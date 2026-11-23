/* Voix (synthèse), micro (reconnaissance vocale) et petits sons */
'use strict';

const NATIVE = typeof window.Android !== 'undefined' && !!window.Android.speak;

/* ================= VOIX ================= */
const Voice = (() => {
  let seq = 0;
  const pending = {};
  let enVoice = null, frVoice = null;

  window.__ttsDone = id => { const p = pending[id]; if (p) { delete pending[id]; clearTimeout(p.t); p.res(); } };

  // on prend la voix la plus naturelle disponible : voix « Natural / Neural / Online » (Edge, Windows),
  // voix Google, puis les autres ; accent demandé d'abord
  function rankVoice(v, lang) {
    let s = 0;
    if (v.lang === lang) s += 50; else if (v.lang && v.lang.slice(0, 2) === lang.slice(0, 2)) s += 20; else return -1;
    if (/natural|neural/i.test(v.name)) s += 40;
    if (/online/i.test(v.name)) s += 15;
    if (/google/i.test(v.name)) s += 12;
    if (/(sonia|libby|maisie|ana|aria|jenny|emma|denise|vivienne|eloise)/i.test(v.name)) s += 6; // voix claires, adaptées aux enfants
    if (v.localService) s += 2;
    return s;
  }
  function best(vs, lang) { let b = null, bs = -1; for (const v of vs) { const s = rankVoice(v, lang); if (s > bs) { bs = s; b = v; } } return bs >= 0 ? b : null; }
  function pickWebVoices() {
    if (!('speechSynthesis' in window)) return;
    const vs = speechSynthesis.getVoices();
    const accent = (Store.settings().accent === 'us') ? 'en-US' : 'en-GB';
    enVoice = best(vs, accent);
    frVoice = best(vs, 'fr-FR');
  }
  if ('speechSynthesis' in window) { pickWebVoices(); speechSynthesis.onvoiceschanged = pickWebVoices; }

  /* ---- vrais enregistrements : si un fichier audio existe pour ce texte, on le joue ---- */
  let player = null;
  const audioKey = t => (t || '').toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();
  function recordedFor(text, lang) {
    const map = (typeof AUDIO_MAP !== 'undefined') ? AUDIO_MAP : null;
    if (!map || lang !== 'en' || Store.settings().realVoices === false) return null;
    return map[audioKey(text)] || null;
  }
  function playFile(src, id, rate) {
    try { if (player) player.pause(); } catch (e) {}
    player = new Audio(src);
    player.playbackRate = Math.max(0.7, Math.min(1.1, rate / 0.85));
    player.onended = player.onerror = () => window.__ttsDone(id);
    const p = player.play(); if (p && p.catch) p.catch(() => window.__ttsDone(id));
  }

  function say(text, lang = 'en', opts = {}) {
    if (!text) return Promise.resolve();
    const st = Store.settings();
    const rec = recordedFor(text, lang);
    if (rec) {
      const id = 'a' + (++seq);
      return new Promise(res => {
        pending[id] = { res, t: setTimeout(() => window.__ttsDone(id), 8000) };
        playFile(rec, id, (opts.rate || 1) * st.speed);
      });
    }
    const rate = (opts.rate || 1) * (lang === 'en' ? st.speed : 1);
    const pitch = opts.pitch || 1.1;
    const id = 'u' + (++seq);
    // garde-fou : si la fin n'arrive jamais, on continue quand même
    const maxMs = 2500 + text.length * 130 / rate;
    return new Promise(res => {
      pending[id] = { res, t: setTimeout(() => window.__ttsDone(id), maxMs) };
      try {
        if (NATIVE) {
          window.Android.speak(id, text, lang === 'en' ? (st.accent === 'us' ? 'en-US' : 'en-GB') : 'fr-FR', rate, pitch);
        } else if ('speechSynthesis' in window) {
          const u = new SpeechSynthesisUtterance(text);
          u.lang = lang === 'en' ? (st.accent === 'us' ? 'en-US' : 'en-GB') : 'fr-FR';
          if (lang === 'en' && (!enVoice || enVoice.lang !== u.lang)) pickWebVoices(); // l'accent a changé
          const v = lang === 'en' ? enVoice : frVoice; if (v) u.voice = v;
          u.rate = rate; u.pitch = pitch;
          u.onend = u.onerror = () => window.__ttsDone(id);
          speechSynthesis.speak(u);
        } else {
          setTimeout(() => window.__ttsDone(id), 400 + text.length * 40);
        }
      } catch (e) { window.__ttsDone(id); }
    });
  }

  function stop() {
    try { if (player) player.pause(); } catch (e) {}
    try { if (NATIVE) window.Android.stopSpeak(); else if ('speechSynthesis' in window) speechSynthesis.cancel(); } catch (e) {}
    Object.keys(pending).forEach(k => window.__ttsDone(k));
  }

  // consigne : en français ou en anglais selon le réglage
  function instr(fr, en) {
    return Store.settings().frInstr ? say(fr, 'fr', { pitch: 1.05 }) : say(en, 'en');
  }

  function status() {
    if (NATIVE) { try { return JSON.parse(window.Android.ttsStatus()); } catch (e) { return { en: true, fr: true }; } }
    return { en: true, fr: true };
  }
  return { say, stop, instr, status };
})();

