/**
 * merge-csv.js
 *
 * Merges the enriched Wiktionary words with the existing greek_anki.csv.
 * - Existing cards are preserved exactly as-is (they have better data).
 * - New words not already in the CSV are appended, sorted by frequency rank.
 * - Words with no English definition (the 7 missing) are skipped.
 *
 * Output: public/greek_anki.csv (overwrites)
 *
 * Usage: node scripts/merge-csv.js
 */

const fs   = require('fs');
const path = require('path');

const ENRICHED_FILE = path.join(__dirname, 'words-enriched.json');
const CSV_FILE      = path.join(__dirname, '..', 'public', 'greek_anki.csv');

// ── CSV helpers ───────────────────────────────────────────────────────────────
function parseCSV(text) {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
    // Simple CSV parse — handle quoted fields
    const fields = [];
    let cur = '', inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQuote = !inQuote; }
      else if (ch === ',' && !inQuote) { fields.push(cur); cur = ''; }
      else { cur += ch; }
    }
    fields.push(cur);
    const obj = {};
    headers.forEach((h, i) => { obj[h.trim()] = (fields[i] || '').trim(); });
    return obj;
  });
}

function escapeCSV(val) {
  if (!val) return '';
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function rowToCSV(row) {
  return [
    row.Greek, row.Gender, row.PartOfSpeech, row.English,
    row.ExampleSentence, row.ExampleTranslation,
  ].map(escapeCSV).join(',');
}

// ── Main ──────────────────────────────────────────────────────────────────────
function main() {
  const csvText   = fs.readFileSync(CSV_FILE, 'utf8');
  const existing  = parseCSV(csvText);
  const enriched  = JSON.parse(fs.readFileSync(ENRICHED_FILE, 'utf8'));

  // Index existing words (lowercase for dedup)
  const existingWords = new Set(existing.map(r => r.Greek.toLowerCase().trim()));
  console.log(`Existing cards: ${existing.length}`);

  // Filter enriched: skip words already present and words with no English
  const newWords = enriched.filter(w =>
    w.english &&
    !existingWords.has(w.greek.toLowerCase().trim())
  );
  console.log(`New words to add: ${newWords.length}`);

  // Build new rows
  const newRows = newWords.map(w => ({
    Greek:              w.greek,
    Gender:             w.gender || '',
    PartOfSpeech:       w.partOfSpeech || '',
    English:            w.english,
    ExampleSentence:    w.exampleSentence || '',
    ExampleTranslation: w.exampleTranslation || '',
  }));

  // Write combined CSV
  const header = 'Greek,Gender,PartOfSpeech,English,ExampleSentence,ExampleTranslation';
  const allRows = [...existing, ...newRows];
  const lines = [header, ...allRows.map(rowToCSV)];
  fs.writeFileSync(CSV_FILE, lines.join('\n') + '\n', 'utf8');

  console.log(`Total cards in CSV: ${allRows.length}`);
  console.log(`Written to: ${CSV_FILE}`);

  // Print a few new entries as a sanity check
  console.log('\nSample new entries:');
  newRows.slice(0, 5).forEach(r => {
    console.log(`  ${r.Greek} | ${r.PartOfSpeech} | ${r.English.substring(0, 50)}`);
  });
}

main();
