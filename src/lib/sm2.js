/**
 * SM-2 Spaced Repetition Algorithm
 *
 * Each card carries an `sm2` object:
 * {
 *   interval:    number  — days until next review (starts 1)
 *   repetition:  number  — consecutive correct reviews
 *   easeFactor:  number  — difficulty multiplier (min 1.3, starts 2.5)
 *   dueDate:     string  — ISO date string (YYYY-MM-DD) when card is next due
 * }
 *
 * Grade scale passed to `reviewCard`:
 *   0 = complete blackout
 *   1 = wrong, remembered after seeing answer
 *   2 = wrong, easy to recall once seen
 *   3 = correct with significant difficulty
 *   4 = correct with some hesitation  (maps to our "Got it")
 *   5 = perfect recall               (not used in UI currently)
 */

export function defaultSm2() {
  return {
    interval: 1,
    repetition: 0,
    easeFactor: 2.5,
    dueDate: today(),
  };
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function isDue(sm2) {
  return sm2.dueDate <= today();
}

/**
 * Returns updated sm2 object after a review.
 * @param {object} sm2  — current sm2 state
 * @param {number} grade — 0-5
 */
export function reviewCard(sm2, grade) {
  let { interval, repetition, easeFactor } = sm2;

  if (grade >= 3) {
    // Correct response
    if (repetition === 0) {
      interval = 1;
    } else if (repetition === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetition += 1;
  } else {
    // Incorrect — reset repetition, short interval
    repetition = 0;
    interval = 1;
  }

  // Update ease factor (EF' = EF + (0.1 - (5-grade)*(0.08+(5-grade)*0.02)))
  easeFactor = easeFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;

  const due = new Date();
  due.setDate(due.getDate() + interval);
  const dueDate = due.toISOString().slice(0, 10);

  return { interval, repetition, easeFactor, dueDate };
}

/**
 * Pick the next card to study.
 * Priority: due reviews first, then new cards (up to dailyNewLimit).
 * Excludes the card just shown (lastId).
 *
 * @param {object[]} cards
 * @param {number}   lastId
 * @param {number}   newSeenToday  — how many new cards already introduced today
 * @param {number}   dailyNewLimit — cap on new cards per day (0 = unlimited)
 */
export function pickNextCard(cards, lastId, newSeenToday = 0, dailyNewLimit = 0) {
  const pool = cards.filter((c) => c.id !== lastId);
  if (pool.length === 0) return cards[0];

  // Due reviews (seen at least once and overdue)
  const dueReviews = pool
    .filter((c) => c.sm2.repetition > 0 && isDue(c.sm2))
    .sort((a, b) => a.sm2.dueDate.localeCompare(b.sm2.dueDate));

  if (dueReviews.length > 0) {
    const top = dueReviews.slice(0, 5);
    return top[Math.floor(Math.random() * top.length)];
  }

  // New cards — respect daily limit
  const newCards = pool.filter((c) => c.sm2.repetition === 0);
  const limitReached = dailyNewLimit > 0 && newSeenToday >= dailyNewLimit;

  if (newCards.length > 0 && !limitReached) {
    return newCards[Math.floor(Math.random() * newCards.length)];
  }

  // Fallback: any due card (including new ones if limit not set), or random
  const anyDue = pool.filter((c) => isDue(c.sm2));
  if (anyDue.length > 0) return anyDue[Math.floor(Math.random() * anyDue.length)];
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Count how many new cards (repetition === 0) were introduced today.
 * We track this via the newSeenToday counter in App state, reset each day.
 */
export function getDueCountByDate(cards) {
  const counts = {};
  cards.forEach((c) => {
    const d = c.sm2.dueDate;
    counts[d] = (counts[d] || 0) + 1;
  });
  return counts;
}
