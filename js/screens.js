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
    h('div', { class: 'hero' }, m, h('div', { class: 'speech' }, `Hello ${p.name}!`)),
    nl ? h('button', { class: 'continue', onclick: () => openLesson(nl) },
      h('span', { class: 'ci' }, THEMES.find(t => t.id === nl.theme).icon),
      h('div', null, h('small', null, 'Continuer'), h('b', null, THEMES.find(t => t.id === nl.theme).fr + ' · ' + nl.name)), h('span', { class: 'play' }, '▶')) : null,
    review ? h('button', { class: 'continue alt', onclick: () => Nav.go('session', review) },
      h('span', { class: 'ci' }, '☀️'), h('div', null, h('small', null, '5 minutes'), h('b', null, 'Révision du jour' + (Store.stars(review.id) ? ' ✔' : ''))), h('span', { class: 'play' }, '▶')) : null,
    h('div', { class: 'tiles' },
      tile('🗺️', 'Parcours', 'Lessons', () => Nav.go('map'), '#FFE7A8'),
      tile('🎮', 'Jeux', 'Games', () => Nav.go('games'), '#CDEBFF'),
      tile('📖', 'Histoires', 'Stories', () => Nav.go('stories'), '#FFD3E0'),
      tile('💬', 'Parler', 'Let’s talk', () => Nav.go('dialogues'), '#D7F5D0'),
      tile('💃', 'Bouge !', 'Move', () => Nav.go('session', { id: 'free-move', free: true, steps: [{ type: 'move', n: 8 }] }), '#FCE1FF'),
      tile('🏅', 'Autocollants', 'Stickers', () => Nav.go('album'), '#FFF1C9')),
    favEl);
  if (!greeted) { greeted = true; setTimeout(() => ctx.alive && mascotSay(m, Voice.say(`Hello ${p.name}!`)), 500); }
  m.addEventListener('click', () => { cheer(m); mascotSay(m, Voice.say(pick(['Hello!', "Let's play!", 'I love English!', `Hi ${p.name}!`]))); });
  return el;
};

function favCard(id) {
  const [kind, x] = id.split(':');
  if (kind === 'story') { const s = STORIES.find(z => z.id === x); return s && h('button', { class: 'mini-card', onclick: () => Nav.go('story', { id: x }) }, h('span', null, s.cover), s.fr); }
  if (kind === 'dlg') { const d = DIALOGUES.find(z => z.id === x); return d && h('button', { class: 'mini-card', onclick: () => Nav.go('dialogue', { id: x }) }, h('span', null, d.icon), d.fr); }
  if (kind === 'game') { const g = ACT_META[x]; return g && h('button', { class: 'mini-card', onclick: () => startGame(x) }, h('span', null, g.icon), g.fr); }
  return null;
}
const favBtn = id => { const b = h('button', { class: 'fav' + (Store.isFav(id) ? ' on' : ''), onclick: e => { e.stopPropagation(); Store.toggleFav(id); b.classList.toggle('on'); Sfx.pop(); } }, '♥'); return b; };

/* ---------------- Parcours ---------------- */
Screens.map = () => h('div', { class: 'screen map' }, topBar('Parcours'),
  h('div', { class: 'path' }, THEMES.map((t, i) => {
    const pr = themeProgress(t.id);
    return h('button', { class: 'island ' + (i % 2 ? 'r' : 'l'), style: { background: t.bg }, onclick: () => Nav.go('theme', { id: t.id }) },
      h('span', { class: 'ii' }, t.icon), h('div', null, h('b', null, t.fr), h('small', null, t.en)),
      h('div', { class: 'ip' }, h('span', null, `⭐ ${pr.got}/${pr.max}`), h('div', { class: 'pbar s' }, h('i', { style: { width: Math.round(pr.got / pr.max * 100) + '%' } }))));
  })));

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
const FREE_GAMES = ['listen', 'bubbles', 'memory', 'tf', 'speak', 'count', 'colour', 'sounds', 'initial', 'move'];
Screens.games = () => h('div', { class: 'screen games' }, topBar('Jeux'),
  h('div', { class: 'tiles' }, FREE_GAMES.map(g => h('div', { class: 'tile game', onclick: () => startGame(g) }, favBtn('game:' + g), h('span', { class: 'ti' }, ACT_META[g].icon), h('b', null, ACT_META[g].fr)))));

