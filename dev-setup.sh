#!/usr/bin/env bash
set -euo pipefail

PLUGIN_NAME="WaydroidToolbox"
PLUGINS_DIR="${HOME}/homebrew/plugins"
DEV_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Setting up ${PLUGIN_NAME} dev environment..."

pnpm install
pnpm build

rm -rf "${PLUGINS_DIR}/${PLUGIN_NAME}"
ln -s "$DEV_DIR" "${PLUGINS_DIR}/${PLUGIN_NAME}"

echo ""
echo "Symlinked: ${PLUGINS_DIR}/${PLUGIN_NAME} -> ${DEV_DIR}"
echo "Restart Decky Loader to pick up changes."
echo ""
echo "After edits: run 'pnpm build' to recompile the frontend, then restart Decky."
