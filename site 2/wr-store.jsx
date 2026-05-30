/* ============================================================
   wr-store.jsx — synced state store + sync + sounds + UI primitives
   Exposes: useDraft (hook via <DraftProvider>), and UI bits:
     Emblem, PawIcon, Paws, CatTag, VPBadge, ThemeBar, Sounds
   Cross-window sync: BroadcastChannel mirrors the doc; localStorage
   persists it (save progress). Presence rides a lightweight beat.
   myRole is per-TAB (sessionStorage) so two windows are two VPs.
   ============================================================ */

const DOC_KEY  = 'wr-doc-v1';
const ROLE_KEY = 'wr-myrole';
const CHAN     = 'wr-duty-draft';

// ---------- sounds (WebAudio, lazy; user-gesture safe) ----------
const Sounds = (() => {
  let ctx = null;
  const on = () => (localStorage.getItem('wr-sound') ?? 'on') === 'on';
  const ac = () => (ctx = ctx || new (window.AudioContext || window.webkitAudioContext)());
  const ping = (t, f, dur, type, g) => {
    const c = ac(); const o = c.createOscillator(); const v = c.createGain();
    o.type = type || 'triangle'; o.frequency.setValueAtTime(f, t);
    v.gain.setValueAtTime(0, t); v.gain.linearRampToValueAtTime(g ?? 0.12, t + 0.005);
    v.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    o.connect(v); v.connect(c.destination); o.start(t); o.stop(t + dur);
  };
  // short filtered-noise burst (whoosh / spin air)
  const noise = (t, dur, freq, q, g) => {
    const c = ac(); const len = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate); const ch = buf.getChannelData(0);
    for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource(); src.buffer = buf;
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = freq; bp.Q.value = q || 1;
    const vg = c.createGain(); vg.gain.value = g || 0.08;
    src.connect(bp); bp.connect(vg); vg.connect(c.destination); src.start(t); src.stop(t + dur);
  };
  return {
    set: (v) => localStorage.setItem('wr-sound', v ? 'on' : 'off'),
    isOn: on,
    // tumbling coin across `dur` ms, then a two-tone metallic landing clink
    flip(dur = 2200) {
      if (!on()) return; const c = ac(); const t0 = c.currentTime; const D = dur / 1000;
      noise(t0, 0.22, 900, 0.8, 0.06);                         // toss whoosh
      const N = 20;
      for (let i = 0; i < N; i++) {                            // spin ticks (fast → slow)
        const f = i / N; const t = t0 + 0.12 + Math.pow(f, 1.4) * D * 0.82;
        ping(t, 2200 + Math.random() * 1100, 0.035, 'square', 0.03);
      }
      const tl = t0 + D * 0.93;                                // landing clink
      noise(tl, 0.05, 4000, 1.5, 0.05);
      ping(tl, 2350, 0.5, 'triangle', 0.18); ping(tl, 3140, 0.42, 'sine', 0.10);
      ping(tl + 0.015, 1640, 0.55, 'triangle', 0.11);
    },
    pick() {           // short broadcast stinger
      if (!on()) return; const c = ac(); const t = c.currentTime;
      ping(t, 520, 0.12, 'sawtooth', 0.10); ping(t + 0.09, 760, 0.14, 'sawtooth', 0.10);
      ping(t + 0.2, 1040, 0.28, 'square', 0.07);
    },
    chat() { if (!on()) return; ping(ac().currentTime, 660, 0.08, 'sine', 0.06); },
    trade() { if (!on()) return; const t = ac().currentTime; ping(t, 600, 0.1, 'triangle', 0.08); ping(t + 0.1, 900, 0.16, 'triangle', 0.08); },
    blip() { if (!on()) return; ping(ac().currentTime, 880, 0.09, 'triangle', 0.07); },
  };
})();

