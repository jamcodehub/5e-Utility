import { useMemo } from 'react'
import { buildDie } from '../utils/diceGeometry'

const FONT = { d6: 0.5, d8: 0.32, d12: 0.3, d20: 0.34 }
// Three real 3D dice (the same geometry as the Dice page), each turning on its own axis and speed. They pick up the
// theme colours, and stand still when the visitor prefers reduced motion.
const DICE = [
  { kind: 'd20', size: 104, x: '52%', y: '50%', axis: '1,1,0.2', secs: 16, tilt: '-18deg' },
  { kind: 'd12', size: 64, x: '16%', y: '72%', axis: '0.3,1,0.6', secs: 22, tilt: '12deg' },
  { kind: 'd8', size: 62, x: '85%', y: '27%', axis: '1,0.4,0.2', secs: 19, tilt: '8deg' },
]

function Die({ kind, size, x, y, axis, secs, tilt, delay }) {
  const faces = useMemo(() => buildDie(kind, size), [kind, size])
  const name = `spin-${kind}`
  const [ax, ay, az] = axis.split(',')
  return (
    <div className="spin-die" style={{ width: size, height: size, left: x, top: y, marginLeft: -size / 2, marginTop: -size / 2, transform: `rotate(${tilt})` }}>
      <style>{`@keyframes ${name} { from { transform: rotate3d(${ax},${ay},${az},0deg); } to { transform: rotate3d(${ax},${ay},${az},360deg); } }`}</style>
      <div className="spin-die-body" style={{ animation: `${name} ${secs}s linear ${delay}s infinite` }}>
        {faces.map((f, k) => (
          <div key={k} className="spin-face" style={{
            width: f.S, height: f.S, left: (size - f.S) / 2, top: (size - f.S) / 2,
            clipPath: f.clip || undefined,
            transform: `matrix3d(${[...f.u, 0, ...f.v, 0, ...f.n, 0, ...f.c, 1].join(',')}) scale(1.012)`,
            fontSize: Math.round(f.S * FONT[kind]),
            background: `color-mix(in srgb, var(--gold) ${34 + ((k * 7) % 5) * 7}%, var(--text))`,
            color: 'color-mix(in srgb, var(--gold) 20%, var(--bg))',
            textDecoration: f.num === 6 || f.num === 9 ? 'underline' : 'none',
          }}>{f.num}</div>
        ))}
      </div>
    </div>
  )
}

export default function SpinningDice() {
  return (
    <div className="spin-dice" role="img" aria-label="A d20, a d12 and a d8 turning slowly">
      {DICE.map((d, i) => <Die key={d.kind} {...d} delay={-i * 5} />)}
    </div>
  )
}
