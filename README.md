# 🇬🇷 Greek Flashcards

A spaced-repetition flashcard app for learning Modern Greek vocabulary — built with Electron + React.

## Install

### Windows
1. Go to **[Actions](../../actions)** → click the latest green build → scroll to **Artifacts**
2. Download **Greek-Flashcards-Windows**
3. Unzip it → double-click **`Install Greek Flashcards.bat`**
4. A shortcut appears on your Desktop and Start Menu — done ✅

### Mac
1. Go to **[Actions](../../actions)** → click the latest green build → scroll to **Artifacts**
2. Download **Greek-Flashcards-Mac**
3. Open **`Greek Flashcards.dmg`** → drag the app to **Applications**
4. First launch: right-click the app → **Open** → **Open** (one-time security prompt) ✅

---

## Features

| Feature | Detail |
|---|---|
| **615 vocabulary cards** | Top-frequency Modern Greek words with English, gender, part of speech |
| **Spaced repetition (SM-2)** | The same algorithm Anki uses — cards you know get scheduled further out |
| **4 study modes** | Flashcard · Type the answer · Multiple choice · Cloze (fill the gap) |
| **4-button rating** | Again / Hard / Good / Easy — feeds directly into SM-2 intervals |
| **Audio pronunciation** | Greek word is spoken aloud when you flip a card (🔊 toggle) |
| **Daily new card limit** | Default 20 new cards/day — configurable in ⚙️ Settings |
| **Progress stats** | Streak 🔥, accuracy, 7-day forecast chart, card maturity distribution |
| **Dark mode** | 🌙 toggle, remembered across sessions |
| **Progress saved** | Your scores survive app restarts and updates |
| **EN → GR and GR → EN** | Switch direction any time |

---

## Keyboard shortcuts (Flashcard mode)

| Key | Action |
|---|---|
| `Space` | Flip card |
| `1` | Again |
| `2` | Hard |
| `3` | Good |
| `4` | Easy |
| `← →` | Again / Good (quick) |

---

## Development

```bash
npm install
npm start          # opens Electron + React dev server
npm run build      # production React build
npm run installer  # build Windows installer package
```

Requires Node.js 18+.
