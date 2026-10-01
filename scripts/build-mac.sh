#!/bin/bash
# ── Greek Flashcards — Mac Installer Builder ──────────────────────────────────
# Run this script on a Mac:
#   chmod +x scripts/build-mac.sh
#   ./scripts/build-mac.sh
#
# Requires: Node.js + npm (install via https://nodejs.org)
# Output:   dist/mac-installer/
#             "Greek Flashcards.dmg"   ← drag-to-Applications installer
# ─────────────────────────────────────────────────────────────────────────────

set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo ""
echo "  🇬🇷 Greek Flashcards — Mac Build"
echo "  =================================="
echo ""

# ── 1. Install deps if needed ─────────────────────────────────────────────────
if [ ! -d node_modules ]; then
  echo "  Installing dependencies..."
  npm install
fi

# ── 2. React build ────────────────────────────────────────────────────────────
echo "  Building React app..."
npm run build

# ── 3. Package with electron-packager ────────────────────────────────────────
echo "  Packaging Electron app for macOS (universal: Intel + Apple Silicon)..."
npx electron-packager . "Greek Flashcards" \
  --platform=darwin \
  --arch=arm64 \
  --out=dist \
  --overwrite \
  --ignore=src \
  --ignore="node_modules/.cache" \
  --ignore=.git \
  --ignore=scripts \
  --icon=public/icon.icns \
  --app-bundle-id=com.greek.flashcards \
  --app-version=1.0.0 \
  --build-version=1.0.0

APP_DIR="$ROOT/dist/Greek Flashcards-darwin-arm64"
APP_BUNDLE="$APP_DIR/Greek Flashcards.app"
OUT_DIR="$ROOT/dist/mac-installer"
DMG_PATH="$OUT_DIR/Greek Flashcards.dmg"

mkdir -p "$OUT_DIR"

# ── 4. Create DMG ─────────────────────────────────────────────────────────────
echo "  Creating DMG installer..."

# Make a temp DMG staging folder
STAGING=$(mktemp -d)
cp -R "$APP_BUNDLE" "$STAGING/"
ln -s /Applications "$STAGING/Applications"

# Create the DMG
hdiutil create \
  -volname "Greek Flashcards" \
  -srcfolder "$STAGING" \
  -ov \
  -format UDZO \
  "$DMG_PATH"

rm -rf "$STAGING"

echo ""
echo "  ✅ Done!"
echo "  DMG installer: dist/mac-installer/Greek Flashcards.dmg"
echo ""
echo "  To install: open the DMG and drag Greek Flashcards → Applications"
echo ""