// ---------- pure reducer over the synced doc ----------
function freshDoc() {
  const cfg = (window.WRC && window.WRC.get()) || {};
  const pool = Array.isArray(cfg.pool) && cfg.pool.length ? cfg.pool : WR.SEED_ITEMS;
  const fp = cfg.firstPick || 'toss';
  return {
    rev: 0, phase: 'signin',
    names: { day: '', eve: '' },
    toss: { result: null, flipping: false, seed: 0 },
    turn: fp === 'eve' ? 'eve' : 'day',
    firstPick: fp,
    year: cfg.year || "'26",
    capPaws: cfg.capDefault || WR.suggestedCap,
    showChart: cfg.showChart !== undefined ? cfg.showChart : true,
    showPhotos: cfg.showPhotos !== undefined ? cfg.showPhotos : false,
    collabOn: cfg.collabOn !== undefined ? cfg.collabOn : false,
    collab: {},                 // issueId -> [roles] supporting (besides owner)
    vpPhotos: cfg.vpPhotos ? { ...cfg.vpPhotos } : { day: null, eve: null },
    items: pool.map((i) => ({ ...i })),
    contacts: cfg.contacts ? JSON.parse(JSON.stringify(cfg.contacts)) : {},
    owners: {},                 // itemId -> 'day'|'eve'|'shared'
    pickOrder: [],
    done: { day: false, eve: false },
    pending: null,              // { issueId, by } -> committee offer in progress
    log: [],
    trades: [],                 // { id, from, to, give:[ids], get:[ids], status, ts }
    chat: [],                   // { by, text, ts, sys? }
    ready: { day: false, eve: false }, // both true -> phase 'final'
  };
}
const loadDoc = () => {
  try {
    const d = JSON.parse(localStorage.getItem(DOC_KEY));
    return d && d.items ? migrate(d) : freshDoc();
  } catch { return freshDoc(); }
};
// Backfill fields added in later versions so an old persisted/peer doc can't crash newer code.
function migrate(d) {
  const base = freshDoc();
  const m = { ...base, ...d };
  ['toss', 'names', 'done', 'ready'].forEach((k) => { m[k] = { ...base[k], ...(d[k] || {}) }; });
  if (!Array.isArray(m.trades)) m.trades = [];
  if (!Array.isArray(m.chat)) m.chat = [];
  if (!Array.isArray(m.log)) m.log = [];
  if (!m.contacts || typeof m.contacts !== 'object') m.contacts = {};
  if (!m.firstPick) m.firstPick = 'toss';
  if (!m.year) m.year = "'26";
  if (m.showChart === undefined) m.showChart = true;
  if (m.showPhotos === undefined) m.showPhotos = false;
  if (m.collabOn === undefined) m.collabOn = false;
  if (!m.collab || typeof m.collab !== 'object') m.collab = {};
  if (!m.vpPhotos || typeof m.vpPhotos !== 'object') m.vpPhotos = { day: null, eve: null };
  if (m.phase === 'results') m.phase = 'review';
  return m;
}

const SUPPORT_COST = 1; // a flagged collaboration costs the supporter this much cap
const supportCount = (d, role) => Object.values(d.collab || {}).filter((arr) => Array.isArray(arr) && arr.includes(role)).length;

const sel = {
  load: (d, role) => d.items.filter((i) => d.owners[i.id] === role).reduce((s, i) => s + i.paws, 0) + supportCount(d, role) * SUPPORT_COST,
  owned: (d, role) => d.pickOrder.filter((id) => d.owners[id] === role).map((id) => d.items.find((i) => i.id === id)).filter(Boolean),
  available: (d) => d.items.filter((i) => !d.owners[i.id]),
  affordable: (d, item, role) => sel.load(d, role) + item.paws <= d.capPaws,
  childrenOf: (d, issueId) => d.items.filter((i) => i.type === 'committee' && i.parent === issueId),
  canAct: (d, role) => sel.available(d).some((i) => sel.affordable(d, i, role)),
};

function nextTurn(d) {
  const other = d.turn === 'day' ? 'eve' : 'day';
  // pass to the other VP if they're not done and can still act; else stay if I can; else finalize
  if (!d.done[other] && sel.canAct(d, other)) { d.turn = other; return; }
  if (!d.done[d.turn] && sel.canAct(d, d.turn)) { return; } // other is stuck — keep drafting
  // nobody can act → finalize
  finalize(d);
}
function finalize(d) {
  sel.available(d).forEach((i) => { d.owners[i.id] = 'shared'; if (!d.pickOrder.includes(i.id)) d.pickOrder.push(i.id); });
  d.phase = 'review'; d.pending = null; d.ready = { day: false, eve: false };
}
const loadOf = (d, r) => d.items.filter((i) => d.owners[i.id] === r).reduce((s, i) => s + i.paws, 0) + supportCount(d, r) * SUPPORT_COST;
const tradesUsed = (d, r) => d.trades.filter((t) => t.from === r && t.status !== 'withdrawn').length;

