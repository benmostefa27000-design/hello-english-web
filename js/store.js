/* Profils, réglages, progrès, temps d'écran — tout reste sur l'appareil */
'use strict';

const Store = (() => {
  const KEY = 'helloenglish.v1';
  const DEF_SETTINGS = { accent: 'uk', speed: 0.85, frInstr: true, mic: true, sfx: true, limitMin: 0, showText: true, realVoices: true, guided: false, guidedN: 4 };
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
      // répétition espacée (boîtes de Leitner) : réussi → revu plus tard, raté → revu demain
      const now = Date.now(), DAY = 864e5, GAPS = [0, 1, 2, 4, 7, 15, 30];
      if (good === true && (w.due || 0) <= now) { w.box = Math.min(6, (w.box || 0) + 1); w.due = now + GAPS[w.box] * DAY; }
      else if (good === false) { w.box = Math.max(0, (w.box || 0) - 2); w.due = now + DAY * 0.5; }
      else if (good === null && w.due == null) w.due = now + DAY;
      if (!w.acq && w.ok >= 4 && w.ok / (w.ok + w.ko) >= 0.7) w.acq = now; // date où le mot est acquis (bilan)
      w.last = now; save();
    },
    dueCount() { const p = P(); if (!p) return 0; const now = Date.now(); return Object.keys(p.words).filter(k => ITEM[k] && p.words[k].due && p.words[k].due <= now).length; },
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

    /* ---- garde-robe de Bloop : les étoiles servent aussi de monnaie ---- */
    coins() { const p = P(); return p ? Math.max(0, this.totalStars() - (p.spent || 0)) : 0; },
    owns(id) { const p = P(); return !!p && (p.owned || []).includes(id); },
    buy(id, price) {
      const p = P(); if (!p || this.owns(id) || this.coins() < price) return false;
      p.owned = [...(p.owned || []), id]; p.spent = (p.spent || 0) + price; p.wear = id; save(); return true;
    },
    wearing() { const p = P(); return p ? p.wear || null : null; },
    setWear(id) { const p = P(); if (p) { p.wear = id; save(); } },

    /* ---- objectif du jour, activités par jour (bilan) ---- */
    goal() { const p = P(); const g = (p && p.goal && p.goal.d === today()) ? p.goal : { d: today(), n: 0, claimed: false }; return g; },
    addActivity() {
      const p = P(); if (!p) return { reached: false };
      const g = this.goal(); g.n++; p.goal = g;
      p.acts = p.acts || {}; p.acts[today()] = (p.acts[today()] || 0) + 1;
      let reached = false;
      if (g.n >= DAILY_GOAL && !g.claimed) { g.claimed = true; p.bonus = (p.bonus || 0) + 3; p.chests = (p.chests || 0) + 1; reached = true; }
      save(); return { reached, n: g.n };
    },
    /* ---- mode guidé : où en est l'enfant dans le déroulement du jour ---- */
    guided() { const p = P(); return (p && p.guided && p.guided.d === today()) ? p.guided : { d: today(), i: 0 }; },
    guidedStep(total) {
      const p = P(); if (!p) return;
      const g = this.guided(); g.i++; p.guided = g;
      if (g.i >= total) { p.gdays = p.gdays || {}; p.gdays[today()] = 1; }
      save(); return g;
    },
    guidedDays(n = 7) { const p = P(); return this.daysLog(n).filter(d => p && p.gdays && p.gdays[d.k]).length; },
    actsLog(n = 7) { const p = P(); return this.daysLog(n).map(d => ({ d: d.d, k: d.k, s: d.s, a: p && p.acts ? (p.acts[d.k] || 0) : 0 })); },

    /* ---- niveau de départ (test de niveau) ---- */
    startLevel() { const p = P(); return p ? (p.startLevel || 1) : 1; },
    setPlacement(level) { const p = P(); if (p) { p.startLevel = level; p.placed = true; save(); } },
    placed() { const p = P(); return !!p && !!p.placed; },

    resetProfile(id) { delete db.prog[id]; save(); },
    exportJSON() { return JSON.stringify(db); },

    /* ---- transfert entre appareils : on fusionne, on ne perd rien ----
       Un enfant est reconnu par son prénom. On garde le meilleur des deux côtés. */
    exportData() { return { v: 1, at: Date.now(), profiles: db.profiles, prog: db.prog }; },
    merge(data) {
      if (!data || !Array.isArray(data.profiles) || !data.prog) throw new Error('Code invalide');
      const res = { added: [], merged: [], skipped: [] };
      const maxMap = (a = {}, b = {}) => { const o = Object.assign({}, a); for (const k in b) o[k] = Math.max(o[k] || 0, b[k] || 0); return o; };
      for (const ip of data.profiles) {
        const inProg = data.prog[ip.id] || {};
        let lp = db.profiles.find(p => (p.name || '').trim().toLowerCase() === (ip.name || '').trim().toLowerCase());
        if (!lp) {
          if (db.profiles.length >= 4) { res.skipped.push(ip.name); continue; }
          lp = Object.assign({}, ip, { id: 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5) });
          db.profiles.push(lp); db.prog[lp.id] = JSON.parse(JSON.stringify(inProg)); res.added.push(ip.name); continue;
        }
        const cur = db.prog[lp.id] || (db.prog[lp.id] = { stars: {}, words: {}, days: {}, favs: [], stories: {}, dialogues: {}, moves: 0 });
        cur.stars = maxMap(cur.stars, inProg.stars);
        cur.days = maxMap(cur.days, inProg.days);
        cur.stories = maxMap(cur.stories, inProg.stories);
        cur.dialogues = maxMap(cur.dialogues, inProg.dialogues);
        cur.words = cur.words || {};
        for (const k in (inProg.words || {})) {
          const a = cur.words[k], b = inProg.words[k], n = w => w ? (w.ok || 0) + (w.ko || 0) + (w.seen || 0) : -1;
          if (n(b) > n(a)) cur.words[k] = Object.assign({}, b);
        }
        cur.favs = Array.from(new Set([...(cur.favs || []), ...(inProg.favs || [])]));
        cur.moves = Math.max(cur.moves || 0, inProg.moves || 0);
        cur.bonus = Math.max(cur.bonus || 0, inProg.bonus || 0);
        cur.stickersSeen = Math.max(cur.stickersSeen || 0, inProg.stickersSeen || 0);
        cur.acts = maxMap(cur.acts, inProg.acts);
        cur.owned = Array.from(new Set([...(cur.owned || []), ...(inProg.owned || [])]));
        cur.spent = Math.max(cur.spent || 0, inProg.spent || 0);
        cur.wear = cur.wear || inProg.wear || null;
        cur.chests = Math.max(cur.chests || 0, inProg.chests || 0);
        if (inProg.placed && !cur.placed) { cur.placed = true; cur.startLevel = inProg.startLevel; }
        res.merged.push(ip.name);
      }
      if (!db.current && db.profiles[0]) db.current = db.profiles[0].id;
      save(); return res;
    },
  };
})();

/* Progrès venus de l'ancienne version de l'appli Android (voir android.js) */
if (window.__pendingMerge) { try { Store.merge(JSON.parse(window.__pendingMerge)); } catch (e) {} delete window.__pendingMerge; }
