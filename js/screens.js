/* Tous les écrans */
'use strict';

let greeted = false;

/* ---------------- Création / choix de profil ---------------- */
Screens.profileForm = (params) => {
  const edit = params.id ? Store.profiles().find(p => p.id === params.id) : null;
  const st = { name: edit ? edit.name : '', avatar: edit ? edit.avatar : AVATARS[0], age: edit ? edit.age : 6, gender: edit ? edit.gender : 'f' };
  const name = h('input', { class: 'input', placeholder: "Prénom de l'enfant", value: st.name, maxlength: 16 });
  const avs = h('div', { class: 'avatars' }, AVATARS.map(a => {
    const b = h('button', { class: 'av' + (a === st.avatar ? ' sel' : ''), onclick: () => { st.avatar = a; avs.querySelectorAll('.av').forEach(x => x.classList.remove('sel')); b.classList.add('sel'); } }, a); return b; }));
  const ageOut = h('span', { class: 'age' }, String(st.age));
  const g = (v, t) => h('button', { class: 'seg' + (st.gender === v ? ' sel' : ''), onclick: e => { st.gender = v; e.currentTarget.parentNode.querySelectorAll('.seg').forEach(x => x.classList.remove('sel')); e.currentTarget.classList.add('sel'); } }, t);
  const save = () => {
    st.name = name.value.trim(); if (!st.name) { name.focus(); toast('Écris un prénom 🙂'); return; }
    if (edit) Store.updateProfile(edit.id, st); else if (!Store.addProfile(st)) { toast('4 profils maximum'); return; }
    Nav.reset('home');
  };
  return h('div', { class: 'screen form' },
    Store.profiles().length ? topBar(edit ? 'Modifier le profil' : 'Nouveau profil', { right: h('div') }) : h('div', { class: 'welcome' }, mascot('bloop', 'jumpy'), h('h1', null, 'Hello English'), h('p', { class: 'muted' }, "L'anglais en jouant, pour les 4-8 ans. Tout est gratuit, sans pub, et reste sur ce téléphone.")),
    h('label', null, 'Prénom'), name,
    h('label', null, 'Avatar'), avs,
    h('label', null, 'Âge'), h('div', { class: 'row center' },
      h('button', { class: 'round', onclick: () => { st.age = Math.max(3, st.age - 1); ageOut.textContent = st.age; } }, '−'), ageOut,
      h('button', { class: 'round', onclick: () => { st.age = Math.min(10, st.age + 1); ageOut.textContent = st.age; } }, '+')),
    h('div', { class: 'segs' }, g('f', '👧 Fille'), g('m', '👦 Garçon')),
    h('button', { class: 'btn big go', onclick: save }, edit ? 'Enregistrer' : "C'est parti ! 🚀"));
};

Screens.who = () => h('div', { class: 'screen who' },
  h('h2', null, 'Qui joue ?'),
  h('div', { class: 'who-grid' }, Store.profiles().map(p => h('button', { class: 'who-btn', onclick: () => { Store.use(p.id); greeted = false; Nav.reset('home'); } }, h('span', { class: 'av big' }, p.avatar), p.name))),
  Store.profiles().length < 4 ? h('button', { class: 'btn ghost', onclick: () => parentGate(() => Nav.go('profileForm', {})) }, '+ Ajouter un enfant') : null);

/* ---------------- Accueil ---------------- */
Screens.home = (_, ctx) => {
  const p = Store.profile();
  if (!p) { setTimeout(() => Nav.reset(Store.profiles().length ? 'who' : 'profileForm'), 0); return h('div'); }
  const m = mascot('bloop', 'hero');
  const nl = nextLesson();
  const review = Object.keys(ITEM).some(k => Store.level(k) > 0) ? dailyReview() : null;
  const tile = (icon, fr, en, go, color) => h('button', { class: 'tile', style: { background: color }, onclick: go }, h('span', { class: 'ti' }, icon), h('b', null, fr), h('small', null, en));
  const favs = Store.favs();
  const favEl = favs.length ? h('div', { class: 'section' }, h('h3', null, '❤️ Mes favoris'), h('div', { class: 'hscroll' }, favs.map(favCard).filter(Boolean))) : null;
  const el = h('div', { class: 'screen home' },
    h('div', { class: 'home-top' },
      h('button', { class: 'me', onclick: () => Nav.go('who') }, h('span', { class: 'av' }, p.avatar), h('b', null, p.name)),
      h('div', { class: 'chips' }, h('span', { class: 'chip' }, '🔥 ', String(Store.streak())), h('span', { class: 'chip' }, '⭐ ', String(Store.totalStars())),
        h('button', { class: 'chip lock', onclick: () => parentGate(() => Nav.go('parent', {})) }, '🔒'))),
    h('div', { class: 'hero' }, m, h('div', { class: 'hero-side' }, h('div', { class: 'speech' }, `Hello ${p.name}!`),
      h('button', { class: 'chip dress', onclick: () => Nav.go('wardrobe') }, '👕 Habille Bloop'))),
    goalBar(),
    !Store.placed() && Object.keys(ITEM).every(k => Store.level(k) === 0) ? h('button', { class: 'continue placement', onclick: () => Nav.go('placement') },
      h('span', { class: 'ci' }, '🎯'), h('div', null, h('small', null, '2 minutes'), h('b', null, 'Quel est mon niveau ?')), h('span', { class: 'play' }, '▶')) : null,
    nl ? h('button', { class: 'continue', onclick: () => openLesson(nl) },
      h('span', { class: 'ci' }, THEMES.find(t => t.id === nl.theme).icon),
      h('div', null, h('small', null, 'Continuer'), h('b', null, THEMES.find(t => t.id === nl.theme).fr + ' · ' + nl.name)), h('span', { class: 'play' }, '▶')) : null,
    review ? h('button', { class: 'continue alt', onclick: () => Nav.go('session', review) },
      h('span', { class: 'ci' }, '☀️'), h('div', null, h('small', null, Store.dueCount() ? `${Store.dueCount()} mots à revoir` : '5 minutes'), h('b', null, 'Révision du jour' + (Store.stars(review.id) ? ' ✔' : ''))), h('span', { class: 'play' }, '▶')) : null,
    (() => { const ch = dailyChallenge(); return h('button', { class: 'continue challenge', onclick: () => Nav.go('session', ch) },
      h('span', { class: 'ci' }, ch.icon), h('div', null, h('small', null, 'Nouveau chaque jour'), h('b', null, ch.name + (Store.stars(ch.id) ? ' ✔' : ''))), h('span', { class: 'play' }, '▶')); })(),
    h('div', { class: 'tiles' },
      tile('🗺️', 'Parcours', 'Lessons', () => Nav.go('map'), '#FFE7A8'),
      tile('🎮', 'Jeux', 'Games', () => Nav.go('games'), '#CDEBFF'),
      tile('📖', 'Histoires', 'Stories', () => Nav.go('stories'), '#FFD3E0'),
      tile('💬', 'Parler', 'Let’s talk', () => Nav.go('dialogues'), '#D7F5D0'),
      tile('✍️', 'Lettres', 'Letters', () => Nav.go('letters'), '#EDE4FF'),
      tile('🎵', 'Chansons', 'Songs', () => Nav.go('songs'), '#FFE0C2'),
      tile('💃', 'Bouge !', 'Move', () => Nav.go('session', { id: 'free-move', free: true, steps: [{ type: 'move', n: 8 }] }), '#FCE1FF'),
      tile('🏅', 'Autocollants', 'Stickers', () => Nav.go('album'), '#FFF1C9')),
    favEl);
  if (!greeted) { greeted = true; setTimeout(() => ctx.alive && mascotSay(m, Voice.say(`Hello ${p.name}!`)), 500); }
  m.addEventListener('click', () => { cheer(m); mascotSay(m, Voice.say(pick(['Hello!', "Let's play!", 'I love English!', `Hi ${p.name}!`]))); });
  return el;
};