/* ================= MICRO ================= */
const Mic = (() => {
  let handler = null;
  let webRec = null;
  window.__asr = msg => { if (handler) handler(typeof msg === 'string' ? JSON.parse(msg) : msg); };
  window.__micPerm = granted => { if (Mic._permRes) { Mic._permRes(!!granted); Mic._permRes = null; } };

  function available() {
    if (!Store.settings().mic) return false;
    if (NATIVE) { try { return !!window.Android.micAvailable(); } catch (e) { return false; } }
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition) || !!window.__FAKE_MIC;
  }

  function ensurePermission() {
    if (!NATIVE) return Promise.resolve(true);
    try { if (window.Android.hasMicPermission()) return Promise.resolve(true); } catch (e) { return Promise.resolve(false); }
    return new Promise(res => { Mic._permRes = res; window.Android.askMicPermission(); });
  }

  // renvoie { heard: [phrases], error }
  function listen() {
    const st = Store.settings();
    const lang = st.accent === 'us' ? 'en-US' : 'en-GB';
    return new Promise(res => {
      let done = false;
      const finish = r => { if (done) return; done = true; handler = null; clearTimeout(guard); res(r); };
      const guard = setTimeout(() => { stop(); finish({ heard: [], error: 'timeout' }); }, 9000);
      if (window.__FAKE_MIC) { setTimeout(() => finish({ heard: [window.__FAKE_MIC()] }), 600); return; }
      if (NATIVE) {
        handler = m => {
          if (m.type === 'results') finish({ heard: m.results || [] });
          else if (m.type === 'error') finish({ heard: [], error: m.code });
        };
        window.Android.listen(lang);
        return;
      }
      const R = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!R) return finish({ heard: [], error: 'none' });
      webRec = new R();
      webRec.lang = lang; webRec.maxAlternatives = 5; webRec.interimResults = false;
      webRec.onresult = e => { const out = []; for (const alt of e.results[0]) out.push(alt.transcript); finish({ heard: out }); };
      webRec.onerror = e => finish({ heard: [], error: e.error });
      webRec.onend = () => finish({ heard: [], error: 'nomatch' });
      try { webRec.start(); } catch (e) { finish({ heard: [], error: 'start' }); }
    });
  }

  function stop() {
    try { if (NATIVE) window.Android.stopListen(); else if (webRec) webRec.abort(); } catch (e) {}
  }

  /* ---- comparaison tolérante ---- */
  const HOMO = { two: ['to', 'too', '2'], four: ['for', '4'], eight: ['ate', '8'], one: ['won', '1'], red: ['read'],
    eye: ['i', 'aye'], bee: ['be', 'b'], see: ['sea', 'c'], pee: ['p'], tea: ['t', 'tee'], you: ['u'], why: ['y'],
    ay: ['a', 'hey'], ee: ['e'], jay: ['j'], kay: ['k', 'ok', 'okay'], oh: ['o'], are: ['r'], ess: ['s', 'yes'], ex: ['x'],
    zed: ['z', 'said'], three: ['3', 'free', 'tree'], five: ['5'], six: ['6', 'sex'], seven: ['7'], nine: ['9'], ten: ['10'],
    hi: ['high'], night: ['knight'], pear: ['pair'], whale: ['wale'], cap: ['cup', 'cab'], cat: ['cut', 'kat'], dog: ['doug'],
    sock: ['sack', 'sok'], hat: ['hut', 'had'], pig: ['big'], ball: ['bowl', 'bal'], mum: ['mom', 'mam'], dad: ['dead'] };

  const norm = s => (s || '').toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();

  function lev(a, b) {
    const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
    let prev = Array.from({ length: n + 1 }, (_, i) => i);
    for (let i = 1; i <= m; i++) {
      const cur = [i];
      for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
    return prev[n];
  }
  const sim = (a, b) => 1 - lev(a, b) / Math.max(a.length, b.length, 1);

  function wordMatch(target, heardWords) {
    const alts = [target, ...(HOMO[target] || [])];
    return heardWords.some(h => alts.some(a => a === h || (a.length > 3 && sim(a, h) >= 0.6) || (a.length <= 3 && a.length > 1 && sim(a, h) >= 0.66)));
  }

  // score 0..1 entre ce qui est attendu et ce qui a été entendu
  function score(expected, heardList) {
    const exp = norm(expected).split(' ').filter(Boolean);
    let best = 0;
    for (const h of heardList) {
      const hw = norm(h).split(' ').filter(Boolean);
      if (!hw.length) continue;
      if (exp.length === 1) {
        if (wordMatch(exp[0], hw)) return 1;
        best = Math.max(best, sim(exp[0], hw.join('')));
      } else {
        const hit = exp.filter(w => wordMatch(w, hw)).length / exp.length;
        best = Math.max(best, hit, sim(exp.join(' '), hw.join(' ')));
      }
    }
    return best;
  }
  return { available, ensurePermission, listen, stop, score, norm };
})();