function startGame(g) {
  if (g === 'count' || g === 'colour' || g === 'move') return Nav.go('session', { id: 'free-' + g, free: true, steps: [{ type: g, n: g === 'move' ? 8 : 6 }] });
  if (g === 'sounds') return Nav.go('session', { id: 'free-sounds', free: true, steps: [{ type: 'sounds', keys: themeKeys('animals'), n: 8 }] });
  if (g === 'initial') return Nav.go('session', { id: 'free-initial', free: true, steps: [{ type: 'initial', keys: themeKeys('abc'), n: 8 }] });
  Nav.go('pickTheme', { game: g });
}
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
    scene.replaceChildren(h('span', { class: 'pop-in' }, pg.s));
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

/* ---------------- Pause (temps d'écran) ---------------- */
Screens.timeup = () => h('div', { class: 'screen timeup' },
  mascot('bloop', 'sleepy'), h('h2', null, "C'est l'heure de la pause !"),
  h('p', null, 'Bloop va dormir. On rejoue demain ! 🌙'),
  h('button', { class: 'btn ghost', onclick: () => parentGate(() => { Store.unlockToday(); Nav.reset('home'); }) }, '🔒 Parent : débloquer pour aujourd’hui'));

/* ---------------- Espace parents ---------------- */
Screens.parent = ({ tab = 'progress', pid }) => {
  const S = Store.settings();
  const tabs = h('div', { class: 'tabs' }, [['progress', '📊 Progrès'], ['settings', '⚙️ Réglages'], ['profiles', '👧 Profils']].map(([k, t]) =>
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
      toggle('frInstr', 'Consignes en français', 'Sinon, tout est en anglais (immersion)'),
      toggle('showText', 'Afficher les mots écrits', 'Utile quand l’enfant commence à lire'),
      toggle('mic', 'Micro (exercices de prononciation)', 'Tolérant : l’enfant n’est jamais bloqué'),
      toggle('sfx', 'Petits sons', ''),
      setRow("Temps d'écran par jour", h('div', { class: 'segs wrap' }, [0, 10, 15, 20, 30, 45, 60].map(v => seg('limitMin', v, v ? v + ' min' : 'Illimité')))),
      h('div', { class: 'row gap wrap' },
        h('button', { class: 'btn', onclick: () => Voice.say('Hello! I am Bloop. Let’s learn English!') }, '🔊 Tester la voix anglaise'),
        h('button', { class: 'btn', onclick: () => Voice.say('Bonjour, je suis Bloop !', 'fr') }, '🔊 Voix française'),
        Mic.available() ? h('button', { class: 'btn', onclick: micTest }, '🎤 Tester le micro') : null,
        NATIVE ? h('button', { class: 'btn ghost', onclick: () => window.Android.openTtsSettings() }, 'Réglages des voix Android') : null),
      (!ts.en || !ts.fr) ? h('p', { class: 'warn' }, `⚠️ Voix ${!ts.en ? 'anglaise' : 'française'} absente : installe-la dans « Réglages des voix Android » (Google Speech Services).`) : null,
      h('p', { class: 'muted small' }, 'Tout est gratuit, sans publicité, et les données restent sur ce téléphone.'));
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
function confirmBox(msg, ok) {
  modal([h('p', null, msg), h('div', { class: 'row gap center' }, h('button', { class: 'btn danger', onclick: () => { closeModal(); ok(); } }, 'Oui'), h('button', { class: 'btn ghost', onclick: closeModal }, 'Annuler'))]);
}
