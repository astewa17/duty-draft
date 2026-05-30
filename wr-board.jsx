/* ============================================================
   wr-board.jsx — the War Room draft board
   Turn-gated drafting · hard tiger-paw cap · issue→committee offer ·
   shared/unassigned pile · live ticker · broadcast stingers.
   ============================================================ */

function CapMeter({ role }) {
  const { doc, sel } = useDraft();
  const load = sel.load(doc, role); const cap = doc.capPaws;
  const pct = Math.min(100, (load / cap) * 100);
  const left = cap - load;
  const col = left <= 0 ? '#d9483b' : left <= 4 ? 'var(--highlight)' : 'var(--brand)';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
        <span className="mono" style={{ fontSize: 10, letterSpacing: '.12em', color: 'var(--muted)' }}>WORKLOAD</span>
        <span className="mono" style={{ fontSize: 12, fontWeight: 700 }}>{load}<span style={{ color: 'var(--muted)' }}>/{cap}</span> <span style={{ color: col }}>· {left <= 0 ? 'FULL' : left + ' left'}</span></span>
      </div>
      <div className="inset" style={{ height: 9, borderRadius: 99, background: 'var(--panel-2)', overflow: 'hidden' }}>
        <div style={{ width: pct + '%', height: '100%', borderRadius: 99, background: col, transition: 'width .35s cubic-bezier(.2,.7,.3,1)' }} />
      </div>
    </div>
  );
}

