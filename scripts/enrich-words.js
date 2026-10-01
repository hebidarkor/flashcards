/**
 * enrich-words.js
 *
 * For each word in words-raw.json, calls the free Wiktionary REST API to get:
 *   - English definition(s)
 *   - Part of speech
 *   - Gender (for nouns)
 *   - Example sentence (from Wiktionary if available)
 *
 * Writes results incrementally to words-enriched.json so you can
 * resume if the script is interrupted (it skips already-done words).
 *
 * Rate limit: 1 request per 300ms (~3/sec) — well within Wiktionary's limits.
 *
 * Usage: node scripts/enrich-words.js
 */

const https = require('https');
const fs    = require('fs');
const path  = require('path');

const RAW_FILE      = path.join(__dirname, 'words-raw.json');
const ENRICHED_FILE = path.join(__dirname, 'words-enriched.json');
const DELAY_MS      = 350; // ms between requests

// ── HTTP helper ───────────────────────────────────────────────────────────────
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'GreekFlashcards/1.0 (educational; contact: nziemis@example.com)',
        'Accept': 'application/json',
      }
    }, (res) => {
      let data = '';
      res.on('data', d => { data += d; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ── Wiktionary parser ─────────────────────────────────────────────────────────
/**
 * Calls https://en.wiktionary.org/api/rest_v1/page/definition/{word}
 * Returns { english, partOfSpeech, gender, exampleSentence, exampleTranslation }
 */
async function lookupWord(greek) {
  const encoded = encodeURIComponent(greek);
  const url = `https://en.wiktionary.org/api/rest_v1/page/definition/${encoded}`;
  const data = await fetchJSON(url);

  if (!data || !data.el) return null; // 'el' = Modern Greek section

  const elEntries = data.el; // array of PoS entries

  let english        = '';
  let partOfSpeech   = '';
  let gender         = '';
  let exampleSentence     = '';
  let exampleTranslation  = '';

  for (const entry of elEntries) {
    const pos = (entry.partOfSpeech || '').toLowerCase();
    partOfSpeech = partOfSpeech || entry.partOfSpeech || '';

    for (const def of (entry.definitions || [])) {
      // First non-empty definition becomes the English gloss
      if (!english && def.definition) {
        // Strip HTML tags
        const clean = def.definition.replace(/<[^>]+>/g, '').trim();
        if (clean) english = clean;
      }

      // Gender: look in definition text or parsedExamples
      if (!gender) {
        const defText = (def.definition || '').toLowerCase();
        if (defText.includes('masculine') || defText.includes('(m)')) gender = 'masculine';
        else if (defText.includes('feminine') || defText.includes('(f)')) gender = 'feminine';
        else if (defText.includes('neuter') || defText.includes('(n)')) gender = 'neuter';
      }

      // Example sentences
      if (!exampleSentence && def.parsedExamples && def.parsedExamples.length > 0) {
        const ex = def.parsedExamples[0];
        if (ex.example) {
          exampleSentence    = ex.example.replace(/<[^>]+>/g, '').trim();
          exampleTranslation = (ex.translation || '').replace(/<[^>]+>/g, '').trim();
        }
      }
      // Also try .examples (older API format)
      if (!exampleSentence && def.examples && def.examples.length > 0) {
        const raw = def.examples[0].replace(/<[^>]+>/g, '').trim();
        if (raw) exampleSentence = raw;
      }
    }

    // Stop after we have enough
    if (english && partOfSpeech) break;
  }

  if (!english) return null;

  // Normalise PoS to short form
  const posMap = {
    'noun': 'noun', 'verb': 'verb', 'adjective': 'adjective',
    'adverb': 'adverb', 'pronoun': 'pronoun', 'preposition': 'preposition',
    'conjunction': 'conjunction', 'particle': 'particle', 'article': 'article',
    'interjection': 'interjection', 'numeral': 'numeral',
  };
  const posLower = partOfSpeech.toLowerCase();
  for (const [k, v] of Object.entries(posMap)) {
    if (posLower.includes(k)) { partOfSpeech = v; break; }
  }

  return { english, partOfSpeech, gender, exampleSentence, exampleTranslation };
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const raw = JSON.parse(fs.readFileSync(RAW_FILE, 'utf8'));

  // Load existing progress
  let enriched = [];
  if (fs.existsSync(ENRICHED_FILE)) {
    enriched = JSON.parse(fs.readFileSync(ENRICHED_FILE, 'utf8'));
    console.log(`Resuming — ${enriched.length} words already done.`);
  }

  const done = new Set(enriched.map(w => w.greek));
  const todo = raw.filter(w => !done.has(w.greek));

  console.log(`${todo.length} words to enrich…`);

  let found = 0, missing = 0;

  for (let i = 0; i < todo.length; i++) {
    const { rank, greek, freq } = todo[i];
    const result = await lookupWord(greek);

    if (result) {
      enriched.push({ rank, greek, freq, ...result });
      found++;
    } else {
      // Keep the word with empty fields — we'll fill manually or skip
      enriched.push({ rank, greek, freq, english: '', partOfSpeech: '', gender: '', exampleSentence: '', exampleTranslation: '' });
      missing++;
    }

    // Save every 25 words
    if ((i + 1) % 25 === 0 || i === todo.length - 1) {
      // Sort by rank before saving
      enriched.sort((a, b) => a.rank - b.rank);
      fs.writeFileSync(ENRICHED_FILE, JSON.stringify(enriched, null, 2), 'utf8');
      const pct = Math.round(((enriched.length) / raw.length) * 100);
      process.stdout.write(`\r[${pct}%] ${enriched.length}/${raw.length} — found: ${found}, missing: ${missing}   `);
    }

    await sleep(DELAY_MS);
  }

  console.log(`\nDone. Found: ${found}, missing definitions: ${missing}`);
  console.log(`Output: ${ENRICHED_FILE}`);
}

main().catch(console.error);