/* ================= PETITS SONS (synthétisés, sans fichier) ================= */
const Sfx = (() => {
  let ctx = null;
  const ac = () => { if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } if (ctx && ctx.state === 'suspended') ctx.resume(); return ctx; };
  function tone(freq, start, dur, type = 'sine', vol = 0.18) {
    const c = ac(); if (!c || !Store.settings().sfx) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, c.currentTime + start);
    g.gain.setValueAtTime(0.0001, c.currentTime + start);
    g.gain.exponentialRampToValueAtTime(vol, c.currentTime + start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
    o.connect(g).connect(c.destination); o.start(c.currentTime + start); o.stop(c.currentTime + start + dur + 0.05);
  }
  return {
    unlock: ac,
    good() { tone(660, 0, 0.15, 'triangle'); tone(880, 0.12, 0.25, 'triangle'); },
    bad() { tone(220, 0, 0.18, 'sine', 0.12); tone(185, 0.15, 0.25, 'sine', 0.1); },
    pop() { tone(900, 0, 0.06, 'square', 0.06); tone(1400, 0.03, 0.05, 'sine', 0.08); },
    flip() { tone(500, 0, 0.07, 'triangle', 0.08); },
    star() { [784, 988, 1175, 1568].forEach((f, i) => tone(f, i * 0.09, 0.22, 'triangle', 0.14)); },
    tick() { tone(1000, 0, 0.04, 'square', 0.04); },
    beat(n = 8, bpm = 120) {
      const step = 60 / bpm;
      for (let i = 0; i < n; i++) { tone(i % 2 ? 180 : 110, i * step, 0.12, 'sine', 0.25); if (i % 2) tone(2400, i * step, 0.03, 'square', 0.03); }
    },
    tone,
  };
})();

/* ================= MUSIQUE DES COMPTINES (mélodie + rythme, en boucle, discrète sous la voix) ================= */
const Music = (() => {
  let timer = null;
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);
  function start(melody, bpm) {
    stop();
    const beat = 60 / bpm; let i = 0;
    const bar = () => {
      // une mesure = 4 temps : 2 notes de mélodie par temps, une basse et un petit tambour
      for (let b = 0; b < 4; b++) {
        Sfx.tone(b % 2 ? 150 : 98, b * beat, 0.1, 'sine', 0.14);
        if (b % 2) Sfx.tone(2200, b * beat, 0.025, 'square', 0.02);
        for (let half = 0; half < 2; half++) {
          const m = melody[i++ % melody.length];
          Sfx.tone(hz(m), b * beat + half * beat / 2, beat / 2 * 0.9, 'triangle', 0.045);
        }
      }
    };
    bar(); timer = setInterval(bar, beat * 4 * 1000);
  }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }
  return { start, stop };
})();
