import { useState, useEffect } from 'react'

export default function Dice() {
  const [rolling, setRolling] = useState(false)
  const [result, setResult] = useState(null)
  const [displayValue, setDisplayValue] = useState(1)
  const [showConfetti, setShowConfetti] = useState(false)
  const [sink, setSink] = useState(false)

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

    let count = 0
    const flick = setInterval(() => {
      count += 1
      setDisplayValue(Math.floor(Math.random() * 20) + 1)
      if (count >= 18) clearInterval(flick)
    }, 60)

    setTimeout(() => {
      const finalValue = Math.floor(Math.random() * 20) + 1
      setDisplayValue(finalValue)
      setResult(finalValue)
      if (finalValue === 20) setShowConfetti(true)
      if (finalValue === 1) setSink(true)
      setRolling(false)
    }, 1200)
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
            .board-shell { width: 100%; max-width: 320px; aspect-ratio: 1 / 1; background: rgba(255,255,255,0.04); border: 2px solid var(--border); border-radius: 24px; position: relative; overflow: hidden; }
            .board-grid { position: absolute; inset: 0; display: grid; grid-template-columns: repeat(4, 1fr); grid-template-rows: repeat(4, 1fr); gap: 10px; padding: 16px; }
            .board-cell { border: 1px solid rgba(255,255,255,0.05); border-radius: 14px; background: rgba(255,255,255,0.02); }
            .d20-spot { position: absolute; inset: 0; display:flex; align-items:center; justify-content:center; pointer-events:none; }
            .d20 { display:flex; align-items:center; justify-content:center; width:96px; height:96px; }
            .d20 svg { width:100%; height:100%; }
            .d20.rolling svg { animation: roll-spin 1200ms linear infinite; }
            @keyframes roll-spin { from { transform: rotate(0deg); } to { transform: rotate(720deg); } }
            .confetti-piece { position:absolute; width:6px; height:16px; background:rgba(255,255,255,0.94); opacity:0.95; border-radius: 3px; animation: confetti-fall 1200ms ease-out forwards; }
            @keyframes confetti-fall { 0%{ transform: translateY(0) rotate(0); opacity:1 } 100%{ transform: translateY(88px) rotate(720deg); opacity:0 } }
            .result-sink { animation: sink 900ms ease-in-out forwards; }
            @keyframes sink { 0%{ transform: translateY(0) scale(1) } 100%{ transform: translateY(14px) scale(0.94) } }
          `}</style>

          <div className="board-shell">
            <div className="board-grid">
              {Array.from({ length: 16 }).map((_, i) => <div key={i} className="board-cell" />)}
            </div>
            <div className="d20-spot">
              <div className={`d20 ${rolling ? 'rolling' : ''}`}>
                <svg viewBox="0 0 100 100" style={{ display: 'block' }}>
                  <g transform="translate(50,50) scale(0.9)">
                    <path d="M0,-42 L34,-13 L20,35 L-20,35 L-34,-13 Z" fill="none" stroke="var(--gold)" strokeWidth="4" />
                    <g stroke="var(--text)" strokeWidth="2" fill="none">
                      <path d="M0,-42 L0,35" />
                      <path d="M34,-13 L-34,-13" />
                      <path d="M20,35 L-20,35" />
                      <path d="M0,-42 L20,35" />
                      <path d="M0,-42 L-20,35" />
                    </g>
                    <text x="0" y="8" textAnchor="middle" fontFamily="Cinzel, serif" fontSize="28" fill="var(--text)">{rolling ? '' : (result || '?')}</text>
                  </g>
                </svg>
              </div>
            </div>
            {showConfetti && [10, 25, 40, 55, 70, 85].map((left, idx) => (
              <div key={idx} className="confetti-piece" style={{ left: `${left}%`, top: `${10 + idx * 4}%`, animationDelay: `${idx * 80}ms` }} />
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: 24, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 10 }}>Result</div>
            <div className={sink ? 'result-sink' : ''} style={{ fontSize: 72, fontFamily: 'Cinzel, serif', color: result ? 'var(--gold)' : 'var(--text)', minHeight: 100, display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
              {result || displayValue}
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-2)' }}>
              {result ? `Your dice landed on ${result}.` : 'Tap roll to send the d20 on the board.'}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={roll} disabled={rolling} style={{ background: 'var(--gold)', border: 'none', color: 'var(--text)', padding: '14px 22px', borderRadius: 12, fontSize: 18, fontWeight: 800, cursor: 'pointer', minWidth: 160 }}>
              {rolling ? 'Rolling…' : 'Roll d20'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
