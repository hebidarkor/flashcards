import React, { useState, useEffect, useCallback, useRef } from 'react';
import Papa from 'papaparse';
import { defaultSm2, reviewCard, pickNextCard, today } from './lib/sm2';
import { loadProgress, saveProgress } from './lib/store';
import TypeAnswer from './components/TypeAnswer';
import MultipleChoice from './components/MultipleChoice';
import Cloze from './components/Cloze';
import StatsScreen from './components/StatsScreen';
import Alphabet from './components/Alphabet';
import './App.css';

// ── CSV loader ────────────────────────────────────────────────────────────────
function loadCards() {
  return new Promise((resolve) => {
    fetch(`${process.env.PUBLIC_URL}/greek_anki.csv`)
      .then((r) => r.text())
      .then((text) => {
        const result = Papa.parse(text, { header: true, skipEmptyLines: true });
        const cards = result.data.map((row, i) => ({
          id: i,
          greek: row['Greek'] || '',
          gender: row['Gender'] || '',
          partOfSpeech: row['PartOfSpeech'] || '',
          english: row['English'] || '',
          exampleSentence: row['ExampleSentence'] || '',
          exampleTranslation: row['ExampleTranslation'] || '',
          sm2: defaultSm2(),
        }));
        resolve(cards);
      });
  });
}

function mergeProgress(cards, saved) {
  return cards.map((c) => ({
    ...c,
    sm2: saved[c.id] ? saved[c.id] : c.sm2,
  }));
}

// ── SM-2 grade buttons ────────────────────────────────────────────────────────
const GRADE_BUTTONS = [
  { grade: 1, label: 'Again',  sub: '< 1d',  cls: 'btn-again' },
  { grade: 2, label: 'Hard',   sub: '~1d',   cls: 'btn-hard'  },
  { grade: 4, label: 'Good',   sub: '~3d',   cls: 'btn-good'  },
  { grade: 5, label: 'Easy',   sub: '~1w',   cls: 'btn-easy'  },
];

const STUDY_MODES = [
  { id: 'flashcard', label: 'Flashcard' },
  { id: 'type',      label: 'Type' },
  { id: 'multiple',  label: 'Multiple choice' },
  { id: 'cloze',     label: 'Cloze' },
  { id: 'alphabet',  label: 'Alphabet' },
];

const DIRECTION_MODES = [
  { id: 'en-to-gr', label: 'EN → GR' },
  { id: 'gr-to-en', label: 'GR → EN' },
];

const DEFAULT_DAILY_LIMIT = 20;