function reduce(d, a) {
  d = JSON.parse(JSON.stringify(d));
  switch (a.t) {
    case 'name': d.names[a.role] = a.name; break;
    case 'toReady': if (d.phase === 'signin') { d.phase = (d.firstPick && d.firstPick !== 'toss') ? 'draft' : 'toss'; if (d.firstPick === 'day' || d.firstPick === 'eve') d.turn = d.firstPick; } break;
    case 'flip': d.toss = { result: null, flipping: true, seed: a.seed != null ? a.seed : Math.random() }; break;
    case 'flipDone': {
      const r = a.result || (Math.random() < 0.5 ? 'day' : 'eve');
      d.toss = { result: r, flipping: false, seed: d.toss.seed }; d.turn = r; break;
    }
    case 'begin': d.phase = 'draft'; break;
    case 'draft': {
      const item = d.items.find((i) => i.id === a.id);
      if (!item || d.owners[item.id]) break;
      if (!sel.affordable(d, item, a.role)) break;
      d.owners[item.id] = a.role; d.pickOrder.push(item.id);
      d.log.unshift({ by: a.role, id: item.id, name: item.name, ts: Date.now() });
      if (item.type === 'issue' && sel.childrenOf(d, item.id).some((c) => !d.owners[c.id] && sel.affordable(d, c, a.role))) {
        d.pending = { issueId: item.id, by: a.role };   // offer committees, stay on turn
      } else { nextTurn(d); }
      break;
    }
    case 'addChild': {
      const item = d.items.find((i) => i.id === a.id);
      if (!item || d.owners[item.id] || !d.pending) break;
      if (!sel.affordable(d, item, d.pending.by)) break;
      d.owners[item.id] = d.pending.by; d.pickOrder.push(item.id);
      d.log.unshift({ by: d.pending.by, id: item.id, name: item.name, ts: Date.now() });
      break;
    }
    case 'endPick': if (d.pending) { d.pending = null; nextTurn(d); } break;
    case 'pass': d.done[a.role] = true; d.pending = null; if (d.done.day && d.done.eve) finalize(d); else { if (d.turn === a.role) nextTurn(d); } break;
    case 'toShared': { const i = d.items.find((x) => x.id === a.id); if (i && !d.owners[i.id]) { d.owners[i.id] = 'shared'; d.pickOrder.push(i.id); } break; }
    case 'setCap': d.capPaws = Math.max(4, a.v); break;
    // editor
    case 'itemEdit': d.items = d.items.map((i) => (i.id === a.id ? { ...i, ...a.patch } : i)); break;
    case 'itemAdd': d.items.push(a.item); break;
    case 'itemDel': d.items = d.items.filter((i) => i.id !== a.id && i.parent !== a.id);
                    delete d.owners[a.id]; d.pickOrder = d.pickOrder.filter((x) => x !== a.id); break;
    case 'undo': { const last = d.pickOrder[d.pickOrder.length - 1]; if (last) { d.pickOrder.pop(); delete d.owners[last]; d.log.shift(); d.pending = null; d.phase = 'draft'; } break; }
    case 'phase': d.phase = a.phase; break;
    // ---- trades & negotiation (review / final phases) ----
    case 'tradeOffer': {
      if (tradesUsed(d, a.from) >= 3) break;
      const to = a.from === 'day' ? 'eve' : 'day';
      const give = (a.give || []).filter((id) => d.owners[id] === a.from);
      const get = (a.get || []).filter((id) => d.owners[id] === to);
      if (give.length + get.length === 0) break;
      d.trades.push({ id: 't' + Date.now() + Math.floor(Math.random() * 999), from: a.from, to, give, get, status: 'open', ts: Date.now() });
      d.chat.push({ by: a.from, sys: true, text: `proposed a trade — offering ${give.length}, requesting ${get.length}`, ts: Date.now() });
      break;
    }
    case 'tradeRespond': {
      const tr = d.trades.find((x) => x.id === a.id);
      if (!tr || tr.status !== 'open') break;
      if (a.accept) {
        tr.give.forEach((id) => { d.owners[id] = tr.to; });
        tr.get.forEach((id) => { d.owners[id] = tr.from; });
        if (loadOf(d, 'day') > d.capPaws || loadOf(d, 'eve') > d.capPaws) {  // cap guard -> revert
          tr.give.forEach((id) => { d.owners[id] = tr.from; });
          tr.get.forEach((id) => { d.owners[id] = tr.to; });
          break;
        }
        tr.status = 'accepted';
        d.chat.push({ by: tr.to, sys: true, text: 'accepted the trade — duties swapped', ts: Date.now() });
      } else {
        tr.status = 'declined';
        d.chat.push({ by: tr.to, sys: true, text: 'declined the trade', ts: Date.now() });
      }
      break;
    }
    case 'tradeWithdraw': { const tr = d.trades.find((x) => x.id === a.id); if (tr && tr.status === 'open') tr.status = 'withdrawn'; break; }
    case 'claimShared': {
      const it = d.items.find((i) => i.id === a.id);
      if (it && d.owners[a.id] === 'shared' && loadOf(d, a.role) + it.paws <= d.capPaws) { d.owners[a.id] = a.role; }
      break;
    }
    case 'chat': if (a.text && a.text.trim()) d.chat.push({ by: a.by, text: a.text.trim().slice(0, 400), ts: Date.now() }); break;
    case 'ready': d.ready[a.role] = a.v; if (d.ready.day && d.ready.eve) d.phase = 'final'; break;
    case 'reopen': d.phase = 'review'; d.ready = { day: false, eve: false }; break;
    // ---- curator (owner) edits; persist to CONFIG happens in the UI ----
    case 'setYear': d.year = a.v; break;
    case 'setShowChart': d.showChart = a.v; break;
    case 'setShowPhotos': d.showPhotos = a.v; break;
    case 'setCollabOn': d.collabOn = a.v; if (!a.v) d.collab = {}; break;
    case 'collabToggle': {
      if (!d.collabOn) break;
      const owner = d.owners[a.id];
      if (!owner || owner === a.role || owner === 'shared') break;   // only support the OTHER VP's owned issue
      const arr = d.collab[a.id] || [];
      if (arr.includes(a.role)) { d.collab[a.id] = arr.filter((r) => r !== a.role); }
      else {
        if (supportCount(d, a.role) >= 2) break;                    // max 2 collaborations per VP
        if (loadOf(d, a.role) + SUPPORT_COST > d.capPaws) break;     // cap guard: no overloading
        d.collab[a.id] = [...arr, a.role];
      }
      break;
    }
    case 'setVpPhoto': d.vpPhotos = { ...(d.vpPhotos || {}), [a.role]: a.url }; break;
    case 'setFirstPick': d.firstPick = a.v; if (a.v === 'day' || a.v === 'eve') d.turn = a.v; break;
    case 'setPool': {
      d.items = a.items.map((i) => ({ ...i }));
      const ids = new Set(d.items.map((i) => i.id));
      Object.keys(d.owners).forEach((id) => { if (!ids.has(id)) delete d.owners[id]; });
      d.pickOrder = d.pickOrder.filter((id) => ids.has(id));
      break;
    }
    case 'contactAdd': { (d.contacts[a.issueId] = d.contacts[a.issueId] || []).push(a.contact); break; }
    case 'contactEdit': { const arr = d.contacts[a.issueId] || []; const c = arr.find((x) => x.id === a.id); if (c) Object.assign(c, a.patch); break; }
    case 'contactDel': { d.contacts[a.issueId] = (d.contacts[a.issueId] || []).filter((x) => x.id !== a.id); break; }
    case 'reset': return freshDoc();
    case 'replace': return a.doc;
    default: break;
  }
  d.rev = (d.rev || 0) + 1;
  return d;
}