function Rail({ role, side, actor, canPick }) {
  const { doc, dispatch, sel } = useDraft();
  const p = WR.VPS[role];
  const owned = sel.owned(doc, role);
  const onClock = doc.turn === role && doc.phase === 'draft';
  return (
    <div style={{ width: 270, flex: '0 0 auto', display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
      <div className="card" style={{ borderRadius: 14, padding: '13px 14px', ...(onClock ? { animation: 'onclock 1.6s infinite' } : {}) }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 12 }}>
          <VPBadge role={role} size={40} ring={onClock ? 'var(--highlight)' : undefined} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="cond" style={{ fontSize: 19, fontWeight: 800, lineHeight: 1, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.names[role] || p.role}</div>
            <div className="mono" style={{ fontSize: 9.5, color: 'var(--muted)', letterSpacing: '.08em', marginTop: 3 }}>{owned.length} PICKS · {p.short} VP</div>
          </div>
        </div>
        <CapMeter role={role} />
        {(canPick && actor === role && doc.phase === 'draft' && !doc.pending) && (
          <button onClick={() => dispatch({ t: 'pass', role })}
            style={{ marginTop: 11, width: '100%', cursor: 'pointer', fontWeight: 700, fontSize: 12.5, padding: '9px', borderRadius: 9, border: '1px solid var(--line)', background: 'var(--panel-2)', color: 'var(--muted)' }}>
            I’m set. Pass remaining.
          </button>
        )}
      </div>
      {doc.showChart && (
        <div className="card" style={{ borderRadius: 14, padding: '13px 14px', flex: '0 0 auto' }}>
          <div className="mono" style={{ fontSize: 9.5, letterSpacing: '.12em', color: 'var(--muted)', marginBottom: 10 }}>FOCUS BY CATEGORY</div>
          <CategoryDonut role={role} size={118} />
        </div>
      )}
      <div className="scroll" style={{ display: 'flex', flexDirection: 'column', gap: 7, overflowY: 'auto', minHeight: 0, flex: 1, paddingRight: 2 }}>
        {owned.map((m) => (
          <div key={m.id} className="card lift" style={{ borderRadius: 9, padding: m.type === 'committee' ? '7px 10px 7px 14px' : '10px 11px', borderLeft: `4px solid ${WR.CATS[m.cat].color}`, marginLeft: m.type === 'committee' ? 16 : 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {m.type === 'committee' && <span className="mono" style={{ fontSize: 9, color: 'var(--muted)', flex: '0 0 auto' }}>▸</span>}
              <span style={{ fontWeight: 700, fontSize: m.type === 'committee' ? 12 : 13.5, lineHeight: 1.15, flex: 1 }}>{m.name}</span>
              <Paws n={m.paws} size={11} showNum={false} />
            </div>
          </div>
        ))}
        {owned.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 12.5, padding: '12px 4px' }}>No picks yet.</div>}
      </div>
    </div>
  );
}

function DraftBtn({ item, actor, canPick, child }) {
  const { doc, dispatch, sel } = useDraft();
  const owner = doc.owners[item.id];
  if (owner) {
    const supporters = (doc.collab && doc.collab[item.id]) || [];
    const iSupport = supporters.includes(actor);
    const canCollab = doc.collabOn && canPick && owner !== 'shared' && owner !== actor &&
      (doc.phase === 'draft' || doc.phase === 'review') &&
      (iSupport || (sel.load(doc, actor) + 1 <= doc.capPaws && (Object.values(doc.collab || {}).filter((arr) => arr.includes(actor)).length < 2)));
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 800 }}>
        <VPBadge role={owner} size={20} /> <span className="mono" style={{ fontSize: 9.5, color: 'var(--muted)' }}>{owner === 'shared' ? 'SHARED' : 'LEAD'}</span>
        {supporters.map((r) => <VPBadge key={r} role={r} size={18} ring="var(--highlight)" />)}
        {canCollab && (
          <button onClick={() => dispatch({ t: 'collabToggle', id: item.id, role: actor })}
            title={iSupport ? 'Remove your support' : 'Flag interest to support this (+1 workload)'}
            style={{ cursor: 'pointer', fontWeight: 800, fontSize: 10, letterSpacing: '.03em', padding: '5px 9px', borderRadius: 7, border: '1px solid var(--highlight)',
              background: iSupport ? 'var(--highlight)' : 'transparent', color: iSupport ? 'var(--on-highlight)' : 'var(--accent-text)' }}>
            {iSupport ? 'SUPPORTING ✓' : '+ COLLABORATE'}
          </button>
        )}
      </span>
    );
  }
  const afford = sel.affordable(doc, item, actor);
  const live = canPick && doc.phase === 'draft' && afford && (!doc.pending || (child && doc.pending.by === actor));
  const act = () => { if (!live) return; dispatch(child && doc.pending ? { t: 'addChild', id: item.id } : { t: 'draft', id: item.id, role: actor }); };
  return (
    <button onClick={act} disabled={!live} title={!afford ? `Over cap by ${item.paws}` : ''}
      style={{ cursor: live ? 'pointer' : 'not-allowed', fontWeight: 800, fontSize: child ? 10.5 : 11.5, letterSpacing: '.04em',
        padding: child ? '5px 9px' : '7px 12px', borderRadius: 8, border: afford ? 'none' : '1px dashed var(--line)',
        background: live ? 'var(--brand)' : afford ? 'color-mix(in srgb, var(--brand) 22%, var(--panel))' : 'transparent',
        color: live ? '#fff' : afford ? 'var(--brand)' : 'var(--muted)', opacity: !afford ? .7 : 1 }}>
      {afford ? (child ? '+ ADD' : 'DRAFT') : 'OVER CAP'}
    </button>
  );
}

