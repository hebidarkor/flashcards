# Mac Build Instructions

This app must be built on a Mac (Apple restricts `.app` bundle creation to macOS).

## Prerequisites

1. **Node.js** — install from https://nodejs.org (LTS version)
2. **This project folder** — copy the entire `Flashcards/` folder to the Mac

## Build steps

Open Terminal, navigate to the project folder, then run:

```bash
chmod +x scripts/build-mac.sh
./scripts/build-mac.sh
```

Or with npm:

```bash
npm run installer:mac
```

## Output

```
dist/mac-installer/
  Greek Flashcards.dmg    ← drag-to-Applications installer
```

## To install

1. Open `Greek Flashcards.dmg`
2. Drag **Greek Flashcards** → **Applications**
3. Launch from Applications or Spotlight

## Optional: App icon

Place a `public/icon.icns` file before building for a custom icon.
You can create one from a PNG at https://cloudconvert.com/png-to-icns
(1024×1024 PNG recommended)

## Note on code signing

The app will be unsigned. On first launch, macOS may show a security warning.
To bypass: right-click the app → Open → Open anyway.

To sign properly, you need an Apple Developer account ($99/year) and run:
```bash
codesign --deep --force --sign "Developer ID Application: Your Name" \
  "dist/Greek Flashcards-darwin-universal/Greek Flashcards.app"
```
