import { useState, useMemo, useRef, useEffect } from 'react'

const DEFAULT_DURATION = 2200

export default function Dice() {
  const [rolling, setRolling] = useState(false)
  const [result, setResult] = useState(null)
  const [displayValue, setDisplayValue] = useState(1)
  const [slideDuration, setSlideDuration] = useState(DEFAULT_DURATION)
  const d20Ref = useRef(null)

  const track = useMemo(() => Array.from({ length: 20 }, (_, i) => 20 - i), [])

  useEffect(() => {
    const compute = () => {
      const w = window.innerWidth
      if (w <= 420) setSlideDuration(1600)
      else if (w <= 768) setSlideDuration(2000)
      else setSlideDuration(DEFAULT_DURATION)
    }
    compute()
    window.addEventListener('resize', compute)
    return () => window.removeEventListener('resize', compute)
  }, [])

  const roll = () => {
    if (rolling) return
    setRolling(true)
    setResult(null)
    let count = 0
    const flick = setInterval(() => {
      count += 1
      setDisplayValue(Math.floor(Math.random() * 20) + 1)
      if (count >= 24) clearInterval(flick)
    }, 60)

    // reveal after animation duration
    setTimeout(() => {
      const finalValue = Math.floor(Math.random() * 20) + 1
      setDisplayValue(finalValue)
      setResult(finalValue)
      setRolling(false)
    }, slideDuration)
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
            <style>{`
              .slide-wrap{ position:relative; width:100%; height:100%; }
              .slide-svg{ width:100%; height:100%; display:block }
              .d20{ position:absolute; width:56px; height:56px; background:linear-gradient(135deg,#f7ecd6,#e6caa0); border-radius:12px; display:flex; align-items:center; justify-content:center; font-weight:700; color:var(--text); box-shadow:0 6px 18px rgba(0,0,0,0.35); transform-origin:center; left:0; top:0 }
              @keyframes slideMotion { from { offset-distance: 0%; transform: rotate(0deg); } to { offset-distance: 100%; transform: rotate(720deg); } }
              .d20.rolling{ offset-path: path('M8 24 C80 14 160 18 240 36 C320 56 380 110 420 140'); -webkit-offset-path: path("M8 24 C80 14 160 18 240 36 C320 56 380 110 420 140"); animation: slideMotion ${slideDuration}ms cubic-bezier(.18,.9,.18,1) forwards; }
            `}</style>

            <div className="slide-wrap">
              <svg className="slide-svg" viewBox="0 0 440 160" preserveAspectRatio="xMidYMid meet">
                <defs>
                  <linearGradient id="g1" x1="0" x2="1"><stop offset="0" stopColor="#e8d8b8" /><stop offset="1" stopColor="#caa879" /></linearGradient>
                </defs>
                <g stroke="#3a2510" strokeWidth="4" strokeLinecap="round">
                  <line x1="40" y1="20" x2="40" y2="140" strokeOpacity="0.9" />
                  <line x1="140" y1="30" x2="140" y2="140" strokeOpacity="0.9" />
                  <line x1="240" y1="40" x2="240" y2="140" strokeOpacity="0.9" />
                  <line x1="340" y1="60" x2="340" y2="140" strokeOpacity="0.9" />
                </g>
                <path d="M8 24 C80 14 160 18 240 36 C320 56 380 110 420 140" fill="none" stroke="url(#g1)" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
                <div ref={d20Ref} className={`d20 ${rolling ? 'rolling' : ''}`} style={{ offsetDistance: '0%' }}>
                  {/* SVG icosahedron-like face: stylized 2D projection with triangular facets */}
                  <svg viewBox="0 0 100 100" width="56" height="56" style={{ display: 'block' }}>
                    <defs>
                      <linearGradient id="d20g" x1="0" x2="1"><stop offset="0" stopColor="#f7ecd6" /><stop offset="1" stopColor="#e6caa0" /></linearGradient>
                    </defs>
                    <g transform="translate(50,50) scale(0.9)">
                      <circle r="46" fill="url(#d20g)" stroke="#3a2510" strokeWidth="2" />
                      {/* simple triangular facet overlay to evoke a d20 */}
                      <g stroke="#3a2510" strokeWidth="1" fill="none">
                        <path d="M0,-42 L20,-8 L-20,-8 Z" />
                        <path d="M-20,-8 L0,30 L-40,6 Z" />
                        <path d="M20,-8 L40,6 L0,30 Z" />
                        <path d="M-40,6 L-8,6 L-20,-8 Z" />
                        <path d="M40,6 L8,6 L20,-8 Z" />
                        <path d="M-8,6 L0,30 L8,6 Z" />
                      </g>
                      <text x="0" y="8" textAnchor="middle" fontFamily="Cinzel, serif" fontSize="28" fill="#2f2216">{rolling ? '' : (result || '?')}</text>
                    </g>
                  </svg>
                </div>
            </div>

            <div style={{ position: 'absolute', left: 12, right: 12, bottom: 12, display: 'grid', gridTemplateRows: 'repeat(20, 1fr)', gap: 8 }}>
              {track.map((value, index) => (
                <div key={value} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', borderRadius: 8, background: index % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', color: 'var(--text)', border: '1px solid rgba(0,0,0,0.04)' }}>
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
