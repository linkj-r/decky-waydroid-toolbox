import {
  ButtonItem,
  PanelSection,
  PanelSectionRow,
  definePlugin,
  staticClasses,
} from "@decky/ui";
import { callable } from "@decky/api";
import { useEffect, useState } from "react";
import { FaAndroid } from "react-icons/fa";

interface Status {
  steamos_version: string;
  waydroid_installed: boolean;
  container_running: boolean;
  compatible: boolean;
  steamos_update_available: boolean;
  pending_version: string | null;
  pending_compatible: boolean | null;
  supported_min: string;
  supported_max: string;
}

interface ActionResult {
  success: boolean;
  message: string;
}

interface UpdateInfo {
  installed_sha: string | null;
  latest_sha: string | null;
  update_available: boolean | null;
}

const getStatus = callable<[], Status>("get_status");
const startContainer = callable<[], ActionResult>("start_container");
const stopContainer = callable<[], ActionResult>("stop_container");
const checkWaydroidUpdate = callable<[], UpdateInfo>("check_waydroid_update");

const GREEN = "#4caf50";
const YELLOW = "#ff9800";
const RED = "#f44336";
const GRAY = "#9e9e9e";

function CompatBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span style={{ color: ok ? GREEN : RED, fontWeight: "bold", marginLeft: 6 }}>
      {ok ? "✓" : "✗"} {label}
    </span>
  );
}

function Content() {
  const [status, setStatus] = useState<Status | null>(null);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const s = await getStatus();
      setStatus(s);
    } finally {
      setLoading(false);
    }
  }

  async function fetchUpdateInfo() {
    const info = await checkWaydroidUpdate();
    setUpdateInfo(info);
  }

  useEffect(() => {
    refresh();
    fetchUpdateInfo();
  }, []);

  function showMsg(msg: string) {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(null), 4000);
  }

  async function handleStartStop() {
    if (!status) return;
    const fn = status.container_running ? stopContainer : startContainer;
    const result = await fn();
    showMsg(result.message);
    await refresh();
  }

  if (loading && !status) {
    return (
      <PanelSection title="Waydroid">
        <PanelSectionRow>
          <span style={{ color: GRAY }}>Loading…</span>
        </PanelSectionRow>
      </PanelSection>
    );
  }

  if (!status?.waydroid_installed) {
    return (
      <PanelSection title="Waydroid">
        <PanelSectionRow>
          <span style={{ color: GRAY }}>Waydroid not installed.</span>
        </PanelSectionRow>
        <PanelSectionRow>
          <span style={{ fontSize: "0.8em", color: GRAY }}>
            Run the installer script in Desktop Mode first.
          </span>
        </PanelSectionRow>
      </PanelSection>
    );
  }

  const pendingWarning =
    status.steamos_update_available && status.pending_compatible === false;
  const pendingUnknown =
    status.steamos_update_available && status.pending_compatible === null;

  return (
    <>
      {/* ── Container control ── */}
      <PanelSection title="Waydroid">
        <PanelSectionRow>
          <span>
            Container:{" "}
            <span
              style={{
                color: status.container_running ? GREEN : GRAY,
                fontWeight: "bold",
              }}
            >
              {status.container_running ? "● Running" : "○ Stopped"}
            </span>
          </span>
        </PanelSectionRow>

        <PanelSectionRow>
          <ButtonItem layout="below" onClick={handleStartStop}>
            {status.container_running ? "Stop Container" : "Start Container"}
          </ButtonItem>
        </PanelSectionRow>

        {actionMsg && (
          <PanelSectionRow>
            <span style={{ fontSize: "0.85em", color: GRAY }}>{actionMsg}</span>
          </PanelSectionRow>
        )}
      </PanelSection>

      {/* ── SteamOS compatibility ── */}
      <PanelSection title="SteamOS Compatibility">
        <PanelSectionRow>
          <span>
            Current: {status.steamos_version}
            <CompatBadge
              ok={status.compatible}
              label={status.compatible ? "Supported" : "Unsupported"}
            />
          </span>
        </PanelSectionRow>

        {!status.compatible && (
          <PanelSectionRow>
            <span style={{ fontSize: "0.8em", color: RED }}>
              Supported range: {status.supported_min}–{status.supported_max}.x
            </span>
          </PanelSectionRow>
        )}

        {status.steamos_update_available ? (
          <>
            <PanelSectionRow>
              <span>
                Pending update:{" "}
                <span
                  style={{
                    color: pendingWarning ? RED : pendingUnknown ? YELLOW : GREEN,
                    fontWeight: "bold",
                  }}
                >
                  {status.pending_version ?? "available"}
                </span>
                {status.pending_compatible !== null && (
                  <CompatBadge
                    ok={status.pending_compatible}
                    label={status.pending_compatible ? "Safe to update" : "Hold update!"}
                  />
                )}
              </span>
            </PanelSectionRow>

            {pendingWarning && (
              <PanelSectionRow>
                <span style={{ fontSize: "0.8em", color: RED }}>
                  ⚠ Waydroid does not yet support this SteamOS version. Do not update.
                </span>
              </PanelSectionRow>
            )}

            {pendingUnknown && (
              <PanelSectionRow>
                <span style={{ fontSize: "0.8em", color: YELLOW }}>
                  ⚠ Could not verify compatibility of this update.
                </span>
              </PanelSectionRow>
            )}
          </>
        ) : (
          <PanelSectionRow>
            <span style={{ color: GRAY, fontSize: "0.85em" }}>
              No SteamOS update pending.
            </span>
          </PanelSectionRow>
        )}

        <PanelSectionRow>
          <ButtonItem layout="below" onClick={refresh}>
            Refresh
          </ButtonItem>
        </PanelSectionRow>
      </PanelSection>

      {/* ── Installer update ── */}
      <PanelSection title="Waydroid Installer">
        {updateInfo === null ? (
          <PanelSectionRow>
            <span style={{ color: GRAY, fontSize: "0.85em" }}>Checking…</span>
          </PanelSectionRow>
        ) : updateInfo.update_available === null ? (
          <PanelSectionRow>
            <span style={{ color: GRAY, fontSize: "0.85em" }}>
              Could not check for updates.
            </span>
          </PanelSectionRow>
        ) : updateInfo.update_available ? (
          <>
            <PanelSectionRow>
              <span style={{ color: YELLOW, fontWeight: "bold" }}>
                Installer update available
              </span>
            </PanelSectionRow>
            <PanelSectionRow>
              <span style={{ fontSize: "0.8em", color: GRAY }}>
                Installed: {updateInfo.installed_sha ?? "unknown"} → Latest:{" "}
                {updateInfo.latest_sha ?? "unknown"}
              </span>
            </PanelSectionRow>
            <PanelSectionRow>
              <span style={{ fontSize: "0.8em", color: GRAY }}>
                Run Waydroid-Updater.sh from Desktop Mode to update.
              </span>
            </PanelSectionRow>
          </>
        ) : (
          <PanelSectionRow>
            <span style={{ color: GREEN, fontSize: "0.85em" }}>
              ✓ Installer up to date ({updateInfo.installed_sha ?? "unknown"})
            </span>
          </PanelSectionRow>
        )}

        <PanelSectionRow>
          <ButtonItem layout="below" onClick={fetchUpdateInfo}>
            Check for Updates
          </ButtonItem>
        </PanelSectionRow>
      </PanelSection>
    </>
  );
}

export default definePlugin(() => ({
  name: "WaydroidToolbox",
  titleView: <div className={staticClasses.Title}>Waydroid</div>,
  content: <Content />,
  icon: <FaAndroid />,
  onDismount() {},
}));
