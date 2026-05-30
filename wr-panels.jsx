/* ============================================================
   wr-panels.jsx — overlays: SharedPanel, EditorPanel, ResultsPanel
   ============================================================ */

function Overlay({ title, sub, onClose, children, wide }) {
  return (
    <div onClick={onClose} className="no-print"
      style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'color-mix(in srgb, var(--field) 30%, rgba(10,8,6,.55))', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={(e) => e.stopPropagation()} className="card"
        style={{ width: '100%', maxWidth: wide ? 1000 : 760, maxHeight: '88vh', borderRadius: 18, display: 'flex', flexDirection: 'column', boxShadow: '0 24px 70px rgba(0,0,0,.4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '18px 22px', borderBottom: '1px solid var(--line)' }}>
          <div style={{ flex: 1 }}>
            <div className="cond" style={{ fontSize: 24, fontWeight: 800, textTransform: 'uppercase', lineHeight: 1 }}>{title}</div>
            {sub && <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>{sub}</div>}
          </div>
          <button onClick={onClose} style={{ cursor: 'pointer', width: 34, height: 34, borderRadius: 99, border: '1px solid var(--line)', background: 'var(--panel-2)', color: 'var(--on-panel)', fontSize: 18, lineHeight: 1 }}>×</button>
        </div>
        <div className="scroll" style={{ overflowY: 'auto', padding: '20px 22px' }}>{children}</div>
      </div>
    </div>
  );
}

function SharedPanel({ onClose }) {
  const S = WR.SHARED;
  return (
    <Overlay title="Shared Duties" sub={S.cite} onClose={onClose}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: 'var(--panel-2)', borderRadius: 12, padding: '14px 16px', marginBottom: 18 }}>
        <div style={{ display: 'flex', gap: -8 }}><VPBadge role="day" size={34} /><span style={{ marginLeft: -8 }}><VPBadge role="eve" size={34} /></span></div>
        <div style={{ fontSize: 13.5, color: 'var(--on-panel)', lineHeight: 1.55 }}>{S.intro}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {S.duties.map((d) => (
          <div key={d.k} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <span className="cond" style={{ flex: '0 0 auto', width: 34, height: 34, borderRadius: 9, background: 'var(--accent)', color: 'var(--on-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18 }}>{d.k}</span>
            <div style={{ fontSize: 14.5, lineHeight: 1.5, paddingTop: 5 }}>{d.t}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px dashed var(--line)' }}>
        <div className="mono" style={{ fontSize: 10.5, letterSpacing: '.14em', color: 'var(--muted)', marginBottom: 10 }}>PRESIDING IN THE PRESIDENT’S ABSENCE (§5.02 E)</div>
        <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 7 }}>
          {S.presiding.map((t, i) => <li key={i} style={{ fontSize: 13.5, lineHeight: 1.5 }}>{t}</li>)}
        </ol>
      </div>
      <div style={{ marginTop: 18, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {S.alsoShared.map((t) => <span key={t} style={{ fontSize: 12.5, fontWeight: 700, background: 'color-mix(in srgb, var(--highlight) 22%, var(--panel))', color: 'var(--on-panel)', borderRadius: 99, padding: '7px 14px' }}>Also shared · {t}</span>)}
      </div>
    </Overlay>
  );
}

function EditorPanel({ onClose }) {
  const { doc, dispatch } = useDraft();
  const issues = doc.items.filter((i) => i.type === 'issue');
  const Stepper = ({ v, on }) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flex: '0 0 auto' }}>
      <button onClick={() => on(Math.max(1, v - 1))} style={stepBtn}>−</button>
      <span style={{ width: 78, display: 'inline-flex', justifyContent: 'center', flex: '0 0 auto' }}><Paws n={v} size={10} showNum={false} /></span>
      <button onClick={() => on(Math.min(5, v + 1))} style={stepBtn}>+</button>
    </span>
  );
  const Row = ({ it, child }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--line)', marginLeft: child ? 22 : 0 }}>
      <input value={it.name} onChange={(e) => dispatch({ t: 'itemEdit', id: it.id, patch: { name: e.target.value } })}
        style={{ flex: 1, minWidth: 0, font: 'inherit', fontSize: child ? 13 : 14, fontWeight: child ? 500 : 700, padding: '7px 9px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--panel-2)', color: 'var(--on-panel)' }} />
      <select value={it.cat} onChange={(e) => dispatch({ t: 'itemEdit', id: it.id, patch: { cat: e.target.value } })}
        style={{ font: 'inherit', fontSize: 12, padding: '7px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--panel-2)', color: 'var(--on-panel)' }}>
        {Object.entries(WR.CATS).map(([k, c]) => <option key={k} value={k}>{c.label}</option>)}
      </select>
      <Stepper v={it.paws} on={(v) => dispatch({ t: 'itemEdit', id: it.id, patch: { paws: v } })} />
      <button onClick={() => dispatch({ t: 'itemDel', id: it.id })} style={{ ...stepBtn, color: '#d9483b', borderColor: 'color-mix(in srgb,#d9483b 40%,var(--line))' }}>✕</button>
    </div>
  );
  const addIssue = () => dispatch({ t: 'itemAdd', item: { id: 'x' + Date.now(), type: 'issue', name: 'New issue', cat: 'ops', paws: 2, blurb: '' } });
  const addCommittee = (parent) => dispatch({ t: 'itemAdd', item: { id: 'c' + Date.now(), type: 'committee', parent, name: 'New committee', cat: WR.SEED_ITEMS.find(i=>i.id===parent)?.cat || 'ops', paws: 2 } });

  return (
    <Overlay title="Edit the draft pool" sub="Add, rename, reweight or remove issues & committees. Changes sync live." onClose={onClose} wide>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'var(--panel-2)', borderRadius: 12, padding: '12px 16px', marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>Capacity cap per VP</div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => dispatch({ t: 'setCap', v: doc.capPaws - 1 })} style={stepBtn}>−</button>
          <span className="mono" style={{ fontWeight: 700, width: 30, textAlign: 'center' }}>{doc.capPaws}</span>
          <button onClick={() => dispatch({ t: 'setCap', v: doc.capPaws + 1 })} style={stepBtn}>+</button>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>weight · pool total {WR.totalPaws}</span>
        </span>
        <div style={{ flex: 1 }} />
        <button onClick={() => { if (confirm('Reset the entire draft (picks, toss, sign-in)?')) { dispatch({ t: 'reset' }); onClose(); } }}
          style={{ cursor: 'pointer', fontWeight: 700, fontSize: 12.5, padding: '8px 14px', borderRadius: 9, border: '1px solid color-mix(in srgb,#d9483b 40%,var(--line))', background: 'transparent', color: '#d9483b' }}>Reset draft</button>
      </div>
      {issues.map((iss) => (
        <div key={iss.id} style={{ marginBottom: 14 }}>
          <Row it={iss} />
          {doc.items.filter((c) => c.parent === iss.id).map((c) => <Row key={c.id} it={c} child />)}
          <button onClick={() => addCommittee(iss.id)} style={{ ...miniAdd, marginLeft: 22, marginTop: 6 }}>+ committee under {iss.name}</button>
        </div>
      ))}
      <button onClick={addIssue} className="feature-bar" style={{ cursor: 'pointer', fontWeight: 800, fontSize: 13.5, padding: '11px 18px', borderRadius: 11, border: 'none', marginTop: 6 }}>+ Add an issue</button>
    </Overlay>
  );
}
const stepBtn = { cursor: 'pointer', width: 28, height: 28, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--panel-2)', color: 'var(--on-panel)', fontWeight: 800, fontSize: 14, flex: '0 0 auto' };
const miniAdd = { cursor: 'pointer', fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', background: 'transparent', border: '1px dashed var(--line)', borderRadius: 8, padding: '6px 11px' };

function ResultsPanel({ onClose }) {
  const { doc, sel } = useDraft();
  const rosters = ['day', 'eve'].map((r) => ({ role: r, items: sel.owned(doc, r), load: sel.load(doc, r) }));
  const shared = doc.items.filter((i) => doc.owners[i.id] === 'shared');

  const csv = () => {
    const rows = [['Owner', 'Type', 'Item', 'Category', 'Weight', 'PickOrder']];
    doc.pickOrder.forEach((id, i) => { const it = doc.items.find((x) => x.id === id); if (it) rows.push([WR.VPS[doc.owners[id]].role, it.type, it.name, WR.CATS[it.cat].label, it.paws, i + 1]); });
    const blob = new Blob([rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'sba-duty-draft.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const Roster = ({ role, items, load }) => (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <VPBadge role={role} size={34} />
        <div><div className="cond" style={{ fontSize: 18, fontWeight: 800, textTransform: 'uppercase', lineHeight: 1 }}>{doc.names[role] || WR.VPS[role].role}</div>
          <div className="mono" style={{ fontSize: 10, color: 'var(--muted)' }}>{items.length} PICKS · {load} WEIGHT</div></div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {items.map((m) => (
          <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, background: 'var(--panel-2)', borderLeft: `4px solid ${WR.CATS[m.cat].color}`, marginLeft: m.type === 'committee' ? 16 : 0 }}>
            <span style={{ flex: 1, fontSize: 13, fontWeight: m.type === 'committee' ? 500 : 700 }}>{m.type === 'committee' ? '▸ ' : ''}{m.name}</span><Paws n={m.paws} size={10} showNum={false} />
          </div>
        ))}
        {items.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 13 }}>No picks.</div>}
      </div>
    </div>
  );

  return (
    <Overlay title="Draft results" sub={doc.phase === 'results' ? 'Draft complete' : 'In progress — live snapshot'} onClose={onClose} wide>
      <div style={{ display: 'flex', gap: 30 }}>
        <Roster {...rosters[0]} />
        <Roster {...rosters[1]} />
      </div>
      {shared.length > 0 && (
        <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px dashed var(--line)' }}>
          <div className="mono" style={{ fontSize: 10.5, letterSpacing: '.14em', color: 'var(--muted)', marginBottom: 8 }}>SHARED / UNASSIGNED PILE ({shared.length})</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {shared.map((m) => <span key={m.id} style={{ fontSize: 12.5, fontWeight: 600, background: 'var(--panel-2)', borderRadius: 8, padding: '6px 11px' }}>{m.name} · wt {m.paws}</span>)}
          </div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
        <button onClick={csv} className="feature-bar" style={{ cursor: 'pointer', fontWeight: 800, fontSize: 13.5, padding: '12px 18px', borderRadius: 11, border: 'none' }}>Export sheet (CSV)</button>
        <button onClick={() => window.print()} style={{ cursor: 'pointer', fontWeight: 800, fontSize: 13.5, padding: '12px 18px', borderRadius: 11, border: '1px solid var(--line)', background: 'var(--panel)', color: 'var(--on-panel)' }}>Print / Save PDF</button>
      </div>
    </Overlay>
  );
}

// CSV export — shared helper so the review screen can reuse it.
function exportCSV(doc) {
  const rows = [['Owner', 'Type', 'Item', 'Category', 'Weight']];
  ['day', 'eve', 'shared'].forEach((r) => {
    doc.items.filter((i) => doc.owners[i.id] === r).forEach((it) => rows.push([WR.VPS[r].role, it.type, it.name, WR.CATS[it.cat].label, it.paws]));
  });
  // Shared duties (Bylaws §5.02) — held jointly, included in every export
  rows.push([], ['Shared Duties (Bylaws \u00a7 5.02) — held jointly by both Vice Presidents']);
  WR.SHARED.duties.forEach((dd) => rows.push(['Both VPs', 'Shared duty', `${dd.k}. ${dd.t}`, '', '']));
  WR.SHARED.alsoShared.forEach((t) => rows.push(['Both VPs', 'Shared duty', t, '', '']));
  const blob = new Blob([rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')], { type: 'text/csv' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'sba-duty-draft.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// PrintArea — portaled to <body> (OUTSIDE #root) so the print stylesheet can
// hide #root and show only this. Reads the live doc; always mounted.
function PrintArea() {
  const { doc, sel } = useDraft();
  const rosters = ['day', 'eve'].map((r) => ({ role: r, items: sel.owned(doc, r), load: sel.load(doc, r) }));
  const shared = doc.items.filter((i) => doc.owners[i.id] === 'shared');
  const node = (
    <div id="print-area" style={{ padding: 40, color: '#111', fontFamily: '"Hanken Grotesk", sans-serif', background: '#fff' }}>
      <div style={{ textAlign: 'center', borderBottom: '2px solid #111', paddingBottom: 12, marginBottom: 20 }}>
        <div className="mono" style={{ fontSize: 11, letterSpacing: '.3em' }}>McGEORGE SBA · UNIVERSITY OF THE PACIFIC</div>
        <div className="cond" style={{ fontSize: 32, fontWeight: 900, textTransform: 'uppercase', margin: '4px 0' }}>The Duty Draft '26 — Allocation of Duties</div>
        <div style={{ fontSize: 12, color: '#555' }}>{doc.phase === 'final' ? 'FINAL' : 'Draft'} · {new Date().toLocaleDateString()} · cap {doc.capPaws} per VP</div>
      </div>
      <div style={{ display: 'flex', gap: 48 }}>
        {rosters.map((r) => (
          <div key={r.role} style={{ flex: 1 }}>
            <div className="cond" style={{ fontSize: 19, fontWeight: 800, textTransform: 'uppercase', borderBottom: '1px solid #bbb', paddingBottom: 6, marginBottom: 9 }}>
              {doc.names[r.role] || WR.VPS[r.role].role}
              <span style={{ float: 'right', fontFamily: '"JetBrains Mono",monospace', fontSize: 12, color: '#666' }}>{r.items.length} picks · {r.load} weight</span>
            </div>
            {r.items.map((m) => (
              <div key={m.id} style={{ fontSize: 13.5, padding: '4px 0', marginLeft: m.type === 'committee' ? 18 : 0, borderBottom: '1px dotted #e3e3e3' }}>
                {m.type === 'committee' ? '▸ ' : '▪ '}{m.name} <span style={{ color: '#888', fontFamily: '"JetBrains Mono",monospace', fontSize: 11 }}>({m.paws})</span>
              </div>
            ))}
            {r.items.length === 0 && <div style={{ fontSize: 13, color: '#999' }}>— none —</div>}
          </div>
        ))}
      </div>
      {shared.length > 0 && (
        <div style={{ marginTop: 22, paddingTop: 12, borderTop: '1px solid #bbb', fontSize: 13 }}>
          <strong>Shared / Unassigned:</strong> {shared.map((m) => `${m.name} (${m.paws})`).join(' · ')}
        </div>
      )}
      <div style={{ marginTop: 26, paddingTop: 14, borderTop: '2px solid #111' }}>
        <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 3 }}>Shared Duties — Bylaws § 5.02</div>
        <div style={{ fontSize: 11.5, color: '#666', marginBottom: 9 }}>Held jointly by both Vice Presidents; not part of the draft allocation.</div>
        {WR.SHARED.duties.map((dd) => (
          <div key={dd.k} style={{ fontSize: 12.5, padding: '2px 0', lineHeight: 1.4 }}><strong>{dd.k}.</strong> {dd.t}</div>
        ))}
        <div style={{ fontSize: 12, color: '#444', marginTop: 8 }}><strong>Also shared:</strong> {WR.SHARED.alsoShared.join(' · ')}</div>
      </div>
    </div>
  );
  return ReactDOM.createPortal(node, document.body);
}

Object.assign(window, { SharedPanel, EditorPanel, ResultsPanel, PrintArea, exportCSV });
