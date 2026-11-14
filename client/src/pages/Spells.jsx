import { useMemo, useState } from 'react'
import { ABILITY_NAMES } from '../utils/rules5e'
import MiniMarkdown from '../components/MiniMarkdown'

const levelName = (n) => (n === 0 ? 'Cantrip' : `Level ${n}`)
const label = { fontSize: 10, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }
const Chip = ({ children }) => (
  <span style={{ display: 'inline-block', fontSize: 11, padding: '2px 8px', borderRadius: 999, background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text-2)', marginRight: 6, marginBottom: 6 }}>{children}</span>
)

function SpellDetail({ spell, children }) {
  return (
    <>
      <div style={{ fontFamily: 'var(--font-title)', fontSize: 18, color: 'var(--gold)', marginBottom: 4 }}>{spell.name}</div>
      <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 12 }}>
        {levelName(spell.level)} {spell.school}{spell.ritual ? ' (ritual)' : ''}
      </div>
      <div style={{ marginBottom: 10 }}>
        <Chip>{spell.castingTime}</Chip><Chip>Range: {spell.range}</Chip>
        <Chip>{spell.components?.join(', ')}</Chip><Chip>{spell.concentration ? 'Concentration, ' : ''}{spell.duration}</Chip>
        {spell.save && <Chip>{ABILITY_NAMES[spell.save.ability]} save</Chip>}
        {spell.attackType && <Chip>{spell.attackType} spell attack</Chip>}
      </div>
      {spell.material && <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 10 }}>Material: {spell.material}</div>}
      <MiniMarkdown text={spell.desc} />
      {spell.higher?.length > 0 && (<><div style={label}>At higher levels</div><MiniMarkdown text={spell.higher} /></>)}
      <div style={{ fontSize: 12, color: 'var(--text-3)', margin: '8px 0' }}>Classes: {spell.classes.map(c => c[0].toUpperCase() + c.slice(1)).join(', ')}</div>
      {children}
    </>
  )
}

// ── Spell browser ───────────────────────────────────────────────────────────
export function SpellBrowser({ srd, renderActions, lockClass }) {
  const [query, setQuery] = useState('')
  const [level, setLevel] = useState('all')
  const [cls, setCls] = useState(lockClass || 'all')
  const [school, setSchool] = useState('all')
  const [selected, setSelected] = useState(null)

  const schools = useMemo(() => [...new Set(srd.spells.map(s => s.school))].sort(), [srd])
  const filtered = useMemo(() => srd.spells.filter(s =>
    s.name.toLowerCase().includes(query.toLowerCase())
    && (level === 'all' || s.level === Number(level))
    && (cls === 'all' || s.classes.includes(cls))
    && (school === 'all' || s.school === school)
  ), [srd, query, level, cls, school])
  const current = srd.spells.find(s => s.id === selected) || filtered[0]

  const select = { padding: '6px 8px', fontSize: 12 }
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <div style={{ width: 280, flexShrink: 0, maxWidth: '100%' }}>
        <input className="input" placeholder="Search spells…" value={query} onChange={e => setQuery(e.target.value)} style={{ marginBottom: 8 }} />
        <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
          <select className="input" style={{ ...select, flex: 1 }} value={level} onChange={e => setLevel(e.target.value)} aria-label="Spell level">
            <option value="all">Any level</option>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => <option key={n} value={n}>{levelName(n)}</option>)}
          </select>
          <select className="input" style={{ ...select, flex: 1 }} value={cls} onChange={e => setCls(e.target.value)} aria-label="Class">
            <option value="all">Any class</option>
            {srd.classes.filter(c => c.spellcasting).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="input" style={{ ...select, flex: 1 }} value={school} onChange={e => setSchool(e.target.value)} aria-label="School">
            <option value="all">Any school</option>
            {schools.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6 }}>{filtered.length} spell{filtered.length === 1 ? '' : 's'}</div>
        <div className="card" style={{ maxHeight: 520, overflowY: 'auto' }}>
          {filtered.map(s => (
            <div key={s.id} onClick={() => setSelected(s.id)}
              style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13, borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', gap: 8, background: current?.id === s.id ? 'var(--gold-bg)' : 'transparent', color: current?.id === s.id ? 'var(--gold)' : 'var(--text-2)' }}>
              <span>{s.name}</span><span style={{ fontSize: 11, color: 'var(--text-3)' }}>{s.level === 0 ? 'C' : s.level}</span>
            </div>
          ))}
          {!filtered.length && <div style={{ padding: 12, fontSize: 12, color: 'var(--text-3)' }}>No matching spells.</div>}
        </div>
      </div>
      <div className="card" style={{ flex: 1, minWidth: 280, padding: 20 }}>
        {current ? <SpellDetail spell={current}>{renderActions?.(current)}</SpellDetail> : <div style={{ color: 'var(--text-3)', fontSize: 13 }}>Nothing selected.</div>}
      </div>
    </div>
  )
}
