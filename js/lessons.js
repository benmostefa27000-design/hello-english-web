/* Parcours : leçons générées par thème + moteur de séance + récompenses */
'use strict';

const themeKeys = t => THEMES.find(x => x.id === t).items.map(keyOf);

function chunk(arr, size) {
  const out = []; for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  if (out.length > 1 && out[out.length - 1].length < 3) { const last = out.pop(); out[out.length - 1].push(...last); }
  return out;
}

const SPECIAL = {
  numbers: k => ({ name: 'Je compte', icon: '🔢', steps: [{ type: 'count', n: 6 }, { type: 'listen', keys: k, n: 4 }] }),
  colours: k => ({ name: 'Je colorie', icon: '🎨', steps: [{ type: 'colour', n: 5 }] }),
  shapes: k => ({ name: 'Je colorie', icon: '🎨', steps: [{ type: 'colour', n: 5 }] }),
  animals: k => ({ name: 'Les cris', icon: '🐮', steps: [{ type: 'sounds', keys: k, n: 6 }] }),
  body: k => ({ name: 'Touche ton…', icon: '🙋', steps: [{ type: 'listen', keys: k, n: 6, phrase: 'Touch your {w}!', fr: 'Écoute Bloop et touche la bonne partie du corps.', en: 'Touch your…' }, { type: 'move', n: 4 }] }),
  food: k => ({ name: 'Bloop a faim', icon: '😋', steps: [{ type: 'listen', keys: k, n: 6, phrase: 'Give Bloop {a} {w}, please!', feed: true, fr: 'Bloop a faim ! Donne-lui ce qu’il demande.', en: 'Bloop is hungry!' }] }),
  clothes: k => ({ name: 'Habille-toi', icon: '🧥', steps: [{ type: 'listen', keys: k, n: 6, phrase: 'Where is the {w}?', fr: 'Trouve le bon vêtement.', en: 'Find it!' }] }),
  abc: k => ({ name: 'Première lettre', icon: '🔤', steps: [{ type: 'initial', keys: k, n: 6 }] }),
  zoo: k => ({ name: 'Qui fait ce bruit ?', icon: '🐯', steps: [{ type: 'sounds', keys: k, n: 5 }, { type: 'listen', keys: k, n: 4, phrase: 'Where is the {w}?', fr: 'Trouve le bon animal.', en: 'Find it!' }] }),
  sea: k => ({ name: 'La pêche', icon: '🎣', steps: [{ type: 'bubbles', keys: k, n: 6 }, { type: 'listen', keys: k, n: 4, phrase: 'Find the {w}!', fr: 'Trouve le bon animal de la mer.', en: 'Find it!' }] }),
  fruit: k => ({ name: 'Bloop a faim', icon: '😋', steps: [{ type: 'listen', keys: k, n: 6, phrase: 'Give Bloop {a} {w}, please!', feed: true, fr: 'Bloop a faim ! Donne-lui ce qu’il demande.', en: 'Bloop is hungry!' }] }),
  house: k => ({ name: 'Où est-ce ?', icon: '🔎', steps: [{ type: 'listen', keys: k, n: 6, phrase: 'Where is the {w}?', fr: 'Trouve la bonne chose dans la maison.', en: 'Where is it?' }] }),
  transport: k => ({ name: 'Les bruits', icon: '📣', steps: [{ type: 'sounds', keys: k, n: 6 }] }),
  nature: k => ({ name: 'La balade', icon: '🥾', steps: [{ type: 'listen', keys: k, n: 6, phrase: 'Look! Can you see the {w}?', fr: 'Écoute et trouve-le dans la nature.', en: 'Can you see it?' }] }),
  actions: k => ({ name: 'Montre-moi !', icon: '🤸', steps: [{ type: 'listen', keys: k, n: 6, phrase: 'Show me: {w}!', fr: 'Écoute Bloop et trouve la bonne action.', en: 'Show me!' }, { type: 'move', n: 4 }] }),
  jobs: k => ({ name: 'Qui est-ce ?', icon: '🕵️', steps: [{ type: 'listen', keys: k, n: 6, phrase: 'Who is the {w}?', fr: 'Trouve le bon métier.', en: 'Who is it?' }] }),
};

