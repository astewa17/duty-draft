/* ============================================================
   wr-app.jsx — provider + phase router + overlays + tweaks
   ============================================================ */
const WR_TWEAKS = /*EDITMODE-BEGIN*/{
  "sound": true,
  "accent": "#4D28BD"
}/*EDITMODE-END*/;

function Shell() {
  const { doc, myRole } = useDraft();
  const [overlay, setOverlay] = React.useState(null);
  const [solo, setSolo] = React.useState(false);
  const [t, setTweak] = useTweaks(WR_TWEAKS);

  React.useEffect(() => { Sounds.set(t.sound); }, [t.sound]);
  React.useEffect(() => { document.documentElement.style.setProperty('--tw-accent', t.accent); }, [t.accent]);

  let screen;
  if (doc.phase === 'signin') screen = <SignIn onOpen={setOverlay} />;
  else if (doc.phase === 'toss') screen = <CoinToss />;
  else if (doc.phase === 'draft') screen = <Board onOpen={setOverlay} solo={solo} setSolo={setSolo} />;
  else screen = <ReviewRoom onOpen={setOverlay} />;

  return (
    <React.Fragment>
      {screen}
      <PrintArea />
      {overlay === 'shared' && <SharedPanel onClose={() => setOverlay(null)} />}
      {overlay === 'edit' && <EditorPanel onClose={() => setOverlay(null)} />}
      {overlay === 'results' && <ResultsPanel onClose={() => setOverlay(null)} />}
      {overlay === 'curator' && <CuratorPanel onClose={() => setOverlay(null)} />}
      {overlay === 'directory' && <Directory onClose={() => setOverlay(null)} />}

      <TweaksPanel>
        <TweakSection label="Sound & feel" />
        <TweakToggle label="Sound effects" value={t.sound} onChange={(v) => setTweak('sound', v)} />
        <TweakSection label="Night-theme accent" />
        <TweakColor label="Indigo" value={t.accent}
          options={['#4D28BD', '#6E47E6', '#3457D5', '#1F8A5B']}
          onChange={(v) => setTweak('accent', v)} />
        <div style={{ fontSize: 11, color: 'var(--muted)', padding: '10px 4px 0', lineHeight: 1.4 }}>
          Logos &amp; brand assets are managed in <strong>Curator Mode</strong> (top bar).
        </div>
      </TweaksPanel>
    </React.Fragment>
  );
}

function App() { return <DraftProvider><Shell /></DraftProvider>; }
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