// ---------- provider / hook ----------
const DraftCtx = React.createContext(null);

function DraftProvider({ children }) {
  const [doc, setDoc] = React.useState(loadDoc);
  const docRef = React.useRef(doc); docRef.current = doc;
  const chanRef = React.useRef(null);
  const fbApi = React.useRef(null);
  const [myRole, setRole] = React.useState(() => sessionStorage.getItem(ROLE_KEY) || null);
  const [seen, setSeen] = React.useState({ day: 0, eve: 0 });
  const [syncMode, setSyncMode] = React.useState('local'); // 'local' | 'connecting' | 'cloud'

  React.useEffect(() => {
    const ch = new BroadcastChannel(CHAN); chanRef.current = ch;
    ch.onmessage = (e) => {
      const m = e.data;
      if (m.type === 'doc' && m.doc.rev >= (docRef.current.rev || 0)) { const nd = migrate(m.doc); docRef.current = nd; setDoc(nd); }
      else if (m.type === 'beat') setSeen((s) => ({ ...s, [m.role]: Date.now() }));
      else if (m.type === 'hello') ch.postMessage({ type: 'doc', doc: docRef.current });
    };
    ch.postMessage({ type: 'hello' });
    const onStore = (e) => { if (e.key === DOC_KEY && e.newValue) { try { const nd0 = JSON.parse(e.newValue); if (nd0.rev >= (docRef.current.rev || 0)) { const nd = migrate(nd0); docRef.current = nd; setDoc(nd); } } catch {} } };
    window.addEventListener('storage', onStore);
    return () => { ch.close(); window.removeEventListener('storage', onStore); };
  }, []);

  // ---- optional cloud sync (Firebase) for cross-internet drafting ----
  React.useEffect(() => {
    const sync = (window.WRC && window.WRC.get().sync) || {};
    if (!sync.config || !sync.room || !window.WRFB) return;
    let alive = true; setSyncMode('connecting');
    window.WRFB.connect(sync.config, sync.room, {
      onDoc: (v) => { if (!alive) return; try { if (v && (v.rev || 0) >= (docRef.current.rev || 0)) { const nd = migrate(v); docRef.current = nd; setDoc(nd); } } catch (e) {} },
      onPresence: (p) => { if (!alive || !p) return; setSeen((s) => ({ day: p.day || 0, eve: p.eve || 0 })); },
    }).then((api) => {
      if (!alive) return;
      fbApi.current = api; setSyncMode('cloud');
      api.push(docRef.current);
      if (myRole && myRole !== 'view') api.beat(myRole);
    }).catch(() => { if (alive) setSyncMode('local'); });
    return () => { alive = false; };
  }, []);

  // heartbeat for presence
  React.useEffect(() => {
    if (!myRole || myRole === 'view') return;
    const beat = () => {
      chanRef.current && chanRef.current.postMessage({ type: 'beat', role: myRole });
      fbApi.current && fbApi.current.beat(myRole);
    };
    beat(); const t = setInterval(beat, 2500); return () => clearInterval(t);
  }, [myRole]);

  const commit = React.useCallback((nd) => {
    docRef.current = nd; setDoc(nd);
    try { localStorage.setItem(DOC_KEY, JSON.stringify(nd)); } catch {}
    chanRef.current && chanRef.current.postMessage({ type: 'doc', doc: nd });
    fbApi.current && fbApi.current.push(nd);
  }, []);
  const dispatch = React.useCallback((a) => commit(reduce(docRef.current, a)), [commit]);

  const claimRole = React.useCallback((role, name) => {
    sessionStorage.setItem(ROLE_KEY, role); setRole(role);
    if (role !== 'view') dispatch({ t: 'name', role, name: name || WR.VPS[role].role });
  }, [dispatch]);

  const now = Date.now();
  const presence = { day: now - seen.day < 6500, eve: now - seen.eve < 6500 };

  const api = { doc, dispatch, myRole, claimRole, presence, sel, Sounds, syncMode };
  return <DraftCtx.Provider value={api}>{children}</DraftCtx.Provider>;
}
const useDraft = () => React.useContext(DraftCtx);