// barre d'objectif du jour : 3 activités → le coffre s'ouvre
function goalBar() {
  const g = Store.goal(), n = Math.min(g.n, DAILY_GOAL);
  return h('div', { class: 'goal' + (g.claimed ? ' done' : '') },
    h('span', { class: 'goal-chest' }, g.claimed ? '🎁' : '🧰'),
    h('div', { class: 'goal-body' }, h('b', null, g.claimed ? 'Coffre du jour ouvert ! +3 ⭐' : `Objectif du jour : ${n}/${DAILY_GOAL} activités`),
      h('div', { class: 'goal-dots' }, Array.from({ length: DAILY_GOAL }, (_, i) => h('i', { class: i < n ? 'on' : '' })))));
}

function favCard(id) {
  const [kind, x] = id.split(':');
  if (kind === 'story') { const s = STORIES.find(z => z.id === x); return s && h('button', { class: 'mini-card', onclick: () => Nav.go('story', { id: x }) }, h('span', null, s.cover), s.fr); }
  if (kind === 'dlg') { const d = DIALOGUES.find(z => z.id === x); return d && h('button', { class: 'mini-card', onclick: () => Nav.go('dialogue', { id: x }) }, h('span', null, d.icon), d.fr); }
  if (kind === 'game') { const g = ACT_META[x]; return g && h('button', { class: 'mini-card', onclick: () => startGame(x) }, h('span', null, g.icon), g.fr); }
  if (kind === 'song') { const s = SONGS.find(z => z.id === x); return s && h('button', { class: 'mini-card', onclick: () => Nav.go('song', { id: x }) }, h('span', null, s.cover), s.fr); }
  return null;
}
const favBtn = id => { const b = h('button', { class: 'fav' + (Store.isFav(id) ? ' on' : ''), onclick: e => { e.stopPropagation(); Store.toggleFav(id); b.classList.toggle('on'); Sfx.pop(); } }, '♥'); return b; };

/* ---------------- Parcours ---------------- */
Screens.map = () => {
  let i = 0;
  return h('div', { class: 'screen map' }, topBar('Parcours'),
    LEVELS.map(L => {
      const lp = levelProgress(L);
      return h('div', { class: 'level-block' },
        h('div', { class: 'level-head', style: { background: L.color } }, h('span', { class: 'lv-ic' }, L.icon),
          h('div', null, h('b', null, `Niveau ${L.id} · ${L.name}`), h('small', null, L.cefr + (lp.reached ? ' · réussi ✔' : ` · ${lp.pct} %`))),
          h('div', { class: 'pbar s' }, h('i', { style: { width: lp.pct + '%' } }))),
        h('div', { class: 'path' }, L.themes.map(tid => {
          const t = THEMES.find(x => x.id === tid), pr = themeProgress(tid);
          return h('button', { class: 'island ' + (i++ % 2 ? 'r' : 'l'), style: { background: t.bg }, onclick: () => Nav.go('theme', { id: t.id }) },
            h('span', { class: 'ii' }, t.icon), h('div', null, h('b', null, t.fr), h('small', null, t.en)),
            h('div', { class: 'ip' }, h('span', null, `⭐ ${pr.got}/${pr.max}`), h('div', { class: 'pbar s' }, h('i', { style: { width: Math.round(pr.got / pr.max * 100) + '%' } }))));
        })));
    }));
};

Screens.theme = ({ id }) => {
  const t = THEMES.find(x => x.id === id);
  const L = lessonsFor(id);
  return h('div', { class: 'screen theme', style: { background: `linear-gradient(${t.bg}, var(--bg) 280px)` } }, topBar(t.icon + ' ' + t.fr),
    h('button', { class: 'btn ghost', onclick: () => Nav.go('words', { id }) }, '📚 Tous les mots (dictionnaire sonore)'),
    h('div', { class: 'lessons' }, L.map((l, i) => {
      const s = Store.stars(l.id);
      return h('button', { class: 'lesson' + (s ? ' done' : '') + (l.boss ? ' boss' : ''), onclick: () => openLesson(l) },
        h('span', { class: 'num' }, l.icon), h('div', null, h('b', null, l.name), h('small', null, lessonHint(l))),
        h('span', { class: 'st' }, [1, 2, 3].map(k => h('i', { class: k <= s ? 'on' : '' }, '★'))));
    })));
};
function lessonHint(l) {
  if (l.story) return STORIES.find(s => s.id === l.story).title;
  if (l.dialogue) return DIALOGUES.find(d => d.id === l.dialogue).title;
  if (l.steps[0].type === 'discover') return l.steps[0].keys.map(k => ITEM[k].en).join(' · ');
  return l.steps.map(s => ACT_META[s.type].icon).join(' ');
}

Screens.words = ({ id }) => {
  const t = THEMES.find(x => x.id === id);
  const lv = ['nouveau', 'vu', 'en cours', 'acquis'];
  return h('div', { class: 'screen words' }, topBar('📚 ' + t.fr),
    h('div', { class: 'wgrid' }, t.items.map(it => {
      const k = keyOf(it), L = Store.level(k);
      return h('button', { class: 'wcard', onclick: () => { Voice.stop(); Voice.say(spoken(it)).then(() => it.theme === 'abc' ? Voice.say(`${spoken(it)} is for ${it.ex}`) : null); Store.mark(k, null); } },
        visual(it), h('b', null, label(it)), h('small', null, it.theme === 'abc' ? it.exE : it.fr), h('i', { class: 'lv l' + L, title: lv[L] }));
    })));
};

