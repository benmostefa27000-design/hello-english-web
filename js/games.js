/* Les activités (jeux) et le moteur de séance */
'use strict';

const STOP = new Error('stop');
const items = keys => keys.map(k => ITEM[k]).filter(Boolean);
const keyOf = it => it.theme + ':' + it.id;

// mots à travailler en priorité : les moins maîtrisés d'abord
function prioritized(keys) {
  return shuffle(keys).sort((a, b) => Store.level(a) - Store.level(b));
}
// distracteurs : mêmes thèmes, différents du mot cible
function options(target, pool, n) {
  const others = shuffle(pool.filter(k => k !== target && ITEM[k].e !== ITEM[target].e));
  if (others.length < n - 1) {
    const t = ITEM[target].theme;
    const extra = shuffle(Object.keys(ITEM).filter(k => k.startsWith(t + ':') && k !== target && !others.includes(k)));
    others.push(...extra);
  }
  return shuffle([target, ...others.slice(0, n - 1)]);
}
// file d'attente de cibles : on fait tourner les mots, en commençant par les plus fragiles
function targets(keys, n) { const out = []; let q = []; while (out.length < n) { if (!q.length) q = prioritized(keys); out.push(q.shift()); } return out; }

function choiceGrid(keys, onTap, cls = '') {
  const grid = h('div', { class: 'choices n' + keys.length + ' ' + cls });
  keys.forEach(k => {
    const it = ITEM[k];
    const b = h('button', { class: 'choice', 'data-key': k }, visual(it));
    b.addEventListener('click', () => onTap(k, b));
    grid.append(b);
  });
  return grid;
}
function waitClick(el) { return new Promise(r => el.addEventListener('click', r, { once: true })); }