function lessonsFor(tid) {
  const t = THEMES.find(x => x.id === tid);
  const keys = themeKeys(tid);
  const groups = chunk(keys, tid === 'abc' ? 5 : 4);
  const L = [];
  groups.forEach((g, i) => {
    L.push({ id: `${tid}-d${i + 1}`, name: groups.length > 1 ? `Découverte ${i + 1}` : 'Découverte', icon: '🔍',
      steps: [{ type: 'discover', keys: g }, { type: 'listen', keys: g, n: 5 }, { type: 'tf', keys: g, n: 3 }, { type: 'speak', keys: g, n: 2 }] });
    // alphabet : après chaque groupe de lettres, on les écrit (majuscules puis minuscules)
    if (tid === 'abc') {
      const letters = g.map(k => ITEM[k].en);
      L.push({ id: `abc-w${i + 1}`, name: `J'écris ${letters.join(' ')}`, icon: '✍️',
        steps: [{ type: 'trace', letters }, { type: 'trace', letters, lower: true }] });
    }
  });
  if (tid === 'abc') {
    L.push({ id: 'abc-ph', name: 'Le son des lettres', icon: '🔉', steps: [{ type: 'phonics', keys, n: 6 }] });
    L.push({ id: 'abc-rd1', name: 'Je lis 1', icon: '📖', steps: [{ type: 'readword', n: 4 }] });
    L.push({ id: 'abc-rd2', name: 'Je lis 2', icon: '📖', steps: [{ type: 'phonics', keys, n: 3 }, { type: 'readword', n: 5 }] });
  }
  L.push({ id: `${tid}-play`, name: 'On joue !', icon: '🎮', steps: [{ type: 'memory', keys, pairs: Math.min(6, keys.length) }, { type: 'bubbles', keys, n: 4 }] });
  if (SPECIAL[tid]) L.push(Object.assign({ id: `${tid}-sp` }, SPECIAL[tid](keys)));
  STORIES.filter(s => s.theme === tid).forEach(s => L.push({ id: `${tid}-st-${s.id}`, name: 'Histoire', icon: '📖', story: s.id }));
  DIALOGUES.filter(d => d.theme === tid).forEach(d => L.push({ id: `${tid}-dl-${d.id}`, name: 'On discute', icon: '💬', dialogue: d.id }));
  L.push({ id: `${tid}-boss`, name: 'Grand défi', icon: '🏆', boss: true,
    steps: [{ type: 'listen', keys, n: 4 }, { type: 'tf', keys, n: 3 }, { type: 'bubbles', keys, n: 3 }, { type: 'speak', keys, n: 2 }] });
  L.forEach(l => l.theme = tid);
  return L;
}
const ALL_LESSONS = {}; THEMES.forEach(t => lessonsFor(t.id).forEach(l => ALL_LESSONS[l.id] = l));

function themeProgress(tid) {
  const L = lessonsFor(tid); const got = L.reduce((a, l) => a + Store.stars(l.id), 0);
  return { got, max: L.length * 3, done: L.filter(l => Store.stars(l.id) > 0).length, total: L.length };
}
// la prochaine leçon conseillée (sans rien bloquer : tout est ouvert),
// en suivant les niveaux, à partir du niveau trouvé par le test
function nextLesson() {
  const start = Store.startLevel();
  const order = [...LEVELS.filter(L => L.id >= start), ...LEVELS.filter(L => L.id < start)];
  for (const L of order) for (const tid of L.themes) for (const l of lessonsFor(tid)) if (!Store.stars(l.id)) return l;
  return null;
}

