import decky_plugin
import subprocess
import json
import os
import urllib.request

INSTALLER_DIR = os.path.expanduser("~/Android_Waydroid")
WAYDROID_UPDATER = os.path.join(INSTALLER_DIR, "Waydroid-Updater.sh")
INSTALLER_GITHUB_API = "https://api.github.com/repos/ryanrudolfoba/SteamOS-Waydroid-Installer/commits/main"

# Update SUPPORTED_MAX here when the installer gains support for a new SteamOS version.
SUPPORTED_MIN = (3, 7)
SUPPORTED_MAX = (3, 7)


def _parse_version(v: str) -> tuple:
    try:
        return tuple(int(x) for x in v.split(".")[:2])
    except Exception:
        return (0, 0)


def _is_compatible(version_str: str) -> bool:
    v = _parse_version(version_str)
    return SUPPORTED_MIN <= v <= SUPPORTED_MAX


def _get_steamos_version() -> str:
    try:
        result = subprocess.run(
            ["grep", "-i", "^VERSION_ID=", "/etc/os-release"],
            capture_output=True, text=True,
        )
        return result.stdout.strip().split("=", 1)[1].strip('"')
    except Exception:
        return "unknown"


def _container_running() -> bool:
    result = subprocess.run(
        ["systemctl", "is-active", "--quiet", "waydroid-container.service"],
        capture_output=True,
    )
    return result.returncode == 0


def _waydroid_installed() -> bool:
    result = subprocess.run(["pacman", "-Q", "waydroid"], capture_output=True)
    return result.returncode == 0


def _check_steamos_update() -> dict:
    """
    Returns whether a SteamOS update is pending and, if possible, its version.
    steamos-update check exits 0 for both cases; we distinguish by output text.
    Version is fetched from the atomupd meta endpoint using the branch in manifest.json.
    """
    available = False
    pending_version = None
    try:
        result = subprocess.run(
            ["steamos-update", "check"],
            capture_output=True, text=True, timeout=15,
        )
        available = "No update available" not in result.stdout

        if available:
            try:
                with open("/etc/steamos-atomupd/manifest.json") as f:
                    manifest = json.load(f)
                branch = manifest.get("default_update_branch", "stable")

                with open("/etc/steamos-atomupd/client.conf") as f:
                    meta_url = None
                    for line in f:
                        if line.startswith("MetaUrl"):
                            meta_url = line.split("=", 1)[1].strip()
                            break

                if meta_url:
                    url = f"{meta_url}/steamdeck/{branch}/manifest.json"
                    req = urllib.request.urlopen(url, timeout=8)
                    data = json.loads(req.read())
                    pending_version = data.get("version")
            except Exception as e:
                decky_plugin.logger.warning(f"pending version fetch failed: {e}")
    except Exception as e:
        decky_plugin.logger.error(f"steamos-update check failed: {e}")

    return {"available": available, "pending_version": pending_version}


def _check_waydroid_update() -> dict:
    """Compare the installed installer SHA against upstream main."""
    try:
        installed_sha = None
        installer_script = os.path.expanduser("~/Android_Waydroid/../steamos-waydroid-installer/steamos-waydroid-installer.sh")
        git_dir = os.path.expanduser("~/steamos-waydroid-installer")
        if os.path.isdir(git_dir):
            r = subprocess.run(
                ["git", "-C", git_dir, "rev-parse", "--short", "HEAD"],
                capture_output=True, text=True,
            )
            installed_sha = r.stdout.strip() or None

        req = urllib.request.urlopen(INSTALLER_GITHUB_API, timeout=8)
        data = json.loads(req.read())
        latest_sha = data.get("sha", "")[:7]

        update_available = bool(installed_sha and latest_sha and installed_sha != latest_sha)
        return {
            "installed_sha": installed_sha,
            "latest_sha": latest_sha,
            "update_available": update_available,
        }
    except Exception as e:
        decky_plugin.logger.warning(f"waydroid update check failed: {e}")
        return {"installed_sha": None, "latest_sha": None, "update_available": None}


class Plugin:

    async def get_status(self):
        steamos_version = _get_steamos_version()
        waydroid_installed = _waydroid_installed()
        container_running = _container_running() if waydroid_installed else False
        compatible = _is_compatible(steamos_version)

        steamos_update = _check_steamos_update()
        pending_version = steamos_update["pending_version"]
        pending_compatible = _is_compatible(pending_version) if pending_version else None

        return {
            "steamos_version": steamos_version,
            "waydroid_installed": waydroid_installed,
            "container_running": container_running,
            "compatible": compatible,
            "steamos_update_available": steamos_update["available"],
            "pending_version": pending_version,
            "pending_compatible": pending_compatible,
            "supported_min": f"{SUPPORTED_MIN[0]}.{SUPPORTED_MIN[1]}",
            "supported_max": f"{SUPPORTED_MAX[0]}.{SUPPORTED_MAX[1]}",
        }

    async def start_container(self):
        try:
            r = subprocess.run(
                ["systemctl", "start", "waydroid-container.service"],
                capture_output=True, text=True, timeout=30,
            )
            return {"success": r.returncode == 0, "message": r.stderr.strip() or "Started"}
        except Exception as e:
            return {"success": False, "message": str(e)}

    async def stop_container(self):
        try:
            r = subprocess.run(
                ["systemctl", "stop", "waydroid-container.service"],
                capture_output=True, text=True, timeout=30,
            )
            return {"success": r.returncode == 0, "message": r.stderr.strip() or "Stopped"}
        except Exception as e:
            return {"success": False, "message": str(e)}

    async def check_waydroid_update(self):
        return _check_waydroid_update()

    async def _main(self):
        decky_plugin.logger.info("WaydroidToolbox loaded")

    async def _unload(self):
        decky_plugin.logger.info("WaydroidToolbox unloaded")