function IssueCard({ item, actor, canPick, onOpen }) {
  const { doc, sel } = useDraft();
  const kids = sel.childrenOf(doc, item.id);
  const owner = doc.owners[item.id];
  return (
    <div className="card lift" style={{ borderRadius: 13, padding: '14px 15px', borderTop: `4px solid ${WR.CATS[item.cat].color}`, display: 'flex', flexDirection: 'column', gap: 9, opacity: owner ? .82 : 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <CatTag cat={item.cat} /><Paws n={item.paws} size={12} />
      </div>
      <div style={{ fontWeight: 800, fontSize: 16, lineHeight: 1.15 }}>{item.name}</div>
      {item.blurb && <div style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.4 }}>{item.blurb}</div>}
      <div style={{ marginTop: 2 }}><DraftBtn item={item} actor={actor} canPick={canPick} /></div>
      {kids.length > 0 && (
        <div style={{ marginTop: 4, paddingTop: 10, borderTop: '1px dashed var(--line)', display: 'flex', flexDirection: 'column', gap: 7 }}>
          <span className="mono" style={{ fontSize: 9, letterSpacing: '.1em', color: 'var(--muted)' }}>COMMITTEES UNDER THIS ISSUE</span>
          {kids.map((k) => (
            <div key={k.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 7 }}>{k.name} <Paws n={k.paws} size={9} showNum={false} /></span>
              <DraftBtn item={k} actor={actor} canPick={canPick} child />
            </div>
          ))}
        </div>
      )}
      <ContactsPeek issueId={item.id} onOpen={onOpen} />
    </div>
  );
}

function OfferBar({ actor, canPick }) {
  const { doc, dispatch, sel } = useDraft();
  if (!doc.pending) return null;
  const issue = doc.items.find((i) => i.id === doc.pending.issueId);
  const kids = sel.childrenOf(doc, issue.id);
  const mine = canPick && doc.pending.by === actor;
  return (
    <div className="card" style={{ borderRadius: 14, padding: '13px 16px', borderLeft: '5px solid var(--highlight)', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: 200 }}>
        <div className="mono" style={{ fontSize: 10, letterSpacing: '.14em', color: 'var(--highlight)' }}>BONUS · RELATED COMMITTEES</div>
        <div style={{ fontWeight: 800, fontSize: 14.5, marginTop: 3 }}>{mine ? `You drafted “${issue.name}.” Grab its committees?` : `${WR.VPS[doc.pending.by].role} is choosing committees…`}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {kids.map((k) => (
          <div key={k.id} style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'var(--panel-2)', borderRadius: 9, padding: '6px 8px 6px 11px' }}>
            <span style={{ fontSize: 12, fontWeight: 600 }}>{k.name}</span><Paws n={k.paws} size={9} showNum={false} />
            <DraftBtn item={k} actor={actor} canPick={canPick} child />
          </div>
        ))}
        {mine && <button onClick={() => dispatch({ t: 'endPick' })} className="feature-bar" style={{ cursor: 'pointer', fontWeight: 800, fontSize: 12.5, padding: '9px 16px', borderRadius: 9, border: 'none' }}>Done — end my pick →</button>}
      </div>
    </div>
  );
}

function Ticker() {
  const { doc } = useDraft();
  const items = doc.log.slice(0, 10);
  const text = items.length
    ? items.map((l) => `${WR.VPS[l.by].short} VP selects ${l.name}`).join('   ◆   ')
    : 'The draft is live. First pick is on the clock.';
  return (
    <div className="feature-bar" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '0 18px', height: 42, overflow: 'hidden' }}>
      <span className="mono" style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.12em', background: 'var(--highlight)', color: 'var(--on-highlight)', padding: '4px 9px', borderRadius: 6, flex: '0 0 auto' }}>THE PICK IS IN</span>
      <div style={{ flex: 1, overflow: 'hidden', whiteSpace: 'nowrap' }}>
        <div style={{ display: 'inline-block', whiteSpace: 'nowrap', animation: 'tickerScroll 28s linear infinite', fontWeight: 600, fontSize: 13.5 }}>
          <span style={{ paddingRight: 40 }}>{text}</span><span style={{ paddingRight: 40 }}>{text}</span>
        </div>
      </div>
    </div>
  );
}