// ── Audio ─────────────────────────────────────────────────────────────────────
function speak(text, lang = 'el-GR') {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = lang;
  utt.rate = 0.9;
  window.speechSynthesis.speak(utt);
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [cards, setCards]               = useState([]);
  const [current, setCurrent]           = useState(null);
  const [flipped, setFlipped]           = useState(false);
  const [studyMode, setStudyMode]       = useState('flashcard');
  const [direction, setDirection]       = useState('en-to-gr');
  const [stats, setStats]               = useState({
    got: 0, missed: 0, streak: 0, lastStudyDate: '',
    newSeenToday: 0, newSeenDate: '',
  });
  const [loading, setLoading]           = useState(true);
  const [showStats, setShowStats]       = useState(false);
  const [darkMode, setDarkMode]         = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [dailyLimit, setDailyLimit]     = useState(DEFAULT_DAILY_LIMIT);
  const [showSettings, setShowSettings] = useState(false);
  const saveTimer                       = useRef(null);

  // ── Load progress on mount ────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([loadCards(), loadProgress()]).then(([loaded, saved]) => {
      const merged     = mergeProgress(loaded, saved._cards || {});
      const savedStats = saved._stats || {};
      setCards(merged);
      setCurrent(pickNextCard(merged, -1, savedStats.newSeenToday || 0, saved._dailyLimit || DEFAULT_DAILY_LIMIT));
      setStats((s) => ({ ...s, ...savedStats }));
      if (saved._darkMode)    setDarkMode(true);
      if (saved._audioEnabled === false) setAudioEnabled(false);
      if (saved._dailyLimit)  setDailyLimit(saved._dailyLimit);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    document.body.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // ── Debounced persistence ─────────────────────────────────────────────────
  const persist = useCallback((updatedCards, updatedStats, dm, audio, limit) => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const cardMap = {};
      updatedCards.forEach((c) => { cardMap[c.id] = c.sm2; });
      saveProgress({
        _cards: cardMap,
        _stats: updatedStats,
        _darkMode: dm,
        _audioEnabled: audio,
        _dailyLimit: limit,
      });
    }, 500);
  }, []);

  // ── Advance — accepts a SM-2 grade (1-5) or boolean for non-flashcard modes
  const advance = useCallback(
    (gradeOrBool) => {
      const grade = typeof gradeOrBool === 'boolean'
        ? (gradeOrBool ? 4 : 1)
        : gradeOrBool;
      const knew = grade >= 3;

      const newSm2 = reviewCard(current.sm2, grade);
      const updatedCards = cards.map((c) =>
        c.id === current.id ? { ...c, sm2: newSm2 } : c
      );

      // Streak
      const todayStr = today();
      let { streak, lastStudyDate, newSeenToday, newSeenDate } = stats;
      if (lastStudyDate === todayStr) {
        // same day
      } else if (lastStudyDate === getPreviousDay(todayStr)) {
        streak += 1;
      } else {
        streak = 1;
      }

      // Track new cards seen today (reset daily)
      const isNewCard = current.sm2.repetition === 0;
      if (newSeenDate !== todayStr) { newSeenToday = 0; newSeenDate = todayStr; }
      if (isNewCard) newSeenToday += 1;

      const updatedStats = {
        got:          stats.got    + (knew ? 1 : 0),
        missed:       stats.missed + (knew ? 0 : 1),
        streak,
        lastStudyDate: todayStr,
        newSeenToday,
        newSeenDate,
      };

      setCards(updatedCards);
      setStats(updatedStats);
      setCurrent(pickNextCard(updatedCards, current.id, newSeenToday, dailyLimit));
      setFlipped(false);
      persist(updatedCards, updatedStats, darkMode, audioEnabled, dailyLimit);
    },
    [cards, current, stats, darkMode, audioEnabled, dailyLimit, persist]
  );

  // ── Auto-speak Greek side when card flips to back ─────────────────────────
  useEffect(() => {
    if (flipped && audioEnabled && current) {
      speak(current.greek);
    }
  }, [flipped, audioEnabled, current]);

  // ── Keyboard shortcuts (flashcard mode) ───────────────────────────────────
  useEffect(() => {
    if (studyMode !== 'flashcard') return;
    const handler = (e) => {
      if (e.code === 'Space')  { e.preventDefault(); setFlipped((f) => !f); }
      if (!flipped) return;
      if (e.code === 'Digit1') advance(1); // Again
      if (e.code === 'Digit2') advance(2); // Hard
      if (e.code === 'Digit3') advance(4); // Good
      if (e.code === 'Digit4') advance(5); // Easy
      if (e.code === 'ArrowRight') advance(4); // Good (legacy)
      if (e.code === 'ArrowLeft')  advance(1); // Again (legacy)
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [flipped, advance, studyMode]);

  if (loading) return <div className="loading">Loading cards…</div>;
  if (!current) return <div className="loading">No cards found.</div>;

  const sessionTotal = stats.got + stats.missed;
  const pct      = sessionTotal === 0 ? 0 : Math.round((stats.got / sessionTotal) * 100);
  const dueCount = cards.filter((c) => c.sm2.dueDate <= today() && c.sm2.repetition > 0).length;
  const newCount = cards.filter((c) => c.sm2.repetition === 0).length;

  const todayStats = stats.newSeenDate === today() ? stats.newSeenToday : 0;
  const newRemaining = Math.max(0, dailyLimit - todayStats);

  const front    = direction === 'en-to-gr' ? current.english : current.greek;
  const backGreek = current.greek;
  const backMeta  = [current.gender, current.partOfSpeech].filter(Boolean).join(' · ');

  return (
    <div className={`app${darkMode ? ' dark' : ''}`}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="header">
        <span className="app-title">🇬🇷 Greek Flashcards</span>

        <div className="mode-toggle">
          {STUDY_MODES.map((m) => (
            <button key={m.id} className={studyMode === m.id ? 'active' : ''}
              onClick={() => { setStudyMode(m.id); setFlipped(false); }}>
              {m.label}
            </button>
          ))}
        </div>

        {studyMode !== 'alphabet' && <div className="mode-toggle direction-toggle">
          {DIRECTION_MODES.map((m) => (
            <button key={m.id} className={direction === m.id ? 'active' : ''}
              onClick={() => { setDirection(m.id); setFlipped(false); }}>
              {m.label}
            </button>
          ))}
        </div>}

        <div className="header-right">
          <div className="stats">
            {dueCount > 0 && <span className="stat due-badge">{dueCount} due</span>}
            {newRemaining > 0 && <span className="stat new-badge">{newRemaining} new</span>}
            <span className="stat got">✓ {stats.got}</span>
            <span className="stat missed">✗ {stats.missed}</span>
            {sessionTotal > 0 && <span className="stat pct">{pct}%</span>}
          </div>
          <button className="icon-btn" title="Toggle audio"
            onClick={() => {
              const next = !audioEnabled;
              setAudioEnabled(next);
              persist(cards, stats, darkMode, next, dailyLimit);
            }}>
            {audioEnabled ? '🔊' : '🔇'}
          </button>
          <button className="icon-btn" title="Settings" onClick={() => setShowSettings(true)}>⚙️</button>
          <button className="icon-btn" title="Progress" onClick={() => setShowStats(true)}>📊</button>
          <button className="icon-btn" title="Toggle dark mode" onClick={() => {
            setDarkMode((d) => {
              const next = !d;
              persist(cards, stats, next, audioEnabled, dailyLimit);
              return next;
            });
          }}>
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      {/* ── Settings overlay ───────────────────────────────────────────── */}
      {showSettings && (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && setShowSettings(false)}>
          <div className="settings-panel">
            <div className="stats-header">
              <h2>Settings</h2>
              <button className="stats-close" onClick={() => setShowSettings(false)}>✕</button>
            </div>
            <div className="setting-row">
              <label className="setting-label">
                New cards per day
                <span className="setting-hint">Cards you've never seen before</span>
              </label>
              <div className="setting-control">
                {[5, 10, 20, 30, 50].map((n) => (
                  <button key={n}
                    className={`limit-btn${dailyLimit === n ? ' active' : ''}`}
                    onClick={() => {
                      setDailyLimit(n);
                      persist(cards, stats, darkMode, audioEnabled, n);
                    }}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div className="setting-row">
              <label className="setting-label">
                Audio pronunciation
                <span className="setting-hint">Speak Greek word when card flips</span>
              </label>
              <button
                className={`toggle-btn${audioEnabled ? ' active' : ''}`}
                onClick={() => {
                  const next = !audioEnabled;
                  setAudioEnabled(next);
                  persist(cards, stats, darkMode, next, dailyLimit);
                }}>
                {audioEnabled ? 'On' : 'Off'}
              </button>
            </div>
            <div className="setting-row">
              <label className="setting-label">
                Total cards
                <span className="setting-hint">{cards.length} cards · {newCount} not yet seen</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ── Stats overlay ──────────────────────────────────────────────── */}
      {showStats && (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && setShowStats(false)}>
          <StatsScreen cards={cards} stats={stats} onClose={() => setShowStats(false)} />
        </div>
      )}

      {/* ── Main study area ─────────────────────────────────────────────── */}
      <main className={`card-area${studyMode === 'alphabet' ? ' scrollable' : ''}`}>

        {/* ── Flashcard mode ── */}
        {studyMode === 'flashcard' && (
          <>
            <div className={`card-container${flipped ? ' flipped' : ''}`}
              onClick={() => setFlipped((f) => !f)}>
              <div className="card">
                <div className="card-face card-front">
                  <p className="card-label">{direction === 'en-to-gr' ? 'English' : 'Greek'}</p>
                  <h1 className="card-word">{front}</h1>
                  <p className="card-hint">Click or press Space to flip</p>
                </div>
                <div className="card-face card-back">
                  <p className="card-label">Greek</p>
                  <h1 className={`card-word${direction === 'en-to-gr' ? ' greek' : ''}`}>{backGreek}</h1>
                  {backMeta && <p className="card-meta">{backMeta}</p>}
                  {flipped && (
                    <>
                      <div className="example">
                        <p className="example-gr">{current.exampleSentence}</p>
                        <p className="example-en">{current.exampleTranslation}</p>
                      </div>
                      {audioEnabled && (
                        <button className="audio-btn" title="Replay pronunciation"
                          onClick={(e) => { e.stopPropagation(); speak(current.greek); }}>
                          🔊
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* 4-button rating row */}
            <div className={`grade-actions${flipped ? ' visible' : ''}`}>
              {GRADE_BUTTONS.map(({ grade, label, sub, cls }) => (
                <button key={grade} className={`grade-btn ${cls}`}
                  onClick={() => advance(grade)}>
                  <span className="grade-label">{label}</span>
                  <span className="grade-sub">{sub}</span>
                  <kbd>{GRADE_BUTTONS.indexOf(GRADE_BUTTONS.find(b => b.grade === grade)) + 1}</kbd>
                </button>
              ))}
            </div>
          </>
        )}

        {studyMode === 'type' && (
          <TypeAnswer card={current} mode={direction} onAdvance={advance} />
        )}

        {studyMode === 'multiple' && (
          <MultipleChoice card={current} allCards={cards} mode={direction} onAdvance={advance} />
        )}

        {studyMode === 'cloze' && (
          <Cloze card={current} onAdvance={advance} />
        )}

        {studyMode === 'alphabet' && (
          <Alphabet />
        )}
      </main>

      {/* ── Progress bar ────────────────────────────────────────────────── */}
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function getPreviousDay(dateStr) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}
