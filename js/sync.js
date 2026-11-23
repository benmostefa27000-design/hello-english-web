/* Synchro automatique entre appareils (Firebase, projet personnel de la famille).
   - Un « code famille » secret relie les appareils : qui a le code voit les progrès.
   - On fusionne toujours (Store.merge) : on garde le meilleur des deux côtés, rien n'est effacé.
   - Sans réseau ou sans configuration, l'appli marche normalement, hors ligne. */
'use strict';

/* Réseau : sur Android on passe par l'appli (pas de blocage CORS), sinon fetch */
const Net = (() => {
  let seq = 0; const waiting = {};
  window.__http = (id, status, text) => { const w = waiting[id]; if (w) { delete waiting[id]; w({ status, text }); } };
  function request(method, url, headers = {}, body = '') {
    if (typeof window.Android !== 'undefined' && window.Android.http) {
      const id = 'h' + (++seq);
      return new Promise(res => { waiting[id] = res; window.Android.http(id, method, url, JSON.stringify(headers), body || ''); });
    }
    return fetch(url, { method, headers, body: body || undefined }).then(async r => ({ status: r.status, text: await r.text() }))
      .catch(e => ({ status: 0, text: String(e) }));
  }
  return { request };
})();

const Sync = (() => {
  const KEY = 'helloenglish.sync';
  let st; try { st = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { st = {}; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} };
  const cfg = () => (typeof FIREBASE_CONFIG !== 'undefined' && FIREBASE_CONFIG && FIREBASE_CONFIG.apiKey) ? FIREBASE_CONFIG : null;
  let busy = false, timer = null, listeners = [];

  const available = () => !!cfg();
  const enabled = () => available() && !!st.family;
  const family = () => st.family || null;
  const lastSync = () => st.last || 0;
  const status = () => st.status || '';
  const onChange = f => listeners.push(f);
  const emit = () => listeners.forEach(f => { try { f(); } catch (e) {} });

  // code famille : 4 groupes de 4 caractères faciles à recopier (sans 0/O ni 1/I)
  function newCode() {
    const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', r = new Uint8Array(16); crypto.getRandomValues(r);
    return Array.from(r, b => A[b % A.length]).join('').match(/.{4}/g).join('-');
  }
  const docId = code => code.replace(/[^A-Z0-9]/gi, '').toUpperCase();

  async function token() {
    if (st.token && st.exp > Date.now() + 60000) return st.token;
    const c = cfg();
    const url = st.refresh
      ? `https://securetoken.googleapis.com/v1/token?key=${c.apiKey}`
      : `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${c.apiKey}`;
    const body = st.refresh ? `grant_type=refresh_token&refresh_token=${encodeURIComponent(st.refresh)}` : JSON.stringify({ returnSecureToken: true });
    const r = await Net.request('POST', url, { 'Content-Type': st.refresh ? 'application/x-www-form-urlencoded' : 'application/json' }, body);
    if (r.status !== 200) { st.refresh = null; throw new Error('Connexion au service impossible (' + r.status + ')'); }
    const j = JSON.parse(r.text);
    st.token = j.idToken || j.id_token; st.refresh = j.refreshToken || j.refresh_token;
    st.exp = Date.now() + (Number(j.expiresIn || j.expires_in || 3600) * 1000); save();
    return st.token;
  }
  const docUrl = () => `https://firestore.googleapis.com/v1/projects/${cfg().projectId}/databases/(default)/documents/families/${docId(st.family)}`;

  async function pull() {
    const r = await Net.request('GET', docUrl(), { Authorization: 'Bearer ' + await token() });
    if (r.status === 404) return null;
    if (r.status !== 200) throw new Error('Lecture impossible (' + r.status + ')');
    const f = (JSON.parse(r.text).fields || {}).data;
    return f && f.stringValue ? JSON.parse(f.stringValue) : null;
  }
  async function push() {
    const body = JSON.stringify({ fields: { data: { stringValue: JSON.stringify(Store.exportData()) }, at: { integerValue: String(Date.now()) } } });
    const r = await Net.request('PATCH', docUrl(), { Authorization: 'Bearer ' + await token(), 'Content-Type': 'application/json' }, body);
    if (r.status !== 200) throw new Error('Envoi impossible (' + r.status + ')');
  }

  // une synchro complète : on récupère, on fusionne, on renvoie
  async function now() {
    if (!enabled() || busy) return false;
    busy = true; st.status = 'sync'; emit();
    try {
      const remote = await pull();
      if (remote) Store.merge(remote);
      await push();
      st.last = Date.now(); st.status = 'ok'; save(); emit(); return true;
    } catch (e) { st.status = 'err:' + e.message; save(); emit(); return false; }
    finally { busy = false; }
  }
  // après une activité : petite attente pour regrouper les envois
  function soon() { if (!enabled()) return; clearTimeout(timer); timer = setTimeout(now, 4000); }

  function start(code) { st.family = code; st.status = ''; save(); return now(); }
  function stop() { st.family = null; st.status = ''; save(); emit(); }

  // au lancement, au retour sur l'appli, et toutes les 10 minutes
  setTimeout(now, 2500);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) now(); });
  setInterval(now, 10 * 60 * 1000);

  return { available, enabled, family, lastSync, status, newCode, start, stop, now, soon, onChange };
})();
