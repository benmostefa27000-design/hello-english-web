// Construit js/audio-index.js : texte (normalisé) → fichier audio, + crédits.
// Usage : node build-audio-index.mjs <dossier assets>
import fs from 'node:fs';
import path from 'node:path';

const assets = process.argv[2];
const key = t => (t || '').toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();
const map = {}, credits = [];

// 1) mots enregistrés par de vrais anglophones (Wikimedia Commons)
const wIdx = path.join(assets, 'audio', 'words', 'index.json');
if (fs.existsSync(wIdx)) {
  const { found, credits: c } = JSON.parse(fs.readFileSync(wIdx, 'utf8'));
  for (const [w, f] of Object.entries(found)) map[key(w)] = `audio/words/${f}`;
  credits.push(...c);
}
// 2) phrases en voix neuronale (générées une fois)
const pIdx = path.join(assets, 'audio', 'phrases', 'index.json');
if (fs.existsSync(pIdx)) {
  const { found } = JSON.parse(fs.readFileSync(pIdx, 'utf8'));
  for (const [t, f] of Object.entries(found)) if (!map[key(t)]) map[key(t)] = `audio/phrases/${f}`;
}

const out = `/* Généré automatiquement : enregistrements audio disponibles (texte → fichier) */
const AUDIO_MAP = ${JSON.stringify(map)};
const AUDIO_CREDITS = ${JSON.stringify(credits.map(c => ({ word: c.word, author: c.author, license: c.license, url: c.url })))};
`;
fs.writeFileSync(path.join(assets, 'js', 'audio-index.js'), out);
console.log('entrées audio :', Object.keys(map).length, '· crédits :', credits.length);
