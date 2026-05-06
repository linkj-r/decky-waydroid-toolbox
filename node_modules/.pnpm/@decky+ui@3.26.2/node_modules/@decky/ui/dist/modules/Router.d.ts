export declare enum SideMenu {
    None = 0,
    Main = 1,
    QuickAccess = 2
}
export declare enum QuickAccessTab {
    Notifications = 0,
    RemotePlayTogetherControls = 1,
    VoiceChat = 2,
    Friends = 3,
    Settings = 4,
    Perf = 5,
    Help = 6,
    Music = 7,
    Decky = 999
}
export declare enum DisplayStatus {
    Invalid = 0,
    Launching = 1,
    Uninstalling = 2,
    Installing = 3,
    Running = 4,
    Validating = 5,
    Updating = 6,
    Downloading = 7,
    Synchronizing = 8,
    ReadyToInstall = 9,
    ReadyToPreload = 10,
    ReadyToLaunch = 11,
    RegionRestricted = 12,
    PresaleOnly = 13,
    InvalidPlatform = 14,
    PreloadComplete = 16,
    BorrowerLocked = 17,
    UpdatePaused = 18,
    UpdateQueued = 19,
    UpdateRequired = 20,
    UpdateDisabled = 21,
    DownloadPaused = 22,
    DownloadQueued = 23,
    DownloadRequired = 24,
    DownloadDisabled = 25,
    LicensePending = 26,
    LicenseExpired = 27,
    AvailForFree = 28,
    AvailToBorrow = 29,
    AvailGuestPass = 30,
    Purchase = 31,
    Unavailable = 32,
    NotLaunchable = 33,
    CloudError = 34,
    CloudOutOfDate = 35,
    Terminating = 36
}
export type AppOverview = {
    appid: string;
    display_name: string;
    display_status: DisplayStatus;
    sort_as: string;
};
export interface MenuStore {
    OpenSideMenu(sideMenu: SideMenu): void;
    OpenQuickAccessMenu(quickAccessTab?: QuickAccessTab): void;
    OpenMainMenu(): void;
}
export interface WindowRouter {
    BrowserWindow: Window;
    MenuStore: MenuStore;
    Navigate(path: string): void;
    NavigateToChat(): void;
    NavigateToSteamWeb(url: string): void;
    NavigateBack(): void;
}
export interface WindowStore {
    GamepadUIMainWindowInstance?: WindowRouter;
    SteamUIWindows: WindowRouter[];
    OverlayWindows: WindowRouter[];
}
export interface Router {
    WindowStore?: WindowStore;
    CloseSideMenus(): void;
    Navigate(path: string): void;
    NavigateToAppProperties(): void;
    NavigateToExternalWeb(url: string): void;
    NavigateToInvites(): void;
    NavigateToChat(): void;
    NavigateToLibraryTab(): void;
    NavigateToLayoutPreview(e: unknown): void;
    OpenPowerMenu(unknown?: any): void;
    get RunningApps(): AppOverview[];
    get MainRunningApp(): AppOverview | undefined;
}
export declare const Router: Router;
export interface Navigation {
    Navigate(path: string): void;
    NavigateBack(): void;
    NavigateToAppProperties(): void;
    NavigateToExternalWeb(url: string): void;
    NavigateToInvites(): void;
    NavigateToChat(): void;
    NavigateToLibraryTab(): void;
    NavigateToLayoutPreview(e: unknown): void;
    NavigateToSteamWeb(url: string): void;
    OpenSideMenu(sideMenu: SideMenu): void;
    OpenQuickAccessMenu(quickAccessTab?: QuickAccessTab): void;
    OpenMainMenu(): void;
    OpenPowerMenu(unknown?: any): void;
    CloseSideMenus(): void;
}
export declare let Navigation: Navigation;
