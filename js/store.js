/* Profils, réglages, progrès, temps d'écran — tout reste sur l'appareil */
'use strict';

const Store = (() => {
  const KEY = 'helloenglish.v1';
  const DEF_SETTINGS = { accent: 'uk', speed: 0.85, frInstr: true, mic: true, sfx: true, limitMin: 0, showText: true };
  let db;

  function load() {
    try { db = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { db = {}; }
    db.profiles = db.profiles || [];
    db.settings = Object.assign({}, DEF_SETTINGS, db.settings || {});
    db.prog = db.prog || {};
    db.extra = db.extra || {};
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {} }
  load();

  const today = (d = new Date()) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');

  function P() {
    const id = db.current;
    if (!id) return null;
    if (!db.prog[id]) db.prog[id] = { stars: {}, words: {}, days: {}, favs: [], stories: {}, dialogues: {}, moves: 0, unlockedTime: null };
    return db.prog[id];
  }

  return {
    today,
    raw: () => db,
    settings: () => db.settings,
    setSetting(k, v) { db.settings[k] = v; save(); },

    profiles: () => db.profiles,
    profile: () => db.profiles.find(p => p.id === db.current) || null,
    addProfile(p) {
      if (db.profiles.length >= 4) return null;
      p.id = 'p' + Date.now().toString(36); p.created = Date.now();
      db.profiles.push(p); db.current = p.id; save(); return p;
    },
    updateProfile(id, patch) { const p = db.profiles.find(x => x.id === id); if (p) Object.assign(p, patch); save(); },
    removeProfile(id) {
      db.profiles = db.profiles.filter(p => p.id !== id); delete db.prog[id];
      if (db.current === id) db.current = db.profiles[0] ? db.profiles[0].id : null; save();
    },
    use(id) { db.current = id; save(); },

    /* ---- étoiles / leçons ---- */
    stars(lessonId) { const p = P(); return p ? (p.stars[lessonId] || 0) : 0; },
    setStars(lessonId, n) { const p = P(); if (!p) return; p.stars[lessonId] = Math.max(p.stars[lessonId] || 0, n); p.last = lessonId; save(); },
    totalStars() { const p = P(); if (!p) return 0; return Object.values(p.stars).reduce((a, b) => a + b, 0) + (p.bonus || 0); },
    addBonus(n) { const p = P(); if (!p) return; p.bonus = (p.bonus || 0) + n; save(); },
    stickerCount() { return Math.min(STICKERS.length, Math.floor(this.totalStars() / 5)); },
    stickersSeen() { const p = P(); return p ? (p.stickersSeen || 0) : 0; },
    setStickersSeen(n) { const p = P(); if (p) { p.stickersSeen = n; save(); } },

    /* ---- maîtrise des mots ---- */
    word(key) { const p = P(); return (p && p.words[key]) || { ok: 0, ko: 0, seen: 0 }; },
    mark(key, good) {
      const p = P(); if (!p || !key) return;
      const w = p.words[key] || (p.words[key] = { ok: 0, ko: 0, seen: 0 });
      if (good === null) w.seen++; else if (good) w.ok++; else w.ko++;
      w.last = Date.now(); save();
    },
    level(key) { // 0 nouveau · 1 vu · 2 en cours · 3 acquis
      const w = this.word(key);
      if (!w.seen && !w.ok && !w.ko) return 0;
      if (w.ok >= 4 && w.ok / (w.ok + w.ko) >= 0.7) return 3;
      if (w.ok >= 1) return 2;
      return 1;
    },
    learnedCount() { return Object.keys(ITEM).filter(k => this.level(k) === 3).length; },

    /* ---- favoris, histoires, dialogues ---- */
    isFav(id) { const p = P(); return !!p && p.favs.includes(id); },
    toggleFav(id) { const p = P(); if (!p) return; const i = p.favs.indexOf(id); if (i >= 0) p.favs.splice(i, 1); else p.favs.push(id); save(); },
    favs() { const p = P(); return p ? p.favs.slice() : []; },
    done(kind, id) { const p = P(); return !!p && !!(p[kind] || {})[id]; },
    setDone(kind, id) { const p = P(); if (!p) return; p[kind] = p[kind] || {}; p[kind][id] = (p[kind][id] || 0) + 1; save(); },
    countMoves() { const p = P(); if (p) { p.moves++; save(); } },

    /* ---- temps d'écran ---- */
    addSeconds(s) { const p = P(); if (!p) return; const d = today(); p.days[d] = (p.days[d] || 0) + s; save(); },
    secondsToday() { const p = P(); return p ? (p.days[today()] || 0) : 0; },
    daysLog(n = 7) {
      const p = P(); const out = [];
      for (let i = n - 1; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); const k = today(d); out.push({ d, k, s: p ? (p.days[k] || 0) : 0 }); }
      return out;
    },
    streak() {
      const p = P(); if (!p) return 0; let n = 0;
      for (let i = 0; i < 365; i++) { const d = new Date(); d.setDate(d.getDate() - i); const s = p.days[today(d)] || 0; if (s >= 60) n++; else if (i > 0) break; }
      return n;
    },
    timeUp() {
      const lim = db.settings.limitMin; if (!lim) return false;
      const p = P(); if (p && p.unlockedTime === today()) return false;
      return this.secondsToday() >= lim * 60;
    },
    unlockToday() { const p = P(); if (p) { p.unlockedTime = today(); save(); } },

    resetProfile(id) { delete db.prog[id]; save(); },
    exportJSON() { return JSON.stringify(db); },
  };
})();
