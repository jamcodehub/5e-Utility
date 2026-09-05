import { createContext, useContext, useRef, useState, useEffect } from 'react'

// Ambient mood generator — lives at app level (not inside the Music page) so
// playback survives navigating between tabs. Synthesized live via Web Audio,
// no network/CORS/rate limits.
export const MOODS = [
  { id: 'tavern',   label: 'Tavern',   desc: 'Warm, mellow drone' },
  { id: 'battle',   label: 'Battle',   desc: 'Tense pulsing low end' },
  { id: 'forest',   label: 'Forest',   desc: 'Soft pad + wind' },
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
  // Return the gain node so callers can silence it immediately on cleanup
  return gain
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
    // `cancelled` flag — set to true the instant cleanup runs so that any
    // in-flight flicker/drip timeout that fires during the 160ms fade-out
    // window cannot call cancelScheduledValues and resurrect the gain.
    let cancelled = false
    const flicker = () => {
      if (cancelled) return
      const t = ctx.currentTime
      const v = 0.02 + Math.random() * 0.035
      fireNoise.gain.cancelScheduledValues(t)
      fireNoise.gain.linearRampToValueAtTime(v, t + 0.08 + Math.random() * 0.1)
      intervals.push(setTimeout(flicker, 90 + Math.random() * 160))
    }
    flicker()
    const scheduleDrip = () => {
      if (cancelled) return
      const dripGain = drip(ctx, master, 0.03 + Math.random() * 0.02)
      // Track the drip's gain node so cleanup can mute any in-flight drip instantly
      nodes.push(dripGain)
      intervals.push(setTimeout(scheduleDrip, 2200 + Math.random() * 3800))
    }
    intervals.push(setTimeout(scheduleDrip, 1500))
    // Attach the cancelled setter so the cleanup closure can flip it
    intervals._cancelDungeon = () => { cancelled = true }
  } else if (mood === 'dramatic') {
    // Softer, more subtle medieval/vampiric drone — lower volumes across the
    // board and a gentler bell so it sits in the background instead of
    // dominating the mix.
    addOsc(jitter(49, 2), 'sawtooth', 0.07)
    addOsc(jitter(73.5, 2), 'sine', 0.06, -6)
    addOsc(jitter(98, 2), 'triangle', 0.03, 5)
    addNoise(0.015, 1600, 'bandpass')
    const { gain: bellGain } = addOsc(220, 'sine', 0)
    const tollBell = () => {
      const t = ctx.currentTime
      bellGain.gain.cancelScheduledValues(t)
      bellGain.gain.setValueAtTime(0.045, t)
      bellGain.gain.exponentialRampToValueAtTime(0.0001, t + 2.2)
      intervals.push(setTimeout(tollBell, 4200 + Math.random() * 2600))
    }
    intervals.push(setTimeout(tollBell, 1200))
  }

  return () => {
    intervals.forEach(id => { clearInterval(id); clearTimeout(id) })
    // Hard-stop quickly (short ramp, then stop) rather than a long crossfade
    // — a slow fade let the outgoing and incoming moods audibly overlap.
    const t = ctx.currentTime
    nodes.forEach(n => { if (n.gain) { try { n.gain.cancelScheduledValues(t); n.gain.linearRampToValueAtTime(0, t + 0.12) } catch { /* noop */ } } })
    setTimeout(() => nodes.forEach(n => { try { n.stop && n.stop() } catch { /* noop */ } }), 160)
  }
}

const MusicContext = createContext(null)
export const useMusic = () => useContext(MusicContext)

const FADE_MS = 170 // must be >= the hard-stop delay in startMood's cleanup (160ms)

