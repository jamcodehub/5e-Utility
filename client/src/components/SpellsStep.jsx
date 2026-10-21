import { useMemo, useState } from 'react'
import {
  abilityMod, cantripsKnown, maxSpellLevel, spellMode, spellbookLimit, preparedLimit, spellsKnownFixed,
} from '../utils/rules5e'

const chip = (on) => ({
  padding: '4px 10px', borderRadius: 999, fontSize: 12, cursor: 'pointer', userSelect: 'none',
  background: on ? 'var(--gold-bg)' : 'var(--surface2)', color: on ? 'var(--gold)' : 'var(--text-2)',
  border: `1px solid ${on ? 'var(--gold-border)' : 'var(--border)'}`,
})
const heading = { fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '12px 0 6px' }

// Pick cantrips / known spells / spellbook / prepared spells for a class at a level,
// enforcing the SRD limits. value = { cantrips, known, prepared }.
export default function SpellsStep({ cls, level, stats, spells, value, onChange }) {
  const [query, setQuery] = useState('')
  const mode = spellMode(cls.id)
  const castMod = abilityMod(stats[cls.spellcasting.ability])
  const top = maxSpellLevel(cls, level)
  const cantripLimit = cantripsKnown(cls, level)
  const knownLimit = mode === 'spellbook' ? spellbookLimit(level) : mode === 'known' ? spellsKnownFixed(cls, level) : 0
  const prepLimit = mode === 'known' ? 0 : preparedLimit(cls.id, level, castMod)

  const pool = useMemo(() => spells.filter(s => s.classes.includes(cls.id) && s.level <= top
    && s.name.toLowerCase().includes(query.toLowerCase())), [spells, cls.id, top, query])
  const cantrips = pool.filter(s => s.level === 0)
  const leveled = pool.filter(s => s.level > 0)

  const toggle = (field, id, limit) => {
    const list = value[field] || []
    if (list.includes(id)) {
      // Removing a spellbook spell also unprepares it
      const next = { ...value, [field]: list.filter(x => x !== id) }
      if (field === 'known' && mode === 'spellbook') next.prepared = (value.prepared || []).filter(x => x !== id)
      return onChange(next)
    }
    if (list.length >= limit) return
    onChange({ ...value, [field]: [...list, id] })
  }

  if (top === 0 && cantripLimit === 0) {
    return <div style={{ fontSize: 13, color: 'var(--text-2)' }}>{cls.name}s don't have spells to choose at level {level}. Spellcasting begins at level {cls.spellcasting.level}.</div>
  }

  const counter = (n, limit) => <span style={{ color: n === limit ? 'var(--green)' : 'var(--text-3)' }}>{n}/{limit}</span>
  const pickFrom = mode === 'prepare-all' ? 'prepared' : 'known'
  const pickLimit = mode === 'prepare-all' ? prepLimit : knownLimit

  return (
    <div>
      <input className="input" placeholder="Search spells…" value={query} onChange={e => setQuery(e.target.value)} style={{ marginBottom: 8 }} />
      {cantripLimit > 0 && (
        <>
          <div style={heading}>Cantrips {counter((value.cantrips || []).length, cantripLimit)}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {cantrips.map(s => <span key={s.id} style={chip((value.cantrips || []).includes(s.id))} onClick={() => toggle('cantrips', s.id, cantripLimit)}>{s.name}</span>)}
          </div>
        </>
      )}
      {pickLimit > 0 && (
        <>
          <div style={heading}>
            {mode === 'spellbook' ? 'Spellbook' : mode === 'prepare-all' ? 'Prepared spells' : 'Spells known'} {counter((value[pickFrom] || []).length, pickLimit)}
          </div>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].filter(l => leveled.some(s => s.level === l)).map(l => (
            <div key={l} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Level {l}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {leveled.filter(s => s.level === l).map(s => <span key={s.id} style={chip((value[pickFrom] || []).includes(s.id))} onClick={() => toggle(pickFrom, s.id, pickLimit)}>{s.name}</span>)}
              </div>
            </div>
          ))}
        </>
      )}
      {mode === 'spellbook' && (value.known || []).length > 0 && (
        <>
          <div style={heading}>Prepared from your spellbook {counter((value.prepared || []).length, prepLimit)}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {spells.filter(s => (value.known || []).includes(s.id)).map(s => (
              <span key={s.id} style={chip((value.prepared || []).includes(s.id))} onClick={() => toggle('prepared', s.id, prepLimit)}>{s.name}</span>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
