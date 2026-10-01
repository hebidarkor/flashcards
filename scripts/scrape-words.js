/**
 * scrape-words.js
 * Fetches the Wiktionary 5K Greek frequency list and writes the top 1000
 * words (with rank) to scripts/words-raw.json
 */
const https = require('https');
const fs    = require('fs');
const path  = require('path');

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'GreekFlashcards/1.0 (educational)' } }, (res) => {
      let data = '';
      res.on('data', d => { data += d; });
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function main() {
  console.log('Fetching Wiktionary frequency list…');
  const html = await fetch('https://en.wiktionary.org/wiki/Wiktionary:Frequency_lists/Modern_Greek/5K_Wordlist');

  // Each word entry looks like: title="word">word</a> 1234567</li>
  const re = /title="([^"#]+)">\1<\/a>\s*([\d,]+)<\/li>/g;
  const words = [];
  let m;
  while ((m = re.exec(html)) !== null) {
    const word = m[1].trim();
    const freq = parseInt(m[2].replace(/,/g, ''), 10);
    // Skip entries that are not Greek (contain only ASCII letters — likely noise)
    if (/^[a-zA-Z0-9\s]+$/.test(word)) continue;
    words.push({ rank: words.length + 1, greek: word, freq });
    if (words.length >= 1000) break;
  }

  console.log(`Scraped ${words.length} words.`);
  console.log('First 5:', words.slice(0, 5).map(w => w.greek).join(', '));
  console.log('Last 5: ', words.slice(-5).map(w => w.greek).join(', '));

  const out = path.join(__dirname, 'words-raw.json');
  fs.writeFileSync(out, JSON.stringify(words, null, 2), 'utf8');
  console.log(`Saved to ${out}`);
}

main().catch(console.error);
