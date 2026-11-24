/* Démarrage, temps d'écran, liens avec Android */
'use strict';

(function start() {
  // le premier toucher débloque le son (navigateurs)
  document.addEventListener('pointerdown', () => Sfx.unlock(), { once: true });

  // anti-appuis en rafale : double appui ignoré, et pas de clic juste après un changement d'écran
  const lastTap = new WeakMap();
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('button');
    if (!b || b.closest('.modal')) return;
    const t = performance.now();
    if (t - (window.__navAt || 0) < 400 || t - (lastTap.get(b) || 0) < 450) { e.stopImmediatePropagation(); e.preventDefault(); return; }
    lastTap.set(b, t);
  }, true);

  let paused = false;
  window.onAppPause = () => { paused = true; Voice.stop(); Mic.stop(); };
  window.onAppResume = () => { paused = false; checkTime(); };
  document.addEventListener('visibilitychange', () => document.hidden ? window.onAppPause() : window.onAppResume());

  function checkTime() {
    const cur = Nav.current;
    if (!Store.profile() || !cur) return;
    if (['timeup', 'parent', 'profileForm', 'who'].includes(cur.name)) return;
    if (Store.timeUp()) Nav.reset('timeup');
  }
  // compte le temps passé (par enfant, par jour)
  setInterval(() => {
    if (paused || document.hidden || !Store.profile()) return;
    const cur = Nav.current;
    if (cur && (cur.name === 'parent' || cur.name === 'timeup')) return;
    Store.addSeconds(10);
    checkTime();
  }, 10000);

  if (!Store.profiles().length) Nav.reset('profileForm');
  else if (Store.profiles().length > 1 || !Store.profile()) Nav.reset('who');
  else Nav.reset('home');
  checkTime();
})();
