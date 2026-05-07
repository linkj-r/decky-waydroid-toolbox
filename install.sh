#!/usr/bin/env bash
set -euo pipefail

PLUGIN_NAME="WaydroidToolbox"
GITHUB_REPO="linkj-r/decky-waydroid-toolbox"
PLUGINS_DIR="${HOME}/homebrew/plugins"
ZIP_URL="https://github.com/${GITHUB_REPO}/releases/latest/download/${PLUGIN_NAME}.zip"

echo "Installing ${PLUGIN_NAME}..."

if [[ ! -d "$PLUGINS_DIR" ]]; then
  echo "Error: Decky Loader plugins directory not found at ${PLUGINS_DIR}"
  echo "Make sure Decky Loader is installed first."
  exit 1
fi

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

echo "Downloading from ${ZIP_URL}..."
curl -sSfL "$ZIP_URL" -o "$TMP/${PLUGIN_NAME}.zip"

rm -rf "${PLUGINS_DIR}/${PLUGIN_NAME}"
unzip -q "$TMP/${PLUGIN_NAME}.zip" -d "$PLUGINS_DIR"

if systemctl is-active --quiet plugin_loader.service 2>/dev/null; then
  echo "Restarting Decky Loader..."
  sudo systemctl restart plugin_loader.service
  echo "Done! ${PLUGIN_NAME} should appear shortly."
else
  echo ""
  echo "Done! Restart Decky Loader (or reboot) to load ${PLUGIN_NAME}."
fi
