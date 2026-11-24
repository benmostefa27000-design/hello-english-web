/* Appli Android qui affiche la version en ligne :
   1) récupère une seule fois les progrès de l'ancienne version (avant le chargement de Store)
   2) propose d'installer une nouvelle version de l'APK quand il y en a une */
'use strict';

(function () {
  const A = window.Android;
  if (!A || !A.takeMigration || location.protocol === 'file:') return;
  let s = null;
  try { s = A.takeMigration(); } catch (e) { return; }
  if (!s) return;
  try {
    const o = JSON.parse(s);
    for (const k in o) {
      if (localStorage.getItem(k) == null) localStorage.setItem(k, o[k]);
      else if (k === 'helloenglish.v1') window.__pendingMerge = o[k]; // fusionné juste après Store
    }
    A.migrationDone();
  } catch (e) {}
})();

window.addEventListener('load', () => {
  const A = window.Android;
  if (!A || !A.appVersion || location.protocol === 'file:') return;
  fetch('apk.json', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(info => {
    if (!info || !(info.version > A.appVersion())) return;
    const url = new URL(info.url, location.href).href;
    const bar = document.createElement('div');
    bar.className = 'apk-update';
    bar.innerHTML = '<span>🎁 Nouvelle version de l’appli !</span><button type="button">Installer</button><button type="button" aria-label="Plus tard">✕</button>';
    const [install, later] = bar.querySelectorAll('button');
    install.onclick = () => { A.openExternal(url); bar.remove(); };
    later.onclick = () => bar.remove();
    document.body.appendChild(bar);
  }).catch(() => {});
});
