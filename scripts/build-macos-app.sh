#!/usr/bin/env bash
set -euo pipefail

# Jev Browser Native macOS Application Bundle Builder
# Created by digitalfoundry.ai (https://digitalfoundry.ai/)

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_NAME="Jev Browser"
OUTPUT_DIR="${DIR}/dist/macos"
APP_BUNDLE="${OUTPUT_DIR}/${APP_NAME}.app"
CONTENTS="${APP_BUNDLE}/Contents"
MACOS="${CONTENTS}/MacOS"
RESOURCES="${CONTENTS}/Resources"

echo "==> Building Jev Browser Native macOS App..."

# Ensure typescript build is up to date
npm run build

# Create bundle directory structure
rm -rf "${APP_BUNDLE}"
mkdir -p "${MACOS}" "${RESOURCES}"

# Generate retina Apple Icon (.icns) from official branding logo
echo "==> Generating native macOS application icon (.icns)..."
ICONSET="/tmp/jev_app_icon.iconset"
rm -rf "${ICONSET}"
mkdir -p "${ICONSET}"

sips -z 16 16 "${DIR}/assets/logo.png" --out "${ICONSET}/icon_16x16.png" >/dev/null 2>&1
sips -z 32 32 "${DIR}/assets/logo.png" --out "${ICONSET}/icon_16x16@2x.png" >/dev/null 2>&1
sips -z 32 32 "${DIR}/assets/logo.png" --out "${ICONSET}/icon_32x32.png" >/dev/null 2>&1
sips -z 64 64 "${DIR}/assets/logo.png" --out "${ICONSET}/icon_32x32@2x.png" >/dev/null 2>&1
sips -z 128 128 "${DIR}/assets/logo.png" --out "${ICONSET}/icon_128x128.png" >/dev/null 2>&1
sips -z 256 256 "${DIR}/assets/logo.png" --out "${ICONSET}/icon_128x128@2x.png" >/dev/null 2>&1
sips -z 256 256 "${DIR}/assets/logo.png" --out "${ICONSET}/icon_256x256.png" >/dev/null 2>&1
sips -z 512 512 "${DIR}/assets/logo.png" --out "${ICONSET}/icon_256x256@2x.png" >/dev/null 2>&1
sips -z 512 512 "${DIR}/assets/logo.png" --out "${ICONSET}/icon_512x512.png" >/dev/null 2>&1
sips -z 1024 1024 "${DIR}/assets/logo.png" --out "${ICONSET}/icon_512x512@2x.png" >/dev/null 2>&1

iconutil -c icns "${ICONSET}" -o "${RESOURCES}/app.icns"
rm -rf "${ICONSET}"

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
    <string>app.icns</string>
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

# Compile native Mach-O executable via swiftc
echo "==> Compiling native Swift Mach-O binary..."
swiftc -O "${DIR}/src/macos/JevBrowserApp.swift" -o "${MACOS}/Jev Browser"
chmod +x "${MACOS}/Jev Browser"

# Package into distribution zip
(cd "${OUTPUT_DIR}" && rm -f "Jev-Browser-macOS.zip" && zip -r -q "Jev-Browser-macOS.zip" "${APP_NAME}.app")

echo "==> Successfully created Standalone Native macOS App at: ${APP_BUNDLE}"
echo "==> Distribution archive created at: ${OUTPUT_DIR}/Jev-Browser-macOS.zip"
