import { useState, useEffect, useRef, useMemo } from 'react'
import { useTheme } from '../context/ThemeContext'
import { buildDie, faceMatrix, restTransform, randomSpin, percentile } from '../utils/diceGeometry'
import { rollDie } from '../utils/dice'

// ---- True 3D dice: every die is a set of flat faces (see utils/diceGeometry.js) ----
const DIE = 60 // size of the box a die lives in, in px

// What the picker offers. d% is two d10s: a "tens" die (00-90) and a "units" die (0-9).
const CHOICES = [
  { id: 'd4', label: 'd4', sides: 4 }, { id: 'd6', label: 'd6', sides: 6 }, { id: 'd8', label: 'd8', sides: 8 },
  { id: 'd10', label: 'd10', sides: 10 }, { id: 'd100', label: 'd%', sides: 100 }, { id: 'd12', label: 'd12', sides: 12 }, { id: 'd20', label: 'd20', sides: 20 },
]
const tensLabel = n => String((n % 10) * 10).padStart(2, '0')
const unitsLabel = n => String(n % 10)
const plainLabel = n => String(n)
const modelsFor = id => (id === 'd100'
  ? [{ kind: 'd10', label: tensLabel, key: 'tens' }, { kind: 'd10', label: unitsLabel, key: 'units' }]
  : [{ kind: id, label: plainLabel, key: id }])
// d% result: tens die (0, 10 ... 90) + units die (0-9); 00 + 0 counts as 100.
const combine = (id, faces) => (id === 'd100' ? percentile(faces[0], faces[1]) : faces[0])
// number size relative to the face's square, tuned per shape
const FONT = { d4: 0.3, d6: 0.5, d8: 0.32, d10: 0.28, d12: 0.3, d20: 0.34 }

// A cube or tetrahedron lying face-on looks flat, so it rests with a slight tilt that shows its top and side faces.
const TILT = { d4: 'rotateX(-18deg) rotateY(16deg) ', d6: 'rotateX(-16deg) rotateY(20deg) ' }
const restOf = (kind, faces, num) => `${TILT[kind] || ''}${restTransform(faces, num)}`

const faceCache = {}
const facesOf = kind => (faceCache[kind] ||= buildDie(kind, DIE))

const OFFSCREEN = 'translate(0px, -400px) rotate(0deg)'
const KIND_KEY = 'll_dice_kind'
const streakKey = id => (id === 'd20' ? 'll_dice_streaks' : `ll_dice_streaks_${id}`) // d20 keeps its original key
const loadStreaks = id => {
  try { const v = JSON.parse(localStorage.getItem(streakKey(id))); if (v && typeof v === 'object') return v } catch { /* ignore */ }
  return {}
}
const loadKind = () => {
  try { const k = localStorage.getItem(KIND_KEY); if (CHOICES.some(c => c.id === k)) return k } catch { /* ignore */ }
  return 'd20'
}