/* ---------------- Jeux libres ---------------- */
const FREE_GAMES = ['listen', 'bubbles', 'memory', 'tf', 'speak', 'count', 'colour', 'sounds', 'initial', 'trace', 'phonics', 'readword', 'move'];
Screens.games = () => h('div', { class: 'screen games' }, topBar('Jeux'),
  h('div', { class: 'tiles' }, FREE_GAMES.map(g => h('div', { class: 'tile game', onclick: () => startGame(g) }, favBtn('game:' + g), h('span', { class: 'ti' }, ACT_META[g].icon), h('b', null, ACT_META[g].fr)))));

function startGame(g) {
  if (g === 'count' || g === 'colour' || g === 'move') return Nav.go('session', { id: 'free-' + g, free: true, steps: [{ type: g, n: g === 'move' ? 8 : 6 }] });
  if (g === 'sounds') return Nav.go('session', { id: 'free-sounds', free: true, steps: [{ type: 'sounds', keys: themeKeys('animals'), n: 8 }] });
  if (g === 'initial') return Nav.go('session', { id: 'free-initial', free: true, steps: [{ type: 'initial', keys: themeKeys('abc'), n: 8 }] });
  if (g === 'trace') return Nav.go('letters');
  if (g === 'phonics') return Nav.go('session', { id: 'free-phonics', free: true, steps: [{ type: 'phonics', keys: themeKeys('abc'), n: 6 }] });
  if (g === 'readword') return Nav.go('session', { id: 'free-read', free: true, steps: [{ type: 'readword', n: 5 }] });
  Nav.go('pickTheme', { game: g });
}

/* ---------------- Lettres : écrire, sons, lecture ---------------- */
Screens.letters = () => {
  const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const traceOne = L => Nav.go('session', { id: 'free-trace-' + L, free: true, steps: [{ type: 'trace', letters: [L] }, { type: 'trace', letters: [L], lower: true }] });
  const big = (icon, title, sub, go, bg) => h('button', { class: 'island l', style: { background: bg, width: '100%' }, onclick: go },
    h('span', { class: 'ii' }, icon), h('div', null, h('b', null, title), h('small', null, sub)));
  return h('div', { class: 'screen letters' }, topBar('✍️ Lettres'),
    big('🔉', 'Le son des lettres', 'buh, kuh, ssss… quel mot commence comme ça ?', () => startGame('phonics'), '#FFF1C9'),
    big('📖', 'Je lis', 'Lis des petits mots, son par son', () => startGame('readword'), '#D7F5D0'),
    big('🎲', 'Écris 4 lettres au hasard', 'Majuscules puis minuscules', () => {
      const ls = shuffle(ABC).slice(0, 4);
      Nav.go('session', { id: 'free-trace', free: true, steps: [{ type: 'trace', letters: ls }, { type: 'trace', letters: ls, lower: true }] });
    }, '#CDEBFF'),
    h('h3', null, 'Choisis une lettre à écrire'),
    h('div', { class: 'abc-grid' }, ABC.map(L => {
      const lv = Store.level('abc:l' + L);
      return h('button', { class: 'abc-key' + (lv === 3 ? ' ok' : ''), onclick: () => traceOne(L) }, h('b', null, L), h('small', null, L.toLowerCase()));
    })));
};

/* ---------------- Chansons (comptines rythmées) ---------------- */
Screens.songs = () => h('div', { class: 'screen stories songs' }, topBar('🎵 Chansons'),
  h('p', { class: 'muted center' }, 'Bloop chante, et toi tu répètes en rythme !'),
  h('div', { class: 'cards' }, SONGS.map(s => h('div', { class: 'scard', onclick: () => Nav.go('song', { id: s.id }) },
    favBtn('song:' + s.id), h('span', { class: 'cover' }, s.cover), h('b', null, s.title), h('small', null, s.fr), Store.done('songs', s.id) ? h('span', { class: 'check' }, '✔') : null))));

Screens.song = ({ id }, ctx) => {
  const s = SONGS.find(x => x.id === id);
  const m = mascot('bloop', 'dance');
  const scene = h('div', { class: 'song-scene' }, h('span', { class: 'pop-in' }, s.cover));
  const lines = h('div', { class: 'song-lines' }, s.lines.map(L => h('div', { class: 'song-line' }, h('span', null, L.en), Store.settings().frInstr ? h('small', null, L.fr) : null)));
  const turn = h('div', { class: 'song-turn' });
  const play = h('button', { class: 'btn big go' }, '▶ Chanter');
  const el = h('div', { class: 'screen song' }, topBar(s.cover + ' ' + s.title, { right: favBtn('song:' + id) }), m, scene, turn, lines, play);
  Nav.onLeave(ctx, () => Music.stop());
  let running = false;
  play.onclick = async () => {
    if (running) return; running = true; play.disabled = true;
    Sfx.unlock(); Music.start(s.melody, s.bpm);
    const rows = lines.querySelectorAll('.song-line');
    // 2 tours : 1) Bloop chante, l'enfant répète  2) tout le monde ensemble
    for (let round = 0; round < 2; round++) {
      for (let i = 0; i < s.lines.length; i++) {
        if (!ctx.alive) return;
        const L = s.lines[i];
        rows.forEach((r, k) => r.classList.toggle('on', k === i));
        scene.replaceChildren(h('span', { class: 'pop-in' }, L.e));
        turn.textContent = round === 0 ? '🎤 Bloop chante…' : '🎶 Tous ensemble !';
        await mascotSay(m, Voice.say(L.en, 'en', { rate: 1.0, pitch: 1.25 }));
        if (!ctx.alive) return;
        if (round === 0) {
          turn.textContent = '🧒 À toi !'; turn.classList.add('kid');
          await sleep(900 + L.en.length * 75);
          turn.classList.remove('kid');
        } else await sleep(300);
      }
    }
    Music.stop();
    if (!ctx.alive) return;
    rows.forEach(r => r.classList.remove('on'));
    turn.textContent = '';
    Store.setDone('songs', id);
    finishLesson({ id: 'free-song-' + id, free: true }, 3);
  };
  return el;
};
Screens.pickTheme = ({ game }) => {
  const seen = Object.keys(ITEM).filter(k => Store.level(k) > 0);
  const run = keys => Nav.go('session', { id: 'free-' + game, free: true, steps: [{ type: game, keys, n: 8, pairs: Math.min(6, keys.length) }] });
  return h('div', { class: 'screen pick' }, topBar(ACT_META[game].icon + ' ' + ACT_META[game].fr),
    h('p', { class: 'muted center' }, 'Avec quels mots ?'),
    seen.length >= 4 ? h('button', { class: 'island l', style: { background: '#FFF' }, onclick: () => run(seen) }, h('span', { class: 'ii' }, '🌈'), h('div', null, h('b', null, 'Tous mes mots'), h('small', null, `${seen.length} mots déjà vus`))) : null,
    h('div', { class: 'tgrid' }, THEMES.map(t => h('button', { class: 'tchip', style: { background: t.bg }, onclick: () => run(themeKeys(t.id)) }, h('span', null, t.icon), t.fr))));
};

