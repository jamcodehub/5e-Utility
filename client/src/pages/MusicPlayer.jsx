import { useRef, useState, useEffect } from 'react'

// The external mp3/API options (Pixabay CDN links, TavernTunes, the old
// DnDMusicApi YouTube-ID list) are unreliable, dead, or require accounts/keys.
// Instead we synthesize each mood live with the Web Audio API — no network
// request, no CORS, no rate limits, and it always actually plays.
const MOODS = [
  { id: 'tavern',  label: 'Tavern',   desc: 'Warm, mellow drone' },
  { id: 'battle',  label: 'Battle',   desc: 'Tense pulsing low end' },
  { id: 'forest',  label: 'Forest',   desc: 'Soft pad + wind' },
  { id: 'dungeon', label: 'Dungeon',  desc: 'Dark rumble + drips' },
  { id: 'dramatic',label: 'Dramatic', desc: 'Rising ominous swell' },
]

function buildNoiseBuffer(ctx, seconds = 2) {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  return buffer
}

// Builds and starts the audio graph for a mood; returns a stop() cleanup fn.
function startMood(ctx, master, mood) {
  const nodes = []
  const now = ctx.currentTime

  const addOsc = (freq, type, gainVal, detune = 0) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type; osc.frequency.value = freq; osc.detune.value = detune
    gain.gain.value = 0
    osc.connect(gain).connect(master)
    osc.start()
    gain.gain.linearRampToValueAtTime(gainVal, now + 1.2)
    nodes.push(osc, gain)
    return { osc, gain }
  }

  const addNoise = (gainVal, filterFreq, filterType = 'lowpass') => {
    const src = ctx.createBufferSource()
    src.buffer = buildNoiseBuffer(ctx)
    src.loop = true
    const filter = ctx.createBiquadFilter()
    filter.type = filterType; filter.frequency.value = filterFreq
    const gain = ctx.createGain()
    gain.gain.value = 0
    src.connect(filter).connect(gain).connect(master)
    src.start()
    gain.gain.linearRampToValueAtTime(gainVal, now + 1.5)
    nodes.push(src, filter, gain)
    return { src, gain }
  }

  let intervalId = null

  if (mood === 'tavern') {
    addOsc(98, 'sine', 0.25)
    addOsc(147, 'triangle', 0.12)
    addNoise(0.03, 900)
  } else if (mood === 'battle') {
    addOsc(55, 'sawtooth', 0.18)
    addOsc(110, 'square', 0.05)
    const { gain } = addOsc(220, 'sine', 0)
    intervalId = setInterval(() => {
      const t = ctx.currentTime
      gain.gain.cancelScheduledValues(t)
      gain.gain.setValueAtTime(0.12, t)
      gain.gain.linearRampToValueAtTime(0, t + 0.18)
    }, 500)
  } else if (mood === 'forest') {
    addOsc(220, 'sine', 0.08)
    addOsc(330, 'sine', 0.05)
    addNoise(0.06, 1800, 'bandpass')
  } else if (mood === 'dungeon') {
    addOsc(46, 'sine', 0.22)
    addOsc(69, 'triangle', 0.08)
    const { gain } = addOsc(140, 'sine', 0)
    addNoise(0.02, 400)
    intervalId = setInterval(() => {
      const t = ctx.currentTime
      gain.gain.cancelScheduledValues(t)
      gain.gain.setValueAtTime(0.1, t)
      gain.gain.linearRampToValueAtTime(0, t + 1.4)
    }, 2600 + Math.random() * 2000)
  } else if (mood === 'dramatic') {
    addOsc(65, 'sawtooth', 0.16)
    addOsc(98, 'sine', 0.1)
    addNoise(0.04, 2200, 'bandpass')
  }

  return () => {
    if (intervalId) clearInterval(intervalId)
    const t = ctx.currentTime
    nodes.forEach(n => { if (n.gain) { try { n.gain.linearRampToValueAtTime(0, t + 0.4) } catch { /* noop */ } } })
    setTimeout(() => nodes.forEach(n => { try { n.stop && n.stop() } catch { /* noop */ } }), 500)
  }
}

export default function MusicPlayer() {
  const ctxRef = useRef(null)
  const masterRef = useRef(null)
  const stopRef = useRef(null)
  const [current, setCurrent] = useState(null)
  const [volume, setVolume] = useState(0.5)

  useEffect(() => () => { stopRef.current?.(); ctxRef.current?.close() }, [])

  const ensureCtx = () => {
    if (!ctxRef.current) {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const master = ctx.createGain()
      master.gain.value = volume
      master.connect(ctx.destination)
      ctxRef.current = ctx
      masterRef.current = master
    }
    return ctxRef.current
  }

  const play = (moodId) => {
    const ctx = ensureCtx()
    if (ctx.state === 'suspended') ctx.resume()
    if (current === moodId) {
      stopRef.current?.(); stopRef.current = null
      setCurrent(null)
      return
    }
    stopRef.current?.()
    stopRef.current = startMood(ctx, masterRef.current, moodId)
    setCurrent(moodId)
  }

  const setVol = (v) => {
    setVolume(v)
    if (masterRef.current) masterRef.current.gain.value = v
  }

  return (
    <div className="page-content">
      <div className="page-header-row" style={{ marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, marginBottom: 4 }}>Dynamic Music Player</h2>
          <p style={{ color: 'var(--text-2)', fontSize: 14, margin: 0 }}>Ambient mood generator — synthesized live, no downloads or streaming needed.</p>
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