/* ---------------- Activités ---------------- */
const ACTIVITIES = {

  /* 🔍 Découvrir : carte + voix */
  async discover(api, cfg) {
    const list = items(cfg.keys);
    await api.instr('Écoute et répète !', 'Listen and repeat!');
    for (let i = 0; i < list.length; i++) {
      api.check();
      const it = list[i];
      const isAbc = it.theme === 'abc';
      const sayIt = async () => {
        await api.say(spoken(it));
        await sleep(350);
        if (isAbc) await api.say(`${spoken(it)} is for ${it.ex}.`);
        else if (sentence(it) !== spoken(it)) await api.say(sentence(it));
      };
      const card = h('div', { class: 'card discover pop-in' },
        visual(it, 'xl'),
        isAbc ? h('div', { class: 'ex' }, h('span', { class: 'exE' }, it.exE), ' ', it.ex) : null,
        Store.settings().showText ? h('div', { class: 'word' }, it.en) : null,
        h('button', { class: 'fr-chip', onclick: () => api.say(it.fr, 'fr') }, '🇫🇷 ', it.fr));
      const next = h('button', { class: 'btn big go' }, i === list.length - 1 ? 'Fini ! ✔' : 'Suivant ➜');
      const rep = h('button', { class: 'round big', onclick: sayIt }, '🔊');
      // prononciation juste → on passe tout seul au mot suivant
      let advance; const spokenOk = new Promise(r => advance = r);
      const micBtn = Mic.available() ? h('button', { class: 'round big mic', onclick: async () => {
        if (micBtn.classList.contains('listening')) return;
        if (await api.tryVoice(spoken(it), micBtn, keyOf(it))) { card.classList.add('said'); await sleep(300); advance(); }
      } }, '🎤') : null;
      api.stage.replaceChildren(card, h('div', { class: 'row center' }, rep, micBtn), next);
      card.addEventListener('click', e => { if (e.target === card || e.target.classList.contains('vis') || e.target.closest('.vis')) sayIt(); });
      Store.mark(keyOf(it), null);
      await sayIt();
      api.progress((i + 1) / list.length);
      await Promise.race([waitClick(next), spokenOk]);
      Voice.stop();
    }
  },

  /* 👂 Écoute et touche */
  async listen(api, cfg) {
    const pool = cfg.keys, n = cfg.n || 5;
    // difficulté adaptée : 2 choix si les mots sont nouveaux et fragiles, jusqu'à 4 quand ils sont bien connus
    const avgLvl = pool.reduce((a, k) => a + Store.level(k), 0) / Math.max(1, pool.length);
    const nOpt = cfg.opts || Math.min(pool.length, avgLvl >= 2 ? 4 : avgLvl >= 1 ? 3 : 2);
    const phrase = cfg.phrase; // ex. "Touch your {w}!"
    const say = it => phrase ? phrase.replace('{w}', spoken(it)).replace('{a} ', it.a ? it.a + ' ' : '') : spoken(it);
    await api.instr(cfg.fr || 'Écoute et touche la bonne image.', cfg.en || 'Listen and touch!');
    const ts = targets(pool, n);
    for (let r = 0; r < ts.length; r++) {
      api.check();
      const tKey = ts[r], it = ITEM[tKey];
      let first = true, solved = false;
      const rep = h('button', { class: 'round big', onclick: () => api.say(say(it)) }, '🔊');
      const extra = cfg.feed ? mascot('bloop', 'feeder') : null;
      const grid = choiceGrid(options(tKey, pool, nOpt), async (k, b) => {
        if (solved) return;
        if (k === tKey) {
          solved = true; b.classList.add('right');
          if (extra) { extra.classList.add('eat'); }
          await api.good(tKey, first);
          done();
        } else {
          first = false; b.classList.add('wrong'); setTimeout(() => b.classList.remove('wrong'), 600);
          await api.bad(tKey); api.say(say(it));
        }
      });
      let done; const p = new Promise(r => done = r);
      api.stage.replaceChildren(extra || '', h('div', { class: 'prompt' }, rep), grid);
      await api.say(say(it));
      await p; api.progress((r + 1) / ts.length); await sleep(500);
    }
  },

  /* ✅❌ Vrai ou faux */
  async tf(api, cfg) {
    const pool = cfg.keys, n = cfg.n || 4;
    await api.instr("C'est vrai ou c'est faux ?", 'True or false?');
    const ts = targets(pool, n);
    for (let r = 0; r < ts.length; r++) {
      api.check();
      const shown = ITEM[ts[r]];
      const truth = Math.random() < 0.5;
      const saidKey = truth ? ts[r] : options(ts[r], pool, 2).find(k => k !== ts[r]);
      const said = ITEM[saidKey];
      const phrase = sentence(said);
      let resolve; const p = new Promise(r => resolve = r);
      const answer = async (yes, b) => {
        if (b.disabled) return; [yesB, noB].forEach(x => x.disabled = true);
        if (yes === truth) { b.classList.add('right'); await api.good(ts[r], true); }
        else { b.classList.add('wrong'); await api.bad(ts[r]); await api.say(truth ? phrase : sentence(shown)); }
        resolve();
      };
      const yesB = h('button', { class: 'tf yes', onclick: e => answer(true, e.currentTarget) }, '👍');
      const noB = h('button', { class: 'tf no', onclick: e => answer(false, e.currentTarget) }, '👎');
      api.stage.replaceChildren(h('div', { class: 'card pop-in' }, visual(shown, 'xl')),
        h('div', { class: 'prompt' }, h('button', { class: 'round big', onclick: () => api.say(phrase) }, '🔊')),
        h('div', { class: 'row center gap' }, yesB, noB));
      await api.say(phrase);
      await p; api.progress((r + 1) / ts.length); await sleep(600);
    }
  },

  /* 🧠 Memory */
  async memory(api, cfg) {
    const chosen = shuffle(cfg.keys).slice(0, cfg.pairs || Math.min(6, cfg.keys.length));
    await api.instr('Retrouve les paires !', 'Find the pairs!');
    const deck = shuffle([...chosen, ...chosen]);
    const grid = h('div', { class: 'memory c' + (deck.length > 8 ? 4 : 3) });
    let open = [], found = 0, lock = false, resolve;
    const p = new Promise(r => resolve = r);
    deck.forEach(k => {
      const c = h('button', { class: 'mcard', 'data-key': k }, h('div', { class: 'back' }, '?'), h('div', { class: 'front' }, visual(ITEM[k])));
      c.addEventListener('click', async () => {
        if (lock || c.classList.contains('open')) return;
        c.classList.add('open'); Sfx.flip(); api.say(spoken(ITEM[k]));
        open.push({ k, c });
        if (open.length === 2) {
          lock = true;
          const [a, b] = open; open = [];
          await sleep(800);
          if (a.k === b.k) { a.c.classList.add('found'); b.c.classList.add('found'); found++; Sfx.good(); Store.mark(a.k, true); api.progress(found / chosen.length); if (found === chosen.length) resolve(); }
          else { a.c.classList.remove('open'); b.c.classList.remove('open'); }
          lock = false;
        }
      });
      grid.append(c);
    });
    api.stage.replaceChildren(grid);
    await p; api.check();
    await api.say(pick(PRAISE)); cheer(api.mascot);
  },

  /* 🫧 Bulles */
  async bubbles(api, cfg) {
    const pool = cfg.keys, n = cfg.n || 5;
    await api.instr('Éclate la bonne bulle !', 'Pop the right bubble!');
    const ts = targets(pool, n);
    for (let r = 0; r < ts.length; r++) {
      api.check();
      const tKey = ts[r], it = ITEM[tKey];
      const field = h('div', { class: 'bubbles' });
      const keys = shuffle([tKey, tKey, ...options(tKey, pool, 4).filter(k => k !== tKey)]);
      let first = true, resolve; const p = new Promise(r => resolve = r);
      keys.forEach((k, i) => {
        const b = h('button', { class: 'bubble', 'data-key': k, style: { left: (6 + i * (82 / keys.length)) + '%', animationDuration: (7 + Math.random() * 4) + 's', animationDelay: (-Math.random() * 6) + 's' } }, visual(ITEM[k]));
        b.addEventListener('click', async () => {
          if (b.classList.contains('popped')) return;
          if (k === tKey) { b.classList.add('popped'); Sfx.pop(); await api.good(tKey, first, false); resolve(); }
          else { first = false; b.classList.add('wrong'); setTimeout(() => b.classList.remove('wrong'), 500); await api.bad(tKey); }
        });
        field.append(b);
      });
      const rep = h('button', { class: 'round big', onclick: () => api.say(`Pop the ${spoken(it)}!`) }, '🔊');
      api.stage.replaceChildren(h('div', { class: 'prompt' }, rep), field);
      await api.say(`Pop the ${spoken(it)}!`);
      await p; api.progress((r + 1) / ts.length); await sleep(400);
    }
  },

  /* 🎤 Je parle */
  async speak(api, cfg) {
    const ts = targets(cfg.keys, cfg.n || 3);
    const micOK = Mic.available() && await Mic.ensurePermission();
    await api.instr(micOK ? 'À toi de parler ! Appuie sur le micro et dis le mot.' : 'À toi ! Répète le mot à voix haute.', 'Your turn! Say it!');
    for (let r = 0; r < ts.length; r++) {
      api.check();
      const it = ITEM[ts[r]];
      const card = h('div', { class: 'card pop-in' }, visual(it, 'xl'), Store.settings().showText ? h('div', { class: 'word' }, it.en) : null);
      const rep = h('button', { class: 'round big', onclick: () => api.say(spoken(it)) }, '🔊');
      const act = micOK ? h('button', { class: 'mic-big' }, '🎤') : h('button', { class: 'btn big go' }, "Je l'ai dit ! 🗣️");
      const note = h('div', { class: 'note' });
      api.stage.replaceChildren(card, h('div', { class: 'row center' }, rep), act, note);
      await api.say(spoken(it));
      if (!micOK) { await waitClick(act); await api.good(ts[r], true); api.progress((r + 1) / ts.length); continue; }
      let tries = 0;
      for (;;) {
        await waitClick(act); api.check();
        const res = await api.listenFor(spoken(it), act);
        api.check();
        if (res.ok) { await api.good(ts[r], tries === 0); break; }
        tries++;
        if (tries >= 2) { note.textContent = ''; Sfx.star(); await api.say("Good try!"); Store.mark(ts[r], null); break; }
        note.textContent = res.silent ? "Je n'ai rien entendu… parle plus fort !" : 'Presque ! Écoute et réessaie.';
        if (res.silent) await Voice.say("Je n'ai rien entendu. Parle un peu plus fort !", 'fr'); else await api.say(spoken(it));
      }
      api.progress((r + 1) / ts.length); await sleep(400);
    }
  },

  /* 🔢 Compte */
  async count(api, cfg) {
    const n = cfg.n || 5;
    const things = ['🍎', '🐱', '⭐', '🦆', '🎈', '🐟', '🍓', '🚗', '🌸', '🐞'];
    await api.instr('Compte et touche le bon nombre.', 'Count!');
    let prev = 0;
    for (let r = 0; r < n; r++) {
      api.check();
      let num; do { num = 1 + Math.floor(Math.random() * 10); } while (num === prev); prev = num;
      const tKey = 'numbers:n' + num, e = pick(things);
      const pile = h('div', { class: 'pile' }, Array.from({ length: num }, () => h('span', null, e)));
      let first = true, resolve; const p = new Promise(r => resolve = r);
      const grid = choiceGrid(options(tKey, Object.keys(ITEM).filter(k => k.startsWith('numbers:') && Math.abs(ITEM[k].n - num) <= 3), 3), async (k, b) => {
        api.say(spoken(ITEM[k]));
        if (k === tKey) { b.classList.add('right'); await sleep(500); await api.good(tKey, first); resolve(); }
        else { first = false; b.classList.add('wrong'); setTimeout(() => b.classList.remove('wrong'), 600); await api.bad(tKey); }
      }, 'nums');
      api.stage.replaceChildren(h('div', { class: 'card' }, pile), grid);
      await api.say('How many?');
      await p; api.progress((r + 1) / n); await sleep(400);
    }
  },

  /* 🎨 Colorie */
  async colour(api, cfg) {
    const shapes = ['circle', 'square', 'triangle', 'star', 'heart'];
    const cols = shuffle(['red', 'blue', 'green', 'yellow', 'orange', 'pink', 'purple', 'brown']).slice(0, 6);
    const n = cfg.n || 5;
    await api.instr('Écoute bien, choisis la couleur, puis touche la forme.', 'Listen and colour!');
    const orders = shuffle(shapes).slice(0, n).map((s, i) => ({ shape: s, col: cols[i % cols.length] }));
    let current = null;
    const pal = h('div', { class: 'palette' });
    cols.forEach(c => {
      const it = ITEM['colours:' + c];
      const b = h('button', { class: 'pcol', 'data-c': c, style: { background: it.c } });
      b.addEventListener('click', () => { pal.querySelectorAll('.pcol').forEach(x => x.classList.remove('sel')); b.classList.add('sel'); current = c; api.say(it.en); });
      pal.append(b);
    });
    const board = h('div', { class: 'board' });
    const els = {};
    shapes.forEach(s => { const el = h('button', { class: 'sh', 'data-s': s, html: shapeSVG(s, '#FFFFFF') }); els[s] = el; board.append(el); });
    const rep = h('button', { class: 'round big' }, '🔊');
    api.stage.replaceChildren(h('div', { class: 'prompt' }, rep), board, pal);
    for (let r = 0; r < orders.length; r++) {
      api.check();
      const o = orders[r];
      const phrase = `Colour the ${o.shape} ${o.col}.`;
      rep.onclick = () => api.say(phrase);
      let first = true, resolve; const p = new Promise(r => resolve = r);
      shapes.forEach(s => els[s].onclick = async () => {
        if (els[s].classList.contains('done')) return;
        if (!current) { api.say(Store.settings().frInstr ? "Choisis d'abord une couleur en bas !" : 'Choose a colour first!', Store.settings().frInstr ? 'fr' : 'en'); return; }
        if (s === o.shape && current === o.col) {
          els[s].innerHTML = shapeSVG(s, ITEM['colours:' + current].c); els[s].classList.add('done');
          Store.mark('shapes:' + s, true); await api.good('colours:' + o.col, first); resolve();
        } else {
          first = false; els[s].classList.add('wrong'); setTimeout(() => els[s].classList.remove('wrong'), 500);
          await api.bad(s !== o.shape ? 'shapes:' + o.shape : 'colours:' + o.col); api.say(phrase);
        }
      });
      await api.say(phrase);
      await p; api.progress((r + 1) / orders.length); await sleep(300);
    }
  },

  /* 🐮 Qui fait ce bruit ? */
  async sounds(api, cfg) {
    const pool = cfg.keys.filter(k => ITEM[k].snd);
    await api.instr('Écoute le cri. Quel animal fait ça ?', 'Who says that?');
    const ts = targets(pool, cfg.n || 5);
    for (let r = 0; r < ts.length; r++) {
      api.check();
      const it = ITEM[ts[r]];
      let first = true, resolve; const p = new Promise(r => resolve = r);
      const grid = choiceGrid(options(ts[r], pool, 3), async (k, b) => {
        if (k === ts[r]) { b.classList.add('right'); await api.good(ts[r], first, false); await api.say(`Yes! The ${it.en} says ${it.snd.toLowerCase()}`); resolve(); }
        else { first = false; b.classList.add('wrong'); setTimeout(() => b.classList.remove('wrong'), 600); await api.bad(ts[r]); api.say(ITEM[k].en); }
      });
      const rep = h('button', { class: 'round big', onclick: () => api.say(`Who says ${it.snd}`) }, '🔊');
      api.stage.replaceChildren(h('div', { class: 'prompt' }, rep), grid);
      await api.say(`Who says ${it.snd}`);
      await p; api.progress((r + 1) / ts.length); await sleep(400);
    }
  },

  /* 🔤 Par quelle lettre ça commence ? */
  async initial(api, cfg) {
    const pool = cfg.keys;
    await api.instr('Par quelle lettre commence ce mot ?', 'What letter is it?');
    const ts = targets(pool, cfg.n || 5);
    for (let r = 0; r < ts.length; r++) {
      api.check();
      const it = ITEM[ts[r]];
      let first = true, resolve; const p = new Promise(r => resolve = r);
      const grid = choiceGrid(options(ts[r], pool, 3), async (k, b) => {
        api.say(spoken(ITEM[k]));
        if (k === ts[r]) { b.classList.add('right'); await sleep(400); await api.good(ts[r], first, false); await api.say(`${spoken(it)} is for ${it.ex}!`); resolve(); }
        else { first = false; b.classList.add('wrong'); setTimeout(() => b.classList.remove('wrong'), 600); await api.bad(ts[r]); }
      });
      const rep = h('button', { class: 'round big', onclick: () => api.say(it.ex) }, '🔊');
      api.stage.replaceChildren(h('div', { class: 'card pop-in' }, h('div', { class: 'vis emoji xl' }, it.exE)), h('div', { class: 'prompt' }, rep), grid);
      await api.say(it.ex);
      await p; api.progress((r + 1) / ts.length); await sleep(400);
    }
  },

  /* 💃 Bouge avec Bloop */
  async move(api, cfg) {
    const list = shuffle(MOVES).slice(0, cfg.n || 8);
    await api.instr('Lève-toi ! On bouge avec Bloop. Écoute et fais comme lui !', "Stand up! Let's move!");
    const big = mascot('bloop', 'dance');
    for (let i = 0; i < list.length; i++) {
      api.check();
      const m = list[i];
      const timer = h('div', { class: 'timer' }, h('i'));
      api.stage.replaceChildren(big, h('div', { class: 'move-e pop-in' }, m.e), h('div', { class: 'word' }, m.en),
        h('button', { class: 'fr-chip', onclick: () => api.say(m.fr, 'fr') }, '🇫🇷 ', m.fr), timer);
      await api.say(m.en, 'en', { rate: 1.05 });
      Sfx.beat(8, 120);
      timer.firstChild.style.animation = 'shrink 4s linear forwards';
      await sleep(4000);
      api.progress((i + 1) / list.length);
    }
    Store.countMoves();
    await api.say('Great dancing! Well done!');
  },

  /* ✍️ Trace la lettre avec le doigt */
  async trace(api, cfg) {
    const letters = cfg.letters || shuffle('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')).slice(0, cfg.n || 3);
    const lower = !!cfg.lower;
    await api.instr('Suis la lettre avec ton doigt !', 'Trace the letter!');
    for (let r = 0; r < letters.length; r++) {
      api.check();
      const it = ITEM['abc:l' + letters[r]];
      const glyph = lower ? letters[r].toLowerCase() : letters[r];
      const pad = new TracePad(glyph);
      let resolve; const p = new Promise(r => resolve = r);
      const sayIt = () => api.say(`${spoken(it)}. ${it.ph}, ${it.ph}, ${it.ex}.`);
      const clear = h('button', { class: 'round', 'aria-label': 'Effacer', onclick: () => pad.clear() }, '🧽');
      const rep = h('button', { class: 'round', 'aria-label': 'Écouter', onclick: sayIt }, '🔊');
      const hint = h('div', { class: 'ex' }, h('span', { class: 'exE' }, it.exE), ' ', it.ex);
      pad.onStroke = async () => {
        const res = pad.score();
        if (res.ok) {
          pad.lock(); pad.celebrate(); Sfx.good(); cheer(api.mascot); Store.mark(keyOf(it), true);
          await api.say(`${spoken(it)}! ${it.ph}, ${it.ph}, ${it.ex}!`); resolve();
        } else if (res.tooMessy) { Sfx.bad(); toast('Reste bien sur la lettre 🙂'); pad.clear(); }
      };
      api.stage.replaceChildren(hint, pad.el, h('div', { class: 'row center gap' }, rep, clear));
      await sayIt();
      await p; api.progress((r + 1) / letters.length); await sleep(500);
    }
  },

  /* 🔉 Le son des lettres : quel mot commence par ce son ? */
  async phonics(api, cfg) {
    const pool = cfg.keys || themeKeys('abc');
    await api.instr('Écoute le son. Quel mot commence par ce son ?', 'Listen to the sound!');
    const ts = targets(pool, cfg.n || 5);
    for (let r = 0; r < ts.length; r++) {
      api.check();
      const it = ITEM[ts[r]];
      const opts = options(ts[r], pool, 3);
      let first = true, resolve; const p = new Promise(r => resolve = r);
      const prompt = () => api.say(`${it.ph}… ${it.ph}…`, 'en', { rate: 0.8 });
      const grid = h('div', { class: 'choices n3' }, opts.map(k => {
        const o = ITEM[k];
        const b = h('button', { class: 'choice' }, h('div', { class: 'vis emoji' }, o.exE));
        b.addEventListener('click', async () => {
          if (k === ts[r]) {
            b.classList.add('right'); b.append(h('b', { class: 'cap-letter' }, o.en));
            await api.good(ts[r], first, false); await api.say(`${it.ph}, ${it.ph}, ${it.ex}!`); resolve();
          } else { first = false; b.classList.add('wrong'); setTimeout(() => b.classList.remove('wrong'), 600); await api.bad(ts[r]); await api.say(o.ex); }
        });
        return b;
      }));
      api.stage.replaceChildren(h('div', { class: 'card pop-in' }, h('div', { class: 'vis big letter xl' }, '?'), h('div', { class: 'word' }, '🔉')),
        h('div', { class: 'prompt' }, h('button', { class: 'round big', onclick: prompt }, '🔊')), grid);
      await prompt();
      await p; api.progress((r + 1) / ts.length); await sleep(400);
    }
  },

  /* 📖 Je lis un petit mot : son par son, puis le mot entier */
  async readword(api, cfg) {
    const list = shuffle(READ_WORDS).slice(0, cfg.n || 4);
    await api.instr('Touche chaque lettre pour entendre son son, puis lis le mot !', 'Sound it out!');
    for (let r = 0; r < list.length; r++) {
      api.check();
      const W = list[r];
      const phOf = ch => (ITEM['abc:l' + ch.toUpperCase()] || {}).ph || ch;
      const tiles = h('div', { class: 'read-tiles' }, W.w.split('').map(ch => {
        const t = h('button', { class: 'read-tile' }, ch);
        t.addEventListener('click', () => { t.classList.remove('lit'); void t.offsetWidth; t.classList.add('lit'); Voice.stop(); api.say(phOf(ch), 'en', { rate: 0.8 }); });
        return t;
      }));
      const blend = async () => {
        const ts = tiles.querySelectorAll('.read-tile');
        for (let i = 0; i < ts.length; i++) { ts[i].classList.add('lit'); await api.say(phOf(W.w[i]), 'en', { rate: 0.8 }); }
        await sleep(200); await api.say(W.w);
      };
      const others = shuffle(READ_WORDS.filter(x => x.w !== W.w)).slice(0, 2);
      let first = true, resolve; const p = new Promise(r => resolve = r);
      const grid = h('div', { class: 'choices n3' }, shuffle([W, ...others]).map(o => {
        const b = h('button', { class: 'choice' }, h('div', { class: 'vis emoji' }, o.e));
        b.addEventListener('click', async () => {
          if (o === W) { b.classList.add('right'); Sfx.good(); cheer(api.mascot); Store.mark('read:' + W.w, first); await api.say(`${W.w}! ${pick(PRAISE)}`); resolve(); }
          else { first = false; b.classList.add('wrong'); setTimeout(() => b.classList.remove('wrong'), 600); Sfx.bad(); Store.mark('read:' + W.w, false); }
        });
        return b;
      }));
      api.stage.replaceChildren(tiles, h('div', { class: 'row center gap' }, h('button', { class: 'btn small go', onclick: blend }, '🔊 Lis avec moi')), grid);
      await blend();
      await p; api.progress((r + 1) / list.length); await sleep(400);
    }
  },
};