/* ---------------- Histoires ---------------- */
Screens.stories = () => h('div', { class: 'screen stories' }, topBar('Histoires'),
  h('div', { class: 'cards' }, STORIES.map(s => h('div', { class: 'scard', onclick: () => Nav.go('story', { id: s.id }) },
    favBtn('story:' + s.id), h('span', { class: 'cover' }, s.cover), h('b', null, s.title), h('small', null, s.fr), Store.done('stories', s.id) ? h('span', { class: 'check' }, '✔') : null))));

Screens.story = ({ id, lessonId }, ctx) => {
  const s = STORIES.find(x => x.id === id);
  const lesson = lessonId ? ALL_LESSONS[lessonId] : { id: 'free-story-' + id, story: id, free: true };
  const p = Store.profile();
  let i = 0;
  const scene = h('div', { class: 'scene' });
  const text = h('div', { class: 'stext' });
  const fr = h('div', { class: 'sfr' });
  const dots = h('div', { class: 'dots' }, s.pages.map(() => h('i')));
  const prev = h('button', { class: 'round big' }, '◀');
  const next = h('button', { class: 'round big go' }, '▶');
  const read = () => { text.classList.add('reading'); Voice.stop(); return Voice.say(s.pages[i].en, 'en', { rate: 0.95 }).then(() => text.classList.remove('reading')); };
  const show = () => {
    const pg = s.pages[i];
    // scène animée : chaque personnage entre à sa façon, puis bouge ; on peut le toucher
    const actors = splitEmoji(pg.s);
    const moves = ['enter-l', 'enter-r', 'enter-up', 'enter-pop'];
    scene.replaceChildren(...actors.map((e, k) => {
      const a = h('span', { class: `actor ${moves[(i + k) % moves.length]} idle-${(i + k) % 3}`, style: { animationDelay: `${k * 0.25}s, ${0.8 + k * 0.25}s` } }, e);
      a.addEventListener('click', ev => { ev.stopPropagation(); a.classList.remove('boing'); void a.offsetWidth; a.classList.add('boing'); Sfx.pop(); });
      return a;
    }));
    scene.style.background = `linear-gradient(180deg, #fff, ${(THEMES.find(t => t.id === s.theme) || {}).bg || '#fff'})`;
    text.replaceChildren(...pg.en.split(' ').map(w => h('span', { class: 'w', onclick: e => { e.stopPropagation(); Voice.stop(); Voice.say(w.replace(/[^A-Za-z'-]/g, '')); } }, w + ' ')));
    fr.textContent = ''; fr.classList.remove('on');
    dots.querySelectorAll('i').forEach((d, k) => d.classList.toggle('on', k <= i));
    prev.disabled = i === 0;
    read();
  };
  prev.onclick = () => { if (i > 0) { i--; show(); } };
  next.onclick = () => { if (i < s.pages.length - 1) { i++; Sfx.flip(); show(); } else quiz(); };
  const body = h('div', { class: 'story-body' }, scene, text, fr,
    h('div', { class: 'row center gap' }, prev, h('button', { class: 'round big', onclick: read }, '🔊'),
      h('button', { class: 'round big', onclick: () => { fr.textContent = s.pages[i].fr; fr.classList.add('on'); Voice.stop(); Voice.say(s.pages[i].fr, 'fr'); } }, '🇫🇷'), next), dots);
  const el = h('div', { class: 'screen story' }, topBar(s.cover + ' ' + s.title, { right: favBtn('story:' + id) }), body);

  async function quiz() {
    let errors = 0;
    for (let q = 0; q < s.quiz.length; q++) {
      if (!ctx.alive) return;
      const Q = s.quiz[q];
      let resolve, first = true; const pr = new Promise(r => resolve = r);
      const grid = choiceGrid(shuffle(Q.opts), async (k, b) => {
        if (k === Q.ok) { b.classList.add('right'); Sfx.good(); Store.mark(k, first); await Voice.say(pick(PRAISE)); resolve(); }
        else { first = false; errors++; b.classList.add('wrong'); Sfx.bad(); setTimeout(() => b.classList.remove('wrong'), 600); Voice.say(spoken(ITEM[k])); }
      });
      const ask = () => Voice.say(Q.en).then(() => Store.settings().frInstr ? Voice.say(Q.fr, 'fr') : null);
      body.replaceChildren(h('div', { class: 'qtitle' }, h('small', null, `Question ${q + 1}/${s.quiz.length}`), h('b', null, Q.en), h('span', { class: 'muted' }, Q.fr)),
        h('div', { class: 'prompt' }, h('button', { class: 'round big', onclick: ask }, '🔊')), grid);
      ask(); await pr; await sleep(500);
    }
    if (!ctx.alive) return;
    Store.setDone('stories', id);
    finishLesson(lesson, errors === 0 ? 3 : errors <= 2 ? 2 : 1);
  }
  setTimeout(show, 200);
  return el;
};

/* ---------------- Dialogues ---------------- */
Screens.dialogues = () => h('div', { class: 'screen dialogues' }, topBar('Parler avec Bloop'),
  h('p', { class: 'muted center' }, 'Bloop et Pip te parlent. À toi de répondre !'),
  h('div', { class: 'cards' }, DIALOGUES.map(d => h('div', { class: 'scard', onclick: () => Nav.go('dialogue', { id: d.id }) },
    favBtn('dlg:' + d.id), h('span', { class: 'cover' }, d.icon), h('b', null, d.title), h('small', null, d.fr), Store.done('dialogues', d.id) ? h('span', { class: 'check' }, '✔') : null))));

Screens.dialogue = ({ id, lessonId }, ctx) => {
  const d = DIALOGUES.find(x => x.id === id);
  const lesson = lessonId ? ALL_LESSONS[lessonId] : { id: 'free-dlg-' + id, dialogue: id, free: true };
  const p = Store.profile();
  const bloop = mascot('bloop', 'chat'), pip = mascot('pip', 'chat');
  const who = d.lines.some(l => l.who === 'pip') ? pip : bloop;
  const chat = h('div', { class: 'chat' });
  const actions = h('div', { class: 'chat-actions' });
  const el = h('div', { class: 'screen dialogue' }, topBar(d.icon + ' ' + d.title, { right: favBtn('dlg:' + id) }),
    h('div', { class: 'cast' }, who, h('span', { class: 'vs' }, '💬'), h('span', { class: 'av big' }, p.avatar)), chat, actions);
  const micOK = Mic.available();
  const add = (side, en, frT) => {
    const b = h('div', { class: 'bubble-msg ' + side + ' pop-in' }, h('div', null, en), Store.settings().frInstr ? h('small', null, frT) : null);
    b.addEventListener('click', () => { Voice.stop(); Voice.say(en); });
    chat.append(b); b.scrollIntoView({ behavior: 'smooth', block: 'end' }); return b;
  };
  (async () => {
    let choice = '';
    await sleep(400);
    for (const line of d.lines) {
      if (!ctx.alive) return;
      if (line.who !== 'kid') {
        const en = fill(line.en, p).replace(/\{choice\}/g, choice), frT = fill(line.fr, p);
        add('left', en, frT);
        await mascotSay(who, Voice.say(en, 'en', { pitch: line.who === 'pip' ? 1.35 : 1.1 }));
        await sleep(300); continue;
      }
      let L = line;
      if (line.choices) {
        L = await new Promise(res => actions.replaceChildren(h('p', { class: 'muted' }, 'Choisis ta réponse :'),
          h('div', { class: 'row center gap wrap' }, line.choices.map(c => h('button', { class: 'choice ans', onclick: () => { Voice.stop(); res(c); }, onpointerdown: () => Voice.say(c.en) },
            c.c ? h('span', { class: 'dot', style: { background: c.c } }) : h('span', { class: 'ce' }, c.e)))) ));
        choice = L.v || '';
      }
      const en = fill(L.en, p), frT = fill(L.fr, p);
      const b = add('right ghosty', en, frT);
      // modèle : on écoute la phrase, puis l'enfant la dit
      actions.replaceChildren(h('p', { class: 'muted' }, 'Écoute…'));
      await Voice.say(en);
      if (!ctx.alive) return;
      const act = micOK ? h('button', { class: 'mic-big' }, '🎤') : h('button', { class: 'btn big go' }, "Je l'ai dit ! 🗣️");
      const skip = h('button', { class: 'btn ghost small' }, 'Passer ➜');
      actions.replaceChildren(h('p', { class: 'muted' }, micOK ? 'À toi ! Appuie et dis la phrase.' : 'À toi ! Dis la phrase à voix haute.'),
        h('div', { class: 'row center gap' }, h('button', { class: 'round big', onclick: () => Voice.say(en) }, '🔊'), act), skip);
      if (Store.settings().frInstr) Voice.say('À toi !', 'fr');
      let tries = 0;
      await new Promise(res => {
        skip.onclick = res;
        act.onclick = async () => {
          if (!micOK) { Sfx.good(); return res(); }
          if (!(await Mic.ensurePermission())) { toast('Micro non autorisé'); return res(); }
          Voice.stop(); act.classList.add('listening');
          const r = await Mic.listen(); act.classList.remove('listening');
          if (r.heard.length && Mic.score(en, r.heard) >= 0.4) { Sfx.good(); cheer(who); return res(); }
          tries++;
          if (tries >= 2) { Sfx.star(); await Voice.say('Good try!'); return res(); }
          await Voice.say(r.heard.length ? 'Almost! Listen: ' + en : 'Say it louder!');
        };
      });
      b.classList.remove('ghosty'); actions.replaceChildren();
      await sleep(300);
    }
    if (!ctx.alive) return;
    Store.setDone('dialogues', id);
    await sleep(600);
    finishLesson(lesson, 3);
  })();
  Nav.onLeave(ctx, () => Mic.stop());
  return el;
};

/* ---------------- Autocollants ---------------- */
Screens.album = () => {
  const n = Store.stickerCount(), total = Store.totalStars();
  Store.setStickersSeen(n);
  return h('div', { class: 'screen album' }, topBar('Mes autocollants'),
    h('div', { class: 'album-head' }, h('b', null, `${n} / ${STICKERS.length}`), h('small', null, n < STICKERS.length ? `Encore ${5 - total % 5} ⭐ pour le prochain !` : 'Collection complète ! 🎉'),
      h('small', null, `📚 ${Store.learnedCount()} mots acquis`)),
    h('div', { class: 'stickers' }, STICKERS.map((s, i) => i < n
      ? h('button', { class: 'stk on', onclick: e => { Sfx.pop(); cheer(e.currentTarget); } }, s)
      : h('div', { class: 'stk' }, '?'))));
};

/* ---------------- Garde-robe de Bloop ---------------- */
Screens.wardrobe = () => {
  const coins = h('span', { class: 'tb-stars' }, '⭐ ', String(Store.coins()));
  const stage = h('div', { class: 'wardrobe-stage' }, mascot('bloop', 'hero'));
  const refresh = () => { stage.replaceChildren(mascot('bloop', 'hero')); coins.replaceChildren('⭐ ', String(Store.coins())); grid.replaceChildren(...cards()); };
  const cards = () => WARDROBE.map(w => {
    const own = Store.owns(w.id), wear = Store.wearing() === w.id, can = Store.coins() >= w.price;
    return h('button', { class: 'wcard ward' + (wear ? ' wearing' : '') + (!own && !can ? ' locked' : ''), onclick: () => {
      if (own) { Store.setWear(wear ? null : w.id); Sfx.pop(); refresh(); return; }
      if (!can) { Sfx.bad(); toast(`Encore ${w.price - Store.coins()} ⭐ pour l'acheter !`); return; }
      Store.buy(w.id, w.price); Sfx.star(); confetti(25); refresh(); Voice.say('Wow! I love it!');
    } }, h('span', { class: 'ward-e' }, w.e), h('b', null, w.fr), h('small', null, own ? (wear ? 'Porté ✔' : 'À toi') : `⭐ ${w.price}`));
  });
  const grid = h('div', { class: 'wgrid' }, cards());
  return h('div', { class: 'screen wardrobe' }, topBar('👕 Habille Bloop', { right: coins }),
    stage, h('p', { class: 'muted center ward-help' }, 'Dépense tes étoiles pour habiller Bloop. Touche un habit pour le mettre ou l’enlever.'), grid);
};

/* ---------------- Pause (temps d'écran) ---------------- */
Screens.timeup = () => h('div', { class: 'screen timeup' },
  mascot('bloop', 'sleepy'), h('h2', null, "C'est l'heure de la pause !"),
  h('p', null, 'Bloop va dormir. On rejoue demain ! 🌙'),
  h('button', { class: 'btn ghost', onclick: () => parentGate(() => { Store.unlockToday(); Nav.reset('home'); }) }, '🔒 Parent : débloquer pour aujourd’hui'));

/* ---------------- Espace parents ---------------- */
Screens.parent = ({ tab = 'progress', pid }) => {
  const S = Store.settings();
  const tabs = h('div', { class: 'tabs' }, [['progress', '📊 Progrès'], ['report', '🎓 Bilan'], ['settings', '⚙️ Réglages'], ['profiles', '👧 Profils'], ['transfer', '🔄 Transfert']].map(([k, t]) =>
    h('button', { class: 'tab' + (k === tab ? ' sel' : ''), onclick: () => Nav.replace('parent', { tab: k, pid }) }, t)));
  let body;
  if (tab === 'progress') {
    const cur = Store.profile();
    const p = Store.profiles().find(x => x.id === pid) || cur;
    Store.use(p.id); // lecture des stats de cet enfant, on revient au profil actif à la fin
    const days = Store.daysLog(7);
    const maxS = Math.max(600, ...days.map(d => d.s));
    const wd = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
    const weak = Object.keys(ITEM).filter(k => { const w = Store.word(k); return w.ko > w.ok && w.ko > 0; }).slice(0, 18);
    body = h('div', null,
      Store.profiles().length > 1 ? h('div', { class: 'segs' }, Store.profiles().map(x => h('button', { class: 'seg' + (x.id === p.id ? ' sel' : ''), onclick: () => Nav.replace('parent', { tab, pid: x.id }) }, x.avatar + ' ' + x.name))) : null,
      h('div', { class: 'kpis' },
        kpi('⭐', Store.totalStars(), 'étoiles'), kpi('📚', `${Store.learnedCount()}/${Object.keys(ITEM).length}`, 'mots acquis'),
        kpi('🔥', Store.streak(), 'jours d’affilée'), kpi('⏱️', Math.round(Store.secondsToday() / 60) + ' min', "aujourd'hui")),
      h('h3', null, '7 derniers jours'),
      h('div', { class: 'chart' }, days.map(d => h('div', { class: 'cbar' }, h('small', null, d.s ? Math.round(d.s / 60) + '′' : ''), h('i', { style: { height: Math.max(2, d.s / maxS * 100) + '%' } }), h('span', null, wd[d.d.getDay()])))),
      h('h3', null, 'Par thème'),
      h('div', { class: 'ptable' }, THEMES.map(t => {
        const pr = themeProgress(t.id); const ks = themeKeys(t.id); const acq = ks.filter(k => Store.level(k) === 3).length;
        return h('div', { class: 'prow' }, h('span', null, t.icon + ' ' + t.fr), h('small', null, `${acq}/${ks.length} mots · ${pr.done}/${pr.total} leçons`), h('div', { class: 'pbar s' }, h('i', { style: { width: Math.round(pr.got / pr.max * 100) + '%' } })));
      })),
      h('h3', null, 'Mots à retravailler'),
      weak.length ? h('div', { class: 'weak' }, weak.map(k => h('button', { class: 'tchip', onclick: () => Voice.say(spoken(ITEM[k])) }, visual(ITEM[k], 'xs'), ITEM[k].en))) : h('p', { class: 'muted' }, 'Rien pour l’instant 👍'),
      h('p', { class: 'muted small' }, `Histoires lues : ${STORIES.filter(s => Store.done('stories', s.id)).length}/${STORIES.length} · Dialogues : ${DIALOGUES.filter(d => Store.done('dialogues', d.id)).length}/${DIALOGUES.length}`));
    Store.use(cur.id);
  } else if (tab === 'settings') {
    const ts = Voice.status();
    body = h('div', { class: 'settings' },
      setRow('Accent', h('div', { class: 'segs' }, seg('accent', 'uk', '🇬🇧 Anglais'), seg('accent', 'us', '🇺🇸 Américain'))),
      setRow('Vitesse de la voix', h('input', { type: 'range', min: 0.6, max: 1.1, step: 0.05, value: S.speed, oninput: e => Store.setSetting('speed', Number(e.target.value)), onchange: () => Voice.say('Hello! How are you?') })),
      toggle('realVoices', 'Vraies voix enregistrées', 'Les mots et phrases enregistrés remplacent la voix de synthèse'),
      toggle('frInstr', 'Consignes en français', 'Sinon, tout est en anglais (immersion)'),
      toggle('showText', 'Afficher les mots écrits', 'Utile quand l’enfant commence à lire'),
      toggle('mic', 'Micro (exercices de prononciation)', 'Tolérant : l’enfant n’est jamais bloqué'),
      toggle('sfx', 'Petits sons', ''),
      setRow("Temps d'écran par jour", h('div', { class: 'segs wrap' }, [0, 10, 15, 20, 30, 45, 60].map(v => seg('limitMin', v, v ? v + ' min' : 'Illimité')))),
      h('div', { class: 'row gap wrap' },
        h('button', { class: 'btn', onclick: () => Voice.say('Hello! I am Bloop. Let’s learn English!') }, '🔊 Tester la voix anglaise'),
        h('button', { class: 'btn', onclick: () => Voice.say('Bonjour, je suis Bloop !', 'fr') }, '🔊 Voix française'),
        Mic.available() ? h('button', { class: 'btn', onclick: micTest }, '🎤 Tester le micro') : null,
        NATIVE ? h('button', { class: 'btn ghost', onclick: () => window.Android.openTtsSettings() }, 'Réglages des voix Android') : null,
        h('button', { class: 'btn ghost', onclick: showCredits }, '📜 Crédits des voix')),
      (!ts.en || !ts.fr) ? h('p', { class: 'warn' }, `⚠️ Voix ${!ts.en ? 'anglaise' : 'française'} absente : installe-la dans « Réglages des voix Android » (Google Speech Services).`) : null,
      h('p', { class: 'muted small' }, 'Tout est gratuit, sans publicité, et les données restent sur ce téléphone.'));
  } else if (tab === 'report') {
    const cur = Store.profile();
    const p = Store.profiles().find(x => x.id === pid) || cur;
    Store.use(p.id);
    const week = Store.actsLog(7), mins = Math.round(week.reduce((a, d) => a + d.s, 0) / 60), acts = week.reduce((a, d) => a + d.a, 0);
    const since = Date.now() - 7 * 864e5;
    const newWords = Object.keys(ITEM).filter(k => (Store.word(k).acq || 0) >= since);
    const weak = Object.keys(ITEM).filter(k => { const w = Store.word(k); return w.ko > w.ok && w.ko > 0; }).slice(0, 10);
    const CL = currentLevel();
    const lines = [`Bilan de la semaine — ${p.name} (Hello English)`, `Niveau en cours : ${CL.id} · ${CL.name} (${CL.cefr})`,
      `Temps : ${mins} min · Activités : ${acts} · Mots acquis cette semaine : ${newWords.length}`,
      ...LEVELS.filter(L => levelProgress(L).reached).map(L => `✔ Niveau ${L.id} réussi : ${L.can.join(' ; ')}`),
      weak.length ? `À retravailler : ${weak.map(k => ITEM[k].en).join(', ')}` : ''].filter(Boolean);
    body = h('div', null,
      Store.profiles().length > 1 ? h('div', { class: 'segs' }, Store.profiles().map(x => h('button', { class: 'seg' + (x.id === p.id ? ' sel' : ''), onclick: () => Nav.replace('parent', { tab, pid: x.id }) }, x.avatar + ' ' + x.name))) : null,
      h('div', { class: 'kpis' }, kpi('⏱️', mins + ' min', 'cette semaine'), kpi('✅', acts, 'activités'), kpi('🆕', newWords.length, 'mots acquis'), kpi(CL.icon, 'Niv. ' + CL.id, CL.cefr)),
      newWords.length ? h('div', { class: 'weak' }, newWords.slice(0, 18).map(k => h('button', { class: 'tchip', onclick: () => Voice.say(spoken(ITEM[k])) }, visual(ITEM[k], 'xs'), ITEM[k].en))) : null,
      h('h3', null, 'Ce que ton enfant sait faire'),
      LEVELS.map(L => {
        const lp = levelProgress(L);
        return h('div', { class: 'can-card' + (lp.reached ? ' ok' : '') },
          h('div', { class: 'can-head' }, h('b', null, `${L.icon} Niveau ${L.id} · ${L.name}`), h('small', null, `${L.cefr} · ${lp.acq}/${lp.words} mots · ${lp.done}/${lp.lessons} leçons`)),
          h('div', { class: 'pbar s' }, h('i', { style: { width: lp.pct + '%' } })),
          h('ul', null, L.can.map(c => h('li', null, (lp.reached ? '✔ ' : '○ ') + c))));
      }),
      weak.length ? [h('h3', null, 'À retravailler ensemble'), h('div', { class: 'weak' }, weak.map(k => h('button', { class: 'tchip', onclick: () => Voice.say(spoken(ITEM[k])) }, visual(ITEM[k], 'xs'), ITEM[k].en)))] : null,
      h('div', { class: 'row gap wrap' },
        h('button', { class: 'btn', onclick: () => Transfer.copy(lines.join('\n')).then(ok => toast(ok ? 'Bilan copié ✔' : 'Copie impossible')) }, '📋 Copier le bilan'),
        h('button', { class: 'btn ghost', onclick: () => { Store.use(p.id); Nav.go('placement'); } }, '🎯 Refaire le test de niveau')),
      h('p', { class: 'muted small' }, 'Les niveaux suivent le programme Cambridge Pre-A1 Starters (le tout premier niveau officiel pour les enfants), puis A1 Movers. Un niveau est « réussi » quand la plupart de ses mots sont acquis et ses leçons faites.'));
    Store.use(cur.id);
  } else if (tab === 'transfer') {
    const out = h('textarea', { class: 'input code-box', readonly: 'readonly', rows: 4, placeholder: 'Le code apparaîtra ici…', onfocus: e => e.target.select() });
    const inp = h('textarea', { class: 'input code-box', rows: 4, placeholder: 'Colle ici le code reçu de l’autre appareil' });
    const canShare = NATIVE ? !!window.Android.shareText : !!navigator.share;
    body = h('div', { class: 'settings' },
      syncBox(tab),
      h('h3', null, 'Transfert manuel (sans internet)'),
      h('p', { class: 'muted' }, 'Pour retrouver les progrès sur un autre appareil : crée un code ici, envoie-le-toi (message, e-mail…), puis colle-le sur l’autre appareil. Les progrès sont fusionnés : on garde le meilleur des deux, rien n’est effacé.'),
      h('h3', null, '1. Envoyer depuis cet appareil'),
      h('button', { class: 'btn go', onclick: async () => { out.value = await Transfer.encode(Store.exportData()); out.focus(); } }, '📦 Créer le code'),
      out,
      h('div', { class: 'row gap wrap' },
        h('button', { class: 'btn', onclick: () => out.value ? Transfer.copy(out.value).then(ok => toast(ok ? 'Code copié ✔' : 'Sélectionne le code et copie-le')) : toast('Crée d’abord le code') }, '📋 Copier'),
        canShare ? h('button', { class: 'btn', onclick: () => out.value ? Transfer.share(out.value) : toast('Crée d’abord le code') }, '📤 Partager') : null),
      h('h3', null, '2. Recevoir sur cet appareil'),
      inp,
      h('button', { class: 'btn go', onclick: async () => {
        try {
          const res = Store.merge(await Transfer.decode(inp.value));
          const parts = [];
          if (res.merged.length) parts.push('fusionné : ' + res.merged.join(', '));
          if (res.added.length) parts.push('ajouté : ' + res.added.join(', '));
          if (res.skipped.length) parts.push('ignoré (4 profils max) : ' + res.skipped.join(', '));
          modal([h('h3', null, 'Progrès récupérés ✔'), h('p', null, parts.join(' · ') || 'Rien à importer.'), h('button', { class: 'btn go', onclick: () => { closeModal(); Nav.reset(Store.profiles().length > 1 ? 'who' : 'home'); } }, 'OK')]);
        } catch (e) { toast('Ce code ne marche pas. Vérifie qu’il est complet.'); }
      } }, '📥 Importer et fusionner'));
  } else {
    body = h('div', null,
      Store.profiles().map(p => h('div', { class: 'prof-row' }, h('span', { class: 'av' }, p.avatar), h('b', null, p.name), h('small', null, p.age + ' ans'),
        h('button', { class: 'btn small', onclick: () => Nav.go('profileForm', { id: p.id }) }, 'Modifier'),
        h('button', { class: 'btn small ghost', onclick: () => confirmBox(`Remettre à zéro les progrès de ${p.name} ?`, () => { Store.resetProfile(p.id); Nav.replace('parent', { tab }); }) }, '↺'),
        h('button', { class: 'btn small danger', onclick: () => confirmBox(`Supprimer le profil de ${p.name} ?`, () => { Store.removeProfile(p.id); Store.profiles().length ? Nav.replace('parent', { tab }) : Nav.reset('profileForm'); }) }, '🗑'))),
      Store.profiles().length < 4 ? h('button', { class: 'btn go', onclick: () => Nav.go('profileForm', {}) }, '+ Ajouter un enfant (4 max)') : null);
  }
  return h('div', { class: 'screen parent' }, topBar('Espace parents', { right: h('div') }), tabs, body);

  function kpi(i, v, t) { return h('div', { class: 'kpi' }, h('span', null, i), h('b', null, String(v)), h('small', null, t)); }
  function setRow(t, ctl) { return h('div', { class: 'set-row' }, h('b', null, t), ctl); }
  function seg(k, v, t) { return h('button', { class: 'seg' + (S[k] === v ? ' sel' : ''), onclick: () => { Store.setSetting(k, v); Nav.replace('parent', { tab }); } }, t); }
  function toggle(k, t, sub) {
    return h('label', { class: 'toggle' }, h('div', null, h('b', null, t), sub ? h('small', null, sub) : null),
      h('input', { type: 'checkbox', checked: S[k] ? 'checked' : null, onchange: e => Store.setSetting(k, e.target.checked) }));
  }
  async function micTest() {
    if (!(await Mic.ensurePermission())) return toast('Micro refusé');
    toast('Dis « Hello » 🎤'); const r = await Mic.listen();
    toast(r.heard.length ? 'Entendu : ' + r.heard[0] : 'Rien entendu (' + (r.error || '?') + ')');
  }
};
/* Code de transfert : JSON compressé (si possible) puis en base64, préfixé pour reconnaître le format */
const Transfer = {
  async encode(obj) {
    const bytes = new TextEncoder().encode(JSON.stringify(obj));
    let data = bytes, tag = 'HE1:';
    if (window.CompressionStream) {
      try { data = new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer()); tag = 'HE1z:'; } catch (e) { data = bytes; }
    }
    let bin = ''; for (let i = 0; i < data.length; i += 0x8000) bin += String.fromCharCode.apply(null, data.subarray(i, i + 0x8000));
    return tag + btoa(bin);
  },
  async decode(code) {
    const s = (code || '').replace(/\s+/g, '');
    const m = s.match(/^(HE1z?):(.+)$/); if (!m) throw new Error('format');
    const bin = atob(m[2]); let bytes = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    if (m[1] === 'HE1z') bytes = new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());
    return JSON.parse(new TextDecoder().decode(bytes));
  },
  async copy(text) {
    if (NATIVE && window.Android.copyText) { window.Android.copyText(text); return true; }
    try { await navigator.clipboard.writeText(text); return true; } catch (e) { return false; }
  },
  share(text) {
    if (NATIVE && window.Android.shareText) return window.Android.shareText(text);
    navigator.share({ title: 'Hello English : sauvegarde', text }).catch(() => {});
  },
};

// encadré « synchro automatique » de l'espace parents
function syncBox(tab) {
  const refresh = () => Nav.replace('parent', { tab });
  if (!Sync.available()) return h('div', { class: 'sync-box' }, h('b', null, '☁️ Synchro automatique'), h('p', { class: 'muted small' }, 'Pas encore activée dans cette version de l’appli.'));
  if (!Sync.enabled()) {
    const inp = h('input', { class: 'input', placeholder: 'XXXX-XXXX-XXXX-XXXX', maxlength: 19, style: { textTransform: 'uppercase' } });
    return h('div', { class: 'sync-box' }, h('b', null, '☁️ Synchro automatique'),
      h('p', { class: 'muted small' }, 'Les progrès se mettent à jour tout seuls entre la tablette et l’ordinateur. Sur le premier appareil, crée un code famille ; sur les autres, entre ce même code.'),
      h('button', { class: 'btn go', onclick: async () => { toast('Activation…'); const ok = await Sync.start(Sync.newCode()); toast(ok ? 'Synchro activée ✔' : 'Échec : vérifie internet'); refresh(); } }, '✨ Créer un code famille'),
      h('p', { class: 'muted small' }, 'Ou j’ai déjà un code :'), inp,
      h('button', { class: 'btn', onclick: async () => {
        const c = inp.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (c.length !== 16) return toast('Le code a 16 caractères');
        toast('Connexion…'); const ok = await Sync.start(c.match(/.{4}/g).join('-'));
        toast(ok ? 'Synchro activée ✔ progrès fusionnés' : 'Échec : vérifie le code et internet'); refresh();
      } }, '🔗 Relier cet appareil'));
  }
  const s = Sync.status(), last = Sync.lastSync();
  return h('div', { class: 'sync-box on' }, h('b', null, '☁️ Synchro automatique activée'),
    h('p', null, 'Code famille : ', h('b', { class: 'fam-code' }, Sync.family())),
    h('p', { class: 'muted small' }, 'Entre ce code sur tes autres appareils (espace parents → Transfert). Garde-le pour toi : il donne accès aux progrès.'),
    h('p', { class: 'small' }, s.startsWith('err') ? '⚠️ ' + s.slice(4) : last ? '✔ Dernière synchro : ' + new Date(last).toLocaleString('fr-FR') : '…'),
    h('div', { class: 'row gap wrap' },
      h('button', { class: 'btn', onclick: async () => { toast('Synchro…'); const ok = await Sync.now(); toast(ok ? 'À jour ✔' : 'Échec : vérifie internet'); refresh(); } }, '🔄 Synchroniser maintenant'),
      h('button', { class: 'btn ghost', onclick: () => confirmBox('Arrêter la synchro sur cet appareil ? (les progrès restent ici)', () => { Sync.stop(); refresh(); }) }, 'Arrêter ici')));
}

// crédits des enregistrements (licences libres : on nomme les auteurs)
function showCredits() {
  const cr = typeof AUDIO_CREDITS !== 'undefined' ? AUDIO_CREDITS : [];
  modal([h('h3', null, '📜 Crédits des voix'),
    h('p', { class: 'muted small' }, cr.length ? 'Mots enregistrés par des bénévoles anglophones sur Wikimedia Commons, sous licence libre. Merci à eux !' : 'Aucun enregistrement pour l’instant.'),
    h('div', { class: 'credits' }, cr.map(c => h('div', null, h('b', null, c.word), ' — ', c.author, ' · ', c.license))),
    h('button', { class: 'btn go', onclick: closeModal }, 'Fermer')]);
}

function confirmBox(msg, ok) {
  modal([h('p', null, msg), h('div', { class: 'row gap center' }, h('button', { class: 'btn danger', onclick: () => { closeModal(); ok(); } }, 'Oui'), h('button', { class: 'btn ghost', onclick: closeModal }, 'Annuler'))]);
}
