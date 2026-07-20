import { useState, useEffect } from 'react'

export default function Dice() {
  const [rolling, setRolling] = useState(false)
  const [result, setResult] = useState(null)
  const [displayValue, setDisplayValue] = useState(1)
  const [showConfetti, setShowConfetti] = useState(false)
  const [sink, setSink] = useState(false)
  const [d20Transform, setD20Transform] = useState('translate(0%, 0%) rotate(0deg)')
  const [d20Transition, setD20Transition] = useState('transform 0ms')

  useEffect(() => {
    if (!showConfetti) return
    const timeout = setTimeout(() => setShowConfetti(false), 1200)
    return () => clearTimeout(timeout)
  }, [showConfetti])

  const roll = () => {
    if (rolling) return
    setRolling(true)
    setResult(null)
    setShowConfetti(false)
    setSink(false)

    // reset d20 position instantly
    setD20Transition('transform 0ms')
    setD20Transform('translate(0%, 0%) rotate(0deg)')

    // randomize throw: position offset (percent), rotation and duration
    const tx = Math.round((Math.random() * 44 - 22) * 10) / 10 // -22%..22%
    const ty = Math.round((Math.random() * 44 - 22) * 10) / 10
    const rot = Math.floor(Math.random() * 720) + 90
    const duration = Math.floor(Math.random() * 700) + 600 // 600-1300ms

    // small delay to allow zero-reset before animating
    setTimeout(() => {
      setD20Transition(`transform ${duration}ms cubic-bezier(.22,1,.36,1)`)
      setD20Transform(`translate(${tx}%, ${ty}%) rotate(${rot}deg)`)
    }, 30)

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
      if (finalValue === 1) setSink(true)
      setRolling(false)
      // ease in slight settle (a tiny inward move)
      setD20Transition('transform 280ms ease-out')
      setD20Transform(`translate(${tx * 0.6}%, ${ty * 0.6}%) rotate(${rot}deg)`) 
    }, duration + 180)
  }

  return (
    <div className="page-content" style={{ paddingBottom: 32 }}>
      <div style={{ display: 'grid', gap: 18, maxWidth: 720, margin: '0 auto' }}>
        <div className="card" style={{ padding: 24, display: 'grid', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 8 }}>Result</div>
              <div className={sink ? 'result-sink' : ''} style={{ fontSize: 72, fontFamily: 'Cinzel, serif', color: result ? 'var(--gold)' : 'var(--text)', minHeight: 98, display: 'flex', alignItems: 'center' }}>
                {result || displayValue}
              </div>
            </div>
            <button onClick={roll} disabled={rolling} style={{ background: 'var(--gold)', border: 'none', color: 'var(--text)', padding: '16px 26px', borderRadius: 14, fontSize: 18, fontWeight: 800, cursor: rolling ? 'default' : 'pointer', minWidth: 160, boxShadow: rolling ? 'none' : '0 18px 30px rgba(255,205,81,0.14)' }}>
              Roll d20
            </button>
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6 }}>
            {result ? `Your dice landed on ${result}.` : 'Toss the d20 to see your next result.'}
          </div>
        </div>

        <div className="card" style={{ padding: 20, background: 'var(--surface2)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 360 }}>
          <style>{`
            .board-shell { width: 100%; max-width: 320px; aspect-ratio: 1 / 1; background: rgba(255,255,255,0.04); border: 2px solid var(--border); border-radius: 24px; position: relative; overflow: hidden; display:flex; align-items:center; justify-content:center; }
            .board-inner { width:100%; height:100%; display:flex; align-items:center; justify-content:center; padding: 20px; box-sizing: border-box; }
            .board-cell { border: 1px solid rgba(255,255,255,0.05); border-radius: 14px; background: rgba(255,255,255,0.02); width: 72%; height: 72%; box-shadow: inset 0 6px 18px rgba(0,0,0,0.06); }
            .board-cell.single { border-radius: 18px; }
            .d20-spot { position: absolute; inset: 0; display:flex; align-items:center; justify-content:center; pointer-events:none; }
            .d20 { display:flex; align-items:center; justify-content:center; width:96px; height:96px; }
            .d20 svg { width:100%; height:100%; }
            .d20.rolling svg { animation: roll-spin 1200ms linear infinite; }
            @keyframes roll-spin { from { transform: rotate(0deg); } to { transform: rotate(720deg); } }
            .confetti-overlay { position:fixed; inset:0; pointer-events:none; overflow:hidden; z-index:9999; }
            .confetti-piece { position:absolute; background:white; opacity:0.95; border-radius: 3px; animation: confetti-up 1200ms cubic-bezier(.2,.9,.2,1) forwards; }
            @keyframes confetti-up { 0%{ transform: translateY(0) rotate(0); opacity:1 } 100%{ transform: translateY(-120vh) rotate(720deg); opacity:0 } }
            .result-sink { animation: sink 900ms ease-in-out forwards; }
            @keyframes sink { 0%{ transform: translateY(0) scale(1) } 100%{ transform: translateY(14px) scale(0.94) } }
          `}</style>

          <div className="board-shell">
            <div className="board-inner">
              <div className="board-cell single" />
            </div>
            <div className="d20-spot">
              <div className={`d20 ${rolling ? 'rolling' : ''}`} style={{ transform: d20Transform, transition: d20Transition }}>
                <svg viewBox="0 0 100 100" style={{ display: 'block' }}>
                  <g transform="translate(50,50) scale(0.9)">
                    <path d="M0,-42 L34,-13 L20,35 L-20,35 L-34,-13 Z" fill="none" stroke="var(--accent)" strokeWidth="4" />
                    <g stroke="var(--accent)" strokeWidth="2" fill="none">
                      <path d="M0,-42 L0,35" />
                      <path d="M34,-13 L-34,-13" />
                      <path d="M20,35 L-20,35" />
                      <path d="M0,-42 L20,35" />
                      <path d="M0,-42 L-20,35" />
                    </g>
                    <text x="0" y="8" textAnchor="middle" fontFamily="Cinzel, serif" fontSize="28" fill={result ? '#ffffff' : 'var(--text)'}>{rolling ? '' : (result || '?')}</text>
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
          </div>
        </div>

        
      </div>
    </div>
  )
}
