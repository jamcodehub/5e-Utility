import { useRef, useState } from 'react'

const TRACKS = [
  { label: 'Tavern', url: 'https://cdn.pixabay.com/audio/2022/03/15/audio_c8c8a73467.mp3' },
  { label: 'Battle', url: 'https://cdn.pixabay.com/audio/2022/10/25/audio_9c5b1b3d7c.mp3' },
  { label: 'Forest Ambience', url: 'https://cdn.pixabay.com/audio/2021/09/06/audio_e0a86f0f6b.mp3' },
  { label: 'Dungeon', url: 'https://cdn.pixabay.com/audio/2022/03/10/audio_54c8b32b5a.mp3' },
]

export default function MusicPlayer() {
  const audioRef = useRef(null)
  const [current, setCurrent] = useState(null)
  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState(0.6)

  const play = (track) => {
    if (current?.url === track.url) {
      if (playing) { audioRef.current.pause(); setPlaying(false) }
      else { audioRef.current.play(); setPlaying(true) }
      return
    }
    setCurrent(track)
    setTimeout(() => { audioRef.current?.play(); setPlaying(true) }, 50)
  }

  return (
    <div className="page-content">
      <div className="page-header-row" style={{ marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, marginBottom: 4 }}>Dynamic Music Player</h2>
          <p style={{ color: 'var(--text-2)', fontSize: 14, margin: 0 }}>Set the mood — one track at a time, looping.</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 420, marginBottom: 20 }}>
        {TRACKS.map(t => (
          <button key={t.url} onClick={() => play(t)} className="card" style={{
            padding: '12px 16px', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            border: current?.url === t.url ? '2px solid var(--gold)' : '1px solid var(--border)', cursor: 'pointer', background: current?.url === t.url ? 'var(--gold-bg)' : 'var(--surface)',
          }}>
            <span style={{ fontSize: 14, color: current?.url === t.url ? 'var(--gold)' : 'var(--text)' }}>{t.label}</span>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{current?.url === t.url && playing ? '⏸ Pause' : '▶ Play'}</span>
          </button>
        ))}
      </div>

      {current && (
        <div style={{ maxWidth: 420, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Volume</span>
          <input type="range" min={0} max={1} step={0.05} value={volume} onChange={e => { const v = +e.target.value; setVolume(v); if (audioRef.current) audioRef.current.volume = v }} style={{ flex: 1 }} />
        </div>
      )}

      <audio ref={audioRef} src={current?.url} loop volume={volume} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />
    </div>
  )
}