export function MusicProvider({ children }) {
  const ctxRef = useRef(null)
  const masterRef = useRef(null)
  const stopRef = useRef(null)          // cleanup fn for the currently-playing (or fading-in) mood
  const currentRef = useRef(null)       // ref mirror of `current` — always accurate, never stale
  const genRef = useRef(0)
  const pendingStartRef = useRef(null)  // timeout id for a scheduled (delayed) start
  const [current, setCurrentState] = useState(null)
  const [volume, setVolume] = useState(0.5)

  const setCurrent = (v) => { currentRef.current = v; setCurrentState(v) }

  useEffect(() => () => {
    clearTimeout(pendingStartRef.current)
    stopRef.current?.()
    ctxRef.current?.close()
  }, [])

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

  // Immediately and fully tears down whatever is currently playing/pending.
  // Always call this before starting anything new — guarantees there is
  // never more than one live audio graph, no matter how fast the user clicks.
  const hardStopNow = () => {
    if (pendingStartRef.current !== null) {
      clearTimeout(pendingStartRef.current)
      pendingStartRef.current = null
    }
    if (stopRef.current) {
      stopRef.current()
      stopRef.current = null
    }
  }

  const play = (moodId) => {
    const ctx = ensureCtx()
    if (ctx.state === 'suspended') ctx.resume()

    // Ambient moods and a custom track shouldn't play simultaneously.
    if (trackAudioRef.current && !trackAudioRef.current.paused) {
      trackAudioRef.current.pause()
      trackAudioRef.current.currentTime = 0
      setTrackPlaying(false)
      setActiveTrack(null)
    }

    // Bump generation so any in-flight delayed start (from a previous call)
    // is guaranteed to no-op even if its setTimeout somehow already fired.
    genRef.current++
    const myGen = genRef.current

    // Toggle off — tapping the mood that's already playing/queued.
    if (currentRef.current === moodId) {
      hardStopNow()
      setCurrent(null)
      return
    }

    // Was something actually playing/queued? If so we need a short fade
    // gap before starting the new mood so they never audibly overlap.
    const wasPlaying = !!stopRef.current
    hardStopNow()
    setCurrent(moodId)

    const startNew = () => {
      if (genRef.current !== myGen) return // a newer switch happened meanwhile
      stopRef.current = startMood(ctx, masterRef.current, moodId)
    }

    if (wasPlaying) {
      pendingStartRef.current = setTimeout(() => {
        pendingStartRef.current = null
        startNew()
      }, FADE_MS)
    } else {
      startNew()
    }
  }

  const stop = () => {
    genRef.current++
    hardStopNow()
    setCurrent(null)
  }

  const setVol = (v) => {
    setVolume(v)
    if (masterRef.current) masterRef.current.gain.value = v
    if (trackAudioRef.current) trackAudioRef.current.volume = v
  }

  // ── Custom track playback (uploaded tracks / session cues) ──
  // Lives here at the provider level — not inside MusicPlayer.jsx — so
  // playback survives navigating to other tabs, exactly like the ambient
  // moods above. A plain `Audio()` object needs no DOM presence to keep
  // playing since this provider is mounted once at the app root.
  const trackAudioRef = useRef(typeof Audio !== 'undefined' ? new Audio() : null)
  const [activeTrack, setActiveTrack] = useState(null)
  const [trackPlaying, setTrackPlaying] = useState(false)
  const [trackTime, setTrackTime] = useState(0)
  const [trackDuration, setTrackDuration] = useState(0)
  const [shuffleEnabled, setShuffleEnabled] = useState(false)
  const [repeatMode, setRepeatMode] = useState('off') // 'off' | 'forever' | 'once'
  const [queue, setQueue] = useState([]) // current playlist, used for shuffle/next-track
  const repeatOnceUsedRef = useRef(false)
  const activeTrackRef = useRef(null)
  activeTrackRef.current = activeTrack

  const playTrack = (track, playlist) => {
    if (playlist) setQueue(playlist)
    const el = trackAudioRef.current
    if (!el) return
    // Ambient moods and custom tracks shouldn't play simultaneously.
    if (currentRef.current) { genRef.current++; hardStopNow(); setCurrent(null) }
    if (activeTrackRef.current?._id === track._id && !el.paused) {
      el.pause(); setTrackPlaying(false); return
    }
    if (activeTrackRef.current?._id === track._id && el.paused && el.currentTime > 0) {
      el.play().then(() => setTrackPlaying(true)).catch(() => setTrackPlaying(false))
      return
    }
    repeatOnceUsedRef.current = false
    setActiveTrack(track)
    el.src = track.url
    el.volume = volume
    return el.play().then(() => setTrackPlaying(true)).catch((err) => { setTrackPlaying(false); throw err })
  }

  const stopTrack = () => {
    const el = trackAudioRef.current
    if (!el) return
    el.pause(); el.currentTime = 0
    setTrackPlaying(false); setActiveTrack(null)
  }

  const seekTrack = (time) => {
    const el = trackAudioRef.current
    if (!el) return
    el.currentTime = time
    setTrackTime(time)
  }

  useEffect(() => {
    const el = trackAudioRef.current
    if (!el) return
    const onTime = () => setTrackTime(el.currentTime)
    const onDur  = () => setTrackDuration(el.duration || 0)
    const onEnd  = () => {
      const endedTrackId = activeTrackRef.current?._id

      if (repeatMode === 'forever') {
        el.currentTime = 0
        el.play().then(() => setTrackPlaying(true)).catch(() => setTrackPlaying(false))
        return
      }

      if (repeatMode === 'once' && !repeatOnceUsedRef.current) {
        repeatOnceUsedRef.current = true
        el.currentTime = 0
        el.play().then(() => setTrackPlaying(true)).catch(() => setTrackPlaying(false))
        return
      }

      if (shuffleEnabled && queue.length > 1) {
        const choices = queue.filter(t => t._id !== endedTrackId)
        const nextTrack = choices[Math.floor(Math.random() * choices.length)]
        if (nextTrack) { playTrack(nextTrack); return }
      }

      if (repeatMode === 'once' && queue.length > 1) {
        const idx = queue.findIndex(t => t._id === endedTrackId)
        const nextTrack = queue[(idx + 1) % queue.length] || queue[0]
        playTrack(nextTrack)
        return
      }

      setTrackPlaying(false)
      setTrackTime(0)
    }
    el.addEventListener('timeupdate', onTime)
    el.addEventListener('loadedmetadata', onDur)
    el.addEventListener('ended', onEnd)
    return () => {
      el.removeEventListener('timeupdate', onTime)
      el.removeEventListener('loadedmetadata', onDur)
      el.removeEventListener('ended', onEnd)
    }
  }, [queue, repeatMode, shuffleEnabled])

  return (
    <MusicContext.Provider value={{
      current, volume, play, stop, setVol,
      activeTrack, trackPlaying, trackTime, trackDuration, trackDurationRef: trackDuration,
      shuffleEnabled, setShuffleEnabled, repeatMode, setRepeatMode,
      queue, setQueue, playTrack, stopTrack, seekTrack,
    }}>
      {children}
    </MusicContext.Provider>
  )
}