function Toast() {
  const { doc, Sounds } = useDraft();
  const prev = React.useRef(doc.pickOrder.length);
  const [t, setT] = React.useState(null);
  React.useEffect(() => {
    if (doc.pickOrder.length > prev.current && doc.log[0]) {
      const l = doc.log[0]; Sounds.pick(); setT(l);
      const to = setTimeout(() => setT(null), 2600); prev.current = doc.pickOrder.length; return () => clearTimeout(to);
    }
    prev.current = doc.pickOrder.length;
  }, [doc.pickOrder.length]);
  if (!t) return null;
  return (
    <div className="stinger" style={{ position: 'fixed', top: 76, left: '50%', transform: 'translateX(-50%)', zIndex: 60 }}>
      <div className="feature-bar" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderRadius: 13, boxShadow: '0 12px 30px var(--shadow-2)' }}>
        <VPBadge role={t.by} size={32} ring="var(--highlight)" />
        <div><div className="mono" style={{ fontSize: 9.5, letterSpacing: '.18em', opacity: .8 }}>THE PICK IS IN</div>
          <div className="cond" style={{ fontSize: 19, fontWeight: 800, textTransform: 'uppercase', lineHeight: 1 }}>{WR.VPS[t.by].short} VP · {t.name}</div></div>
      </div>
    </div>
  );
}

