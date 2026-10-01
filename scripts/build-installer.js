/**
 * build-installer.js
 *
 * Builds the app with electron-packager, then creates an installer package:
 *   dist/installer/
 *     app/                       <- the electron app files
 *     install.ps1                <- PowerShell installer
 *     Install Greek Flashcards.bat  <- double-click to install
 *
 * Usage: node scripts/build-installer.js
 */

const { execSync } = require('child_process');
const fs   = require('fs');
const path = require('path');

const ROOT    = path.join(__dirname, '..');
const DIST    = path.join(ROOT, 'dist');
const APP_DIR = path.join(DIST, 'Greek Flashcards-win32-x64');
const OUT_DIR = path.join(DIST, 'installer');

// ── Step 1: Build + package ───────────────────────────────────────────────────
if (process.env.SKIP_PACKAGE === '1') {
  console.log('Step 1: Skipping build+package (SKIP_PACKAGE=1)');
} else {
  console.log('Step 1: Building React app + packaging…');
  execSync('npm run package:win', { cwd: ROOT, stdio: 'inherit' });
}

// ── Step 2: Set up installer folder ──────────────────────────────────────────
console.log('Step 2: Building installer package…');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// Copy app files
const appDest = path.join(OUT_DIR, 'app');
if (fs.existsSync(appDest)) fs.rmSync(appDest, { recursive: true });
console.log('  Copying app files…');
copyDirSync(APP_DIR, appDest);

// ── Step 3: Write install.ps1 ─────────────────────────────────────────────────
// Use a separate .ps1 source file to avoid JS escape issues with backslashes
const ps1Src = path.join(__dirname, 'install.ps1');
if (!fs.existsSync(ps1Src)) {
  console.error('ERROR: scripts/install.ps1 not found. It should have been created by this step.');
  process.exit(1);
}
fs.copyFileSync(ps1Src, path.join(OUT_DIR, 'install.ps1'));

// ── Step 4: Write the .bat launcher ──────────────────────────────────────────
const bat = [
  '@echo off',
  'echo.',
  'echo  Greek Flashcards Installer',
  'echo  ===========================',
  'echo.',
  'powershell -ExecutionPolicy Bypass -File "%~dp0install.ps1"',
  'echo.',
  'pause',
  '',
].join('\r\n');
fs.writeFileSync(path.join(OUT_DIR, 'Install Greek Flashcards.bat'), bat);

console.log(`\nInstaller package ready: dist\\installer\\`);
console.log('Share the entire "installer" folder. Users double-click:');
console.log('  "Install Greek Flashcards.bat"');
console.log('\nContents:');
fs.readdirSync(OUT_DIR).forEach(f => {
  const s = fs.statSync(path.join(OUT_DIR, f));
  const size = s.isDirectory() ? '(folder)' : `${Math.round(s.size/1024)}KB`;
  console.log(`  ${f}  ${size}`);
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    entry.isDirectory() ? copyDirSync(s, d) : fs.copyFileSync(s, d);
  }
}
