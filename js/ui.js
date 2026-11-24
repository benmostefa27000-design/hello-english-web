/* Outils d'interface : DOM, navigation, mascottes, visuels */
'use strict';

const Screens = {};

function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  if (attrs) for (const k in attrs) {
    const v = attrs[k];
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'html') el.innerHTML = v;
    else el.setAttribute(k, v);
  }
  for (const c of kids.flat(9)) if (c != null && c !== false) el.append(c.nodeType ? c : document.createTextNode(c));
  return el;
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = a => a[Math.floor(Math.random() * a.length)];
const fill = (s, p) => s.replace(/\{name\}/g, p.name || 'friend').replace(/\{age\}/g, NUM_WORDS[p.age] || 'six')
  .replace(/\{agefr\}/g, String(p.age || 6)).replace(/\{e\}/g, p.gender === 'm' ? '' : 'e');

/* ---------------- Navigation ---------------- */
const Nav = (() => {
  const stack = [];
  let current = null;
  function render(name, params) {
    if (current) { current.alive = false; current._c.forEach(f => { try { f(); } catch (e) {} }); }
    Voice.stop(); Mic.stop(); closeModal();
    const root = document.getElementById('app');
    const ctx = { _c: [], alive: true, name, params: params || {} };
    window.__navAt = performance.now();
    current = ctx;
    const el = Screens[name](ctx.params, ctx);
    root.replaceChildren(el);
    window.scrollTo(0, 0);
  }
  return {
    go(name, params) { stack.push({ name, params }); render(name, params); },
    replace(name, params) { stack.pop(); stack.push({ name, params }); render(name, params); },
    back() {
      if (stack.length <= 1) return false;
      stack.pop(); const s = stack[stack.length - 1]; render(s.name, s.params); return true;
    },
    home() { stack.length = 0; Nav.go('home'); },
    reset(name) { stack.length = 0; Nav.go(name); },
    get current() { return current; },
    onLeave(ctx, f) { ctx._c.push(f); },
  };
})();
window.appBack = () => (document.querySelector('.modal') ? (closeModal(), true) : Nav.back()) ? 'true' : 'false';

