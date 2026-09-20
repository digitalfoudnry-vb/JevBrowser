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
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../../" && pwd)"
export JEV_PROVIDER="${JEV_PROVIDER:-vercel}"

# Ensure node is available in GUI environment
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"

if command -v node >/dev/null 2>&1; then
  exec node "${DIR}/dist/index.js" "$@"
else
  osascript -e 'display dialog "Node.js (>=22.18) is required to run Jev Browser. Please install Node.js from https://nodejs.org or via brew install node." buttons {"OK"} default button "OK" with icon stop with title "Jev Browser Error"'
  exit 1
fi
EOF

chmod +x "${MACOS}/Jev Browser"

# Package into distribution zip
(cd "${OUTPUT_DIR}" && rm -f "Jev-Browser-macOS.zip" && zip -r -q "Jev-Browser-macOS.zip" "${APP_NAME}.app")

echo "==> Successfully created macOS App at: ${APP_BUNDLE}"
echo "==> Distribution archive created at: ${OUTPUT_DIR}/Jev-Browser-macOS.zip"