export default function Dice() {
  const { theme, lightMode } = useTheme()
  const isClassic = theme === 'light' || theme === 'classic'
  // Same rule the shell uses: dark UI gets a light die, light UI gets a dark one, both tinted by the theme accent.
  const darkUI = theme !== 'light' && (!lightMode || theme === 'dark')
  const boardRef = useRef(null)
  const [die, setDie] = useState(loadKind)
  const choice = CHOICES.find(c => c.id === die)
  const models = useMemo(() => modelsFor(die), [die])
  const [rolling, setRolling] = useState(false)
  const [result, setResult] = useState(null)
  const [displayValue, setDisplayValue] = useState(1)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showRain, setShowRain] = useState(false)
  const [sink, setSink] = useState(false)
  const dieRefs = useRef([])   // the 3D bodies
  const wrapRefs = useRef([])  // the boxes that fly around the tray
  const run = useRef({ value: null, count: 0 })
  const [best, setBest] = useState(() => loadStreaks(die))
  const [places, setPlaces] = useState(() => modelsFor(die).map(() => OFFSCREEN))
  const timers = useRef([])

  // Choosing another die resets the tray: the new die waits above the tray until you roll.
  useEffect(() => {
    timers.current.forEach(clearTimeout); timers.current = []
    setPlaces(modelsFor(die).map(() => OFFSCREEN))
    setResult(null); setDisplayValue(1); setSink(false); setShowConfetti(false); setShowRain(false)
    setBest(loadStreaks(die)); run.current = { value: null, count: 0 }; setRolling(false)
    try { localStorage.setItem(KIND_KEY, die) } catch { /* ignore */ }
  }, [die])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  useEffect(() => {
    if (!showConfetti) return
    const timeout = setTimeout(() => setShowConfetti(false), 1200)
    return () => clearTimeout(timeout)
  }, [showConfetti])

  useEffect(() => {
    if (!showRain) return
    const t = setTimeout(() => setShowRain(false), 1400)
    return () => clearTimeout(t)
  }, [showRain])

  const roll = () => {
    if (rolling) return
    setRolling(true)
    setResult(null)
    setShowConfetti(false)
    setSink(false)

    // Measure the actual tray so the throw distance is always relative to real pixel dimensions.
    const rect = boardRef.current?.getBoundingClientRect()
    const dieSize = DIE * 1.9
    const maxX = rect ? (rect.width - dieSize) / 2 - 6 : 300
    const maxY = rect ? (rect.height - dieSize) / 2 - 6 : 200

    // each die lands on a random face (crypto RNG, same as the rest of the site)
    const faces = models.map(m => rollDie(facesOf(m.kind).length))
    const finalValue = combine(die, faces)
    const duration = Math.floor(Math.random() * 500) + 550 // fast, forceful throw

    const nextPlaces = models.map((m, i) => {
      const f = facesOf(m.kind)
      const body = dieRefs.current[i], wrap = wrapRefs.current[i]
      if (!body || !wrap) return OFFSCREEN
      // Tumble through random orientations and settle with the rolled face toward the viewer.
      const restNow = body.style.transform || 'none'
      const restNext = restOf(m.kind, f, faces[i])
      body.animate(
        [{ transform: restNow }, ...Array.from({ length: 5 }, () => ({ transform: randomSpin() })), { transform: restNext }],
        { duration: duration + 150, easing: 'cubic-bezier(.3,.6,.4,1)' },
      )
      body.style.transform = restNext

      // Slam into a wall/corner. Two dice (d%) go to opposite halves of the tray so they never land on each other.
      const angle = Math.random() * Math.PI * 2
      let tx = Math.round(Math.cos(angle) * maxX), ty = Math.round(Math.sin(angle) * maxY)
      if (models.length > 1) {
        const side = i === 0 ? -1 : 1
        tx = Math.round(side * (0.5 + Math.random() * 0.45) * maxX)
        ty = Math.round((Math.random() * 2 - 1) * maxY)
      }
      // drops in from above, hits the wall, rebounds and settles with two small hops
      const bx = -Math.sign(tx || 1) * Math.min(46, Math.abs(tx)), by = -Math.sign(ty || 1) * Math.min(34, Math.abs(ty))
      const at = (k, hop = 0) => `translate(${tx + bx * k}px, ${ty + by * k - hop}px)`
      wrap.animate([
        { transform: `translate(0px, ${-(maxY + 220)}px)`, offset: 0, easing: 'cubic-bezier(.4,0,.9,.6)' },
        { transform: at(0), offset: 0.5, easing: 'cubic-bezier(.2,.6,.4,1)' },
        { transform: at(0.6, 46), offset: 0.68, easing: 'ease-in' },
        { transform: at(1), offset: 0.8, easing: 'cubic-bezier(.2,.6,.4,1)' },
        { transform: at(1.12, 16), offset: 0.9, easing: 'ease-in' },
        { transform: at(1.2), offset: 1 },
      ], { duration: duration + 150 })
      return at(1.2)
    })
    setPlaces(nextPlaces)

    // flicker display while throwing
    const sides = choice.sides
    let count = 0
    const flick = setInterval(() => {
      count += 1
      setDisplayValue(Math.floor(Math.random() * sides) + 1)
      if (count >= Math.max(8, Math.round(duration / 80))) clearInterval(flick)
    }, 60)
    timers.current.push(flick)

    // finalize after the throw animation completes
    timers.current.push(setTimeout(() => {
      setDisplayValue(finalValue)
      setResult(finalValue)
      // the natural 20 / natural 1 celebrations belong to the d20
      if (die === 'd20' && finalValue === 20) setShowConfetti(true)
      if (die === 'd20' && finalValue === 1) { setSink(true); setShowRain(true) }
      const r = run.current
      r.count = r.value === finalValue ? r.count + 1 : 1
      r.value = finalValue
      setBest(prev => {
        if ((prev[finalValue] || 0) >= r.count) return prev
        const next = { ...prev, [finalValue]: r.count }
        try { localStorage.setItem(streakKey(die), JSON.stringify(next)) } catch { /* ignore */ }
        return next
      })
      setRolling(false)
    }, duration + 180))
  }

  return (
    <div className="page-content dice-page" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%', gap: 14, padding: '14px', overflowY: 'auto' }}>
      <div className="dice-stage" style={{ flex: 1, width: '100%', maxWidth: 1280, margin: '0 auto', display: 'flex', gap: 12, minHeight: 0 }}>
        <style>{`
          .dice-picker { display:flex; flex-direction:column; gap:8px; flex-shrink:0; width:64px; overflow-y:auto; padding:2px; }
          .dice-pick { height:50px; border-radius:6px; border:1px solid var(--border); background:var(--surface); color:var(--text-2); font:600 15px var(--font-ui); cursor:pointer; transition: background .12s ease, color .12s ease, border-color .12s ease; }
          .dice-pick:hover:not(:disabled) { border-color:var(--gold); color:var(--text); }
          .dice-pick[aria-pressed="true"] { background:var(--gold-bg); border-color:var(--gold); color:var(--gold); box-shadow: inset 0 -2px 0 color-mix(in srgb, var(--gold) 45%, transparent); }
          .dice-pick:disabled { opacity:.55; cursor:default; }
          .dice-tray { flex:1; min-width:0; position:relative; }
          .board-shell { width: 100%; height: 100%; background: rgba(255,255,255,0.02); border: 2px solid rgba(255,255,255,0.07); border-radius: 32px; position: relative; overflow: hidden; display:flex; align-items:center; justify-content:center; box-shadow: inset 0 12px 34px rgba(0,0,0,0.28); }
          .board-shell::before { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(255,255,255,0.02), transparent 26%, transparent 74%, rgba(255,255,255,0.01)); pointer-events:none; }
          .d20-spot { position: absolute; inset: 0; display:flex; align-items:center; justify-content:center; pointer-events:none; }
          .d20 { position:absolute; left:calc(50% - ${DIE / 2}px); top:calc(50% - ${DIE / 2}px); display:flex; align-items:center; justify-content:center; width:${DIE}px; height:${DIE}px; perspective:700px; filter: drop-shadow(0 14px 10px rgba(0,0,0,0.35)); }
          .die3d { position:relative; width:100%; height:100%; transform-style:preserve-3d; }
          .die-face { position:absolute; display:flex; align-items:center; justify-content:center; backface-visibility:hidden; font-family: 'Alegreya',Georgia,serif; font-weight:700; box-sizing:border-box; }
          .streaks { position:absolute; top:12px; right:16px; z-index:2; max-width:55%; text-align:right; font-size:11px; letter-spacing:.04em; color:var(--text-3); opacity:.8; pointer-events:auto; cursor:default; }
          .streaks b { color:var(--text-2); font-weight:600; }
          .dice-controls { display:flex; justify-content:stretch; align-items:stretch; gap:20px; width:100%; max-width:1280px; margin:0 auto; }
          .dice-btn { border:none; border-radius:22px; padding:32px 24px; font-family: 'var(--font-title)'; font-size:26px; font-weight:700; line-height:1; transition: transform .08s ease, filter .12s ease, opacity .12s ease, box-shadow .08s ease; white-space: nowrap; flex:1 1 0; text-align:center; }
          .dice-roll-btn {
            box-shadow: 0 5px 0 rgba(0,0,0,0.35), 0 8px 14px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.35);
          }
          .dice-roll-btn:disabled { opacity: .75; cursor: default; }
          .dice-result-btn {
            color: var(--text); border: 1px solid var(--border); cursor: default; overflow: hidden; text-overflow: ellipsis;
            box-shadow: 0 5px 0 rgba(0,0,0,0.35), 0 8px 14px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.12);
          }
          @media (max-width: 768px) {
            .dice-stage { flex-direction: column; }
            .dice-picker { flex-direction: row; width: 100%; overflow-x: auto; overflow-y: visible; }
            .dice-pick { flex: 1 0 52px; }
            .board-shell { min-height: 280px; }
            .dice-controls { margin-bottom: calc(64px + env(safe-area-inset-bottom, 0px)); gap: 10px; }
            .dice-btn { padding: 22px 14px; font-size: 17px; border-radius: 20px; min-height: 64px; }
            .dice-roll-btn { flex: 1.15 1 0; }
          }
          .confetti-overlay { position:fixed; inset:0; pointer-events:none; overflow:hidden; z-index:9999; }
          .confetti-piece { position:absolute; background:white; opacity:0.95; border-radius: 3px; animation: confetti-up 1200ms cubic-bezier(.2,.9,.2,1) forwards; }
          @keyframes confetti-up { 0%{ transform: translateY(0) rotate(0); opacity:1 } 100%{ transform: translateY(-120vh) rotate(720deg); opacity:0 } }
          .rain-overlay { position:fixed; inset:0; pointer-events:none; overflow:hidden; z-index:9998 }
          .rain-drop { position:absolute; background:linear-gradient(180deg, rgba(173,216,230,0.98), rgba(173,216,230,0.7)); opacity:0.95; border-radius: 2px; animation: rain-fall 900ms linear forwards; }
          @keyframes rain-fall { 0%{ transform: translateY(0) rotate(0); opacity:1 } 100%{ transform: translateY(120vh) rotate(30deg); opacity:0.04 } }
          .result-sink { animation: sink 900ms ease-in-out forwards; }
          @keyframes sink { 0%{ transform: translateY(0) scale(1) } 100%{ transform: translateY(14px) scale(0.94) } }
        `}</style>

        {/* Choose the die */}
        <div className="dice-picker" role="group" aria-label="Choose a die">
          {CHOICES.map(c => (
            <button key={c.id} type="button" className="dice-pick" aria-pressed={die === c.id} disabled={rolling} onClick={() => setDie(c.id)} title={c.id === 'd100' ? 'Percentile (two d10s)' : `Roll a ${c.label}`}>{c.label}</button>
          ))}
        </div>

        <div className="dice-tray">
          <div className="board-shell" ref={boardRef}>
            <div className="streaks" title={`Best consecutive repeats of each number\n${Array.from({ length: Math.min(choice.sides, 20) }, (_, i) => `${i + 1}: ${best[i + 1] || 0}`).join('  ')}`}>
              {(() => {
                const top = Object.entries(best).filter(([, n]) => n >= 2).sort((x, y) => y[1] - x[1] || x[0] - y[0]).slice(0, 6)
                return top.length
                  ? <>Best streaks: {top.map(([v, n], i) => <span key={v}>{i > 0 && ' · '}<b>{v}</b>×{n}</span>)}</>
                  : 'Best streaks: none yet'
              })()}
            </div>
            <div className="d20-spot">
              {models.map((m, i) => {
                const faces = facesOf(m.kind)
                return (
                  <div key={`${die}-${m.key}`} className="d20" ref={el => { wrapRefs.current[i] = el }} style={{ transform: places[i] || OFFSCREEN, transition: 'transform 0ms' }}>
                    <div className="die3d" ref={el => { dieRefs.current[i] = el }} style={{ transform: restOf(m.kind, faces, faces.length) }}>
                      {faces.map((f, k) => (
                        <div
                          key={k}
                          className="die-face"
                          style={{
                            width: f.S, height: f.S, left: (DIE - f.S) / 2, top: (DIE - f.S) / 2,
                            clipPath: f.clip || undefined,
                            transform: `${faceMatrix(f)} scale(1.012)`,
                            fontSize: Math.round(f.S * FONT[m.kind]),
                            background: darkUI
                              ? `color-mix(in srgb, var(--gold) ${16 + ((k * 7) % 5) * 5}%, #f4f1e8)`
                              : `color-mix(in srgb, var(--gold) ${34 + ((k * 7) % 5) * 7}%, #14110c)`,
                            color: darkUI ? 'color-mix(in srgb, var(--gold) 35%, #120f08)' : 'color-mix(in srgb, var(--gold) 20%, #f8f3e6)',
                            textDecoration: f.num === 6 || f.num === 9 ? 'underline' : 'none',
                          }}
                        >{m.label(f.num)}</div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            {showConfetti && (
              <div className="confetti-overlay">
                {[...Array(28)].map((_, idx) => {
                  const left = Math.floor(Math.random() * 100)
                  const delay = Math.floor(Math.random() * 500)
                  const size = Math.floor(Math.random() * 10) + 6
                  return <div key={idx} className="confetti-piece" style={{ left: `${left}%`, bottom: '-10%', width: size + 'px', height: size * 1.6 + 'px', animationDelay: `${delay}ms` }} />
                })}
              </div>
            )}

            {showRain && (
              <div className="rain-overlay">
                {[...Array(40)].map((_, idx) => {
                  const left = Math.floor(Math.random() * 100)
                  const delay = Math.floor(Math.random() * 400)
                  const w = Math.floor(Math.random() * 4) + 2
                  return <div key={idx} className="rain-drop" style={{ left: `${left}%`, top: '-6%', width: `${w}px`, height: `${w * 8}px`, animationDelay: `${delay}ms` }} />
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="dice-controls">
        <button className={`dice-btn dice-result-btn ${sink ? 'result-sink' : ''}`} disabled style={{
          background: isClassic ? '#f2f2f2' : 'var(--surface)',
          color: isClassic ? '#111111' : 'var(--text)',
          textShadow: isClassic ? '0 0 1px #fff, 0 0 2px #fff' : 'none',
        }}>
          Result: {result || displayValue}
        </button>
        <button className="dice-btn dice-roll-btn" onClick={roll} disabled={rolling} style={{
          background: isClassic ? '#111111' : 'var(--gold)',
          color: isClassic ? '#ffffff' : '#2a1a00',
        }}>Roll {choice.label}</button>
      </div>
    </div>
  )
}
