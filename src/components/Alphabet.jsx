import React, { useState } from 'react';

const ALPHABET = [
  { upper: 'Α', lower: 'α', name: 'Alpha',   latin: 'a',  pronunciation: 'like "a" in "father"' },
  { upper: 'Β', lower: 'β', name: 'Beta',    latin: 'v',  pronunciation: 'like "v" in "voice"' },
  { upper: 'Γ', lower: 'γ', name: 'Gamma',   latin: 'g',  pronunciation: 'like "y" in "yes" (before e/i) or soft "g"' },
  { upper: 'Δ', lower: 'δ', name: 'Delta',   latin: 'dh', pronunciation: 'like "th" in "the"' },
  { upper: 'Ε', lower: 'ε', name: 'Epsilon', latin: 'e',  pronunciation: 'like "e" in "bed"' },
  { upper: 'Ζ', lower: 'ζ', name: 'Zeta',    latin: 'z',  pronunciation: 'like "z" in "zone"' },
  { upper: 'Η', lower: 'η', name: 'Eta',     latin: 'i',  pronunciation: 'like "ee" in "feet"' },
  { upper: 'Θ', lower: 'θ', name: 'Theta',   latin: 'th', pronunciation: 'like "th" in "think"' },
  { upper: 'Ι', lower: 'ι', name: 'Iota',    latin: 'i',  pronunciation: 'like "ee" in "feet"' },
  { upper: 'Κ', lower: 'κ', name: 'Kappa',   latin: 'k',  pronunciation: 'like "k" in "key"' },
  { upper: 'Λ', lower: 'λ', name: 'Lambda',  latin: 'l',  pronunciation: 'like "l" in "love"' },
  { upper: 'Μ', lower: 'μ', name: 'Mu',      latin: 'm',  pronunciation: 'like "m" in "moon"' },
  { upper: 'Ν', lower: 'ν', name: 'Nu',      latin: 'n',  pronunciation: 'like "n" in "night"' },
  { upper: 'Ξ', lower: 'ξ', name: 'Xi',      latin: 'ks', pronunciation: 'like "x" in "fox"' },
  { upper: 'Ο', lower: 'ο', name: 'Omicron', latin: 'o',  pronunciation: 'like "o" in "off"' },
  { upper: 'Π', lower: 'π', name: 'Pi',      latin: 'p',  pronunciation: 'like "p" in "pen"' },
  { upper: 'Ρ', lower: 'ρ', name: 'Rho',     latin: 'r',  pronunciation: 'rolled "r"' },
  { upper: 'Σ', lower: 'σ', name: 'Sigma',   latin: 's',  pronunciation: 'like "s" in "sun" (ς at word end)' },
  { upper: 'Τ', lower: 'τ', name: 'Tau',     latin: 't',  pronunciation: 'like "t" in "top"' },
  { upper: 'Υ', lower: 'υ', name: 'Upsilon', latin: 'i',  pronunciation: 'like "ee" in "feet"' },
  { upper: 'Φ', lower: 'φ', name: 'Phi',     latin: 'f',  pronunciation: 'like "f" in "fan"' },
  { upper: 'Χ', lower: 'χ', name: 'Chi',     latin: 'ch', pronunciation: 'like "ch" in Scottish "loch"' },
  { upper: 'Ψ', lower: 'ψ', name: 'Psi',     latin: 'ps', pronunciation: 'like "ps" in "lips"' },
  { upper: 'Ω', lower: 'ω', name: 'Omega',   latin: 'o',  pronunciation: 'like "o" in "off"' },
];

// Common digraphs / combos worth knowing
const DIGRAPHS = [
  { combo: 'αι', sound: 'e',  note: 'like "e" in "bed"' },
  { combo: 'ει', sound: 'i',  note: 'like "ee" in "feet"' },
  { combo: 'οι', sound: 'i',  note: 'like "ee" in "feet"' },
  { combo: 'αυ', sound: 'av/af', note: '"av" before vowels/voiced, "af" before unvoiced' },
  { combo: 'ευ', sound: 'ev/ef', note: '"ev" before vowels/voiced, "ef" before unvoiced' },
  { combo: 'ου', sound: 'ou', note: 'like "oo" in "moon"' },
  { combo: 'μπ', sound: 'b/mb', note: '"b" at word start, "mb" in middle' },
  { combo: 'ντ', sound: 'd/nd', note: '"d" at word start, "nd" in middle' },
  { combo: 'γκ', sound: 'g',  note: 'like "g" in "go"' },
  { combo: 'τσ', sound: 'ts', note: 'like "ts" in "cats"' },
  { combo: 'τζ', sound: 'dz', note: 'like "ds" in "kids"' },
];

function speak(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = 'el-GR';
  utt.rate = 0.8;
  window.speechSynthesis.speak(utt);
}

export default function Alphabet() {
  const [active, setActive] = useState(null); // index of tapped letter

  function handleLetter(idx, letter) {
    setActive(idx);
    speak(letter.lower);
  }

  function handleDigraph(combo) {
    speak(combo);
  }

  return (
    <div className="alphabet-screen">
      <div className="alphabet-intro">
        <p>Tap any letter to hear its pronunciation in Modern Greek.</p>
      </div>

      {/* ── Letter grid ─────────────────────────────────────────────────── */}
      <div className="alpha-grid">
        {ALPHABET.map((letter, idx) => (
          <button
            key={letter.name}
            className={`alpha-card${active === idx ? ' alpha-active' : ''}`}
            onClick={() => handleLetter(idx, letter)}
          >
            <span className="alpha-upper">{letter.upper}</span>
            <span className="alpha-lower">{letter.lower}</span>
            <span className="alpha-name">{letter.name}</span>
            <span className="alpha-latin">{letter.latin}</span>
          </button>
        ))}
      </div>

      {/* ── Active letter detail ─────────────────────────────────────────── */}
      {active !== null && (
        <div className="alpha-detail">
          <span className="alpha-detail-letter">{ALPHABET[active].upper} {ALPHABET[active].lower}</span>
          <span className="alpha-detail-name">{ALPHABET[active].name}</span>
          <span className="alpha-detail-pron">{ALPHABET[active].pronunciation}</span>
          <button className="alpha-replay" onClick={() => speak(ALPHABET[active].lower)}>
            🔊 Replay
          </button>
        </div>
      )}

      {/* ── Digraphs ─────────────────────────────────────────────────────── */}
      <div className="alpha-section-title">Common letter combinations</div>
      <div className="digraph-grid">
        {DIGRAPHS.map((d) => (
          <button
            key={d.combo}
            className="digraph-card"
            onClick={() => handleDigraph(d.combo)}
          >
            <span className="digraph-combo">{d.combo}</span>
            <span className="digraph-sound">/{d.sound}/</span>
            <span className="digraph-note">{d.note}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
