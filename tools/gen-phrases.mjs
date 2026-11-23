// Génère une fois les phrases de l'appli en voix neuronale Microsoft Azure (fichiers .ogg).
// La clé est lue dans un fichier local (ligne 1 : clé, ligne 2 : région), jamais affichée.
// Usage : node gen-phrases.mjs <data.js> <dossier de sortie> <fichier clé> [--dry]
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';

const [dataFile, outDir, keyFile, flag] = process.argv.slice(2);
const dry = flag === '--dry';
const ctx = { window: {} }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(dataFile, 'utf8') + ';Object.assign(this,{THEMES,STORIES,DIALOGUES,SONGS,MOVES,PRAISE,RETRY_EN});', ctx);
const { THEMES, STORIES, DIALOGUES, SONGS, MOVES, PRAISE, RETRY_EN } = ctx;

const phrases = new Map(); // texte → voix
const add = (t, voice = 'en-GB-SoniaNeural') => { if (t && !/[{}]/.test(t) && !phrases.has(t)) phrases.set(t, voice); };
const spoken = it => it.say || it.en;
const withA = (tpl, it) => tpl.replace('{w}', spoken(it)).replace('{a} ', it.a ? it.a + ' ' : '');
const SPECIAL = { body: ['Touch your {w}!'], food: ['Give Bloop {a} {w}, please!'], fruit: ['Give Bloop {a} {w}, please!'], clothes: ['Where is the {w}?'],
  house: ['Where is the {w}?'], zoo: ['Where is the {w}?'], sea: ['Find the {w}!'], nature: ['Look! Can you see the {w}?'], actions: ['Show me: {w}!'], jobs: ['Who is the {w}?'] };
for (const t of THEMES) for (const it of t.items) {
  if (t.id === 'abc') { add(`${spoken(it)} is for ${it.ex}.`); continue; }
  if (t.tpl) add(withA(t.tpl, it));
  add(`Pop the ${spoken(it)}!`);
  for (const tpl of SPECIAL[t.id] || []) add(withA(tpl, it));
}
for (const s of STORIES) { s.pages.forEach(p => add(p.en)); s.quiz.forEach(q => add(q.en)); }
for (const d of DIALOGUES) for (const l of d.lines) {
  const v = l.who === 'pip' ? 'en-GB-MaisieNeural' : l.who === 'kid' ? 'en-GB-SoniaNeural' : 'en-GB-RyanNeural';
  if (l.choices) l.choices.forEach(c => add(c.en)); else add(l.en, v);
}
for (const s of SONGS) s.lines.forEach(l => add(l.en, 'en-GB-MaisieNeural'));
MOVES.forEach(m => add(m.en)); PRAISE.forEach(p => add(p)); RETRY_EN.forEach(p => add(p));
['How many?', 'Good try!', 'Say it louder!', 'Great dancing! Well done!', 'Wow! I love it!', 'Hello!', "Let's play!", 'I love English!'].forEach(p => add(p));

const chars = [...phrases.keys()].reduce((a, t) => a + t.length, 0);
console.log('phrases :', phrases.size, '· caractères :', chars);
if (dry) process.exit(0);

// clé : soit un fichier local (ligne 1 : clé, ligne 2 : région), soit « - » = variables
// d'environnement AZURE_TTS_KEY / AZURE_TTS_REGION (secrets GitHub)
let key, region;
if (keyFile === '-') { key = (process.env.AZURE_TTS_KEY || '').trim(); region = (process.env.AZURE_TTS_REGION || '').trim(); }
else [key, region] = fs.readFileSync(keyFile, 'utf8').split(/\r?\n/).map(s => s.trim());
if (!key || !region) { console.log('Pas de clé Azure configurée : voix non générées (l’appli utilisera la voix de synthèse).'); process.exit(0); }
fs.mkdirSync(outDir, { recursive: true });
const idxFile = path.join(outDir, 'index.json');
const found = fs.existsSync(idxFile) ? JSON.parse(fs.readFileSync(idxFile, 'utf8')).found : {};
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const wait = ms => new Promise(r => setTimeout(r, ms));
let done = 0, fails = 0;
for (const [text, voice] of phrases) {
  if (found[text]) { done++; continue; }
  const file = crypto.createHash('sha1').update(voice + '|' + text).digest('hex').slice(0, 12) + '.ogg';
  const ssml = `<speak version="1.0" xml:lang="en-GB"><voice name="${voice}"><prosody rate="-8%">${esc(text)}</prosody></voice></speak>`;
  let ok = false;
  for (let t = 0; t < 4 && !ok; t++) {
    const r = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, { method: 'POST',
      headers: { 'Ocp-Apim-Subscription-Key': key, 'Content-Type': 'application/ssml+xml', 'X-Microsoft-OutputFormat': 'ogg-24khz-16bit-mono-opus', 'User-Agent': 'HelloEnglishTTS' }, body: ssml });
    if (r.ok) { fs.writeFileSync(path.join(outDir, file), Buffer.from(await r.arrayBuffer())); found[text] = file; ok = true; }
    else if (r.status === 401 || r.status === 403) throw new Error('Clé Azure refusée (' + r.status + ') : vérifie la clé et la région');
    else await wait(2000 * (t + 1));
  }
  if (!ok) fails++;
  if (++done % 100 === 0) { console.log(done, '/', phrases.size); fs.writeFileSync(idxFile, JSON.stringify({ found }, null, 1)); }
  await wait(120);
}
fs.writeFileSync(idxFile, JSON.stringify({ found }, null, 1));
console.log('fini :', Object.keys(found).length, 'fichiers · échecs :', fails);