/* ---------------- Tablette à tracer (canvas) ---------------- */
class TracePad {
  constructor(glyph) {
    this.glyph = glyph; this.done = false;
    this.size = Math.min(320, window.innerWidth - 48);
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    const S = this.size * this.dpr;
    this.el = h('canvas', { class: 'trace-pad', width: S, height: S, style: { width: this.size + 'px', height: this.size + 'px' } });
    this.ctx = this.el.getContext('2d');
    this.user = document.createElement('canvas'); this.user.width = this.user.height = S;
    this.mask = document.createElement('canvas'); this.mask.width = this.mask.height = S;
    this.font = `900 ${Math.round(S * 0.78)}px Nunito, system-ui, sans-serif`;
    this.brush = S * 0.075;
    const m = this.mask.getContext('2d'); this.drawGlyph(m, '#000');
    this.render();
    let drawing = false, last = null;
    const pos = e => { const b = this.el.getBoundingClientRect(); return [(e.clientX - b.left) * this.dpr * (this.size / b.width), (e.clientY - b.top) * this.dpr * (this.size / b.height)]; };
    this.el.addEventListener('pointerdown', e => { if (this.done) return; drawing = true; last = pos(e); try { this.el.setPointerCapture(e.pointerId); } catch (x) {} this.line(last, last); });
    this.el.addEventListener('pointermove', e => { if (!drawing) return; const p = pos(e); this.line(last, p); last = p; });
    const end = () => { if (!drawing) return; drawing = false; if (this.onStroke) this.onStroke(); };
    this.el.addEventListener('pointerup', end); this.el.addEventListener('pointercancel', end);
  }
  drawGlyph(c, color) { c.font = this.font; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = color; c.fillText(this.glyph, this.user.width / 2, this.user.height * 0.53); }
  line(a, b) {
    const u = this.user.getContext('2d');
    u.strokeStyle = '#7B61FF'; u.lineWidth = this.brush; u.lineCap = u.lineJoin = 'round';
    u.beginPath(); u.moveTo(a[0], a[1]); u.lineTo(b[0], b[1]); u.stroke();
    this.render();
  }
  render(color) {
    const c = this.ctx, S = this.user.width;
    c.clearRect(0, 0, S, S);
    this.drawGlyph(c, color || '#E7E0F5');
    if (!color) c.drawImage(this.user, 0, 0);
  }
  clear() { if (this.done) return; this.user.getContext('2d').clearRect(0, 0, this.user.width, this.user.height); this.render(); }
  lock() { this.done = true; }
  celebrate() { this.render('#FF7A2F'); this.el.classList.add('pop-in'); }
  // part de la lettre recouverte, et part du tracé hors de la lettre (on reste tolérant)
  score() {
    const S = this.user.width, step = Math.max(3, Math.round(S / 90));
    const M = this.mask.getContext('2d').getImageData(0, 0, S, S).data;
    const U = this.user.getContext('2d').getImageData(0, 0, S, S).data;
    let inLetter = 0, covered = 0, drawn = 0, outside = 0;
    // le masque « élargi » : un point du tracé compte comme « sur la lettre » s'il en est proche
    const near = (x, y) => { const r = Math.round(this.brush * 0.6); for (const [dx, dy] of [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]]) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < S && Y < S && M[(Y * S + X) * 4 + 3] > 0) return true; } return false; };
    for (let y = 0; y < S; y += step) for (let x = 0; x < S; x += step) {
      const i = (y * S + x) * 4, m = M[i + 3] > 0, u = U[i + 3] > 0;
      if (m) { inLetter++; if (u) covered++; }
      if (u) { drawn++; if (!m && !near(x, y)) outside++; }
    }
    const cov = inLetter ? covered / inLetter : 0, out = drawn ? outside / drawn : 0;
    return { ok: cov >= 0.55 && out <= 0.35, tooMessy: drawn > inLetter * 0.6 && out > 0.5, cov, out };
  }
}

const ACT_META = {
  discover: { fr: 'Découvrir', icon: '🔍' }, listen: { fr: 'Écoute et touche', icon: '👂' }, tf: { fr: 'Vrai ou faux', icon: '👍' },
  memory: { fr: 'Memory', icon: '🧠' }, bubbles: { fr: 'Bulles', icon: '🫧' }, speak: { fr: 'Je parle', icon: '🎤' },
  count: { fr: 'Compte', icon: '🔢' }, colour: { fr: 'Colorie', icon: '🎨' }, sounds: { fr: 'Cris des animaux', icon: '🐮' },
  initial: { fr: 'Première lettre', icon: '🔤' }, move: { fr: 'Bouge !', icon: '💃' },
  trace: { fr: 'Trace les lettres', icon: '✍️' }, phonics: { fr: 'Le son des lettres', icon: '🔉' }, readword: { fr: 'Je lis', icon: '📖' },
};
