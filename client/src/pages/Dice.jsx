import { useState, useMemo } from 'react'

export default function Dice() {
  const [rolling, setRolling] = useState(false)
  const [result, setResult] = useState(null)
  const [displayValue, setDisplayValue] = useState(1)

  const track = useMemo(() => Array.from({ length: 20 }, (_, i) => 20 - i), [])

  const roll = () => {
    if (rolling) return
    setRolling(true)
    setResult(null)
    let count = 0
    const interval = setInterval(() => {
      count += 1
      setDisplayValue(Math.floor(Math.random() * 20) + 1)
      if (count >= 18) {
        clearInterval(interval)
        const finalValue = Math.floor(Math.random() * 20) + 1
        setDisplayValue(finalValue)
        setResult(finalValue)
        setRolling(false)
      }
    }, 75)
  }

  return (
    <div className="page-content" style={{ paddingBottom: 32 }}>
      <div className="page-header-row" style={{ marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, marginBottom: 6 }}>Dice Tower</h2>
          <p style={{ color: 'var(--text-2)', fontSize: 14, margin: 0 }}>Roll a d20 down the castle slide and see where it lands.</p>
        </div>
        <button className="btn btn-primary" onClick={roll} disabled={rolling} style={{ minWidth: 160 }}>
          {rolling ? 'Rolling…' : 'Roll d20'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 18, maxWidth: 720, margin: '0 auto' }}>
        <div className="card" style={{ padding: 20, background: 'var(--surface2)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Castle Slide</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>1-20 random chance</div>
          </div>
          <div style={{ height: 420, overflow: 'hidden', background: 'linear-gradient(180deg, rgba(255,255,255,0.08), transparent 35%), var(--surface)', borderRadius: 20, border: '1px solid var(--border)', position: 'relative', padding: 16 }}>
            <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(135deg, transparent, transparent 40px, rgba(0,0,0,0.04) 40px, rgba(0,0,0,0.04) 41px)' }} />
            <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', display: 'grid', gridTemplateRows: 'repeat(20, 1fr)', gap: 8, padding: '12px 0' }}>
              {track.map((value, index) => (
                <div key={value} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 12, background: index % 2 === 0 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', color: 'var(--text)', border: '1px solid rgba(0,0,0,0.08)' }}>
                  <span style={{ fontWeight: 600 }}>{value}</span>
                  {displayValue === value && rolling && <span style={{ fontSize: 11, color: 'var(--gold)' }}>Rolling</span>}
                  {displayValue === value && result === value && !rolling && <span style={{ fontSize: 11, color: 'var(--green)' }}>Landed</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 10 }}>Result</div>
          <div style={{ fontSize: 72, fontFamily: 'Cinzel, serif', color: result ? 'var(--gold)' : 'var(--text)', minHeight: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {result || displayValue}
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-2)' }}>
            {result ? `Your dice landed on ${result}.` : 'Tap roll to send the d20 down the slide.'}
          </div>
        </div>
      </div>
    </div>
  )
}
