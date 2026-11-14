import { useState, useEffect, useRef } from 'react'
import { useTheme } from '../context/ThemeContext'

// ---- True 3D icosahedron (d20) built from 20 CSS-transformed triangles ----
const DIE = 60 // edge length in px (the die is about 1.9x this across)
const PHI = (1 + Math.sqrt(5)) / 2
const VERTS = [[-1, PHI, 0], [1, PHI, 0], [-1, -PHI, 0], [1, -PHI, 0], [0, -1, PHI], [0, 1, PHI], [0, -1, -PHI], [0, 1, -PHI], [PHI, 0, -1], [PHI, 0, 1], [-PHI, 0, -1], [-PHI, 0, 1]]
const TRIS = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]]
const norm = v => { const l = Math.hypot(...v); return v.map(x => x / l) }
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const FACES = (() => {
  const k = DIE / 2
  const faces = TRIS.map(t => {
    const pts = t.map(i => VERTS[i].map(x => x * k))
    const c = [0, 1, 2].map(a => (pts[0][a] + pts[1][a] + pts[2][a]) / 3)
    const n = norm(c)
    const v = norm([c[0] - pts[0][0], c[1] - pts[0][1], c[2] - pts[0][2]]) // points from apex to centre, i.e. down the face
    const u = cross(v, n)
    return { c, n, u, v, num: 0 }
  })
  // Opposite faces sum to 21, like a real die.
  let next = 1
  faces.forEach((f, i) => {
    if (f.num) return
    const j = faces.findIndex((g, x) => x !== i && g.n[0] * f.n[0] + g.n[1] * f.n[1] + g.n[2] * f.n[2] < -0.99)
    f.num = next; faces[j].num = 21 - next; next += 1
  })
  return faces
})()
const faceMatrix = f => `matrix3d(${[...f.u, 0, ...f.v, 0, ...f.n, 0, ...f.c, 1].join(',')})`
// Rotation that brings a face to the front, upright.
const restTransform = num => {
  const f = FACES.find(x => x.num === num)
  return `matrix3d(${[f.u[0], f.v[0], f.n[0], 0, f.u[1], f.v[1], f.n[1], 0, f.u[2], f.v[2], f.n[2], 0, 0, 0, 0, 1].join(',')})`
}
const randomSpin = () => {
  const a = norm([Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5])
  return `rotate3d(${a.join(',')},${Math.floor(Math.random() * 360)}deg)`
}
const FACE_R = DIE / Math.sqrt(3)
const FACE_CLIP = `polygon(50% ${50 - (FACE_R / DIE) * 100}%, 100% ${50 + (FACE_R / DIE) * 50}%, 0% ${50 + (FACE_R / DIE) * 50}%)`

const STREAK_KEY = 'll_dice_streaks'
const loadStreaks = () => {
  try { const v = JSON.parse(localStorage.getItem(STREAK_KEY)); if (v && typeof v === 'object') return v } catch { /* ignore */ }
  return {}
}