/* ---------------- Mascottes (dessins originaux) ---------------- */
function mascot(kind = 'bloop', cls = '') {
  if (kind === 'pip') return h('div', { class: 'mascot pip ' + cls, html: `
<svg viewBox="0 0 120 120"><defs><radialGradient id="pg" cx="40%" cy="35%"><stop offset="0" stop-color="#7FE3DA"/><stop offset="1" stop-color="#22A99C"/></radialGradient></defs>
<ellipse cx="60" cy="112" rx="30" ry="5" fill="#000" opacity=".1"/>
<path d="M20 70 Q8 60 16 48 Q26 58 30 66Z" fill="#1E9488"/><path d="M100 70 Q112 60 104 48 Q94 58 90 66Z" fill="#1E9488"/>
<circle cx="60" cy="64" r="44" fill="url(#pg)"/>
<path d="M50 14 Q60 2 66 16" stroke="#1E9488" stroke-width="5" fill="none" stroke-linecap="round"/>
<circle cx="45" cy="56" r="11" fill="#fff"/><circle cx="75" cy="56" r="11" fill="#fff"/>
<circle class="pupil" cx="47" cy="58" r="6" fill="#2B2340"/><circle class="pupil" cx="77" cy="58" r="6" fill="#2B2340"/>
<circle cx="49" cy="55" r="2" fill="#fff"/><circle cx="79" cy="55" r="2" fill="#fff"/>
<path class="mouth" d="M53 72 L67 72 L60 82Z" fill="#FFB020"/>
<circle cx="34" cy="74" r="6" fill="#FF8FB1" opacity=".55"/><circle cx="86" cy="74" r="6" fill="#FF8FB1" opacity=".55"/>
</svg>` });
  const el = bloopSVG(cls);
  // la tenue choisie dans la garde-robe
  const w = (typeof Store !== 'undefined' && Store.profile()) ? WARDROBE.find(x => x.id === Store.wearing()) : null;
  if (w) el.append(h('span', { class: 'outfit outfit-' + w.pos, 'aria-hidden': 'true' }, w.e));
  return el;
}
function bloopSVG(cls) {
  return h('div', { class: 'mascot bloop ' + cls, html: `
<svg viewBox="0 0 120 120"><defs><radialGradient id="bg1" cx="38%" cy="30%"><stop offset="0" stop-color="#FFC47A"/><stop offset="1" stop-color="#FF7A2F"/></radialGradient></defs>
<ellipse cx="60" cy="113" rx="32" ry="5" fill="#000" opacity=".1"/>
<line x1="60" y1="20" x2="60" y2="8" stroke="#FF7A2F" stroke-width="4" stroke-linecap="round"/><circle cx="60" cy="7" r="6" fill="#FFD447"/>
<path d="M14 72 Q12 22 60 20 Q108 22 106 72 Q104 108 60 108 Q16 108 14 72Z" fill="url(#bg1)"/>
<ellipse cx="44" cy="58" rx="12" ry="14" fill="#fff"/><ellipse cx="76" cy="58" rx="12" ry="14" fill="#fff"/>
<circle class="pupil" cx="46" cy="61" r="6.5" fill="#2B2340"/><circle class="pupil" cx="78" cy="61" r="6.5" fill="#2B2340"/>
<circle cx="48" cy="57" r="2.2" fill="#fff"/><circle cx="80" cy="57" r="2.2" fill="#fff"/>
<path class="mouth" d="M48 80 Q60 92 72 80" stroke="#2B2340" stroke-width="4" fill="none" stroke-linecap="round"/>
<circle cx="31" cy="78" r="7" fill="#FF5E7E" opacity=".45"/><circle cx="89" cy="78" r="7" fill="#FF5E7E" opacity=".45"/>
<path d="M20 92 Q8 96 10 84" stroke="#FF7A2F" stroke-width="7" fill="none" stroke-linecap="round"/>
<path d="M100 92 Q112 96 110 84" stroke="#FF7A2F" stroke-width="7" fill="none" stroke-linecap="round"/>
</svg>` });
}
async function mascotSay(m, promise) { m.classList.add('talk'); try { await promise; } finally { m.classList.remove('talk'); } }
function cheer(m) { if (!m) return; m.classList.remove('jump'); void m.offsetWidth; m.classList.add('jump'); }

/* ---------------- Visuels des mots ---------------- */
function shapeSVG(shape, fillC = '#FFC93C', stroke = '#3B2F4A') {
  const s = `fill="${fillC}" stroke="${stroke}" stroke-width="4" stroke-linejoin="round"`;
  const p = {
    circle: `<circle cx="50" cy="50" r="40" ${s}/>`,
    square: `<rect x="12" y="12" width="76" height="76" rx="6" ${s}/>`,
    triangle: `<path d="M50 10 L92 86 L8 86Z" ${s}/>`,
    star: `<path d="M50 6 L61 37 L94 38 L68 58 L77 90 L50 71 L23 90 L32 58 L6 38 L39 37Z" ${s}/>`,
    heart: `<path d="M50 88 C10 62 6 36 22 22 C34 12 46 18 50 30 C54 18 66 12 78 22 C94 36 90 62 50 88Z" ${s}/>`,
    rectangle: `<rect x="6" y="26" width="88" height="48" rx="6" ${s}/>`,
  }[shape];
  return `<svg viewBox="0 0 100 100">${p}</svg>`;
}
function visual(it, cls = '') {
  if (!it) return h('div');
  if (it.c) return h('div', { class: 'vis swatch ' + cls }, h('span', { style: { background: it.c } }));
  if (it.shape) return h('div', { class: 'vis shape ' + cls, html: shapeSVG(it.shape) });
  if (it.big) return h('div', { class: 'vis big ' + cls + (it.theme === 'abc' ? ' letter' : '') }, it.big);
  return h('div', { class: 'vis emoji ' + cls }, it.e);
}
// découpe une chaîne d'emojis en emojis entiers (y compris 👨‍👩‍👧‍👦)
function splitEmoji(s) {
  if (window.Intl && Intl.Segmenter) return Array.from(new Intl.Segmenter('fr', { granularity: 'grapheme' }).segment(s), x => x.segment).filter(x => x.trim());
  return Array.from(s).filter(x => x.trim() && x !== '‍' && x !== '️');
}
const spoken = it => it.say || it.en;
const label = it => it.theme === 'abc' ? `${it.en} – ${it.ex}` : it.en;
function sentence(it) {
  const t = THEMES.find(x => x.id === it.theme);
  if (!t || !t.tpl) return spoken(it);
  return t.tpl.replace('{w}', spoken(it)).replace('{a} ', it.a ? it.a + ' ' : '');
}

