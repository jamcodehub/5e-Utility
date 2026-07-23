import { MOODS, useMusic } from '../context/MusicContext'

export default function MusicPlayer() {
  const { current, volume, play, setVol } = useMusic()

  return (
    <div className="page-content">
      <div className="page-header-row" style={{ marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, marginBottom: 4 }}>Dynamic Music Player</h2>
          <p style={{ color: 'var(--text-2)', fontSize: 14, margin: 0 }}>Ambient mood generator</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 420, marginBottom: 20 }}>
        {MOODS.map(m => (
          <button key={m.id} onClick={() => play(m.id)} className="card" style={{
            padding: '12px 16px', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            border: current === m.id ? '2px solid var(--gold)' : '1px solid var(--border)', cursor: 'pointer', background: current === m.id ? 'var(--gold-bg)' : 'var(--surface)',
          }}>
            <span>
              <span style={{ fontSize: 14, color: current === m.id ? 'var(--gold)' : 'var(--text)', display: 'block' }}>{m.label}</span>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{m.desc}</span>
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{current === m.id ? '⏸ Stop' : '▶ Play'}</span>
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 420, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Volume</span>
        <input type="range" min={0} max={1} step={0.05} value={volume} onChange={e => setVol(+e.target.value)} style={{ flex: 1 }} />
      </div>
    </div>
  )
}
