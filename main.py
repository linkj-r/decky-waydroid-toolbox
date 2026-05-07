import decky_plugin
import json
import os
import pwd
import re
import ssl
import subprocess
import urllib.request

# Resolve deck user's home regardless of what user this process runs as
_DECK_HOME = pwd.getpwnam("deck").pw_dir

# Steam's runtime LD_LIBRARY_PATH breaks system bash (readline symbol mismatch).
# Pass a clean environment so subprocess calls use system libraries.
_SYSTEM_ENV = {
    "PATH": "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
    "LD_LIBRARY_PATH": "/usr/lib:/usr/lib32:/lib",
    "HOME": _DECK_HOME,
}

_SSL_CTX = ssl.create_default_context(cafile="/etc/ssl/certs/ca-certificates.crt")

INSTALLER_DIR = os.path.join(_DECK_HOME, "Android_Waydroid")
INSTALLER_GITHUB_API = "https://api.github.com/repos/ryanrudolfoba/SteamOS-Waydroid-Installer/commits/main"

_LOCAL_INSTALLER = os.path.join(_DECK_HOME, "steamos-waydroid-installer", "steamos-waydroid-installer.sh")
_LOCAL_SANITY = os.path.join(_DECK_HOME, "steamos-waydroid-installer", "sanity-checks.sh")
_RAW_INSTALLER = "https://raw.githubusercontent.com/ryanrudolfoba/SteamOS-Waydroid-Installer/main/steamos-waydroid-installer.sh"
_RAW_SANITY = "https://raw.githubusercontent.com/ryanrudolfoba/SteamOS-Waydroid-Installer/main/sanity-checks.sh"

_FALLBACK_MIN = (3, 7)
_FALLBACK_MAX = (3, 7)

# Cached after first successful parse so network is only hit once per session
_compat_cache: dict | None = None


# ── helpers ──────────────────────────────────────────────────────────────────

def _parse_version(v: str) -> tuple:
    try:
        return tuple(int(x) for x in v.split(".")[:2])
    except Exception:
        return (0, 0)


def _get_supported_range_local() -> tuple[tuple, tuple | None]:
    """Read compat range from local installer clone only — no network, no blocking."""
    global _compat_cache
    if _compat_cache is not None:
        return _compat_cache["min"], _compat_cache["max"]

    min_v, max_v = _FALLBACK_MIN, _FALLBACK_MAX
    try:
        if os.path.exists(_LOCAL_INSTALLER) and os.path.exists(_LOCAL_SANITY):
            with open(_LOCAL_INSTALLER) as f:
                installer = f.read()
            with open(_LOCAL_SANITY) as f:
                sanity = f.read()

            base = re.search(r"^BASE_VERSION=([\d.]+)", installer, re.MULTILINE)
            if base:
                min_v = _parse_version(base.group(1))

            upper = re.search(r"\$STEAMOS_VERSION\s*<=\s*([\d.]+)", sanity)
            max_v = _parse_version(upper.group(1)) if upper else None

            _compat_cache = {"min": min_v, "max": max_v}
            decky_plugin.logger.info(f"compat range from local files: min={min_v} max={max_v}")
    except Exception as e:
        decky_plugin.logger.warning(f"local compat range parse failed: {e}")

    return min_v, max_v


def _is_compatible(version_str: str) -> bool:
    v = _parse_version(version_str)
    min_v, max_v = _get_supported_range_local()
    if max_v is None:
        return v >= min_v
    return min_v <= v <= max_v


def _get_steamos_version() -> str:
    try:
        with open("/etc/os-release") as f:
            for line in f:
                if line.upper().startswith("VERSION_ID="):
                    return line.split("=", 1)[1].strip().strip('"')
    except Exception:
        pass
    return "unknown"


def _container_running() -> bool:
    try:
        r = subprocess.run(
            ["/usr/bin/systemctl", "is-active", "--quiet", "waydroid-container.service"],
            capture_output=True, timeout=5, env=_SYSTEM_ENV,
        )
        return r.returncode == 0
    except Exception:
        return False


def _waydroid_installed() -> bool:
    return os.path.exists(os.path.join(INSTALLER_DIR, "Android_Waydroid_Cage.sh"))


# ── Plugin class ─────────────────────────────────────────────────────────────

