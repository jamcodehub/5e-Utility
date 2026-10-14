import { useState } from 'react'

const SECTIONS = [
  { title: 'Actions in Combat', body: 'Attack, Cast a Spell, Dash, Disengage, Dodge, Help, Hide, Ready, Search, Use an Object. Each turn: 1 action, 1 bonus action (if available), movement, 1 reaction (per round).' },
  { title: 'Advantage / Disadvantage', body: 'Roll 2d20, take the higher (advantage) or lower (disadvantage). They never stack — multiple sources still mean just one extra roll.' },
  { title: 'Conditions', body: 'Blinded, Charmed, Deafened, Frightened, Grappled, Incapacitated, Invisible, Paralyzed, Petrified, Poisoned, Prone, Restrained, Stunned, Unconscious. Check the PHB for exact mechanical effects of each.' },
  { title: 'Death Saves', body: 'At 0 HP, roll d20 each turn: 10+ is a success, below 10 a failure. 3 successes stabilizes; 3 failures = death. A natural 20 regains 1 HP; a natural 1 counts as two failures.' },
  { title: 'Resting', body: 'Short rest: 1 hour, spend Hit Dice to heal. Long rest: 8 hours, regain all HP and half your Hit Dice (min 1), resets most limited-use abilities.' },
  { title: 'Cover', body: 'Half cover: +2 AC/Dex saves. Three-quarters cover: +5 AC/Dex saves. Full cover: can\'t be targeted directly.' },
  { title: 'Spell Slots & Concentration', body: 'Casting a concentration spell while concentrating on another ends the first. Taking damage: Constitution save (DC 10 or half damage, whichever is higher) to maintain concentration.' },
  { title: 'Difficulty Classes (quick reference)', body: 'Very easy 5 · Easy 10 · Medium 15 · Hard 20 · Very hard 25 · Nearly impossible 30.' },
]

export default function RulesReference() {
  const [query, setQuery] = useState('')
  const filtered = SECTIONS.filter(s => (s.title + s.body).toLowerCase().includes(query.toLowerCase()))

  return (
    <div className="page-content">
      <div className="page-header-row" style={{ marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, marginBottom: 4 }}>5e Rules Reference</h2>
        </div>
      </div>

      <input className="input" placeholder="Search rules..." value={query} onChange={e => setQuery(e.target.value)} style={{ maxWidth: 400, marginBottom: 20 }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 720 }}>
        {filtered.map(s => (
          <div key={s.title} className="card" style={{ padding: 16 }}>
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: 15, marginBottom: 6, color: 'var(--gold)' }}>{s.title}</div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>{s.body}</div>
          </div>
        ))}
        {filtered.length === 0 && <div style={{ color: 'var(--text-3)', fontSize: 13 }}>No matching rules found.</div>}
      </div>
    </div>
  )
}