// hasard « graine » : le même défi toute la journée, un nouveau chaque jour
function seeded(seedStr) {
  let s = 0; for (const c of seedStr) s = (s * 31 + c.charCodeAt(0)) >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
const DAILY_KINDS = [
  { name: 'Défi des bulles', icon: '🫧', steps: k => [{ type: 'bubbles', keys: k, n: 5 }, { type: 'listen', keys: k, n: 4 }] },
  { name: 'Défi mémoire', icon: '🧠', steps: k => [{ type: 'memory', keys: k, pairs: 6 }, { type: 'tf', keys: k, n: 4 }] },
  { name: 'Défi de l’oreille', icon: '👂', steps: k => [{ type: 'listen', keys: k, n: 6 }, { type: 'tf', keys: k, n: 3 }] },
  { name: 'Défi de la parole', icon: '🎤', steps: k => [{ type: 'listen', keys: k, n: 3 }, { type: 'speak', keys: k, n: 4 }] },
  { name: 'Défi des lettres', icon: '🔤', steps: () => [{ type: 'phonics', keys: themeKeys('abc'), n: 4 }, { type: 'readword', n: 3 }] },
  { name: 'Grand mélange', icon: '🎲', steps: k => [{ type: 'listen', keys: k, n: 3 }, { type: 'bubbles', keys: k, n: 3 }, { type: 'tf', keys: k, n: 3 }] },
];
function dailyChallenge() {
  const day = Store.today(), rnd = seeded(day + (Store.profile() || {}).id);
  const pickR = a => a[Math.floor(rnd() * a.length)];
  // deux thèmes : un déjà vu (pour réviser) et un du niveau de l'enfant (pour découvrir)
  const seenThemes = THEMES.filter(t => t.items.some(it => Store.level(keyOf(it)) > 0)).map(t => t.id);
  const lvl = LEVELS.find(L => L.id === Store.startLevel()) || LEVELS[0];
  const t1 = seenThemes.length ? pickR(seenThemes) : pickR(lvl.themes), t2 = pickR(lvl.themes.filter(x => x !== 'abc' && x !== t1));
  const keys = [...themeKeys(t1).filter(k => !k.startsWith('abc:')), ...themeKeys(t2 || t1)].filter((k, i, a) => a.indexOf(k) === i);
  const kind = pickR(DAILY_KINDS);
  const pool = keys.length >= 4 ? keys : themeKeys('animals');
  return { id: 'challenge-' + day, name: kind.name, icon: kind.icon, challenge: true, steps: kind.steps(pool) };
}
function lessonAfter(id) {
  const ids = LEVELS.flatMap(L => L.themes.flatMap(t => lessonsFor(t).map(l => l.id))); const i = ids.indexOf(id);
  return i >= 0 && i < ids.length - 1 ? ALL_LESSONS[ids[i + 1]] : null;
}

/* ---------------- Niveaux : progression et test de départ ---------------- */
function levelProgress(L) {
  const keys = L.themes.flatMap(themeKeys);
  const acq = keys.filter(k => Store.level(k) === 3).length;
  const lessons = L.themes.flatMap(lessonsFor), done = lessons.filter(l => Store.stars(l.id) > 0).length;
  const pct = Math.round((acq / keys.length * 0.6 + done / lessons.length * 0.4) * 100);
  return { acq, words: keys.length, done, lessons: lessons.length, pct, reached: pct >= 70 };
}
function currentLevel() { for (const L of LEVELS) if (!levelProgress(L).reached) return L; return LEVELS[LEVELS.length - 1]; }

// test de niveau : 2 mots par niveau ; on démarre au premier niveau où l'enfant se trompe
Screens.placement = (_, ctx) => {
  const m = mascot('bloop', 'mini'), bar = progressBar(), stage = h('div', { class: 'stage' });
  const root = h('div', { class: 'screen session' }, h('div', { class: 'sess-head' }, h('button', { class: 'round back', onclick: () => Nav.back() }, '✕'), bar, m), stage);
  const qs = LEVELS.flatMap(L => shuffle(L.themes.filter(t => t !== 'abc').flatMap(themeKeys)).slice(0, 2).map(k => ({ L: L.id, k })));
  (async () => {
    const okByLevel = {};
    await mascotSay(m, Voice.instr('Petit jeu pour voir ce que tu connais déjà. Si tu ne sais pas, ce n’est pas grave !', "Let's see what you know!"));
    for (let i = 0; i < qs.length; i++) {
      if (!ctx.alive) return;
      const q = qs[i], it = ITEM[q.k];
      const pool = themeKeys(it.theme);
      let resolve; const p = new Promise(r => resolve = r);
      const grid = choiceGrid(options(q.k, pool, 3), (k, b) => { b.classList.add(k === q.k ? 'right' : 'wrong'); Sfx.tick(); resolve(k === q.k); });
      const dunno = h('button', { class: 'btn ghost small', onclick: () => resolve(false) }, 'Je ne sais pas 🤷');
      stage.replaceChildren(h('div', { class: 'prompt' }, h('button', { class: 'round big', onclick: () => Voice.say(spoken(it)) }, '🔊')), grid, dunno);
      Voice.say(spoken(it));
      const ok = await p; okByLevel[q.L] = (okByLevel[q.L] || 0) + (ok ? 1 : 0);
      bar.set((i + 1) / qs.length); await sleep(350);
    }
    let start = 1; for (const L of LEVELS) { if ((okByLevel[L.id] || 0) >= 2) start = Math.min(LEVELS.length, L.id + 1); else break; }
    Store.setPlacement(start);
    if (!ctx.alive) return;
    const L = LEVELS.find(x => x.id === start);
    stage.replaceChildren(mascot('bloop', 'jumpy'), h('h2', null, `${L.icon} Niveau ${L.id} : ${L.name}`), h('p', { class: 'muted center' }, `On commence ici (${L.cefr}). Tout reste ouvert : on peut toujours revenir en arrière.`),
      h('button', { class: 'btn big go', onclick: () => Nav.home() }, "C'est parti ! 🚀"));
    Sfx.star(); confetti();
  })();
  return root;
};

// révision du jour (répétition espacée) : d'abord les mots « à revoir aujourd'hui »,
// les plus en retard et les plus fragiles en premier, puis quelques nouveaux
function dailyReview() {
  const now = Date.now();
  const seen = Object.keys(ITEM).filter(k => Store.level(k) > 0);
  const due = seen.filter(k => (Store.word(k).due || 0) <= now);
  const rest = seen.filter(k => !due.includes(k));
  const fragile = (a, b) => {
    const A = Store.word(a), B = Store.word(b);
    return (A.box || 0) - (B.box || 0) || (A.ok - A.ko * 2) - (B.ok - B.ko * 2) || (A.last || 0) - (B.last || 0);
  };
  let keys = [...due.sort(fragile), ...rest.sort(fragile)].slice(0, 6);
  if (keys.length < 6) {
    const nl = nextLesson(); const t = nl ? nl.theme : 'hello';
    keys.push(...themeKeys(t).filter(k => !keys.includes(k)).slice(0, 6 - keys.length));
  }
  return { id: 'review-' + Store.today(), name: 'Révision du jour', icon: '☀️', review: true,
    steps: [{ type: 'listen', keys, n: 5, opts: 3 }, { type: 'tf', keys, n: 3 }, { type: 'bubbles', keys, n: 3 }, { type: 'speak', keys, n: 2 }] };
}

/* ---------------- Séance ---------------- */
Screens.session = (lesson, ctx) => {
  const prof = Store.profile();
  const m = mascot('bloop', 'mini');
  const bar = progressBar();
  const stage = h('div', { class: 'stage' });
  const head = h('div', { class: 'sess-head' },
    h('button', { class: 'round back', onclick: () => Nav.back() }, '✕'), bar, m);
  const root = h('div', { class: 'screen session' }, head, stage);
  let errors = 0;

  const api = {
    stage, mascot: m,
    alive: () => ctx.alive,
    check() { if (!ctx.alive) throw STOP; },
    say(text, lang = 'en', o) { if (!ctx.alive) return Promise.resolve(); return mascotSay(m, Voice.say(text, lang, o)); },
    instr(fr, en) { if (!ctx.alive) return Promise.resolve(); return mascotSay(m, Voice.instr(fr, en)); },
    progress: f => bar.set((stepIdx + f) / lesson.steps.length),
    async good(key, firstTry, speak = true) {
      Sfx.good(); cheer(m); Store.mark(key, !!firstTry);
      if (speak && Math.random() < 0.45) await api.say(pick(PRAISE)); else await sleep(350);
    },
    async bad(key) {
      errors++; Sfx.bad(); Store.mark(key, false);
      m.classList.add('sad'); setTimeout(() => m.classList.remove('sad'), 700);
      if (Math.random() < 0.5) await (Store.settings().frInstr ? Voice.say(pick(RETRY_FR), 'fr') : api.say(pick(RETRY_EN)));
    },
    // écoute l'enfant et dit si c'est bon (tolérant)
    async listenFor(expected, btn) {
      Voice.stop(); btn.classList.add('listening'); Sfx.tick();
      const r = await Mic.listen(); btn.classList.remove('listening');
      if (!r.heard.length) return { ok: false, silent: true };
      return { ok: Mic.score(expected, r.heard) >= 0.5, heard: r.heard };
    },
    async tryVoice(expected, btn, key) {
      if (!(await Mic.ensurePermission())) { toast('Micro non autorisé'); return; }
      const r = await api.listenFor(expected, btn);
      if (r.ok) { Sfx.good(); cheer(m); Store.mark(key, true); api.say(pick(PRAISE)); }
      else { api.say(r.silent ? 'Say it louder!' : 'Listen: ' + expected); }
    },
  };

  let stepIdx = 0;
  (async () => {
    try {
      await sleep(300);
      for (stepIdx = 0; stepIdx < lesson.steps.length; stepIdx++) {
        api.check();
        const st = lesson.steps[stepIdx];
        bar.set(stepIdx / lesson.steps.length);
        await ACTIVITIES[st.type](api, st);
        await sleep(400);
      }
      api.check();
      bar.set(1);
      const stars = lesson.free ? 1 : errors <= 1 ? 3 : errors <= 4 ? 2 : 1;
      finishLesson(lesson, stars);
    } catch (e) { if (e !== STOP) { console.error(e); toast('Oups, un souci : ' + e.message); } }
  })();
  Nav.onLeave(ctx, () => { Mic.stop(); });
  return root;
};

function finishLesson(lesson, stars) {
  const before = Store.stickerCount();
  if (lesson.free) Store.addBonus(1); else Store.setStars(lesson.id, stars);
  const goal = Store.addActivity();
  const after = Store.stickerCount();
  Nav.replace('reward', { lesson, stars, newSticker: after > before ? STICKERS[after - 1] : null, chest: goal.reached, goalN: goal.n });
}

Screens.reward = ({ lesson, stars, newSticker, chest, goalN }, ctx) => {
  const prof = Store.profile();
  const m = mascot('bloop', 'jumpy');
  const starRow = h('div', { class: 'stars-row' }, [1, 2, 3].map(i => h('span', { class: 'bigstar' + (i <= stars ? ' on' : '') }, '★')));
  const next = !lesson.free && !lesson.review && !lesson.challenge ? lessonAfter(lesson.id) : null;
  const btns = h('div', { class: 'col gap' },
    next ? h('button', { class: 'btn big go', onclick: () => openLesson(next, true) }, 'Leçon suivante ➜') : null,
    h('button', { class: 'btn', onclick: () => openLesson(lesson, true) }, '↻ Rejouer'),
    h('button', { class: 'btn ghost', onclick: () => Nav.home() }, '🏠 Accueil'));
  const sticker = newSticker ? h('div', { class: 'new-sticker pop-in' }, h('div', { class: 'stk' }, newSticker), h('div', null, 'Nouvel autocollant !')) : null;
  const chestEl = chest ? h('button', { class: 'chest-box' }, h('span', { class: 'chest' }, '🧰'), h('b', null, 'Touche le coffre du jour !')) : null;
  const goalEl = !chest && goalN && goalN < DAILY_GOAL ? h('p', { class: 'muted' }, `Objectif du jour : ${goalN}/${DAILY_GOAL} — encore ${DAILY_GOAL - goalN} pour ouvrir le coffre 🧰`) : null;
  const el = h('div', { class: 'screen reward' }, m, h('h2', null, pick(['Bravo', 'Super', 'Génial', 'Waouh']) + ' ' + (prof ? prof.name : '') + ' !'), starRow, chestEl, sticker, goalEl, btns);
  if (chestEl) chestEl.addEventListener('click', () => {
    if (chestEl.classList.contains('open')) return;
    chestEl.classList.add('open'); chestEl.querySelector('.chest').textContent = '🎁';
    chestEl.querySelector('b').textContent = 'Coffre ouvert : +3 ⭐ !'; Sfx.star(); confetti(60); cheer(m);
    Voice.instr('Bravo ! Tu as rempli ton objectif du jour !', 'Well done! You did your daily goal!');
  }, { once: true });
  (async () => {
    await sleep(300); Sfx.star(); confetti();
    starRow.querySelectorAll('.on').forEach((s, i) => setTimeout(() => s.classList.add('pop'), 250 * i));
    await mascotSay(m, Voice.say(`${pick(PRAISE)} ${prof ? prof.name : ''}!`));
    if (newSticker && ctx.alive) { Sfx.star(); await Voice.instr('Tu as gagné un nouvel autocollant !', 'You have a new sticker!'); }
    if (chest && ctx.alive) await Voice.instr('Objectif du jour réussi ! Touche le coffre !', 'Open your treasure chest!');
  })();
  return el;
};

function openLesson(l, replace) {
  const go = replace ? Nav.replace : Nav.go;
  if (l.story) return go('story', { id: l.story, lessonId: l.id });
  if (l.dialogue) return go('dialogue', { id: l.dialogue, lessonId: l.id });
  return go('session', l);
}
