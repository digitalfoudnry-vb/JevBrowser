#!/usr/bin/env bash
set -euo pipefail

# Jev Browser macOS Application Bundle Builder
# Created by digitalfoundry.ai (https://digitalfoundry.ai/)

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_NAME="Jev Browser"
OUTPUT_DIR="${DIR}/dist/macos"
APP_BUNDLE="${OUTPUT_DIR}/${APP_NAME}.app"
CONTENTS="${APP_BUNDLE}/Contents"
MACOS="${CONTENTS}/MacOS"
RESOURCES="${CONTENTS}/Resources"

echo "==> Building Jev Browser for macOS..."

# Ensure typescript build is up to date
npm run build

# Create bundle directory structure
rm -rf "${APP_BUNDLE}"
mkdir -p "${MACOS}" "${RESOURCES}"

# Copy branding icon
if [ -f "${DIR}/assets/logo.png" ]; then
  cp "${DIR}/assets/logo.png" "${RESOURCES}/app-icon.png"
fi

# Create Info.plist
cat > "${CONTENTS}/Info.plist" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>en</string>
    <key>CFBundleDisplayName</key>
    <string>Jev Browser</string>
    <key>CFBundleExecutable</key>
    <string>Jev Browser</string>
    <key>CFBundleIconFile</key>
    <string>app-icon.png</string>
    <key>CFBundleIdentifier</key>
    <string>ai.digitalfoundry.jevbrowser</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>Jev Browser</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>0.1.0</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>LSMinimumSystemVersion</key>
    <string>12.0</string>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>LSApplicationCategoryType</key>
    <string>public.app-category.developer-tools</string>
</dict>
</plist>
EOF

# Create executable launcher
cat > "${MACOS}/Jev Browser" << 'EOF'
#!/usr/bin/env bash
set -e

# Ensure node and standard tools are available in GUI environment
export PATH="/usr/local/bin:/opt/homebrew/bin:${HOME}/.local/bin:$PATH"

# Resolve installation directory
APP_DIR=""
for candidate in \
  "$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../../" && pwd)" \
  "${HOME}/JEVBROWSER" \
  "/Users/vikrambala/JEVBROWSER" \
  "${HOME}/.jev-browser"
do
  if [ -f "${candidate}/dist/index.js" ]; then
    APP_DIR="${candidate}"
    break
  fi
done

if [ -z "${APP_DIR}" ]; then
  osascript -e 'display dialog "Could not locate Jev Browser installation. Please run scripts/install-mac.sh." buttons {"OK"} default button "OK" with icon stop with title "Jev Browser Error"'
  exit 1
fi

export JEV_PROVIDER="${JEV_PROVIDER:-vercel}"

# If command-line arguments are supplied (e.g., 'run ...'), execute CLI
if [ "$#" -gt 0 ]; then
  exec node "${APP_DIR}/dist/index.js" "$@"
fi

# GUI Mode (Double-clicked in Finder/Dock):
# 1. Ensure local website/dashboard server is running on port 8000
if ! curl -s -o /dev/null -m 1 "http://localhost:8000/"; then
  PORT=8000 node "${APP_DIR}/scripts/serve-website.mjs" >/tmp/jev-browser-server.log 2>&1 &
  sleep 0.8
fi

# 2. Locate Chromium browser executable from Playwright or system
CHROME_BIN=""
if command -v node >/dev/null 2>&1; then
  CHROME_BIN="$(node -e 'import("playwright").then(({chromium})=>console.log(chromium.executablePath())).catch(()=>console.log(""))' 2>/dev/null || true)"
fi

PROFILE_DIR="${HOME}/.jev-browser/chrome-profile"
mkdir -p "${PROFILE_DIR}"

if [ -n "${CHROME_BIN}" ] && [ -x "${CHROME_BIN}" ]; then
  exec "${CHROME_BIN}" \
    --app="http://localhost:8000" \
    --user-data-dir="${PROFILE_DIR}" \
    --window-size=1280,850 \
    --disable-quic \
    "$@"
else
  # Fallback: open in default browser
  open "http://localhost:8000"
fi
EOF

chmod +x "${MACOS}/Jev Browser"

# Package into distribution zip
(cd "${OUTPUT_DIR}" && rm -f "Jev-Browser-macOS.zip" && zip -r -q "Jev-Browser-macOS.zip" "${APP_NAME}.app")

echo "==> Successfully created macOS App at: ${APP_BUNDLE}"
echo "==> Distribution archive created at: ${OUTPUT_DIR}/Jev-Browser-macOS.zip"