/* ============================================================
   UI PRIMITIVES
   ============================================================ */

// Abstract themed emblem (stand-in until real tiger/duck art is dropped in).
function Emblem({ size = 40, tone = 'var(--secondary)', ink = 'var(--on-secondary)' }) {
  const r = size * 0.22;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: 'block', flex: '0 0 auto' }} aria-label="SBA emblem (placeholder)">
      <rect x="6" y="6" width="88" height="88" rx={r} fill={tone} />
      <clipPath id={'em' + size}><rect x="6" y="6" width="88" height="88" rx={r} /></clipPath>
      <g clipPath={`url(#em${size})`} fill={ink} opacity="0.92">
        <rect x="18" y="-20" width="9" height="140" transform="rotate(22 50 50)" />
        <rect x="40" y="-20" width="13" height="140" transform="rotate(22 50 50)" />
        <rect x="66" y="-20" width="8" height="140" transform="rotate(22 50 50)" />
      </g>
    </svg>
  );
}

// Tiger-paw weight glyph (primitive shapes only).
function PawIcon({ size = 13, fill = 'currentColor', dim = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block', opacity: dim ? 0.26 : 1 }} aria-hidden="true">
      <g fill={fill}>
        <ellipse cx="12" cy="15.5" rx="6" ry="5" />
        <circle cx="6.5" cy="9" r="2.4" /><circle cx="11" cy="6.4" r="2.5" />
        <circle cx="15.5" cy="6.7" r="2.5" /><circle cx="18.6" cy="10" r="2.2" />
      </g>
    </svg>
  );
}
function Paws({ n, max = 5, size = 13, showNum = true }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }} title={`weight ${n} of ${max}`}>
      {Array.from({ length: max }).map((_, i) => {
        const fillFrac = Math.max(0, Math.min(1, n - i)); // 1 full, 0.5 half, 0 empty
        if (fillFrac >= 1) return <PawIcon key={i} size={size} fill="var(--highlight)" />;
        if (fillFrac <= 0) return <PawIcon key={i} size={size} fill="var(--muted)" dim />;
        // half: dim base with a bright left-half overlay
        return (
          <span key={i} style={{ position: 'relative', width: size, height: size, display: 'inline-block', flex: '0 0 auto' }}>
            <span style={{ position: 'absolute', inset: 0 }}><PawIcon size={size} fill="var(--muted)" dim /></span>
            <span style={{ position: 'absolute', inset: 0, width: size * fillFrac, overflow: 'hidden' }}><PawIcon size={size} fill="var(--highlight)" /></span>
          </span>
        );
      })}
      {showNum && <span className="mono" style={{ fontSize: size - 2, fontWeight: 700, marginLeft: 4, color: 'var(--muted)' }}>{n}</span>}
    </span>
  );
}

