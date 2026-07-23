import { useState, useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'

export default function Dice() {
  const { theme } = useTheme()
  const isClassic = theme === 'light' || theme === 'classic'
  const [rolling, setRolling] = useState(false)
  const [result, setResult] = useState(null)
  const [displayValue, setDisplayValue] = useState(1)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showRain, setShowRain] = useState(false)
  const [sink, setSink] = useState(false)
  const [d20Transform, setD20Transform] = useState('translate(0%, -140%) rotate(0deg)')
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

    // reset d20 position to outside tray (top center)
    setD20Transition('transform 0ms')
    setD20Transform('translate(0%, -140%) rotate(0deg)')

    // randomize throw: exaggerated target area across the full tray
    const tx = Math.round((Math.random() * 136 - 68) * 10) / 10 // -68%..68%
    const ty = Math.round((Math.random() * 136 - 68) * 10) / 10
    const rot = Math.floor(Math.random() * 900) + 180
    const duration = Math.floor(Math.random() * 900) + 900 // 900-1800ms for a bigger arc

    // animate from outside into the tray with a sweeping, full-space throw
    setTimeout(() => {
      setD20Transition(`transform ${duration}ms cubic-bezier(.14,.68,.25,1)`)
      setD20Transform(`translate(${tx}%, ${ty}%) rotate(${rot}deg)`)
    }, 50)

    // flicker display while throwing
    let count = 0
    const flick = setInterval(() => {
      count += 1
      setDisplayValue(Math.floor(Math.random() * 20) + 1)
      if (count >= Math.max(8, Math.round(duration / 80))) clearInterval(flick)
    }, 60)

    // finalize after the throw animation completes
    setTimeout(() => {
      const finalValue = Math.floor(Math.random() * 20) + 1
      setDisplayValue(finalValue)
      setResult(finalValue)
      if (finalValue === 20) setShowConfetti(true)
      if (finalValue === 1) { setSink(true); setShowRain(true) }
      setRolling(false)

      // ease in slight settle (a tiny inward move)
      const settleTx = tx * 0.45
      const settleTy = ty * 0.45
      setD20Transition('transform 280ms ease-out')
      setD20Transform(`translate(${settleTx}%, ${settleTy}%) rotate(${rot}deg)`)

      // Bounce out to the wall and back into the tray
      setTimeout(() => {
        const bounceOutTx = Math.round((Math.sign(settleTx) * Math.min(92, Math.abs(settleTx) * 1.25 + 12)) * 10) / 10
        const bounceOutTy = Math.round((Math.sign(settleTy) * Math.min(92, Math.abs(settleTy) * 1.25 + 12)) * 10) / 10
        setD20Transition('transform 220ms cubic-bezier(.34,1.56,.64,1)')
        setD20Transform(`translate(${bounceOutTx}%, ${bounceOutTy}%) rotate(${rot}deg)`)

        // return to settled position
        setTimeout(() => {
          setD20Transition('transform 260ms ease-out')
          setD20Transform(`translate(${settleTx}%, ${settleTy}%) rotate(${rot}deg)`)
        }, 220)
      }, 320)
    }, duration + 180)
  }

  return (
    <div className="page-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', gap: 20, padding: '18px 18px 24px' }}>
      <div style={{ flex: 1, width: '100%', maxWidth: 1280, margin: '0 auto', position: 'relative' }}>
        <style>{`
          .board-shell { width: 100%; height: 100%; background: rgba(255,255,255,0.02); border: 2px solid rgba(255,255,255,0.07); border-radius: 32px; position: relative; overflow: hidden; display:flex; align-items:center; justify-content:center; box-shadow: inset 0 12px 34px rgba(0,0,0,0.28); }
          .board-shell::before { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(255,255,255,0.02), transparent 26%, transparent 74%, rgba(255,255,255,0.01)); pointer-events:none; }
          .d20-spot { position: absolute; inset: 0; display:flex; align-items:center; justify-content:center; pointer-events:none; }
          .d20 { display:flex; align-items:center; justify-content:center; width:58px; height:58px; }
          .d20 svg { width:100%; height:100%; }
          .d20.rolling svg { animation: roll-spin 1100ms linear infinite; }
          @keyframes roll-spin { from { transform: rotate(0deg); } to { transform: rotate(720deg); } }
          .dice-controls { display:flex; justify-content:center; align-items:center; gap:10px; width:100%; max-width:1280px; margin:0 auto; flex-wrap:wrap; }
          .dice-btn { border:none; border-radius:14px; padding:12px 18px; font-family: 'Cinzel, serif'; font-size:16px; font-weight:700; line-height:1; transition: transform .08s ease, filter .12s ease, opacity .12s ease; }
          .dice-roll-btn { background: var(--gold); color: var(--text); }
          .dice-roll-btn:not(:disabled):active { transform: translateY(2px); filter: brightness(0.96); }
          .dice-roll-btn:disabled { opacity: .75; cursor: default; }
          .dice-result-btn { background: var(--surface); color: var(--text); border: 1px solid var(--border); cursor: default; }
          .confetti-overlay { position:fixed; inset:0; pointer-events:none; overflow:hidden; z-index:9999; }
          .confetti-piece { position:absolute; background:white; opacity:0.95; border-radius: 3px; animation: confetti-up 1200ms cubic-bezier(.2,.9,.2,1) forwards; }
          @keyframes confetti-up { 0%{ transform: translateY(0) rotate(0); opacity:1 } 100%{ transform: translateY(-120vh) rotate(720deg); opacity:0 } }
          .rain-overlay { position:fixed; inset:0; pointer-events:none; overflow:hidden; z-index:9998 }
          .rain-drop { position:absolute; background:linear-gradient(180deg, rgba(173,216,230,0.98), rgba(173,216,230,0.7)); opacity:0.95; border-radius: 2px; animation: rain-fall 900ms linear forwards; }
          @keyframes rain-fall { 0%{ transform: translateY(0) rotate(0); opacity:1 } 100%{ transform: translateY(120vh) rotate(30deg); opacity:0.04 } }
          .result-sink { animation: sink 900ms ease-in-out forwards; }
          @keyframes sink { 0%{ transform: translateY(0) scale(1) } 100%{ transform: translateY(14px) scale(0.94) } }
        `}</style>

        <div className="board-shell">
          <div className="d20-spot">
            <div className={`d20 ${rolling ? 'rolling' : ''}`} style={{ transform: d20Transform, transition: d20Transition }}>
              <svg viewBox="0 0 100 100" style={{ display: 'block' }}>
                <g transform="translate(50,50) scale(0.9)">
                  <path d="M0,-42 L34,-13 L20,35 L-20,35 L-34,-13 Z" fill="none" stroke={isClassic ? '#111111' : '#ffffff'} strokeWidth="4" />
                  <g stroke={isClassic ? '#111111' : '#ffffff'} strokeWidth="2" fill="none">
                    <path d="M0,-42 L0,35" />
                    <path d="M34,-13 L-34,-13" />
                    <path d="M20,35 L-20,35" />
                    <path d="M0,-42 L20,35" />
                    <path d="M0,-42 L-20,35" />
                  </g>
                  <text x="0" y="8" textAnchor="middle" fontFamily="Cinzel, serif" fontSize="28" fill={isClassic ? '#111111' : '#ffffff'} stroke={isClassic ? '#ffffff' : '#000000'} strokeWidth="1.1" paintOrder="stroke">{rolling ? '' : (result || '?')}</text>
                </g>
              </svg>
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
        <button className="dice-btn dice-roll-btn" onClick={roll} disabled={rolling}>Roll d20</button>
        <button className={`dice-btn dice-result-btn ${sink ? 'result-sink' : ''}`} disabled style={{
          color: isClassic ? '#111111' : 'var(--text)',
          textShadow: isClassic ? '0 0 1px #fff, 0 0 2px #fff' : 'none',
        }}>
          Result: {result || displayValue}
        </button>
      </div>
    </div>
  )
}
