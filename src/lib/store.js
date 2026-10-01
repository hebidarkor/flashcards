/**
 * store.js — thin wrapper around Electron IPC persistence.
 * Falls back to localStorage when running in a plain browser (dev without Electron).
 *
 * Shape saved: { [cardId]: sm2Object, _stats: { got, missed, streak, lastStudyDate } }
 */

const LS_KEY = 'greek-flashcards-progress';

function isElectron() {
  return typeof window !== 'undefined' && window.electronAPI != null;
}

export async function loadProgress() {
  if (isElectron()) {
    return (await window.electronAPI.loadProgress()) || {};
  }
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '{}');
  } catch {
    return {};
  }
}

export async function saveProgress(data) {
  if (isElectron()) {
    await window.electronAPI.saveProgress(data);
  } else {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  }
}
