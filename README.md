# WaydroidToolbox

A [Decky Loader](https://github.com/SteamDeckHomebrew/decky-loader) plugin for Steam Deck that provides:

- Waydroid container start/stop control
- SteamOS version compatibility check against the Waydroid installer's supported range
- Pending SteamOS update compatibility warning (tells you if it's safe to update)
- Waydroid installer update detection

## Prerequisites

- [Decky Loader](https://github.com/SteamDeckHomebrew/decky-loader) installed
- Waydroid installed via [ryanrudolfoba/SteamOS-Waydroid-Installer](https://github.com/ryanrudolfoba/SteamOS-Waydroid-Installer)

## Install

Run this in Desktop Mode (Konsole):

```bash
curl -sSfL https://github.com/linkj-r/decky-waydroid-toolbox/releases/latest/download/install.sh | bash
```

Then restart Decky Loader from the Quick Access Menu, or reboot.

## Update

Run the same install command — it replaces the existing plugin in place.

## Uninstall

Delete the plugin folder:

```bash
rm -rf ~/homebrew/plugins/WaydroidToolbox
```

## Build from source

```bash
git clone https://github.com/linkj-r/decky-waydroid-toolbox.git
cd decky-waydroid-toolbox
pnpm install
pnpm build
```

Then copy `plugin.json`, `main.py`, `package.json`, and `dist/` into `~/homebrew/plugins/WaydroidToolbox/`.

## License

MIT
