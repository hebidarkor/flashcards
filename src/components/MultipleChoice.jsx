import React, { useState, useEffect, useMemo } from 'react';

/**
 * MultipleChoice — shows 4 options, one correct.
 * Props:
 *   card      — current card object
 *   allCards  — full card array (for building distractors)
 *   mode      — 'en-to-gr' | 'gr-to-en'
 *   onAdvance — (knew: bool) => void
 */
export default function MultipleChoice({ card, allCards, mode, onAdvance }) {
  const [selected, setSelected] = useState(null);

  // Reset selection on new card
  useEffect(() => {
    setSelected(null);
  }, [card.id]);

  const question = mode === 'en-to-gr' ? card.english : card.greek;
  const answerKey = mode === 'en-to-gr' ? 'greek' : 'english';

  // Build 4 choices: 1 correct + 3 random distractors
  const choices = useMemo(() => {
    const correct = card[answerKey];
    const distractors = allCards
      .filter((c) => c.id !== card.id && c[answerKey] !== correct)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((c) => c[answerKey]);

    const all = [correct, ...distractors].sort(() => Math.random() - 0.5);
    return all;
  }, [card.id, card, answerKey]); // eslint-disable-line

  const correctAnswer = card[answerKey];

  function handleSelect(choice) {
    if (selected !== null) return; // already answered
    setSelected(choice);
  }

  useEffect(() => {
    if (selected === null) return;
    const handler = (e) => {
      if (e.code === 'ArrowRight' || e.code === 'Space') onAdvance(selected === correctAnswer);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selected, correctAnswer, onAdvance]);

  const backMeta = [card.gender, card.partOfSpeech].filter(Boolean).join(' · ');

  return (
    <div className="mc-container">
      <div className="mc-card">
        <p className="card-label">{mode === 'en-to-gr' ? 'English' : 'Greek'}</p>
        <h1 className="card-word">{question}</h1>
        {backMeta && selected !== null && <p className="card-meta">{backMeta}</p>}
      </div>

      <div className="mc-choices">
        {choices.map((choice, i) => {
          let cls = 'mc-choice';
          if (selected !== null) {
            if (choice === correctAnswer) cls += ' mc-correct';
            else if (choice === selected)  cls += ' mc-wrong';
          }
          return (
            <button
              key={i}
              className={cls}
              onClick={() => handleSelect(choice)}
            >
              <span className="mc-letter">{['A', 'B', 'C', 'D'][i]}</span>
              <span className="mc-text">{choice}</span>
            </button>
          );
        })}
      </div>

      {selected !== null && (
        <div className="mc-feedback">
          {selected === correctAnswer
            ? <p className="mc-verdict correct">✓ Correct!</p>
            : <p className="mc-verdict incorrect">✗ The answer was: <strong>{correctAnswer}</strong></p>
          }
          {card.exampleSentence && (
            <div className="example">
              <p className="example-gr">{card.exampleSentence}</p>
              <p className="example-en">{card.exampleTranslation}</p>
            </div>
          )}
          <button
            className="btn got mc-next"
            onClick={() => onAdvance(selected === correctAnswer)}
          >
            Next <kbd>→</kbd>
          </button>
        </div>
      )}
    </div>
  );
}