export default function Dice() {
  const { theme, lightMode } = useTheme()
  const isClassic = theme === 'light' || theme === 'classic'
  // Same rule the shell uses: dark UI gets a light die, light UI gets a dark one, both tinted by the theme accent.
  const darkUI = theme !== 'light' && (!lightMode || theme === 'dark')
  const boardRef = useRef(null)
  const [rolling, setRolling] = useState(false)
  const [result, setResult] = useState(null)
  const [displayValue, setDisplayValue] = useState(1)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showRain, setShowRain] = useState(false)
  const [sink, setSink] = useState(false)
  const dieRef = useRef(null)
  const d20Ref = useRef(null)
  const run = useRef({ value: null, count: 0 })
  const [best, setBest] = useState(loadStreaks)
  const [d20Transform, setD20Transform] = useState('translate(0px, -400px) rotate(0deg)')
  const [d20Transition, setD20Transition] = useState('transform 0ms')

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

    // Measure the actual tray so the throw distance is always relative to
    // real pixel dimensions — using % transforms was relative to the die's
    // own tiny size (58px), which is why it barely moved before.
    const rect = boardRef.current?.getBoundingClientRect()
    const dieSize = DIE * 1.9
    const maxX = rect ? (rect.width - dieSize) / 2 - 6 : 300
    const maxY = rect ? (rect.height - dieSize) / 2 - 6 : 200

    const finalValue = Math.floor(Math.random() * 20) + 1

    // Tumble through random orientations and settle with the rolled face toward the viewer.
    const die = dieRef.current
    const restNow = die.style.transform || 'none'
    const restNext = restTransform(finalValue)

    // Pick a random direction and slam all the way to a wall/corner every time.
    const angle = Math.random() * Math.PI * 2
    const tx = Math.round(Math.cos(angle) * maxX)
    const ty = Math.round(Math.sin(angle) * maxY)
    const duration = Math.floor(Math.random() * 500) + 550 // fast, forceful throw

    die.animate(
      [{ transform: restNow }, ...Array.from({ length: 5 }, () => ({ transform: randomSpin() })), { transform: restNext }],
      { duration: duration + 150, easing: 'cubic-bezier(.3,.6,.4,1)' },
    )
    die.style.transform = restNext

    // The die drops in from above the tray, hits the wall, then rebounds and settles with two small hops.
    const bx = -Math.sign(tx || 1) * Math.min(46, Math.abs(tx)), by = -Math.sign(ty || 1) * Math.min(34, Math.abs(ty))
    const at = (k, hop = 0) => `translate(${tx + bx * k}px, ${ty + by * k - hop}px)`
    setD20Transition('transform 0ms')
    setD20Transform(at(1.2))
    d20Ref.current.animate([
      { transform: `translate(0px, ${-(maxY + 220)}px)`, offset: 0, easing: 'cubic-bezier(.4,0,.9,.6)' },
      { transform: at(0), offset: 0.5, easing: 'cubic-bezier(.2,.6,.4,1)' },
      { transform: at(0.6, 46), offset: 0.68, easing: 'ease-in' },
      { transform: at(1), offset: 0.8, easing: 'cubic-bezier(.2,.6,.4,1)' },
      { transform: at(1.12, 16), offset: 0.9, easing: 'ease-in' },
      { transform: at(1.2), offset: 1 },
    ], { duration: duration + 150 })

    // flicker display while throwing
    let count = 0
    const flick = setInterval(() => {
      count += 1
      setDisplayValue(Math.floor(Math.random() * 20) + 1)
      if (count >= Math.max(8, Math.round(duration / 80))) clearInterval(flick)
    }, 60)

    // finalize after the throw animation completes
    setTimeout(() => {
      setDisplayValue(finalValue)
      setResult(finalValue)
      if (finalValue === 20) setShowConfetti(true)
      if (finalValue === 1) { setSink(true); setShowRain(true) }
      const r = run.current
      r.count = r.value === finalValue ? r.count + 1 : 1
      r.value = finalValue
      setBest(prev => {
        if ((prev[finalValue] || 0) >= r.count) return prev
        const next = { ...prev, [finalValue]: r.count }
        try { localStorage.setItem(STREAK_KEY, JSON.stringify(next)) } catch { /* ignore */ }
        return next
      })
      setRolling(false)
    }, duration + 180)
  }

  return (
    <div className="page-content dice-page" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%', gap: 14, padding: '14px', overflowY: 'auto' }}>
      <div style={{ flex: 1, width: '100%', maxWidth: 1280, margin: '0 auto', position: 'relative' }}>
        <style>{`
          .board-shell { width: 100%; height: 100%; background: rgba(255,255,255,0.02); border: 2px solid rgba(255,255,255,0.07); border-radius: 32px; position: relative; overflow: hidden; display:flex; align-items:center; justify-content:center; box-shadow: inset 0 12px 34px rgba(0,0,0,0.28); }
          .board-shell::before { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(255,255,255,0.02), transparent 26%, transparent 74%, rgba(255,255,255,0.01)); pointer-events:none; }
          .d20-spot { position: absolute; inset: 0; display:flex; align-items:center; justify-content:center; pointer-events:none; }
          .d20 { display:flex; align-items:center; justify-content:center; width:${DIE}px; height:${DIE}px; perspective:700px; }
          .die3d { position:relative; width:100%; height:100%; transform-style:preserve-3d; filter: drop-shadow(0 14px 10px rgba(0,0,0,0.35)); }
          .die-face { position:absolute; left:0; top:0; width:100%; height:100%; clip-path:${FACE_CLIP}; backface-visibility:hidden; display:flex; align-items:center; justify-content:center; font-family: Cinzel, serif; font-weight:700; font-size:${Math.round(DIE * 0.34)}px; padding-top:${Math.round(DIE * 0.1)}px; box-sizing:border-box; }
          .streaks { position:absolute; top:12px; right:16px; z-index:2; max-width:55%; text-align:right; font-size:11px; letter-spacing:.04em; color:var(--text-3); opacity:.8; pointer-events:auto; cursor:default; }
          .streaks b { color:var(--text-2); font-weight:600; }
          .dice-controls { display:flex; justify-content:stretch; align-items:stretch; gap:20px; width:100%; max-width:1280px; margin:0 auto; }
          .dice-btn { border:none; border-radius:22px; padding:32px 24px; font-family: 'Cinzel, serif'; font-size:26px; font-weight:700; line-height:1; transition: transform .08s ease, filter .12s ease, opacity .12s ease, box-shadow .08s ease; white-space: nowrap; flex:1 1 0; text-align:center; }
          .dice-roll-btn {
            box-shadow: 0 5px 0 rgba(0,0,0,0.35), 0 8px 14px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.35);
          }
          .dice-roll-btn:disabled { opacity: .75; cursor: default; }
          .dice-result-btn {
            color: var(--text); border: 1px solid var(--border); cursor: default; overflow: hidden; text-overflow: ellipsis;
            box-shadow: 0 5px 0 rgba(0,0,0,0.35), 0 8px 14px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.12);
          }
          @media (max-width: 768px) {
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

        <div className="board-shell" ref={boardRef}>
          <div className="streaks" title={`Best consecutive repeats of each number\n${Array.from({ length: 20 }, (_, i) => `${i + 1}: ${best[i + 1] || 0}`).join('  ')}`}>
            {(() => {
              const top = Object.entries(best).filter(([, n]) => n >= 2).sort((x, y) => y[1] - x[1] || x[0] - y[0]).slice(0, 6)
              return top.length
                ? <>Best streaks: {top.map(([v, n], i) => <span key={v}>{i > 0 && ' · '}<b>{v}</b>×{n}</span>)}</>
                : 'Best streaks: none yet'
            })()}
          </div>
          <div className="d20-spot">
            <div className="d20" ref={d20Ref} style={{ transform: d20Transform, transition: d20Transition }}>
              <div className="die3d" ref={dieRef} style={{ transform: restTransform(20) }}>
                {FACES.map((f, i) => (
                  <div
                    key={i}
                    className="die-face"
                    style={{
                      transform: `${faceMatrix(f)} scale(1.012)`,
                      background: darkUI
                        ? `color-mix(in srgb, var(--gold) ${16 + ((i * 7) % 5) * 5}%, #f4f1e8)`
                        : `color-mix(in srgb, var(--gold) ${34 + ((i * 7) % 5) * 7}%, #14110c)`,
                      color: darkUI ? 'color-mix(in srgb, var(--gold) 35%, #120f08)' : 'color-mix(in srgb, var(--gold) 20%, #f8f3e6)',
                                            textDecoration: f.num === 6 || f.num === 9 ? 'underline' : 'none',
                    }}
                  >{f.num}</div>
                ))}
              </div>
            </div>
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
        }}>Roll d20</button>
      </div>
    </div>
  )
}