function Board({ onOpen, solo, setSolo }) {
  const { doc, dispatch, myRole, sel } = useDraft();
  const actor = doc.turn;
  const canPick = (solo || myRole === actor) && myRole && myRole !== 'view';
  const [filter, setFilter] = React.useState('all');
  const issues = doc.items.filter((i) => i.type === 'issue');
  const orphans = doc.items.filter((i) => i.type === 'committee' && !issues.some((x) => x.id === i.parent));
  const shown = filter === 'all' ? issues : issues.filter((i) => i.cat === filter);
  const sharedCount = Object.values(doc.owners).filter((o) => o === 'shared').length;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* top bar */}
      <div className="feature-bar no-print" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '11px 18px', flex: '0 0 auto' }}>
        <Logo which="tiger" size={40} bare title="Pacific Tigers" />
        <div className="cond" style={{ fontSize: 23, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.03em' }}>The Duty Draft <span style={{ color: 'var(--highlight)' }}>{doc.year}</span></div>
        <span className="mono" style={{ fontSize: 11, opacity: .8, fontWeight: 700, border: '1px solid color-mix(in srgb, var(--on-accent) 35%, transparent)', borderRadius: 6, padding: '4px 9px' }}>{doc.pickOrder.filter((id)=>doc.owners[id]!=='shared').length} PICKS</span>
        <SyncBadge />
        <div style={{ flex: 1 }} />
        <Logo which="sba" size={34} bare title="McGeorge SBA" />
        <ThemeBar />
        <div style={{ display: 'flex', gap: 7 }}>
          <button onClick={() => onOpen('directory')} style={topBtn}>Directory</button>
          <button onClick={() => onOpen('shared')} style={topBtn}>Shared duties</button>
          <button onClick={() => onOpen('curator')} style={topBtn}>Curator</button>
          <button onClick={() => onOpen('results')} style={topBtn}>Results</button>
        </div>
      </div>

      {/* on the clock */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 20px', background: 'var(--secondary)', color: 'var(--on-secondary)', flex: '0 0 auto' }} className="no-print">
        <VPBadge role={actor} size={46} ring="rgba(255,255,255,.6)" />
        <div style={{ flex: 1 }}>
          <div className="mono" style={{ fontSize: 10.5, letterSpacing: '.22em', opacity: .9 }}>ON THE CLOCK</div>
          <div className="cond" style={{ fontSize: 28, fontWeight: 800, textTransform: 'uppercase', lineHeight: 1 }}>{doc.names[actor] || WR.VPS[actor].role}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="mono" style={{ fontSize: 10.5, letterSpacing: '.16em', opacity: .9 }}>{canPick ? 'YOUR PICK' : myRole === 'view' ? 'SPECTATING' : 'PLEASE WAIT'}</div>
          <div className="cond" style={{ fontSize: 17, fontWeight: 700 }}>{doc.capPaws - sel.load(doc, actor)} under cap</div>
        </div>
      </div>

      {/* body */}
      <div style={{ flex: 1, display: 'flex', gap: 16, padding: '16px 20px', minHeight: 0 }} className="no-print">
        <Rail role="day" side="left" actor={actor} canPick={canPick} />

        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
          <OfferBar actor={actor} canPick={canPick} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span className="cond" style={{ fontSize: 19, fontWeight: 800, textTransform: 'uppercase' }}>On the board</span>
            <div style={{ flex: 1 }} />
            {['all', ...Object.keys(WR.CATS)].map((f) => (
              <button key={f} onClick={() => setFilter(f)} style={{ cursor: 'pointer', fontSize: 11, fontWeight: 700, padding: '5px 10px', borderRadius: 99, border: '1px solid var(--line)',
                background: filter === f ? 'var(--accent)' : 'transparent', color: filter === f ? 'var(--on-accent)' : 'var(--muted)' }}>
                {f === 'all' ? 'All' : WR.CATS[f].label}
              </button>
            ))}
          </div>
          <div className="scroll" style={{ flex: 1, overflowY: 'auto', minHeight: 0, paddingRight: 4 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 13, alignItems: 'start' }}>
              {shown.map((it) => <IssueCard key={it.id} item={it} actor={actor} canPick={canPick} onOpen={onOpen} />)}
              {orphans.map((it) => <IssueCard key={it.id} item={it} actor={actor} canPick={canPick} onOpen={onOpen} />)}
            </div>
            {sharedCount > 0 && <div className="mono" style={{ fontSize: 11, color: 'var(--muted)', marginTop: 14 }}>{sharedCount} item(s) in the shared / unassigned pile. See Results.</div>}
          </div>
        </div>

        <Rail role="eve" side="right" actor={actor} canPick={canPick} />
      </div>

      <Ticker />
      <Toast />

      {/* solo toggle */}
      <button onClick={() => setSolo((s) => !s)} className="no-print" title="Pass-the-laptop: control both seats from one window"
        style={{ position: 'fixed', left: 14, bottom: 52, zIndex: 40, cursor: 'pointer', fontSize: 11, fontWeight: 700, padding: '6px 11px', borderRadius: 99,
          border: '1px solid var(--line)', background: solo ? 'var(--highlight)' : 'var(--panel)', color: solo ? 'var(--on-highlight)' : 'var(--muted)', boxShadow: '0 4px 12px var(--shadow)' }}>
        {solo ? '● Solo control ON' : '○ Solo (one device)'}
      </button>
    </div>
  );
}
const topBtn = { cursor: 'pointer', fontWeight: 700, fontSize: 12.5, padding: '8px 12px', borderRadius: 9, border: '1px solid color-mix(in srgb, var(--on-accent) 30%, transparent)', background: 'color-mix(in srgb, var(--on-accent) 12%, transparent)', color: 'var(--on-accent)' };

function SyncBadge() {
  const { syncMode } = useDraft();
  const map = { cloud: ['● Live online', 'var(--highlight)'], connecting: ['◌ Connecting…', 'color-mix(in srgb, var(--on-accent) 60%, transparent)'], local: ['● This device', 'color-mix(in srgb, var(--on-accent) 45%, transparent)'] };
  const [label, col] = map[syncMode] || map.local;
  return <span className="mono" title={syncMode === 'cloud' ? 'Cross-internet sync active' : 'Same-device / cross-window sync. Set up Firebase in Curator for cross-internet.'} style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.06em', color: col, border: '1px solid color-mix(in srgb, var(--on-accent) 25%, transparent)', borderRadius: 6, padding: '4px 8px' }}>{label}</span>;
}

window.Board = Board;
window.SyncBadge = SyncBadge;
