/* ============================================================
   wr-config.jsx — owner ("Curator") configuration + realtime sync
   ------------------------------------------------------------
   CONFIG persists on the OWNER's device (localStorage) and seeds
   every fresh draft: draft year, paw weights, per-VP cap, the base
   duty pool + descriptions, first-pick rule, contacts directory,
   the Curator passcode, and the Firebase sync settings.

   WRFB = a tiny Firebase Realtime Database adapter. With a (free)
   Firebase config + room code pasted into Curator Mode, two VPs on
   DIFFERENT devices/networks share one live draft. With no config,
   the app silently falls back to same-device (cross-window) sync.
   ============================================================ */

const CFG_KEY = 'wr-config-v1';
let CONFIG = (() => { try { return JSON.parse(localStorage.getItem(CFG_KEY)) || {}; } catch { return {}; } })();
function cfgSave() { try { localStorage.setItem(CFG_KEY, JSON.stringify(CONFIG)); } catch {} }
window.WRC = {
  get: () => CONFIG,
  set: (patch) => { CONFIG = { ...CONFIG, ...patch }; cfgSave(); },
  // simple non-secret passcode check (deters, not secures — it's a club app)
  checkPass: (p) => !CONFIG.passcode || CONFIG.passcode === p,
  hasPass: () => !!CONFIG.passcode,
};

// ---------- Firebase Realtime DB adapter (lazy-loaded) ----------
const WRFB = (() => {
  let db = null, docRefFb = null, presRefFb = null, room = null;
  const SDK = ['https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js',
               'https://www.gstatic.com/firebasejs/10.7.1/firebase-database-compat.js'];
  function loadScript(src) {
    return new Promise((res, rej) => {
      if ([...document.scripts].some((s) => s.src === src)) return res();
      const el = document.createElement('script'); el.src = src; el.onload = res; el.onerror = rej;
      document.head.appendChild(el);
    });
  }
  async function loadSDK() {
    if (window.firebase && window.firebase.database) return;
    for (const s of SDK) await loadScript(s);
  }
  async function connect(config, roomCode, handlers) {
    await loadSDK();
    try { window.firebase.apps.length ? window.firebase.app() : window.firebase.initializeApp(config); }
    catch (e) { /* already initialized */ }
    db = window.firebase.database(); room = String(roomCode).trim().toUpperCase();
    docRefFb = db.ref('rooms/' + room + '/doc');
    presRefFb = db.ref('rooms/' + room + '/presence');
    docRefFb.on('value', (snap) => { const v = snap.val(); if (v && handlers.onDoc) handlers.onDoc(v); });
    presRefFb.on('value', (snap) => { if (handlers.onPresence) handlers.onPresence(snap.val() || {}); });
    return {
      push: (doc) => { try { docRefFb && docRefFb.set(doc); } catch (e) {} },
      beat: (role) => {
        if (!role || role === 'view' || !db) return;
        try { const p = db.ref('rooms/' + room + '/presence/' + role); p.set(Date.now()); p.onDisconnect().remove(); } catch (e) {}
      },
      room,
    };
  }
  return { connect };
})();
window.WRFB = WRFB;
