const manifest = {"name":"WaydroidToolbox"};
const API_VERSION = 2;
const internalAPIConnection = window.__DECKY_SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED_deckyLoaderAPIInit;
if (!internalAPIConnection) {
    throw new Error('[@decky/api]: Failed to connect to the loader as as the loader API was not initialized. This is likely a bug in Decky Loader.');
}
let api;
try {
    api = internalAPIConnection.connect(API_VERSION, manifest.name);
}
catch {
    api = internalAPIConnection.connect(1, manifest.name);
    console.warn(`[@decky/api] Requested API version ${API_VERSION} but the running loader only supports version 1. Some features may not work.`);
}
if (api._version != API_VERSION) {
    console.warn(`[@decky/api] Requested API version ${API_VERSION} but the running loader only supports version ${api._version}. Some features may not work.`);
}
const callable = api.callable;

var DefaultContext = {
  color: undefined,
  size: undefined,
  className: undefined,
  style: undefined,
  attr: undefined
};
var IconContext = SP_REACT.createContext && SP_REACT.createContext(DefaultContext);

var __assign = window && window.__assign || function () {
  __assign = Object.assign || function (t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
      s = arguments[i];
      for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
    }
    return t;
  };
  return __assign.apply(this, arguments);
};
var __rest = window && window.__rest || function (s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
    if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
  }
  return t;
};
function Tree2Element(tree) {
  return tree && tree.map(function (node, i) {
    return SP_REACT.createElement(node.tag, __assign({
      key: i
    }, node.attr), Tree2Element(node.child));
  });
}
function GenIcon(data) {
  // eslint-disable-next-line react/display-name
  return function (props) {
    return SP_REACT.createElement(IconBase, __assign({
      attr: __assign({}, data.attr)
    }, props), Tree2Element(data.child));
  };
}
function IconBase(props) {
  var elem = function (conf) {
    var attr = props.attr,
      size = props.size,
      title = props.title,
      svgProps = __rest(props, ["attr", "size", "title"]);
    var computedSize = size || conf.size || "1em";
    var className;
    if (conf.className) className = conf.className;
    if (props.className) className = (className ? className + " " : "") + props.className;
    return SP_REACT.createElement("svg", __assign({
      stroke: "currentColor",
      fill: "currentColor",
      strokeWidth: "0"
    }, conf.attr, attr, svgProps, {
      className: className,
      style: __assign(__assign({
        color: props.color || conf.color
      }, conf.style), props.style),
      height: computedSize,
      width: computedSize,
      xmlns: "http://www.w3.org/2000/svg"
    }), title && SP_REACT.createElement("title", null, title), props.children);
  };
  return IconContext !== undefined ? SP_REACT.createElement(IconContext.Consumer, null, function (conf) {
    return elem(conf);
  }) : elem(DefaultContext);
}

// THIS FILE IS AUTO GENERATED
function FaAndroid (props) {
  return GenIcon({"attr":{"viewBox":"0 0 576 512"},"child":[{"tag":"path","attr":{"d":"M420.55,301.93a24,24,0,1,1,24-24,24,24,0,0,1-24,24m-265.1,0a24,24,0,1,1,24-24,24,24,0,0,1-24,24m273.7-144.48,47.94-83a10,10,0,1,0-17.27-10h0l-48.54,84.07a301.25,301.25,0,0,0-246.56,0L116.18,64.45a10,10,0,1,0-17.27,10h0l47.94,83C64.53,202.22,8.24,285.55,0,384H576c-8.24-98.45-64.54-181.78-146.85-226.55"}}]})(props);
}