class Plugin:

    async def get_status(self):
        """Fast local-only status — no network, no blocking subprocesses."""
        steamos_version = _get_steamos_version()
        waydroid_installed = _waydroid_installed()
        container_running = _container_running() if waydroid_installed else False
        compatible = _is_compatible(steamos_version)
        min_v, max_v = _get_supported_range_local()

        return {
            "steamos_version": steamos_version,
            "waydroid_installed": waydroid_installed,
            "container_running": container_running,
            "compatible": compatible,
            "supported_min": f"{min_v[0]}.{min_v[1]}",
            "supported_max": f"{max_v[0]}.{max_v[1]}" if max_v else None,
        }

    async def check_steamos_update(self):
        """
        Network call: fetch remote atomupd manifest and compare to local version.
        Also refreshes the compat range from GitHub if local clone is absent.
        """
        global _compat_cache
        result = {
            "update_available": False,
            "pending_version": None,
            "pending_compatible": None,
        }
        try:
            with open("/etc/steamos-atomupd/manifest.json") as f:
                local_manifest = json.load(f)
            current_version = local_manifest.get("version", "")
            branch = local_manifest.get("default_update_branch", "stable")

            with open("/etc/steamos-atomupd/client.conf") as f:
                meta_url = None
                for line in f:
                    if line.startswith("MetaUrl"):
                        meta_url = line.split("=", 1)[1].strip()
                        break

            if meta_url:
                url = f"{meta_url}/steamdeck/{branch}/manifest.json"
                req = urllib.request.urlopen(url, timeout=8, context=_SSL_CTX)
                remote = json.loads(req.read())
                pending_version = remote.get("version", "")

                if pending_version and pending_version != current_version:
                    result["update_available"] = True
                    result["pending_version"] = pending_version
                    result["pending_compatible"] = _is_compatible(pending_version)
        except Exception as e:
            decky_plugin.logger.warning(f"steamos update check failed: {e}")

        # Also refresh compat range from GitHub if we don't have it locally
        if _compat_cache is None:
            try:
                req_i = urllib.request.urlopen(_RAW_INSTALLER, timeout=8, context=_SSL_CTX)
                req_s = urllib.request.urlopen(_RAW_SANITY, timeout=8, context=_SSL_CTX)
                installer = req_i.read().decode()
                sanity = req_s.read().decode()

                min_v = _FALLBACK_MIN
                base = re.search(r"^BASE_VERSION=([\d.]+)", installer, re.MULTILINE)
                if base:
                    min_v = _parse_version(base.group(1))

                upper = re.search(r"\$STEAMOS_VERSION\s*<=\s*([\d.]+)", sanity)
                max_v = _parse_version(upper.group(1)) if upper else None

                _compat_cache = {"min": min_v, "max": max_v}
                decky_plugin.logger.info(f"compat range from GitHub: min={min_v} max={max_v}")

                # Re-evaluate pending compatibility with fresh range
                if result["pending_version"]:
                    result["pending_compatible"] = _is_compatible(result["pending_version"])
            except Exception as e:
                decky_plugin.logger.warning(f"compat range GitHub fetch failed: {e}")

        return result

    async def check_waydroid_update(self):
        """Network call: compare local installer git SHA to upstream main."""
        try:
            installed_sha = None
            git_dir = os.path.join(_DECK_HOME, "steamos-waydroid-installer")
            if os.path.isdir(git_dir):
                r = subprocess.run(
                    ["/usr/bin/git", "-C", git_dir, "rev-parse", "--short", "HEAD"],
                    capture_output=True, text=True, timeout=5, env=_SYSTEM_ENV,
                )
                installed_sha = r.stdout.strip() or None

            req = urllib.request.urlopen(INSTALLER_GITHUB_API, timeout=8, context=_SSL_CTX)
            data = json.loads(req.read())
            latest_sha = data.get("sha", "")[:7]

            return {
                "installed_sha": installed_sha,
                "latest_sha": latest_sha,
                "update_available": bool(installed_sha and latest_sha and installed_sha != latest_sha),
            }
        except Exception as e:
            decky_plugin.logger.warning(f"waydroid update check failed: {e}")
            return {"installed_sha": None, "latest_sha": None, "update_available": None}

    async def start_container(self):
        try:
            # Check if waydroid.img is already loop-mounted to avoid duplicates
            lo = subprocess.run(
                ["/usr/sbin/losetup", "-l", "--noheadings", "-O", "BACK-FILE"],
                capture_output=True, text=True, env=_SYSTEM_ENV,
            )
            already_mounted = any("waydroid.img" in line for line in lo.stdout.splitlines())
            if not already_mounted:
                r = subprocess.run(["/usr/bin/waydroid-mount"], capture_output=True, text=True,
                                   timeout=30, env=_SYSTEM_ENV)
                if r.returncode != 0:
                    return {"success": False, "message": f"Mount failed: {r.stderr.strip()}"}
            r = subprocess.run(["/usr/bin/waydroid-firewall"], capture_output=True, text=True,
                               timeout=30, env=_SYSTEM_ENV)
            return {"success": r.returncode == 0, "message": r.stderr.strip() or "Container started"}
        except Exception as e:
            return {"success": False, "message": str(e)}

    async def stop_container(self):
        try:
            subprocess.run(["/usr/bin/systemctl", "stop", "waydroid-container.service"],
                           capture_output=True, timeout=15, env=_SYSTEM_ENV)
            # Kill stray waydroid processes that prevent umount
            subprocess.run(["/usr/bin/pkill", "-9", "-f", "waydroid.*container start"],
                           capture_output=True, timeout=5, env=_SYSTEM_ENV)
            subprocess.run(["/usr/bin/systemctl", "stop", "firewalld.service"],
                           capture_output=True, timeout=15, env=_SYSTEM_ENV)
            subprocess.run(["/usr/bin/umount", "/var/lib/waydroid"],
                           capture_output=True, timeout=15, env=_SYSTEM_ENV)
            lo = subprocess.run(
                ["/usr/sbin/losetup", "-l", "--noheadings", "-O", "NAME,BACK-FILE"],
                capture_output=True, text=True, env=_SYSTEM_ENV,
            )
            # Detach ALL loop devices backed by waydroid.img (handles duplicates)
            for line in lo.stdout.splitlines():
                parts = line.split()
                if len(parts) == 2 and "waydroid.img" in parts[1]:
                    subprocess.run(["/usr/sbin/losetup", "-d", parts[0]],
                                   capture_output=True, env=_SYSTEM_ENV)
            return {"success": True, "message": "Container stopped"}
        except Exception as e:
            return {"success": False, "message": str(e)}

    async def _main(self):
        decky_plugin.logger.info("WaydroidToolbox loaded")

    async def _unload(self):
        decky_plugin.logger.info("WaydroidToolbox unloaded")