/* ---------------- Petits composants ---------------- */
function topBar(title, opts = {}) {
  return h('div', { class: 'topbar' },
    h('button', { class: 'round back', 'aria-label': 'Retour', onclick: () => opts.onBack ? opts.onBack() : (Nav.back() || Nav.home()) }, '←'),
    h('div', { class: 'tb-title' }, title),
    opts.right || h('div', { class: 'tb-stars' }, '⭐ ', String(Store.totalStars())));
}
function progressBar() { const bar = h('div', { class: 'pbar' }, h('i')); bar.set = f => bar.firstChild.style.width = Math.round(f * 100) + '%'; return bar; }

function confetti(n = 40) {
  const box = h('div', { class: 'confetti' });
  const cols = ['#FF7A2F', '#FFC93C', '#2EC4B6', '#7B61FF', '#FF5E7E', '#43A047'];
  for (let i = 0; i < n; i++) box.append(h('i', { style: { left: Math.random() * 100 + '%', background: pick(cols), animationDelay: Math.random() * 0.6 + 's', transform: `rotate(${Math.random() * 360}deg)` } }));
  document.body.append(box); setTimeout(() => box.remove(), 2600);
}
function toast(msg) { const t = h('div', { class: 'toast' }, msg); document.body.append(t); setTimeout(() => t.remove(), 2400); }

function modal(content, opts = {}) {
  closeModal();
  const m = h('div', { class: 'modal', onclick: e => { if (e.target === m && !opts.locked) closeModal(); } }, h('div', { class: 'sheet' }, content));
  document.body.append(m); return m;
}
function closeModal() { document.querySelectorAll('.modal').forEach(m => m.remove()); }

/* Barrière parentale : une multiplication que l'enfant de 6 ans ne sait pas faire */
function parentGate(onOk) {
  const a = 3 + Math.floor(Math.random() * 6), b = 4 + Math.floor(Math.random() * 6);
  let typed = '';
  const out = h('div', { class: 'gate-out' }, '…');
  const keys = h('div', { class: 'keypad' });
  const press = k => {
    if (k === '⌫') typed = typed.slice(0, -1); else if (typed.length < 3) typed += k;
    out.textContent = typed || '…';
    if (typed.length >= String(a * b).length) {
      if (Number(typed) === a * b) { closeModal(); onOk(); }
      else { out.classList.add('shake'); setTimeout(() => { out.classList.remove('shake'); typed = ''; out.textContent = '…'; }, 500); }
    }
  };
  ['1','2','3','4','5','6','7','8','9','⌫','0'].forEach(k => keys.append(h('button', { class: 'key', onclick: () => press(k) }, k)));
  modal([h('h3', null, 'Espace parents 🔒'), h('p', { class: 'muted' }, `Combien font ${a} × ${b} ?`), out, keys,
    h('button', { class: 'btn ghost', onclick: closeModal }, 'Annuler')]);
}
