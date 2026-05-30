/* ============================================================
   wr-trades.jsx — the Negotiation Room (review + final phases)
   • Each VP may offer up to 3 trades (give some duties, request others)
   • Trades respect the tiger-paw cap (a swap that busts a cap is blocked)
   • Claim leftovers from the shared pile (if under cap)
   • Live chat box for discussing an offer before accept/decline
   • "Finalize duties" = BOTH VPs mark ready → locks to the final phase
     (separate from ending the draft; either can reopen to keep talking)
   ============================================================ */

function previewLoads(doc, from, to, give, get) {
  const owners = { ...doc.owners };
  give.forEach((id) => { owners[id] = to; });
  get.forEach((id) => { owners[id] = from; });
  const load = (r) => doc.items.filter((i) => owners[i.id] === r).reduce((s, i) => s + i.paws, 0);
  return { day: load('day'), eve: load('eve') };
}
const itemsOf = (doc, role) => doc.items.filter((i) => doc.owners[i.id] === role);

function MiniCap({ role, load, cap }) {
  const pct = Math.min(100, (load / cap) * 100);
  const over = load > cap;
  return (
    <div style={{ flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
        <span className="mono" style={{ color: 'var(--muted)', letterSpacing: '.1em' }}>{WR.VPS[role].short}</span>
        <span className="mono" style={{ fontWeight: 700, color: over ? '#d9483b' : 'var(--on-panel)' }}>{load}/{cap}</span>
      </div>
      <div className="inset" style={{ height: 7, borderRadius: 99, background: 'var(--panel-2)', overflow: 'hidden' }}>
        <div style={{ width: pct + '%', height: '100%', background: over ? '#d9483b' : 'var(--brand)', borderRadius: 99, transition: 'width .3s' }} />
      </div>
    </div>
  );
}

// ---------- the trade builder modal ----------
function TradeBuilder({ acting, onClose }) {
  const { doc, dispatch, Sounds } = useDraft();
  const other = acting === 'day' ? 'eve' : 'day';
  const [give, setGive] = React.useState([]);
  const [get, setGet] = React.useState([]);
  const mine = itemsOf(doc, acting);
  const theirs = itemsOf(doc, other);
  const tog = (set, id) => set((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));
  const loads = previewLoads(doc, acting, other, give, get);
  const valid = (give.length + get.length) > 0 && loads.day <= doc.capPaws && loads.eve <= doc.capPaws;
  const used = tradesUsed(doc, acting);

  const Col = ({ title, list, sel, set, tint }) => (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div className="mono" style={{ fontSize: 10, letterSpacing: '.12em', color: 'var(--muted)', marginBottom: 8 }}>{title}</div>
      <div className="scroll" style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 280, overflowY: 'auto', paddingRight: 4 }}>
        {list.map((m) => {
          const on = sel.includes(m.id);
          return (
            <button key={m.id} onClick={() => tog(set, m.id)} style={{ cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 9, padding: '9px 11px', borderRadius: 9,
              border: on ? `1.5px solid ${tint}` : '1px solid var(--line)', background: on ? `color-mix(in srgb, ${tint} 14%, var(--panel))` : 'var(--panel)', color: 'var(--on-panel)' }}>
              <span style={{ width: 15, height: 15, borderRadius: 5, flex: '0 0 auto', border: `1.5px solid ${on ? tint : 'var(--line-strong)'}`, background: on ? tint : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {on && <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#fff" strokeWidth="2"><path d="M2 5l2 2 4-5" /></svg>}
              </span>
              <span style={{ flex: 1, fontSize: 12.5, fontWeight: m.type === 'committee' ? 500 : 700, lineHeight: 1.2 }}>{m.type === 'committee' ? '▸ ' : ''}{m.name}</span>
              <Paws n={m.paws} size={9} showNum={false} />
            </button>
          );
        })}
        {list.length === 0 && <div style={{ fontSize: 12, color: 'var(--muted)', padding: 8 }}>Nothing here.</div>}
      </div>
    </div>
  );

  return (
    <div onClick={onClose} className="no-print" style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(10,8,6,.55)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={(e) => e.stopPropagation()} className="card" style={{ width: '100%', maxWidth: 720, borderRadius: 18, padding: '22px 24px', boxShadow: '0 24px 70px rgba(0,0,0,.45)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <VPBadge role={acting} size={36} />
          <div style={{ flex: 1 }}>
            <div className="cond" style={{ fontSize: 22, fontWeight: 800, textTransform: 'uppercase', lineHeight: 1 }}>Propose a trade</div>
            <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>{3 - used} of 3 offers left for {WR.VPS[acting].role}</div>
          </div>
          <button onClick={onClose} style={{ cursor: 'pointer', width: 32, height: 32, borderRadius: 99, border: '1px solid var(--line)', background: 'var(--panel-2)', color: 'var(--on-panel)', fontSize: 17 }}>×</button>
        </div>
        <div style={{ display: 'flex', gap: 18, margin: '14px 0' }}>
          <Col title={`YOU GIVE (${WR.VPS[acting].short})`} list={mine} sel={give} set={setGive} tint="var(--secondary)" />
          <div style={{ display: 'flex', alignItems: 'center', color: 'var(--muted)', fontSize: 22 }}>⇄</div>
          <Col title={`YOU REQUEST (${WR.VPS[other].short})`} list={theirs} sel={get} set={setGet} tint="var(--accent-text)" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'var(--panel-2)', borderRadius: 11, padding: '11px 14px' }}>
          <div className="mono" style={{ fontSize: 10.5, letterSpacing: '.1em', color: 'var(--muted)', flex: '0 0 auto' }}>AFTER TRADE</div>
          <MiniCap role="day" load={loads.day} cap={doc.capPaws} />
          <MiniCap role="eve" load={loads.eve} cap={doc.capPaws} />
        </div>
        {!valid && (give.length + get.length > 0) && (
          <div style={{ fontSize: 12, color: '#d9483b', marginTop: 8, fontWeight: 600 }}>This swap would push a VP over the cap — adjust the items.</div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
          <button onClick={onClose} style={{ cursor: 'pointer', fontWeight: 700, fontSize: 13.5, padding: '11px 18px', borderRadius: 11, border: '1px solid var(--line)', background: 'var(--panel)', color: 'var(--on-panel)' }}>Cancel</button>
          <button disabled={!valid || used >= 3} onClick={() => { dispatch({ t: 'tradeOffer', from: acting, give, get }); Sounds.trade(); onClose(); }}
            className="feature-bar" style={{ cursor: valid && used < 3 ? 'pointer' : 'not-allowed', opacity: valid && used < 3 ? 1 : .5, fontWeight: 800, fontSize: 14, padding: '11px 22px', borderRadius: 11, border: 'none' }}>
            Send offer →
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- a single trade offer card ----------
function TradeCard({ tr, acting }) {
  const { doc, dispatch, Sounds } = useDraft();
  const nm = (id) => { const i = doc.items.find((x) => x.id === id); return i ? i.name : '?'; };
  const Side = ({ ids, label }) => (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div className="mono" style={{ fontSize: 9, letterSpacing: '.1em', color: 'var(--muted)', marginBottom: 4 }}>{label}</div>
      {ids.length ? ids.map((id) => <div key={id} style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.25 }}>• {nm(id)}</div>) : <div style={{ fontSize: 12, color: 'var(--muted)' }}>—</div>}
    </div>
  );
  const incoming = tr.to === acting && tr.status === 'open';
  const outgoing = tr.from === acting && tr.status === 'open';
  const loads = previewLoads(doc, tr.from, tr.to, tr.give, tr.get);
  const canAccept = loads.day <= doc.capPaws && loads.eve <= doc.capPaws;
  const statusColor = { accepted: 'var(--brand)', declined: '#d9483b', withdrawn: 'var(--muted)' }[tr.status];
  return (
    <div className="card" style={{ borderRadius: 12, padding: '12px 14px', borderLeft: `4px solid ${incoming ? 'var(--highlight)' : 'var(--line-strong)'}`, opacity: tr.status === 'open' ? 1 : .7 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
        <VPBadge role={tr.from} size={22} />
        <span style={{ fontSize: 12, fontWeight: 700 }}>{WR.VPS[tr.from].short} → {WR.VPS[tr.to].short}</span>
        <div style={{ flex: 1 }} />
        {tr.status !== 'open' && <span className="mono" style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '.1em', color: statusColor, textTransform: 'uppercase' }}>{tr.status}</span>}
        {incoming && <span className="mono" style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '.1em', color: 'var(--highlight)' }}>NEEDS YOU</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <Side ids={tr.give} label={`${WR.VPS[tr.from].short} GIVES`} />
        <span style={{ color: 'var(--muted)', fontSize: 16, paddingTop: 12 }}>⇄</span>
        <Side ids={tr.get} label={`${WR.VPS[tr.to].short} GIVES`} />
      </div>
      {incoming && (
        <div style={{ display: 'flex', gap: 8, marginTop: 11 }}>
          <button disabled={!canAccept} onClick={() => { dispatch({ t: 'tradeRespond', id: tr.id, accept: true }); Sounds.trade(); }}
            style={{ flex: 1, cursor: canAccept ? 'pointer' : 'not-allowed', opacity: canAccept ? 1 : .5, fontWeight: 800, fontSize: 12.5, padding: '9px', borderRadius: 9, border: 'none', background: 'var(--brand)', color: '#fff' }}>
            {canAccept ? 'Accept' : 'Over cap'}
          </button>
          <button onClick={() => dispatch({ t: 'tradeRespond', id: tr.id, accept: false })}
            style={{ flex: 1, cursor: 'pointer', fontWeight: 800, fontSize: 12.5, padding: '9px', borderRadius: 9, border: '1px solid var(--line)', background: 'var(--panel-2)', color: 'var(--on-panel)' }}>Decline</button>
        </div>
      )}
      {outgoing && (
        <button onClick={() => dispatch({ t: 'tradeWithdraw', id: tr.id })}
          style={{ marginTop: 10, width: '100%', cursor: 'pointer', fontWeight: 700, fontSize: 12, padding: '8px', borderRadius: 9, border: '1px solid var(--line)', background: 'var(--panel-2)', color: 'var(--muted)' }}>Withdraw offer</button>
      )}
    </div>
  );
}

// ---------- live chat ----------
function Chat({ acting }) {
  const { doc, dispatch, Sounds } = useDraft();
  const [text, setText] = React.useState('');
  const scrollRef = React.useRef(null);
  const count = doc.chat.length;
  React.useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [count]);
  const send = () => { if (!text.trim()) return; dispatch({ t: 'chat', by: acting, text }); setText(''); };
  return (
    <div className="card" style={{ width: 320, flex: '0 0 auto', borderRadius: 16, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 8, height: 8, borderRadius: 99, background: 'var(--brand)' }} />
        <span className="cond" style={{ fontSize: 17, fontWeight: 800, textTransform: 'uppercase' }}>Negotiation chat</span>
      </div>
      <div ref={scrollRef} className="scroll" style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 9, minHeight: 0 }}>
        {doc.chat.length === 0 && <div style={{ fontSize: 12.5, color: 'var(--muted)', textAlign: 'center', marginTop: 20 }}>No messages yet. Talk it out before you trade.</div>}
        {doc.chat.map((m, i) => m.sys ? (
          <div key={i} style={{ textAlign: 'center', fontSize: 11, color: 'var(--muted)', fontStyle: 'italic' }}>
            <strong style={{ color: 'var(--on-panel)' }}>{WR.VPS[m.by].short} VP</strong> {m.text}
          </div>
        ) : (
          <div key={i} style={{ alignSelf: m.by === acting ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
            <div className="mono" style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: '.08em', marginBottom: 2, textAlign: m.by === acting ? 'right' : 'left' }}>{WR.VPS[m.by].short} VP</div>
            <div style={{ fontSize: 13, lineHeight: 1.35, padding: '8px 12px', borderRadius: 12, background: m.by === acting ? 'var(--secondary)' : 'var(--panel-2)', color: m.by === acting ? 'var(--on-secondary)' : 'var(--on-panel)',
              borderBottomRightRadius: m.by === acting ? 3 : 12, borderBottomLeftRadius: m.by === acting ? 12 : 3 }}>{m.text}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: 12, borderTop: '1px solid var(--line)', display: 'flex', gap: 8 }}>
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') send(); }} placeholder={`Message as ${WR.VPS[acting].short} VP…`}
          style={{ flex: 1, minWidth: 0, font: 'inherit', fontSize: 13, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--panel-2)', color: 'var(--on-panel)', outline: 'none' }} />
        <button onClick={send} className="feature-bar" style={{ cursor: 'pointer', fontWeight: 800, fontSize: 13, padding: '0 16px', borderRadius: 10, border: 'none' }}>Send</button>
      </div>
    </div>
  );
}

// ---------- the room ----------
function ReviewRoom({ onOpen }) {
  const { doc, dispatch, myRole, sel } = useDraft();
  const final = doc.phase === 'final';
  const myVP = (myRole === 'day' || myRole === 'eve') ? myRole : null;
  const [persp, setPersp] = React.useState(myVP || 'day');
  const acting = myVP || persp;
  const [builder, setBuilder] = React.useState(false);

  const openTrades = doc.trades.filter((t) => t.status === 'open');
  const incoming = openTrades.filter((t) => t.to === acting);
  const visibleTrades = [...doc.trades].reverse();
  const shared = doc.items.filter((i) => doc.owners[i.id] === 'shared');

  const Roster = ({ role }) => {
    const items = sel.owned(doc, role); const load = sel.load(doc, role);
    const onClock = acting === role;
    return (
      <div className="card" style={{ flex: 1, minWidth: 0, borderRadius: 14, padding: '14px 15px', display: 'flex', flexDirection: 'column', minHeight: 0, boxShadow: onClock ? '0 0 0 2px var(--highlight), 0 6px 18px var(--shadow)' : undefined }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 11 }}>
          <VPBadge role={role} size={36} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="cond" style={{ fontSize: 18, fontWeight: 800, textTransform: 'uppercase', lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.names[role] || WR.VPS[role].role}</div>
            <div className="mono" style={{ fontSize: 9.5, color: 'var(--muted)' }}>{items.length} DUTIES · {load} WEIGHT</div>
          </div>
          {doc.ready[role] && <span className="mono" style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '.1em', color: 'var(--brand)', border: '1px solid var(--brand)', borderRadius: 6, padding: '3px 7px' }}>READY ✓</span>}
        </div>
        <div className="scroll" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, minHeight: 0, paddingRight: 2 }}>
          {items.map((m) => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, background: 'var(--panel-2)', borderLeft: `4px solid ${WR.CATS[m.cat].color}`, marginLeft: m.type === 'committee' ? 14 : 0 }}>
              <span style={{ flex: 1, fontSize: 12.5, fontWeight: m.type === 'committee' ? 500 : 700, lineHeight: 1.2 }}>{m.type === 'committee' ? '▸ ' : ''}{m.name}</span>
              <Paws n={m.paws} size={9} showNum={false} />
            </div>
          ))}
          {items.length === 0 && <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>No duties.</div>}
        </div>
      </div>
    );
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* top bar */}
      <div className="feature-bar no-print" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '11px 18px', flex: '0 0 auto' }}>
        <Logo which="tiger" size={40} bare />
        <div className="cond" style={{ fontSize: 22, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.03em' }}>Negotiation Room</div>
        {final && <span className="mono" style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.14em', background: 'var(--highlight)', color: 'var(--on-highlight)', padding: '4px 10px', borderRadius: 6 }}>● DUTIES FINALIZED</span>}
        <SyncBadge />
        <div style={{ flex: 1 }} />
        <Logo which="sba" size={34} bare title="McGeorge SBA" />
        <ThemeBar />
        <div style={{ display: 'flex', gap: 7 }}>
          <button onClick={() => onOpen('directory')} style={topBtn}>Directory</button>
          <button onClick={() => onOpen('shared')} style={topBtn}>Shared duties</button>
          <button onClick={() => onOpen('curator')} style={topBtn}>Curator</button>
          <button onClick={() => exportCSV(doc)} style={topBtn}>CSV</button>
          <button onClick={() => window.print()} style={topBtn}>PDF</button>
        </div>
      </div>

      {/* acting-as switch */}
      <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 18px', background: 'var(--panel-2)', borderBottom: '1px solid var(--line)', flex: '0 0 auto' }}>
        <span className="mono" style={{ fontSize: 10.5, letterSpacing: '.12em', color: 'var(--muted)' }}>ACTING AS</span>
        {['day', 'eve'].map((r) => (
          <button key={r} onClick={() => setPersp(r)} disabled={!!myVP && myVP !== r}
            style={{ cursor: (!myVP || myVP === r) ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 7, fontWeight: 700, fontSize: 12.5, padding: '6px 12px', borderRadius: 99,
              border: '1px solid var(--line)', background: acting === r ? 'var(--secondary)' : 'var(--panel)', color: acting === r ? 'var(--on-secondary)' : 'var(--muted)', opacity: (!myVP || myVP === r) ? 1 : .4 }}>
            <VPBadge role={r} size={18} /> {WR.VPS[r].role}
          </button>
        ))}
        {myVP && <span style={{ fontSize: 12, color: 'var(--muted)' }}>· you hold the {WR.VPS[myVP].short} seat</span>}
        {!myVP && <span style={{ fontSize: 12, color: 'var(--muted)' }}>· spectator / one-device — switch seats to act for either VP</span>}
        <div style={{ flex: 1 }} />
        <span className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>{3 - tradesUsed(doc, acting)} trade offers left</span>
      </div>

      {/* body */}
      <div style={{ flex: 1, display: 'flex', gap: 16, padding: '14px 18px', minHeight: 0 }} className="no-print">
        {/* left: rosters + trades + finalize */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14, minHeight: 0 }}>
          <div style={{ display: 'flex', gap: 14, flex: '1 1 40%', minHeight: 0 }}>
            <Roster role="day" /><Roster role="eve" />
          </div>

          {/* trades */}
          <div style={{ flex: '1 1 60%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span className="cond" style={{ fontSize: 18, fontWeight: 800, textTransform: 'uppercase' }}>Trades</span>
              {incoming.length > 0 && <span className="mono" style={{ fontSize: 10, fontWeight: 800, background: 'var(--highlight)', color: 'var(--on-highlight)', borderRadius: 6, padding: '3px 8px' }}>{incoming.length} AWAITING YOU</span>}
              <div style={{ flex: 1 }} />
              {!final && (
                <button onClick={() => setBuilder(true)} disabled={tradesUsed(doc, acting) >= 3} className="feature-bar"
                  style={{ cursor: tradesUsed(doc, acting) < 3 ? 'pointer' : 'not-allowed', opacity: tradesUsed(doc, acting) < 3 ? 1 : .5, fontWeight: 800, fontSize: 13, padding: '9px 16px', borderRadius: 10, border: 'none' }}>
                  + Propose a trade
                </button>
              )}
            </div>
            <div className="scroll" style={{ flex: 1, overflowY: 'auto', minHeight: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10, alignContent: 'start', paddingRight: 4 }}>
              {visibleTrades.map((tr) => <TradeCard key={tr.id} tr={tr} acting={acting} />)}
              {doc.trades.length === 0 && <div style={{ fontSize: 13, color: 'var(--muted)', gridColumn: '1/-1', padding: 8 }}>No trades yet. {final ? '' : 'Propose one above — each VP gets up to 3 offers.'}</div>}
            </div>
            {/* shared pile claim */}
            {shared.length > 0 && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed var(--line)' }}>
                <div className="mono" style={{ fontSize: 9.5, letterSpacing: '.12em', color: 'var(--muted)', marginBottom: 7 }}>SHARED PILE — CLAIM IF UNDER CAP</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {shared.map((m) => {
                    const can = !final && sel.load(doc, acting) + m.paws <= doc.capPaws;
                    return (
                      <button key={m.id} disabled={!can} onClick={() => dispatch({ t: 'claimShared', id: m.id, role: acting })}
                        style={{ cursor: can ? 'pointer' : 'not-allowed', opacity: can ? 1 : .55, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, padding: '6px 11px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--panel)', color: 'var(--on-panel)' }}>
                        {m.name} <Paws n={m.paws} size={8} showNum={false} /> {can && <span style={{ color: 'var(--brand)', fontWeight: 800 }}>+ claim</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* finalize bar */}
          <div className="card" style={{ flex: '0 0 auto', borderRadius: 14, padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            {final ? (
              <React.Fragment>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div className="cond" style={{ fontSize: 18, fontWeight: 800, textTransform: 'uppercase' }}>Duties are final</div>
                  <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>Locked by both VPs. Reopen if you want to keep negotiating.</div>
                </div>
                <button onClick={() => dispatch({ t: 'reopen' })} style={{ cursor: 'pointer', fontWeight: 700, fontSize: 13, padding: '11px 18px', borderRadius: 11, border: '1px solid var(--line)', background: 'var(--panel-2)', color: 'var(--on-panel)' }}>Reopen negotiations</button>
                <button onClick={() => exportCSV(doc)} className="feature-bar" style={{ cursor: 'pointer', fontWeight: 800, fontSize: 13, padding: '11px 18px', borderRadius: 11, border: 'none' }}>Export sheet</button>
              </React.Fragment>
            ) : (
              <React.Fragment>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div className="cond" style={{ fontSize: 18, fontWeight: 800, textTransform: 'uppercase' }}>Finalize duties</div>
                  <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>Both VPs lock it in. Negotiations stay open until then.</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['day', 'eve'].map((r) => (
                    <span key={r} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, padding: '6px 11px', borderRadius: 99, background: doc.ready[r] ? 'color-mix(in srgb,var(--brand) 18%,var(--panel))' : 'var(--panel-2)', color: doc.ready[r] ? 'var(--brand)' : 'var(--muted)' }}>
                      <VPBadge role={r} size={16} /> {doc.ready[r] ? 'Ready ✓' : 'Not ready'}
                    </span>
                  ))}
                </div>
                <button onClick={() => dispatch({ t: 'ready', role: acting, v: !doc.ready[acting] })} className={doc.ready[acting] ? '' : 'feature-bar'}
                  style={{ cursor: 'pointer', fontWeight: 800, fontSize: 13.5, padding: '11px 20px', borderRadius: 11, border: doc.ready[acting] ? '1px solid var(--line)' : 'none', background: doc.ready[acting] ? 'var(--panel-2)' : undefined, color: doc.ready[acting] ? 'var(--on-panel)' : undefined }}>
                  {doc.ready[acting] ? `Unready (${WR.VPS[acting].short})` : `${WR.VPS[acting].short} ready to finalize →`}
                </button>
              </React.Fragment>
            )}
          </div>
        </div>

        {/* right: chat */}
        <Chat acting={acting} />
      </div>

      {builder && <TradeBuilder acting={acting} onClose={() => setBuilder(false)} />}
    </div>
  );
}

window.ReviewRoom = ReviewRoom;
const topBtn = { cursor: 'pointer', fontWeight: 700, fontSize: 12.5, padding: '8px 12px', borderRadius: 9, border: '1px solid color-mix(in srgb, var(--on-accent) 30%, transparent)', background: 'color-mix(in srgb, var(--on-accent) 12%, transparent)', color: 'var(--on-accent)' };
