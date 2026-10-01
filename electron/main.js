const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// ── Persistence helpers ───────────────────────────────────────────────────────
function getProgressPath() {
  return path.join(app.getPath('userData'), 'progress.json');
}

function loadProgress() {
  try {
    const raw = fs.readFileSync(getProgressPath(), 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveProgress(data) {
  fs.writeFileSync(getProgressPath(), JSON.stringify(data), 'utf8');
}

// ── IPC handlers ──────────────────────────────────────────────────────────────
ipcMain.handle('progress:load', () => loadProgress());
ipcMain.handle('progress:save', (_event, data) => { saveProgress(data); return true; });

// ── Window ────────────────────────────────────────────────────────────────────
function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 720,
    minWidth: 640,
    minHeight: 520,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    titleBarStyle: 'hiddenInset',
    title: 'Greek Flashcards',
  });

  if (process.env.ELECTRON_START_URL) {
    win.loadURL(process.env.ELECTRON_START_URL);
  } else {
    // __dirname inside asar is e.g. .../resources/app.asar/electron
    // app.getAppPath() always gives the root of the asar (or unpacked folder)
    win.loadFile(path.join(app.getAppPath(), 'build', 'index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
