/* ============================================================
   wr-cointoss.jsx — TRUE 3D coin toss (à la coinflip3d.com)
   A solid gold cylinder: stacked gold slabs give real thickness,
   two printed faces (SBA seal = DAY / heads, Pacific tiger = EVE /
   tails). It tosses up and tumbles on the X-axis many times, then
   lands — the result is only revealed once the coin settles.
   Deterministic from doc.toss.seed so both windows land identically.
   ============================================================ */

function CoinToss() {
  const { doc, dispatch, myRole, Sounds } = useDraft();
  const { flipping, result, seed } = doc.toss;
  const DUR = 2300;
  const canFlip = myRole && myRole !== 'view';

  // Rotation is a SINGLE source of truth in React state -> inline transform.
  // No WAAPI / imperative style, so the computed 3D matrix always matches and
  // back-face culling reveals the correct face at rest.
  const [rot, setRot] = React.useState(result === 'eve' ? 180 : 0);
  const rotRef = React.useRef(rot); rotRef.current = rot;
  const animSeed = React.useRef(null);
  const [tossing, setTossing] = React.useState(false);

  React.useEffect(() => {
    if (flipping && seed != null && animSeed.current !== seed) {
      animSeed.current = seed;
      const res = seed < 0.5 ? 'day' : 'eve';
      const spins = 5 + Math.floor((seed * 1000) % 4);   // 5–8 tumbles
      const end = res === 'day' ? 0 : 180;               // DAY=heads / EVE=tails
      const base = Math.ceil((rotRef.current + 1) / 360) * 360;
      setTossing(true);
      requestAnimationFrame(() => setRot(base + spins * 360 + end));
      const t = setTimeout(() => setTossing(false), DUR);
      return () => clearTimeout(t);
    }
    if (!flipping && result) {                            // settle on the result face
      const end = result === 'eve' ? 180 : 0;
      if ((((rotRef.current % 360) + 360) % 360) !== end) setRot(Math.round(rotRef.current / 360) * 360 + end);
    }
    if (!flipping && !result) { animSeed.current = null; setRot(0); }
  }, [flipping, seed, result]);

  const flip = () => {
    if (flipping) return;
    const s = Math.random();
    Sounds.flip(DUR);
    dispatch({ t: 'flip', seed: s });
    setTimeout(() => dispatch({ t: 'flipDone', result: s < 0.5 ? 'day' : 'eve' }), DUR + 70);
  };

  const TH = 9; // half-thickness (px)
  const SILVER_FACE = 'radial-gradient(circle at 38% 26%, #f4f5f6 0%, #d6dadf 26%, #a7adb4 56%, #62686e 86%, #4c5157 100%)';

  const Face = ({ role, back }) => {
    const isDay = role === 'day';
    return (
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%', backfaceVisibility: 'hidden', overflow: 'hidden',
        transform: back ? `rotateX(180deg) translateZ(${TH}px)` : `translateZ(${TH}px)`,
        background: SILVER_FACE,
        boxShadow: 'inset 0 0 0 5px rgba(86,92,98,.6), inset 0 0 0 8px rgba(232,236,240,.6), inset 0 8px 18px rgba(255,255,255,.45), inset 0 -13px 26px rgba(44,48,52,.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {/* recessed dark medallion — gives the face real depth */}
        <div style={{
          width: '72%', height: '72%', borderRadius: '50%', overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'radial-gradient(circle at 50% 38%, #34383d 0%, #25282c 55%, #14161a 100%)',
          boxShadow: 'inset 0 4px 9px rgba(0,0,0,.75), inset 0 -3px 6px rgba(255,255,255,.10), 0 1px 0 rgba(255,255,255,.35), 0 -1px 0 rgba(0,0,0,.4)',
        }}>
          {isDay ? (
            /* heads — Pacific Tigers mark, popped out of the recess */
            <img src="assets/pacific-tiger.png" alt="Pacific Tigers" draggable="false"
              style={{ width: '84%', height: '84%', objectFit: 'contain', filter: 'drop-shadow(0 2px 3px rgba(0,0,0,.7))' }} />
          ) : (
            /* tails — SBA seal, zoomed past its white border so only the dark
               inner disc (white scales + "University of the Pacific") shows */
            <img src="assets/sba-seal.jpg" alt="McGeorge SBA" draggable="false"
              style={{ width: '172%', height: '172%', objectFit: 'contain', mixBlendMode: 'screen', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.5))' }} />
          )}
        </div>
      </div>
    );
  };

  const slabs = [];
  for (let z = -TH; z <= TH; z++) {
    slabs.push(
      <div key={z} style={{ position: 'absolute', inset: 0, borderRadius: '50%', transform: `translateZ(${z}px)`,
        background: 'repeating-conic-gradient(from 0deg, #b7bcc2 0deg 3deg, #8a9097 3deg 6deg)' }} />
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 26, padding: 24, textAlign: 'center' }}>
      <div>
        <div className="mono" style={{ fontSize: 11, letterSpacing: '.3em', color: 'var(--muted)' }}>STEP 1 OF THE DRAFT</div>
        <div className="cond" style={{ fontSize: 40, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.01em', marginTop: 6, whiteSpace: 'nowrap' }}>The Coin Toss</div>
        <div style={{ fontSize: 15, color: 'var(--muted)', marginTop: 6 }}>
          <strong style={{ color: 'var(--on-field)' }}>Heads (Tiger)</strong> → Day VP&nbsp;&nbsp;·&nbsp;&nbsp;<strong style={{ color: 'var(--on-field)' }}>Tails (SBA)</strong> → Evening VP
        </div>
      </div>

      {/* stage */}
      <div style={{ perspective: 1100, height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        {/* ground shadow */}
        <div style={{ position: 'absolute', bottom: 26, width: 150, height: 22, borderRadius: '50%', background: 'rgba(0,0,0,.22)', filter: 'blur(7px)', animation: tossing ? 'coinShadow 2.3s ease-in-out' : 'none' }} />
        {/* toss arc on the wrapper (translateY) keeps it off the rotating coin */}
        <div style={{ transformStyle: 'preserve-3d', animation: tossing ? 'coinToss 2.3s ease-in-out' : 'none' }}>
          <div onClick={canFlip && !result && !flipping ? flip : undefined}
            style={{ width: 200, height: 200, position: 'relative', transformStyle: 'preserve-3d',
              transform: `rotateX(${rot}deg)`,
              transition: tossing ? 'transform 2.3s cubic-bezier(.16,.6,.22,1)' : 'none',
              cursor: canFlip && !result && !flipping ? 'pointer' : 'default' }}>
            {slabs}
            <Face role="day" />
            <Face role="eve" back />
          </div>
        </div>
      </div>

      {/* result / action */}
      {result && !flipping ? (
        <div className="stinger" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div className="card" style={{ borderRadius: 16, padding: '16px 26px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <VPBadge role={result} size={42} ring="var(--highlight)" />
            <div style={{ textAlign: 'left' }}>
              <div className="mono" style={{ fontSize: 10.5, letterSpacing: '.2em', color: 'var(--muted)' }}>{result === 'day' ? 'HEADS · TIGER' : 'TAILS · SBA'} — FIRST PICK</div>
              <div className="cond" style={{ fontSize: 26, fontWeight: 800, textTransform: 'uppercase', lineHeight: 1 }}>{WR.VPS[result].role} is on the clock</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={flip} style={{ cursor: 'pointer', fontWeight: 700, fontSize: 14, padding: '12px 18px', borderRadius: 12, border: '1px solid var(--line)', background: 'var(--panel)', color: 'var(--on-panel)' }}>Flip again</button>
            <button onClick={() => dispatch({ t: 'begin' })} className="feature-bar"
              style={{ cursor: 'pointer', fontWeight: 800, fontSize: 15, padding: '12px 24px', borderRadius: 12, border: 'none', boxShadow: '0 8px 22px var(--shadow-2)' }}>Begin the draft →</button>
          </div>
        </div>
      ) : (
        <button onClick={flip} disabled={!canFlip || flipping} className="feature-bar"
          style={{ cursor: canFlip && !flipping ? 'pointer' : 'not-allowed', opacity: canFlip ? 1 : .55, fontWeight: 800, fontSize: 16,
            padding: '15px 32px', borderRadius: 14, border: 'none', letterSpacing: '.02em', boxShadow: '0 8px 22px var(--shadow-2)' }}>
          {flipping ? 'Tumbling…' : canFlip ? 'Flip the coin' : 'Take a seat to flip'}
        </button>
      )}
    </div>
  );
}

window.CoinToss = CoinToss;