const getStatus = callable("get_status");
const startContainer = callable("start_container");
const stopContainer = callable("stop_container");
const checkWaydroidUpdate = callable("check_waydroid_update");
const GREEN = "#4caf50";
const YELLOW = "#ff9800";
const RED = "#f44336";
const GRAY = "#9e9e9e";
function CompatBadge({ ok, label }) {
    return (SP_JSX.jsxs("span", { style: { color: ok ? GREEN : RED, fontWeight: "bold", marginLeft: 6 }, children: [ok ? "✓" : "✗", " ", label] }));
}
function Content() {
    const [status, setStatus] = SP_REACT.useState(null);
    const [updateInfo, setUpdateInfo] = SP_REACT.useState(null);
    const [loading, setLoading] = SP_REACT.useState(true);
    const [actionMsg, setActionMsg] = SP_REACT.useState(null);
    async function refresh() {
        setLoading(true);
        try {
            const s = await getStatus();
            setStatus(s);
        }
        finally {
            setLoading(false);
        }
    }
    async function fetchUpdateInfo() {
        const info = await checkWaydroidUpdate();
        setUpdateInfo(info);
    }
    SP_REACT.useEffect(() => {
        refresh();
        fetchUpdateInfo();
    }, []);
    function showMsg(msg) {
        setActionMsg(msg);
        setTimeout(() => setActionMsg(null), 4000);
    }
    async function handleStartStop() {
        if (!status)
            return;
        const fn = status.container_running ? stopContainer : startContainer;
        const result = await fn();
        showMsg(result.message);
        await refresh();
    }
    if (loading && !status) {
        return (SP_JSX.jsx(DFL.PanelSection, { title: "Waydroid", children: SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("span", { style: { color: GRAY }, children: "Loading\u2026" }) }) }));
    }
    if (!status?.waydroid_installed) {
        return (SP_JSX.jsxs(DFL.PanelSection, { title: "Waydroid", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("span", { style: { color: GRAY }, children: "Waydroid not installed." }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("span", { style: { fontSize: "0.8em", color: GRAY }, children: "Run the installer script in Desktop Mode first." }) })] }));
    }
    const pendingWarning = status.steamos_update_available && status.pending_compatible === false;
    const pendingUnknown = status.steamos_update_available && status.pending_compatible === null;
    return (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsxs(DFL.PanelSection, { title: "Waydroid", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("span", { children: ["Container:", " ", SP_JSX.jsx("span", { style: {
                                        color: status.container_running ? GREEN : GRAY,
                                        fontWeight: "bold",
                                    }, children: status.container_running ? "● Running" : "○ Stopped" })] }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: handleStartStop, children: status.container_running ? "Stop Container" : "Start Container" }) }), actionMsg && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("span", { style: { fontSize: "0.85em", color: GRAY }, children: actionMsg }) }))] }), SP_JSX.jsxs(DFL.PanelSection, { title: "SteamOS Compatibility", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("span", { children: ["Current: ", status.steamos_version, SP_JSX.jsx(CompatBadge, { ok: status.compatible, label: status.compatible ? "Supported" : "Unsupported" })] }) }), !status.compatible && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("span", { style: { fontSize: "0.8em", color: RED }, children: ["Supported range: ", status.supported_min, "\u2013", status.supported_max, ".x"] }) })), status.steamos_update_available ? (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("span", { children: ["Pending update:", " ", SP_JSX.jsx("span", { style: {
                                                color: pendingWarning ? RED : pendingUnknown ? YELLOW : GREEN,
                                                fontWeight: "bold",
                                            }, children: status.pending_version ?? "available" }), status.pending_compatible !== null && (SP_JSX.jsx(CompatBadge, { ok: status.pending_compatible, label: status.pending_compatible ? "Safe to update" : "Hold update!" }))] }) }), pendingWarning && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("span", { style: { fontSize: "0.8em", color: RED }, children: "\u26A0 Waydroid does not yet support this SteamOS version. Do not update." }) })), pendingUnknown && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("span", { style: { fontSize: "0.8em", color: YELLOW }, children: "\u26A0 Could not verify compatibility of this update." }) }))] })) : (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("span", { style: { color: GRAY, fontSize: "0.85em" }, children: "No SteamOS update pending." }) })), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: refresh, children: "Refresh" }) })] }), SP_JSX.jsxs(DFL.PanelSection, { title: "Waydroid Installer", children: [updateInfo === null ? (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("span", { style: { color: GRAY, fontSize: "0.85em" }, children: "Checking\u2026" }) })) : updateInfo.update_available === null ? (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("span", { style: { color: GRAY, fontSize: "0.85em" }, children: "Could not check for updates." }) })) : updateInfo.update_available ? (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("span", { style: { color: YELLOW, fontWeight: "bold" }, children: "Installer update available" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("span", { style: { fontSize: "0.8em", color: GRAY }, children: ["Installed: ", updateInfo.installed_sha ?? "unknown", " \u2192 Latest:", " ", updateInfo.latest_sha ?? "unknown"] }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("span", { style: { fontSize: "0.8em", color: GRAY }, children: "Run Waydroid-Updater.sh from Desktop Mode to update." }) })] })) : (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("span", { style: { color: GREEN, fontSize: "0.85em" }, children: ["\u2713 Installer up to date (", updateInfo.installed_sha ?? "unknown", ")"] }) })), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: fetchUpdateInfo, children: "Check for Updates" }) })] })] }));
}
var index = DFL.definePlugin(() => ({
    name: "WaydroidToolbox",
    titleView: SP_JSX.jsx("div", { className: DFL.staticClasses.Title, children: "Waydroid" }),
    content: SP_JSX.jsx(Content, {}),
    icon: SP_JSX.jsx(FaAndroid, {}),
    onDismount() { },
}));

export { index as default };
//# sourceMappingURL=index.js.map
