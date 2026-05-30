/* ============================================================
   wr-curator.jsx — Curator Mode (owner) + Contacts Directory
     • CuratorPanel: passcode-gated owner settings that persist across
       resets (year, first-pick rule, per-VP cap, paw weights, the base
       duty pool + descriptions, contacts) + Firebase sync setup.
     • Directory: VP-facing contacts list (either VP can add/edit).
     • ContactsPeek: compact key-contacts block on each issue card.
   ============================================================ */

function CModal({ title, sub, onClose, children, wide }) {
  return (
    <div onClick={onClose} className="no-print" style={{ position: 'fixed', inset: 0, zIndex: 95, background: 'color-mix(in srgb, var(--field) 28%, rgba(10,8,6,.6))', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={(e) => e.stopPropagation()} className="card" style={{ width: '100%', maxWidth: wide ? 1040 : 720, maxHeight: '90vh', borderRadius: 18, display: 'flex', flexDirection: 'column', boxShadow: '0 24px 70px rgba(0,0,0,.45)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '18px 22px', borderBottom: '1px solid var(--line)' }}>
          <div style={{ flex: 1 }}>
            <div className="cond" style={{ fontSize: 24, fontWeight: 800, textTransform: 'uppercase', lineHeight: 1 }}>{title}</div>
            {sub && <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>{sub}</div>}
          </div>
          <button onClick={onClose} style={{ cursor: 'pointer', width: 34, height: 34, borderRadius: 99, border: '1px solid var(--line)', background: 'var(--panel-2)', color: 'var(--on-panel)', fontSize: 18 }}>×</button>
        </div>
        <div className="scroll" style={{ overflowY: 'auto', padding: '20px 22px' }}>{children}</div>
      </div>
    </div>
  );
}

const cInput = { font: 'inherit', fontSize: 14, padding: '9px 11px', borderRadius: 9, border: '1px solid var(--line)', background: 'var(--panel-2)', color: 'var(--on-panel)', outline: 'none' };
const cStep = { cursor: 'pointer', width: 28, height: 28, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--panel-2)', color: 'var(--on-panel)', fontWeight: 800, fontSize: 14, flex: '0 0 auto' };
const cSection = { fontFamily: '"JetBrains Mono", monospace', fontSize: 10.5, letterSpacing: '.14em', color: 'var(--muted)', textTransform: 'uppercase', margin: '22px 0 12px', paddingBottom: 6, borderBottom: '1px solid var(--line)' };

// ---------------- Curator Mode ----------------
function CuratorPanel({ onClose }) {
  const { doc, dispatch } = useDraft();
  const [unlocked, setUnlocked] = React.useState(!window.WRC.hasPass());
  const [pass, setPass] = React.useState('');
  const [err, setErr] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [newPass, setNewPass] = React.useState(window.WRC.get().passcode || '');
  const [fbText, setFbText] = React.useState(() => { const s = window.WRC.get().sync; return s && s.config ? JSON.stringify(s.config, null, 1) : ''; });
  const [room, setRoom] = React.useState(() => (window.WRC.get().sync || {}).room || '');
  const [fbMsg, setFbMsg] = React.useState('');

  if (!unlocked) {
    return (
      <CModal title="Curator Mode" sub="Owner access" onClose={onClose}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 360 }}>
          <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.5 }}>Enter the owner passcode to edit the draft setup.</div>
          <input type="password" value={pass} autoFocus onChange={(e) => { setPass(e.target.value); setErr(false); }}
            onKeyDown={(e) => { if (e.key === 'Enter') { window.WRC.checkPass(pass) ? setUnlocked(true) : setErr(true); } }}
            placeholder="Passcode" style={{ ...cInput, borderColor: err ? '#d9483b' : 'var(--line)' }} />
          {err && <div style={{ fontSize: 12.5, color: '#d9483b', fontWeight: 600 }}>Incorrect passcode.</div>}
          <button onClick={() => { window.WRC.checkPass(pass) ? setUnlocked(true) : setErr(true); }} className="feature-bar"
            style={{ cursor: 'pointer', fontWeight: 800, fontSize: 14, padding: '11px', borderRadius: 11, border: 'none' }}>Unlock</button>
        </div>
      </CModal>
    );
  }

  const issues = doc.items.filter((i) => i.type === 'issue');
  const setBlurb = (id, v) => dispatch({ t: 'itemEdit', id, patch: { blurb: v } });
  const Stepper = ({ v, on, min = 1, max = 5 }) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flex: '0 0 auto' }}>
      <button onClick={() => on(Math.max(min, v - 1))} style={cStep}>−</button>
      <span style={{ width: 78, display: 'inline-flex', justifyContent: 'center', flex: '0 0 auto' }}><Paws n={v} size={10} showNum={false} /></span>
      <button onClick={() => on(Math.min(max, v + 1))} style={cStep}>+</button>
    </span>
  );

  const saveTemplate = () => {
    window.WRC.set({
      year: doc.year, capDefault: doc.capPaws, firstPick: doc.firstPick,
      pool: doc.items, contacts: doc.contacts,
    });
    setSaved(true); setTimeout(() => setSaved(false), 2200);
  };
  const saveSync = () => {
    let cfg = null;
    const raw = fbText.trim();
    if (raw) {
      const body = (raw.match(/\{[\s\S]*\}/) || [raw])[0];   // grab the { … } block
      try { cfg = JSON.parse(body); }
      catch (e) {
        try { cfg = (new Function('return (' + body + ')'))(); }  // tolerate JS-object form from the console
        catch (e2) { setFbMsg('Could not read the config — paste the firebaseConfig { … } from Firebase.'); return; }
      }
      if (!cfg || !cfg.databaseURL) { setFbMsg('That config has no databaseURL — make sure you created a Realtime Database.'); return; }
    }
    window.WRC.set({ sync: cfg && room.trim() ? { config: cfg, room: room.trim().toUpperCase() } : null });
    setFbMsg('Saved. Reloading to connect…'); setTimeout(() => location.reload(), 800);
  };

  return (
    <CModal title="Curator Mode" sub="Owner settings — persist across draft resets & seed every new draft" onClose={onClose} wide>
      {/* draft basics */}
      <div style={cSection}>Draft basics</div>
      <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', alignItems: 'center' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ fontSize: 12, fontWeight: 700 }}>Draft year label</span>
          <input value={doc.year} onChange={(e) => dispatch({ t: 'setYear', v: e.target.value })} style={{ ...cInput, width: 110 }} placeholder="'26" />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ fontSize: 12, fontWeight: 700 }}>Per-VP paw cap</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => dispatch({ t: 'setCap', v: doc.capPaws - 1 })} style={cStep}>−</button>
            <span className="mono" style={{ fontWeight: 700, width: 30, textAlign: 'center' }}>{doc.capPaws}</span>
            <button onClick={() => dispatch({ t: 'setCap', v: doc.capPaws + 1 })} style={cStep}>+</button>
          </span>
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ fontSize: 12, fontWeight: 700 }}>First pick</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {[['toss', 'Coin toss'], ['day', 'Day VP'], ['eve', 'Evening VP']].map(([v, l]) => (
              <button key={v} onClick={() => dispatch({ t: 'setFirstPick', v })} style={{ cursor: 'pointer', fontSize: 12.5, fontWeight: 700, padding: '7px 12px', borderRadius: 9, border: '1px solid var(--line)', background: doc.firstPick === v ? 'var(--secondary)' : 'var(--panel-2)', color: doc.firstPick === v ? 'var(--on-secondary)' : 'var(--muted)' }}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      {/* base pool + weights + descriptions */}
      <div style={cSection}>Base duty pool · weights · descriptions</div>
      {issues.map((iss) => (
        <div key={iss.id} style={{ marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <input value={iss.name} onChange={(e) => dispatch({ t: 'itemEdit', id: iss.id, patch: { name: e.target.value } })} style={{ ...cInput, flex: 1, fontWeight: 700 }} />
            <select value={iss.cat} onChange={(e) => dispatch({ t: 'itemEdit', id: iss.id, patch: { cat: e.target.value } })} style={{ ...cInput, fontSize: 12, flex: '0 0 auto' }}>
              {Object.entries(WR.CATS).map(([k, c]) => <option key={k} value={k}>{c.label}</option>)}
            </select>
            <Stepper v={iss.paws} on={(v) => dispatch({ t: 'itemEdit', id: iss.id, patch: { paws: v } })} />
            <button onClick={() => dispatch({ t: 'itemDel', id: iss.id })} style={{ ...cStep, color: '#d9483b' }}>✕</button>
          </div>
          <input value={iss.blurb || ''} onChange={(e) => setBlurb(iss.id, e.target.value)} placeholder="Short description (shown on the draft card)…" style={{ ...cInput, width: '100%', marginTop: 6, fontSize: 12.5 }} />
          {doc.items.filter((c) => c.parent === iss.id).map((c) => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 6, marginLeft: 22 }}>
              <span className="mono" style={{ color: 'var(--muted)', fontSize: 11 }}>▸</span>
              <input value={c.name} onChange={(e) => dispatch({ t: 'itemEdit', id: c.id, patch: { name: e.target.value } })} style={{ ...cInput, flex: 1, fontSize: 13 }} />
              <select value={c.cat} onChange={(e) => dispatch({ t: 'itemEdit', id: c.id, patch: { cat: e.target.value } })} style={{ ...cInput, fontSize: 12, flex: '0 0 auto' }}>
                {Object.entries(WR.CATS).map(([k, cc]) => <option key={k} value={k}>{cc.label}</option>)}
              </select>
              <Stepper v={c.paws} on={(v) => dispatch({ t: 'itemEdit', id: c.id, patch: { paws: v } })} />
              <button onClick={() => dispatch({ t: 'itemDel', id: c.id })} style={{ ...cStep, color: '#d9483b' }}>✕</button>
            </div>
          ))}
          <button onClick={() => dispatch({ t: 'itemAdd', item: { id: 'c' + Date.now(), type: 'committee', parent: iss.id, name: 'New committee', cat: iss.cat, paws: 2 } })}
            style={{ cursor: 'pointer', fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', background: 'transparent', border: '1px dashed var(--line)', borderRadius: 8, padding: '5px 10px', marginTop: 7, marginLeft: 22 }}>+ committee</button>
        </div>
      ))}
      <button onClick={() => dispatch({ t: 'itemAdd', item: { id: 'x' + Date.now(), type: 'issue', name: 'New issue', cat: 'ops', paws: 2, blurb: '' } })}
        style={{ cursor: 'pointer', fontWeight: 700, fontSize: 13, padding: '9px 15px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--panel-2)', color: 'var(--on-panel)' }}>+ Add an issue</button>

      {/* cross-internet sync */}
      <div style={cSection}>Cross-internet sync (Firebase)</div>
      <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.55, marginBottom: 10 }}>
        Create a free Firebase project → add a <strong>Realtime Database</strong> → copy its <code>firebaseConfig</code> object here and pick a room code. Both VPs use the same code to share one live draft across devices. Leave blank for same-device sync.
      </div>
      <textarea value={fbText} onChange={(e) => setFbText(e.target.value)} placeholder='{ "apiKey": "…", "databaseURL": "https://…", "projectId": "…" }'
        style={{ ...cInput, width: '100%', minHeight: 96, fontFamily: '"JetBrains Mono", monospace', fontSize: 12, resize: 'vertical' }} />
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 10, flexWrap: 'wrap' }}>
        <input value={room} onChange={(e) => setRoom(e.target.value.toUpperCase())} placeholder="ROOM CODE" style={{ ...cInput, width: 160, fontFamily: '"JetBrains Mono", monospace', letterSpacing: '.1em' }} />
        <button onClick={saveSync} className="feature-bar" style={{ cursor: 'pointer', fontWeight: 800, fontSize: 13, padding: '10px 16px', borderRadius: 10, border: 'none' }}>Save & connect</button>
        {(window.WRC.get().sync && window.WRC.get().sync.room) && <button onClick={() => { window.WRC.set({ sync: null }); location.reload(); }} style={{ cursor: 'pointer', fontWeight: 700, fontSize: 12.5, padding: '10px 14px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--panel-2)', color: 'var(--on-panel)' }}>Disconnect</button>}
        {fbMsg && <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>{fbMsg}</span>}
      </div>

      {/* passcode */}
      <div style={cSection}>Owner passcode</div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <input value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="Set a passcode (blank = none)" style={{ ...cInput, width: 240 }} />
        <button onClick={() => { window.WRC.set({ passcode: newPass.trim() || null }); setSaved(true); setTimeout(() => setSaved(false), 1600); }}
          style={{ cursor: 'pointer', fontWeight: 700, fontSize: 13, padding: '10px 16px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--panel-2)', color: 'var(--on-panel)' }}>Set passcode</button>
      </div>

      {/* save template */}
      <div style={{ position: 'sticky', bottom: -20, marginTop: 24, paddingTop: 14, borderTop: '1px solid var(--line)', background: 'var(--panel)', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ flex: 1, fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.45 }}>“Save as master template” stores the current pool, weights, cap, year, first-pick &amp; contacts as the defaults for every future draft (survives Reset).</div>
        {saved && <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--brand)' }}>Saved ✓</span>}
        <button onClick={() => { if (confirm('Reset the draft? Clears picks, trades & chat. Your master template (pool, weights, contacts) is kept.')) { dispatch({ t: 'reset' }); onClose(); } }}
          style={{ cursor: 'pointer', fontWeight: 700, fontSize: 13, padding: '12px 16px', borderRadius: 12, border: '1px solid color-mix(in srgb,#d9483b 40%,var(--line))', background: 'transparent', color: '#d9483b' }}>Reset draft</button>
        <button onClick={saveTemplate} className="feature-bar" style={{ cursor: 'pointer', fontWeight: 800, fontSize: 14, padding: '12px 20px', borderRadius: 12, border: 'none' }}>Save as master template</button>
      </div>
    </CModal>
  );
}