function CatTag({ cat }) {
  const c = WR.CATS[cat]; if (!c) return null;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 9, height: 9, borderRadius: 3, background: c.color, flex: '0 0 auto' }} />
      <span className="mono" style={{ fontSize: 10, letterSpacing: '.07em', color: 'var(--muted)', textTransform: 'uppercase' }}>{c.label}</span>
    </span>
  );
}

// Real brand logos on a white chip so they read on every theme.
const LOGO_SRC = { sba: 'assets/sba-seal.png', tiger: 'assets/pacific-tiger.png', vintage: 'assets/tiger-vintage.png' };
function Logo({ which = 'sba', size = 44, pad = 0.12, title, bare = false }) {
  if (bare) {
    // transparent mark with a soft white halo (reads on dark) + faint depth (reads on light)
    return (
      <img src={LOGO_SRC[which]} alt={title || which} draggable="false"
        style={{ width: size, height: size, objectFit: 'contain', display: 'block', flex: '0 0 auto',
          filter: 'drop-shadow(0 0 2px rgba(255,255,255,.9)) drop-shadow(0 0 5px rgba(255,255,255,.45)) drop-shadow(0 2px 3px rgba(0,0,0,.3))' }} />
    );
  }
  return (
    <span style={{ width: size, height: size, borderRadius: size * 0.22, background: '#fff', flex: '0 0 auto',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
      padding: size * pad, boxShadow: '0 1px 3px rgba(0,0,0,.22), inset 0 0 0 1px rgba(0,0,0,.06)' }}>
      <img src={LOGO_SRC[which]} alt={title || which} draggable="false"
        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }} />
    </span>
  );
}

