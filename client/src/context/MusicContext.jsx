import { createContext, useContext, useRef, useState, useEffect } from 'react'

// Ambient mood generator — lives at app level (not inside the Music page) so
// playback survives navigating between tabs. Synthesized live via Web Audio,
// no network/CORS/rate limits.
export const MOODS = [
  { id: 'tavern',   label: 'Tavern',   desc: 'Warm, mellow drone' },
  { id: 'battle',   label: 'Battle',   desc: 'Tense pulsing low end' },
  { id: 'forest',   label: 'Forest',   desc: 'Soft pad + wind' },
  { id: 'dungeon',  label: 'Dungeon',  desc: 'Dark rumble + drips' },
  { id: 'dramatic', label: 'Dramatic', desc: 'Rising ominous swell' },
]

function buildNoiseBuffer(ctx, seconds = 2) {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  return buffer
}

function clink(ctx, dest, freq = 1800, dur = 0.06, gainVal = 0.05) {
  const src = ctx.createBufferSource()
  src.buffer = buildNoiseBuffer(ctx, 0.2)
  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'; filter.frequency.value = freq; filter.Q.value = 6
  const gain = ctx.createGain()
  const t = ctx.currentTime
  gain.gain.setValueAtTime(gainVal, t)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  src.connect(filter).connect(gain).connect(dest)
  src.start(); src.stop(t + dur + 0.05)
}

function murmur(ctx, dest, gainVal = 0.04) {
  const src = ctx.createBufferSource()
  src.buffer = buildNoiseBuffer(ctx, 0.5)
  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'; filter.frequency.value = 280 + Math.random() * 260; filter.Q.value = 1.2
  const gain = ctx.createGain()
  const t = ctx.currentTime
  const dur = 0.35 + Math.random() * 0.3
  gain.gain.setValueAtTime(0, t)
  gain.gain.linearRampToValueAtTime(gainVal, t + 0.08)
  gain.gain.linearRampToValueAtTime(0, t + dur)
  src.connect(filter).connect(gain).connect(dest)
  src.start(); src.stop(t + dur + 0.1)
}

function drip(ctx, dest, gainVal = 0.06) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  const t = ctx.currentTime
  osc.type = 'sine'
  osc.frequency.setValueAtTime(1200 + Math.random() * 400, t)
  osc.frequency.exponentialRampToValueAtTime(400, t + 0.18)
  gain.gain.setValueAtTime(gainVal, t)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22)
  osc.connect(gain).connect(dest)
  osc.start(); osc.stop(t + 0.25)
}

// Builds and starts the audio graph for a mood; returns a stop() cleanup fn.
// Each call procedurally varies exact frequencies/timings within a themed
// range so replaying the same mood never sounds identical twice.
function startMood(ctx, master, mood) {
  const nodes = []
  const intervals = []
  const now = ctx.currentTime
  const jitter = (base, amt) => base + (Math.random() * 2 - 1) * amt

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

  if (mood === 'tavern') {
    addOsc(jitter(98, 4), 'sine', 0.22)
    addOsc(jitter(147, 5), 'triangle', 0.1)
    addNoise(0.025, 900)
    const scheduleMurmur = () => { murmur(ctx, master); intervals.push(setTimeout(scheduleMurmur, 300 + Math.random() * 900)) }
    scheduleMurmur()
    const scheduleClink = () => { clink(ctx, master, 1400 + Math.random() * 1800, 0.05 + Math.random() * 0.05); intervals.push(setTimeout(scheduleClink, 1200 + Math.random() * 2600)) }
    intervals.push(setTimeout(scheduleClink, 800))
  } else if (mood === 'battle') {
    addOsc(jitter(55, 3), 'sawtooth', 0.18)
    addOsc(jitter(110, 4), 'square', 0.05)
    const { gain } = addOsc(220, 'sine', 0)
    const pulse = 420 + Math.random() * 160
    const id = setInterval(() => {
      const t = ctx.currentTime
      gain.gain.cancelScheduledValues(t)
      gain.gain.setValueAtTime(0.1 + Math.random() * 0.05, t)
      gain.gain.linearRampToValueAtTime(0, t + 0.18)
    }, pulse)
    intervals.push(id)
  } else if (mood === 'forest') {
    addOsc(jitter(220, 8), 'sine', 0.08)
    addOsc(jitter(330, 8), 'sine', 0.05)
    addNoise(0.06, 1800, 'bandpass')
  } else if (mood === 'dungeon') {
    addOsc(jitter(46, 2), 'sine', 0.2)
    addOsc(jitter(69, 3), 'triangle', 0.07)
    addNoise(0.02, 400)
    const fireNoise = addNoise(0, 700, 'lowpass')
    const flicker = () => {
      const t = ctx.currentTime
      const v = 0.02 + Math.random() * 0.035
      fireNoise.gain.cancelScheduledValues(t)
      fireNoise.gain.linearRampToValueAtTime(v, t + 0.08 + Math.random() * 0.1)
      intervals.push(setTimeout(flicker, 90 + Math.random() * 160))
    }
    flicker()
    const scheduleDrip = () => { drip(ctx, master, 0.03 + Math.random() * 0.02); intervals.push(setTimeout(scheduleDrip, 2200 + Math.random() * 3800)) }
    intervals.push(setTimeout(scheduleDrip, 1500))
  } else if (mood === 'dramatic') {
    addOsc(jitter(49, 2), 'sawtooth', 0.15)
    addOsc(jitter(73.5, 2), 'sine', 0.1, -6)
    addOsc(jitter(98, 2), 'triangle', 0.05, 5)
    addNoise(0.03, 1800, 'bandpass')
    const { gain: bellGain } = addOsc(220, 'sine', 0)
    const tollBell = () => {
      const t = ctx.currentTime
      bellGain.gain.cancelScheduledValues(t)
      bellGain.gain.setValueAtTime(0.09, t)
      bellGain.gain.exponentialRampToValueAtTime(0.0001, t + 2.2)
      intervals.push(setTimeout(tollBell, 3800 + Math.random() * 2400))
    }
    intervals.push(setTimeout(tollBell, 1000))
  }

  return () => {
    intervals.forEach(id => { clearInterval(id); clearTimeout(id) })
    const t = ctx.currentTime
    nodes.forEach(n => { if (n.gain) { try { n.gain.linearRampToValueAtTime(0, t + 0.4) } catch { /* noop */ } } })
    setTimeout(() => nodes.forEach(n => { try { n.stop && n.stop() } catch { /* noop */ } }), 500)
  }
}

const MusicContext = createContext(null)
export const useMusic = () => useContext(MusicContext)

export function MusicProvider({ children }) {
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

  const stop = () => { stopRef.current?.(); stopRef.current = null; setCurrent(null) }

  const setVol = (v) => {
    setVolume(v)
    if (masterRef.current) masterRef.current.gain.value = v
  }

  return (
    <MusicContext.Provider value={{ current, volume, play, stop, setVol }}>
      {children}
    </MusicContext.Provider>
  )
}
