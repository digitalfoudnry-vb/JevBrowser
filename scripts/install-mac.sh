#!/usr/bin/env bash
set -euo pipefail

# Jev Browser macOS One-Line Setup & Skill Installer
# Created by digitalfoundry.ai (https://digitalfoundry.ai/)

echo "=========================================================="
echo "          Jev Browser — Official macOS Installer          "
echo "              Created by digitalfoundry.ai                "
echo "=========================================================="

# Check OS
if [[ "$(uname)" != "Darwin" ]]; then
  echo "Error: This installer is designed for macOS only." >&2
  exit 1
fi

# Check Node.js
if ! command -v node >/dev/null 2>&1; then
  echo "Error: Node.js 22.18+ is required. Please install Node.js (e.g. brew install node)." >&2
  exit 1
fi

INSTALL_DIR="${HOME}/.jev-browser"
echo "==> Installing Jev Browser to ${INSTALL_DIR}..."

if [ -d "${INSTALL_DIR}/.git" ]; then
  echo "==> Updating existing installation..."
  cd "${INSTALL_DIR}"
  git pull --ff-only origin main || true
else
  rm -rf "${INSTALL_DIR}"
  git clone https://github.com/digitalfoudnry-vb/JevBrowser.git "${INSTALL_DIR}"
  cd "${INSTALL_DIR}"
fi

echo "==> Installing dependencies and compiling..."
npm ci --ignore-scripts
npm run build

echo "==> Installing Playwright browser binaries..."
npm run browser:install || npx playwright install chromium

echo "==> Registering jev-browser skill across AI agent clients..."
node scripts/install-skill.mjs --client all --apply || true

echo "==> Packaging native macOS Application..."
bash scripts/build-macos-app.sh
mkdir -p "${HOME}/Applications"
rm -rf "${HOME}/Applications/Jev Browser.app"
cp -R "dist/macos/Jev Browser.app" "${HOME}/Applications/"

# Link binary to ~/.local/bin
mkdir -p "${HOME}/.local/bin"
ln -sf "${INSTALL_DIR}/dist/index.js" "${HOME}/.local/bin/jev-browser"

echo ""
echo "=========================================================="
echo "      Jev Browser successfully installed on macOS!        "
echo "=========================================================="
echo "To use Jev Browser in your agent, invoke:"
echo "   /jev-browser <your task instructions>"
echo ""
echo "Or run directly via CLI:"
echo "   jev-browser run \"Explore page\" https://example.com"
echo "=========================================================="