function VPBadge({ role, size = 36, ring }) {
  const p = WR.VPS[role];
  const ctx = React.useContext(DraftCtx);
  const doc = ctx && ctx.doc;
  const photo = doc && doc.showPhotos && doc.vpPhotos && doc.vpPhotos[role];
  if (photo) {
    return (
      <span style={{ width: size, height: size, borderRadius: '50%', flex: '0 0 auto', overflow: 'hidden', display: 'inline-block',
        boxShadow: ring ? `0 0 0 3px ${ring}` : 'inset 0 0 0 1px rgba(0,0,0,.15)' }}>
        <img src={photo} alt={p.short} draggable="false" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      </span>
    );
  }
  return (
    <span style={{
      width: size, height: size, borderRadius: '50%', flex: '0 0 auto',
      background: p.tint, color: p.on, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 800, fontSize: size * 0.34, letterSpacing: '.02em', fontFamily: '"Saira Condensed", sans-serif',
      boxShadow: ring ? `0 0 0 3px ${ring}` : 'none',
    }}>{p.short}</span>
  );
}

// Donut chart: a VP's owned weight split by category. Pure, reads doc.
function CategoryDonut({ role, size = 132 }) {
  const { doc } = useDraft();
  const owned = doc.items.filter((i) => doc.owners[i.id] === role);
  const byCat = {};
  owned.forEach((i) => { byCat[i.cat] = (byCat[i.cat] || 0) + i.paws; });
  const total = Object.values(byCat).reduce((s, n) => s + n, 0);
  const cats = Object.keys(byCat).sort((a, b) => byCat[b] - byCat[a]);
  if (total === 0) {
    return <div style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', padding: '12px 0' }}>No picks yet — the focus chart fills in as {WR.VPS[role].short} drafts.</div>;
  }
  let acc = 0; const stops = [];
  cats.forEach((c) => { const frac = byCat[c] / total; const col = WR.CATS[c].color; stops.push(`${col} ${(acc * 100).toFixed(1)}% ${((acc + frac) * 100).toFixed(1)}%`); acc += frac; });
  const ringW = Math.round(size * 0.17);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: size, height: size, borderRadius: '50%', flex: '0 0 auto', position: 'relative',
        background: `conic-gradient(${stops.join(',')})` }}>
        <div style={{ position: 'absolute', inset: ringW, borderRadius: '50%', background: 'var(--panel)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span className="cond" style={{ fontSize: size * 0.26, fontWeight: 800, lineHeight: 1 }}>{owned.length}</span>
          <span className="mono" style={{ fontSize: 8.5, color: 'var(--muted)', letterSpacing: '.1em' }}>PICKS</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 }}>
        {cats.map((c) => (
          <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5 }}>
            <span style={{ width: 9, height: 9, borderRadius: 3, background: WR.CATS[c].color, flex: '0 0 auto' }} />
            <span style={{ flex: 1, color: 'var(--on-panel)' }}>{WR.CATS[c].label}</span>
            <span className="mono" style={{ color: 'var(--muted)', fontWeight: 700 }}>{Math.round((byCat[c] / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ThemeBar() {
  const [theme, setTheme] = React.useState(() => localStorage.getItem('wr-theme') || 'light');
  React.useEffect(() => { document.documentElement.setAttribute('data-theme', theme); localStorage.setItem('wr-theme', theme); }, [theme]);
  const opts = [
    { id: 'light', label: 'Tiger', sw: '#E8571C' },
    { id: 'duck',  label: 'Duck',  sw: '#1C7A43' },
    { id: 'dark',  label: 'Night', sw: '#15120E' },
  ];
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: 'color-mix(in srgb, var(--accent) 90%, transparent)', borderRadius: 999, padding: '4px 5px' }}>
      {opts.map((o) => (
        <button key={o.id} onClick={() => setTheme(o.id)} title={o.label}
          style={{ border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: '5px 11px', borderRadius: 999,
            fontSize: 12, fontWeight: 700, background: theme === o.id ? 'var(--on-accent)' : 'transparent',
            color: theme === o.id ? 'var(--accent)' : 'color-mix(in srgb, var(--on-accent) 80%, transparent)' }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: o.sw, border: '1px solid rgba(0,0,0,.25)' }} />{o.label}
        </button>
      ))}
    </div>
  );
}

Object.assign(window, { DraftProvider, useDraft, Emblem, Logo, PawIcon, Paws, CatTag, VPBadge, CategoryDonut, ThemeBar, Sounds, loadOf, tradesUsed });
