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
  supported_min: string;
  supported_max: string | null;
  binder_ok: boolean;
}

interface SteamOSUpdate {
  update_available: boolean;
  pending_version: string | null;
  pending_compatible: boolean | null;
}

interface WaydroidUpdate {
  installed_sha: string | null;
  latest_sha: string | null;
  update_available: boolean | null;
}

interface ActionResult {
  success: boolean;
  message: string;
}

const getStatus = callable<[], Status>("get_status");
const checkSteamOSUpdate = callable<[], SteamOSUpdate>("check_steamos_update");
const checkWaydroidUpdate = callable<[], WaydroidUpdate>("check_waydroid_update");
const startContainer = callable<[], ActionResult>("start_container");
const stopContainer = callable<[], ActionResult>("stop_container");
const repairBinder = callable<[], ActionResult>("repair_binder");

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
  const [steamosUpdate, setSteamosUpdate] = useState<SteamOSUpdate | null>(null);
  const [waydroidUpdate, setWaydroidUpdate] = useState<WaydroidUpdate | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [loadingUpdates, setLoadingUpdates] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [repairing, setRepairing] = useState(false);

  async function refreshStatus() {
    setLoadingStatus(true);
    try {
      setStatus(await getStatus());
    } finally {
      setLoadingStatus(false);
    }
  }

  async function fetchUpdates() {
    setLoadingUpdates(true);
    try {
      const [su, wu] = await Promise.all([checkSteamOSUpdate(), checkWaydroidUpdate()]);
      setSteamosUpdate(su);
      setWaydroidUpdate(wu);
    } finally {
      setLoadingUpdates(false);
    }
  }

  useEffect(() => {
    refreshStatus().then(() => fetchUpdates());
  }, []);

  function showMsg(msg: string) {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(null), 5000);
  }

  async function handleRepairBinder() {
    setRepairing(true);
    setActionMsg("Repairing binder… this may take a few minutes.");
    try {
      const result = await repairBinder();
      showMsg(result.message);
      await refreshStatus();
    } finally {
      setRepairing(false);
    }
  }

  async function handleStartStop() {
    if (!status) return;
    const fn = status.container_running ? stopContainer : startContainer;
    const result = await fn();
    showMsg(result.message);
    await refreshStatus();
  }

  if (loadingStatus) {
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

  const pendingWarning = steamosUpdate?.update_available && steamosUpdate.pending_compatible === false;
  const pendingUnknown = steamosUpdate?.update_available && steamosUpdate.pending_compatible === null;

  return (
    <>
      {/* ── Container control ── */}
      <PanelSection title="Waydroid">
        <PanelSectionRow>
          <span>
            Container:{" "}
            <span style={{ color: status.container_running ? GREEN : GRAY, fontWeight: "bold" }}>
              {status.container_running ? "● Running" : "○ Stopped"}
            </span>
          </span>
        </PanelSectionRow>

        {!status.binder_ok && (
          <>
            <PanelSectionRow>
              <span style={{ color: RED, fontWeight: "bold" }}>
                ⚠ Binder module not loaded
              </span>
            </PanelSectionRow>
            <PanelSectionRow>
              <span style={{ fontSize: "0.8em", color: GRAY }}>
                Waydroid will not work. This usually happens after a SteamOS update.
              </span>
            </PanelSectionRow>
            <PanelSectionRow>
              <ButtonItem layout="below" onClick={handleRepairBinder} disabled={repairing}>
                {repairing ? "Repairing…" : "Repair Binder"}
              </ButtonItem>
            </PanelSectionRow>
          </>
        )}

        <PanelSectionRow>
          <ButtonItem layout="below" onClick={handleStartStop} disabled={repairing || !status.binder_ok}>
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
            <CompatBadge ok={status.compatible} label={status.compatible ? "Supported" : "Unsupported"} />
          </span>
        </PanelSectionRow>

        {!status.compatible && (
          <PanelSectionRow>
            <span style={{ fontSize: "0.8em", color: RED }}>
              Supported: {status.supported_min}
              {status.supported_max ? `–${status.supported_max}.x` : ".x+"}
            </span>
          </PanelSectionRow>
        )}

        {loadingUpdates ? (
          <PanelSectionRow>
            <span style={{ color: GRAY, fontSize: "0.85em" }}>Checking for updates…</span>
          </PanelSectionRow>
        ) : steamosUpdate?.update_available ? (
          <>
            <PanelSectionRow>
              <span>
                Pending:{" "}
                <span style={{ color: pendingWarning ? RED : pendingUnknown ? YELLOW : GREEN, fontWeight: "bold" }}>
                  {steamosUpdate.pending_version ?? "available"}
                </span>
                {steamosUpdate.pending_compatible !== null && (
                  <CompatBadge
                    ok={steamosUpdate.pending_compatible}
                    label={steamosUpdate.pending_compatible ? "Safe to update" : "Hold update!"}
                  />
                )}
              </span>
            </PanelSectionRow>
            {pendingWarning && (
              <PanelSectionRow>
                <span style={{ fontSize: "0.8em", color: RED }}>
                  ⚠ Do not update — Waydroid does not yet support this version.
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
            <span style={{ color: GRAY, fontSize: "0.85em" }}>No SteamOS update pending.</span>
          </PanelSectionRow>
        )}

        <PanelSectionRow>
          <ButtonItem layout="below" onClick={() => { refreshStatus(); fetchUpdates(); }}>
            Refresh
          </ButtonItem>
        </PanelSectionRow>
      </PanelSection>

      {/* ── Installer update ── */}
      <PanelSection title="Waydroid Installer">
        {loadingUpdates ? (
          <PanelSectionRow>
            <span style={{ color: GRAY, fontSize: "0.85em" }}>Checking…</span>
          </PanelSectionRow>
        ) : waydroidUpdate?.update_available === null ? (
          <PanelSectionRow>
            <span style={{ color: GRAY, fontSize: "0.85em" }}>Could not check for updates.</span>
          </PanelSectionRow>
        ) : waydroidUpdate?.update_available ? (
          <>
            <PanelSectionRow>
              <span style={{ color: YELLOW, fontWeight: "bold" }}>Installer update available</span>
            </PanelSectionRow>
            <PanelSectionRow>
              <span style={{ fontSize: "0.8em", color: GRAY }}>
                {waydroidUpdate.installed_sha} → {waydroidUpdate.latest_sha}
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
              ✓ Installer up to date ({waydroidUpdate?.installed_sha ?? "unknown"})
            </span>
          </PanelSectionRow>
        )}

        <PanelSectionRow>
          <ButtonItem layout="below" onClick={fetchUpdates}>
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
