import React, { useState, useEffect, useRef } from 'react';

/**
 * TypeAnswer — shows the front of a card and asks the user to type the answer.
 * Props:
 *   card       — current card object
 *   mode       — 'en-to-gr' | 'gr-to-en'
 *   onAdvance  — (knew: bool) => void
 */
export default function TypeAnswer({ card, mode, onAdvance }) {
  const [input, setInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef(null);

  // Focus input whenever a new card arrives
  useEffect(() => {
    setInput('');
    setSubmitted(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [card.id]);

  const question = mode === 'en-to-gr' ? card.english : card.greek;
  const answer   = mode === 'en-to-gr' ? card.greek   : card.english;

  function normalize(str) {
    return str.trim().toLowerCase();
  }

  const isCorrect = submitted && normalize(input) === normalize(answer);

  function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim()) return;
    setSubmitted(true);
  }

  function handleKeyDown(e) {
    if (submitted) {
      if (e.code === 'ArrowRight') onAdvance(isCorrect);
      if (e.code === 'ArrowLeft')  onAdvance(false);
    }
  }

  const backMeta = [card.gender, card.partOfSpeech].filter(Boolean).join(' · ');

  return (
    <div className="type-answer" onKeyDown={handleKeyDown} tabIndex={-1}>
      <div className="ta-card">
        <p className="card-label">{mode === 'en-to-gr' ? 'English' : 'Greek'}</p>
        <h1 className="card-word">{question}</h1>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="ta-form">
            <input
              ref={inputRef}
              className="ta-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={mode === 'en-to-gr' ? 'Type the Greek…' : 'Type the English…'}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            <button className="ta-submit" type="submit">Check</button>
          </form>
        ) : (
          <div className={`ta-result ${isCorrect ? 'correct' : 'incorrect'}`}>
            <p className="ta-verdict">{isCorrect ? '✓ Correct!' : '✗ Incorrect'}</p>
            {!isCorrect && (
              <p className="ta-correct-answer">
                <span className="ta-your-label">You typed: </span>
                <span className="ta-your">{input}</span>
                <br />
                <span className="ta-answer-label">Answer: </span>
                <span className="ta-answer">{answer}</span>
              </p>
            )}
            {backMeta && <p className="card-meta">{backMeta}</p>}
            {card.exampleSentence && (
              <div className="example">
                <p className="example-gr">{card.exampleSentence}</p>
                <p className="example-en">{card.exampleTranslation}</p>
              </div>
            )}
            <div className="ta-actions">
              <button className="btn missed" onClick={() => onAdvance(false)}>
                ✗ Mark wrong <kbd>←</kbd>
              </button>
              <button className="btn got" onClick={() => onAdvance(isCorrect)}>
                ✓ Continue <kbd>→</kbd>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