// ---------------- Contacts Directory (VP-facing) ----------------
function ContactRow({ issueId, c, editable }) {
  const { dispatch } = useDraft();
  const [edit, setEdit] = React.useState(false);
  const [name, setName] = React.useState(c.name);
  const [title, setTitle] = React.useState(c.title || '');
  if (edit) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, padding: '8px 0' }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" style={{ ...cInput, fontSize: 13 }} />
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title / role" style={{ ...cInput, fontSize: 13 }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => { dispatch({ t: 'contactEdit', issueId, id: c.id, patch: { name, title } }); setEdit(false); }} className="feature-bar" style={{ flex: 1, cursor: 'pointer', fontWeight: 700, fontSize: 12.5, padding: '8px', borderRadius: 8, border: 'none' }}>Save</button>
          <button onClick={() => dispatch({ t: 'contactDel', issueId, id: c.id })} style={{ cursor: 'pointer', fontWeight: 700, fontSize: 12.5, padding: '8px 14px', borderRadius: 8, border: '1px solid color-mix(in srgb,#d9483b 40%,var(--line))', background: 'transparent', color: '#d9483b' }}>Delete</button>
        </div>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 11px', borderRadius: 9, background: 'var(--panel-2)' }}>
      <span style={{ width: 30, height: 30, borderRadius: '50%', flex: '0 0 auto', background: 'var(--secondary)', color: 'var(--on-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, fontFamily: '"Saira Condensed",sans-serif' }}>{(c.name || '?').slice(0, 2).toUpperCase()}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 13.5, lineHeight: 1.15 }}>{c.name}</div>
        {c.title && <div style={{ fontSize: 12, color: 'var(--muted)' }}>{c.title}</div>}
      </div>
      {editable && <button onClick={() => setEdit(true)} style={{ cursor: 'pointer', fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', background: 'transparent', border: '1px solid var(--line)', borderRadius: 7, padding: '5px 9px' }}>Edit</button>}
    </div>
  );
}

function Directory({ onClose }) {
  const { doc, dispatch } = useDraft();
  const issues = doc.items.filter((i) => i.type === 'issue');
  const [adding, setAdding] = React.useState(null);
  const [n, setN] = React.useState(''); const [tt, setTt] = React.useState('');
  const add = (issueId) => { if (!n.trim()) return; dispatch({ t: 'contactAdd', issueId, contact: { id: 'k' + Date.now() + Math.floor(Math.random() * 99), name: n.trim(), title: tt.trim() } }); setN(''); setTt(''); setAdding(null); };
  const total = Object.values(doc.contacts || {}).reduce((s, a) => s + (a ? a.length : 0), 0);
  return (
    <CModal title="Contacts Directory" sub={`Key people by issue · ${total} contact${total === 1 ? '' : 's'} · either VP can add or edit`} onClose={onClose} wide>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, alignItems: 'start' }}>
        {issues.map((iss) => {
          const list = (doc.contacts && doc.contacts[iss.id]) || [];
          return (
            <div key={iss.id} className="card" style={{ borderRadius: 14, padding: '14px 15px', borderTop: `4px solid ${WR.CATS[iss.cat].color}` }}>
              <div style={{ fontWeight: 800, fontSize: 14.5, marginBottom: 2 }}>{iss.name}</div>
              <div style={{ marginBottom: 10 }}><CatTag cat={iss.cat} /></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {list.map((c) => <ContactRow key={c.id} issueId={iss.id} c={c} editable />)}
                {list.length === 0 && adding !== iss.id && <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>No contacts yet.</div>}
              </div>
              {adding === iss.id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 9 }}>
                  <input value={n} autoFocus onChange={(e) => setN(e.target.value)} placeholder="Name" style={{ ...cInput, fontSize: 13 }} />
                  <input value={tt} onChange={(e) => setTt(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') add(iss.id); }} placeholder="Title / role (e.g. Dean of Students)" style={{ ...cInput, fontSize: 13 }} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => add(iss.id)} className="feature-bar" style={{ flex: 1, cursor: 'pointer', fontWeight: 700, fontSize: 12.5, padding: '8px', borderRadius: 8, border: 'none' }}>Add contact</button>
                    <button onClick={() => { setAdding(null); setN(''); setTt(''); }} style={{ cursor: 'pointer', fontWeight: 700, fontSize: 12.5, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--panel-2)', color: 'var(--on-panel)' }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => { setAdding(iss.id); setN(''); setTt(''); }} style={{ cursor: 'pointer', fontSize: 12, fontWeight: 700, color: 'var(--muted)', background: 'transparent', border: '1px dashed var(--line)', borderRadius: 8, padding: '7px 11px', marginTop: 9 }}>+ Add contact</button>
              )}
            </div>
          );
        })}
      </div>
    </CModal>
  );
}

// ---------------- compact peek on an issue card ----------------
function ContactsPeek({ issueId, onOpen }) {
  const { doc } = useDraft();
  const list = (doc.contacts && doc.contacts[issueId]) || [];
  if (list.length === 0) return null;
  return (
    <button onClick={(e) => { e.stopPropagation(); onOpen && onOpen('directory'); }} style={{ cursor: 'pointer', textAlign: 'left', width: '100%', marginTop: 4, paddingTop: 9, borderTop: '1px dashed var(--line)', background: 'transparent', border: 'none' }}>
      <div className="mono" style={{ fontSize: 9, letterSpacing: '.1em', color: 'var(--muted)', marginBottom: 5 }}>KEY CONTACTS</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {list.slice(0, 2).map((c) => (
          <div key={c.id} style={{ fontSize: 11.5, color: 'var(--on-panel)' }}><strong>{c.name}</strong>{c.title ? <span style={{ color: 'var(--muted)' }}> · {c.title}</span> : null}</div>
        ))}
        {list.length > 2 && <div style={{ fontSize: 11, color: 'var(--brand)', fontWeight: 700 }}>+{list.length - 2} more in Directory →</div>}
      </div>
    </button>
  );
}

Object.assign(window, { CuratorPanel, Directory, ContactsPeek });
