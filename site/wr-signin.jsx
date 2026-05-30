/* ============================================================
   wr-signin.jsx — lobby: claim Day or Evening VP, see presence,
   remote-play guidance, enter the War Room.
   ============================================================ */

function SignIn() {
  const { doc, dispatch, myRole, claimRole, presence } = useDraft();
  const [name, setName] = React.useState('');

  const claim = (role) => {claimRole(role, doc.names[role] || '');};
  const saveName = (v) => {setName(v);if (myRole && myRole !== 'view') claimRole(myRole, v);};

  const RoleCard = ({ role }) => {
    const p = WR.VPS[role];
    const mine = myRole === role;
    const live = presence[role];
    const named = doc.names[role];
    return (
      <button onClick={() => claim(role)} className={'lift' + (mine ? ' glow' : '')}
      style={{ textAlign: 'left', cursor: 'pointer', flex: 1, minWidth: 0, background: 'var(--panel)', color: 'var(--on-panel)',
        border: '1px solid var(--line)', borderRadius: 18, padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <VPBadge role={role} size={52} ring={mine ? 'var(--highlight)' : undefined} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="cond" style={{ fontSize: 26, fontWeight: 800, lineHeight: 1, textTransform: 'uppercase', letterSpacing: '.01em' }}>{p.role}</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>Represents the {p.rep}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 700 }}>
          <span style={{ width: 9, height: 9, borderRadius: 99, background: live ? 'var(--brand)' : 'var(--muted)', boxShadow: live ? '0 0 0 3px color-mix(in srgb, var(--brand) 30%, transparent)' : 'none' }} />
          <span style={{ color: live ? 'var(--on-panel)' : 'var(--muted)' }}>
            {mine ? 'You — connected' : live ? `Connected${named ? ' · ' + named : ''}` : named ? `${named} (away)` : 'Open — tap to take this seat'}
          </span>
        </div>
        {mine &&
        <input value={name || named || ''} onChange={(e) => saveName(e.target.value)} placeholder="Your name (optional)"
        onClick={(e) => e.stopPropagation()}
        style={{ font: 'inherit', fontSize: 14, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--panel-2)', color: 'var(--on-panel)', outline: 'none' }} />
        }
      </button>);

  };

  return (
    <div className="scroll" style={{ height: '100vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 24px' }}>
      {/* masthead */}
      <div style={{ width: '100%', maxWidth: 960, display: 'flex', alignItems: 'center', gap: 18, padding: '40px 0 8px' }}>
        <Logo which="tiger" size={66} bare title="Pacific Tigers" />
        <div style={{ flex: 1 }}>
          <div className="mono" style={{ fontSize: 11, letterSpacing: '.28em', color: 'var(--muted)' }}>McGEORGE SBA · UNIVERSITY OF THE PACIFIC</div>
          <div className="cond" style={{ fontSize: 52, fontWeight: 900, lineHeight: .92, textTransform: 'uppercase', letterSpacing: '.005em', marginTop: 4 }}>
            The Duty Draft <span style={{ color: 'var(--brand)' }}>'26</span>
          </div>
        </div>
        <Logo which="sba" size={64} title="McGeorge SBA" />
      </div>

      <div style={{ width: '100%', maxWidth: 960, fontSize: 16, color: 'var(--muted)', marginBottom: 26, lineHeight: 1.5 }}>
        Day VP &amp; Evening VP take turns drafting the issues &amp; committees each will own — straight alternating, balanced by a tiger-paw cap. Sign in below.
      </div>

      {/* seats */}
      <div style={{ width: '100%', maxWidth: 960, display: 'flex', gap: 18 }}>
        <RoleCard role="day" />
        <RoleCard role="eve" />
      </div>

      {/* remote-play note + actions */}
      <div className="card" style={{ width: '100%', maxWidth: 960, borderRadius: 16, padding: '18px 22px', marginTop: 18, display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>Drafting from different places?</div>
          <div style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.5 }}>
            Each VP opens this on their own device and takes the opposite seat — the board stays in sync live. (Cross-window sync works now; true cross-internet sync uses a hosted backend, spec’d for handoff.)
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => window.open(location.href, '_blank')}
          style={{ cursor: 'pointer', fontWeight: 700, fontSize: 13.5, padding: '11px 16px', borderRadius: 11, border: '1px solid var(--line)', background: 'var(--panel-2)', color: 'var(--on-panel)' }}>
            Open a 2nd window
          </button>
          <button onClick={() => navigator.clipboard && navigator.clipboard.writeText(location.href)}
          style={{ cursor: 'pointer', fontWeight: 700, fontSize: 13.5, padding: '11px 16px', borderRadius: 11, border: '1px solid var(--line)', background: 'var(--panel-2)', color: 'var(--on-panel)' }}>
            Copy invite link
          </button>
        </div>
      </div>

      {/* enter */}
      <div style={{ width: '100%', maxWidth: 960, display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '24px 0 48px', gap: 16, flexWrap: 'wrap' }}>
        <button onClick={() => claimRole('view')} style={{ cursor: 'pointer', background: 'none', border: 'none', color: 'var(--muted)', fontSize: 13.5, fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 3 }}>
          Just watching
        </button>
        <button disabled={!myRole} onClick={() => {dispatch({ t: 'toReady' });}}
        className="feature-bar"
        style={{ cursor: myRole ? 'pointer' : 'not-allowed', opacity: myRole ? 1 : .5, fontWeight: 800, fontSize: 16,
          padding: '15px 30px', borderRadius: 14, border: 'none', letterSpacing: '.02em', boxShadow: '0 8px 22px var(--shadow-2)' }}>
          {presence.day && presence.eve ? 'Both VPs ready — enter the War Room →' : 'Enter the War Room →'}
        </button>
      </div>
    </div>);

}

window.SignIn = SignIn;