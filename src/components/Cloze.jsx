import React, { useState, useEffect, useRef } from 'react';

/**
 * Cloze — hides the Greek word inside the example sentence.
 * Front shows: "___ μου είναι Νίκος." (with English hint below)
 * Back reveals the full sentence + the word.
 *
 * Props:
 *   card      — current card object
 *   onAdvance — (knew: bool) => void
 */
export default function Cloze({ card, onAdvance }) {
  const [input, setInput]       = useState('');
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setInput('');
    setSubmitted(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [card.id]);

  // Build the gapped sentence: replace the greek word (case-insensitive) with ___
  const sentence = card.exampleSentence || '';
  const word     = card.greek.trim();

  // Escape special regex chars in the word
  const escaped  = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const gapped   = sentence.replace(new RegExp(escaped, 'i'), '___');
  const hasGap   = gapped !== sentence; // only show cloze if word appears in sentence

  function normalize(s) { return s.trim().toLowerCase(); }
  const isCorrect = submitted && normalize(input) === normalize(word);

  function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim()) return;
    setSubmitted(true);
  }

  useEffect(() => {
    if (!submitted) return;
    const handler = (e) => {
      if (e.code === 'ArrowRight' || e.code === 'Space') onAdvance(isCorrect);
      if (e.code === 'ArrowLeft') onAdvance(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [submitted, isCorrect, onAdvance]);

  // Fallback: if word not in sentence, show English → type Greek
  if (!hasGap || !sentence) {
    return (
      <div className="cloze-container">
        <div className="cloze-card">
          <p className="card-label">Fill in the Greek</p>
          <h1 className="card-word">{card.english}</h1>
          {!submitted ? (
            <form onSubmit={handleSubmit} className="ta-form">
              <input ref={inputRef} className="ta-input" value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type the Greek word…" autoComplete="off" spellCheck={false} />
              <button className="ta-submit" type="submit">Check</button>
            </form>
          ) : (
            <ClozeResult isCorrect={isCorrect} input={input} word={word}
              card={card} onAdvance={onAdvance} />
          )}
        </div>
      </div>
    );
  }

  // Split gapped sentence around ___ for styled rendering
  const [before, after] = gapped.split('___');

  return (
    <div className="cloze-container">
      <div className="cloze-card">
        <p className="card-label">Complete the sentence</p>

        <p className="cloze-sentence">
          <span>{before}</span>
          {!submitted ? (
            <span className="cloze-blank-wrap">
              <input
                ref={inputRef}
                className="cloze-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(e); }}
                placeholder="___"
                autoComplete="off"
                spellCheck={false}
                style={{ width: `${Math.max(input.length, 5) + 2}ch` }}
              />
            </span>
          ) : (
            <span className={`cloze-filled ${isCorrect ? 'correct' : 'incorrect'}`}>
              {isCorrect ? word : <><s>{input}</s> <strong>{word}</strong></>}
            </span>
          )}
          <span>{after}</span>
        </p>

        <p className="cloze-translation">{card.exampleTranslation}</p>
        <p className="cloze-hint">{card.english} · {[card.gender, card.partOfSpeech].filter(Boolean).join(' · ')}</p>

        {!submitted && (
          <button className="ta-submit cloze-check" onClick={handleSubmit}>Check</button>
        )}

        {submitted && (
          <ClozeResult isCorrect={isCorrect} input={input} word={word}
            card={card} onAdvance={onAdvance} inline />
        )}
      </div>
    </div>
  );
}

function ClozeResult({ isCorrect, onAdvance, inline }) {
  return (
    <div className={`cloze-result ${inline ? 'inline' : ''}`}>
      <p className={`ta-verdict ${isCorrect ? 'correct-text' : 'incorrect-text'}`}>
        {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
      </p>
      <div className="ta-actions">
        <button className="btn missed" onClick={() => onAdvance(false)}>✗ Mark wrong <kbd>←</kbd></button>
        <button className="btn got" onClick={() => onAdvance(isCorrect)}>✓ Continue <kbd>→</kbd></button>
      </div>
    </div>
  );
}
