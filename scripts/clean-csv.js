/**
 * clean-csv.js
 *
 * Post-processes the merged CSV to fix common Wiktionary data quality issues:
 * 1. PoS fixes: words Wiktionary tags as "verb" that are clearly adverbs/adjectives
 *    based on their definition text.
 * 2. Strips "form-of" definitions (e.g. "nominative singular of X") and replaces
 *    with a cleaner gloss where possible.
 * 3. Removes entries that are clearly noise (single letters, misspellings flagged
 *    by Wiktionary itself, entries with no useful English).
 *
 * Usage: node scripts/clean-csv.js
 */

const fs   = require('fs');
const path = require('path');

const CSV_FILE = path.join(__dirname, '..', 'public', 'greek_anki.csv');

function parseCSVLine(line) {
  const fields = [];
  let cur = '', inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuote = !inQuote; }
    else if (ch === ',' && !inQuote) { fields.push(cur); cur = ''; }
    else { cur += ch; }
  }
  fields.push(cur);
  return fields.map(f => f.trim());
}

function escapeCSV(val) {
  if (!val) return '';
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

// Patterns that indicate a "form-of" definition — not useful as a flashcard gloss
const FORM_OF_PATTERNS = [
  /^(nominative|accusative|genitive|vocative|dative)\b/i,
  /\bsingular of\b/i,
  /\bplural of\b/i,
  /\bform of\b/i,
  /\bfeminine of\b/i,
  /\bmasculine of\b/i,
  /\bneuter of\b/i,
  /^alternative form of\b/i,
  /^misspelling of\b/i,
  /^obsolete form of\b/i,
  /^(active|passive) (non)?finite form of\b/i,
  /^inflection of\b/i,
  /^present tense of\b/i,
  /^past tense of\b/i,
  /^first.person\b/i,
  /^second.person\b/i,
  /^third.person\b/i,
  /\bimperfect of\b/i,
  /\baorist of\b/i,
  /\bparticiple of\b/i,
  /^abbreviation of\b/i,
  /\bcomparative of\b/i,
  /\bsuperlative of\b/i,
];

// Words to drop entirely (noise / single chars / obvious garbage)
const DROP_WORDS = new Set(['απ', 'γι', 'τελευταία', 'αύριο', 'βράδυ', 'απλώς', 'πει', 'αυτοί', 'ποιο']);

// Manual PoS corrections based on obvious definition text
function inferPoS(english, currentPoS) {
  const e = english.toLowerCase();
  if (/\btomorrow\b/.test(e) || /\byesterday\b/.test(e) || /\btoday\b/.test(e)) return 'adverb';
  if (/^(just|only|also|still|already|always|never|often|here|there|now|then|very|quite|really|well|again|soon|later|early|late|maybe|perhaps|probably|suddenly|usually|finally|quickly|slowly|together|alone|around|away|back|before|after|above|below|outside|inside|almost)\b/.test(e)) return 'adverb';
  if (/\bnight\b/.test(e) && currentPoS === 'verb') return 'adverb';
  return currentPoS;
}

function isFormOf(english) {
  return FORM_OF_PATTERNS.some(p => p.test(english));
}

function cleanDefinition(english) {
  // Remove trailing links like (transliteration, "word")
  return english
    .replace(/\s*\([^)]*\)\s*$/, '')  // trailing parens
    .replace(/\s*\[[^\]]*\]\s*$/, '')  // trailing brackets
    .trim();
}

function main() {
  const text  = fs.readFileSync(CSV_FILE, 'utf8');
  const lines = text.trim().split('\n');
  const header = lines[0];
  const rows   = lines.slice(1);

  let kept = 0, dropped = 0, fixed = 0;
  const output = [header];

  for (const line of rows) {
    if (!line.trim()) continue;
    const fields = parseCSVLine(line);
    const [Greek='', Gender='', PartOfSpeech='', English='', ExampleSentence='', ExampleTranslation=''] = fields;

    // Drop noise entries
    if (DROP_WORDS.has(Greek)) { dropped++; continue; }

    // Drop if English is a form-of definition
    if (isFormOf(English)) { dropped++; continue; }

    // Drop if English is empty
    if (!English.trim()) { dropped++; continue; }

    // Fix PoS
    const newPoS = inferPoS(English, PartOfSpeech);
    if (newPoS !== PartOfSpeech) fixed++;

    // Clean definition
    const cleanEn = cleanDefinition(English);

    const newLine = [Greek, Gender, newPoS, cleanEn, ExampleSentence, ExampleTranslation]
      .map(escapeCSV).join(',');
    output.push(newLine);
    kept++;
  }

  fs.writeFileSync(CSV_FILE, output.join('\n') + '\n', 'utf8');
  console.log(`Kept: ${kept}, Dropped: ${dropped}, PoS fixed: ${fixed}`);
  console.log(`Final CSV: ${kept} cards`);

  // Print a sample of new entries (after original 273)
  console.log('\nSample entries 274-280:');
  output.slice(275, 282).forEach(l => console.log(' ', l.substring(0, 100)));
}

main();
