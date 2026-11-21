import { useEffect, useMemo, useState } from 'react'
import { loadSrdMany } from '../utils/srd'
import { ABILITY_NAMES, fmtMod, spellSlots } from '../utils/rules5e'
import MiniMarkdown from '../components/MiniMarkdown'
import SrdAttribution from '../components/SrdAttribution'
import { SpellBrowser } from './Spells'

const TABS = ['Rules', 'Conditions', 'Classes', 'Races', 'Equipment', 'Spells']

const label = { fontSize: 10, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }
const title = { fontFamily: 'var(--font-title)', fontSize: 18, color: 'var(--gold)', marginBottom: 8 }
const text = { fontSize: 13, color: 'var(--text-2)', marginBottom: 10, lineHeight: 1.6 }
const Chip = ({ children }) => (
  <span style={{ display: 'inline-block', fontSize: 11, padding: '2px 8px', borderRadius: 999, background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text-2)', marginRight: 6, marginBottom: 6 }}>{children}</span>
)

// Searchable list on the left, detail on the right (wraps on narrow screens)
function Browser({ items, render, placeholder }) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const filtered = useMemo(() => items.filter(i => i.name.toLowerCase().includes(query.toLowerCase())), [items, query])
  const current = items.find(i => i.id === selected) || filtered[0]

  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <div style={{ width: 240, flexShrink: 0, maxWidth: '100%' }}>
        <input className="input" placeholder={placeholder} value={query} onChange={e => setQuery(e.target.value)} style={{ marginBottom: 8 }} />
        <div className="card" style={{ maxHeight: 520, overflowY: 'auto' }}>
          {filtered.map(i => (
            <div key={i.id} onClick={() => setSelected(i.id)}
              style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13, borderBottom: '1px solid var(--border)', background: current?.id === i.id ? 'var(--gold-bg)' : 'transparent', color: current?.id === i.id ? 'var(--gold)' : 'var(--text-2)' }}>
              {i.name}
            </div>
          ))}
          {!filtered.length && <div style={{ padding: 12, fontSize: 12, color: 'var(--text-3)' }}>No matches.</div>}
        </div>
      </div>
      <div className="card" style={{ flex: 1, minWidth: 280, padding: 20 }}>
        {current ? render(current) : <div style={{ color: 'var(--text-3)', fontSize: 13 }}>Nothing selected.</div>}
      </div>
    </div>
  )
}

function FeatureList({ ids, features }) {
  return [...new Set(ids)].map(f => features[f] && (
    <details key={f} style={{ marginBottom: 6 }}>
      <summary style={{ cursor: 'pointer', fontSize: 13, color: 'var(--text)' }}>
        {features[f].name} <span style={{ color: 'var(--text-3)', fontSize: 11 }}>· level {features[f].level}</span>
      </summary>
      <div style={{ marginTop: 6 }}><MiniMarkdown text={features[f].desc} compact /></div>
    </details>
  ))
}

function ClassDetail({ cls, srd }) {
  const { core, features } = srd
  const skillNames = Object.fromEntries(core.skills.map(s => [s.id, s.name]))
  const profName = (id) => core.proficiencies[id] || id
  const slotCols = cls.spellcasting ? [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(n => cls.levels.some(l => spellSlots(cls, l.level)[n])) : []

  return (
    <>
      <div style={title}>{cls.name}</div>
      <div style={{ marginBottom: 12 }}>
        <Chip>Hit die d{cls.hitDie}</Chip>
        <Chip>Saves: {cls.saves.map(s => ABILITY_NAMES[s]).join(', ')}</Chip>
        {cls.spellcasting && <Chip>Spellcasting: {ABILITY_NAMES[cls.spellcasting.ability]}</Chip>}
      </div>
      <div style={label}>Proficiencies</div>
      <div style={{ marginBottom: 10 }}>{cls.proficiencies.map(p => <Chip key={p}>{profName(p)}</Chip>)}</div>
      {cls.proficiencyChoices?.map((c, i) => (
        <div key={i} style={text}>Choose {c.choose}: {(c.from || []).map(f => skillNames[f.replace('skill-', '')] || profName(f)).join(', ')}</div>
      ))}

      <div style={label}>Level progression</div>
      <div style={{ overflowX: 'auto', marginBottom: 16 }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 12, color: 'var(--text-2)', width: '100%' }}>
          <thead>
            <tr style={{ color: 'var(--text-3)', textAlign: 'left' }}>
              <th style={{ padding: '4px 8px' }}>Lvl</th><th style={{ padding: '4px 8px' }}>Prof</th><th style={{ padding: '4px 8px' }}>Features</th>
              {slotCols.map(n => <th key={n} style={{ padding: '4px 6px' }}>{n}</th>)}
            </tr>
          </thead>
          <tbody>
            {cls.levels.map(l => {
              const slots = spellSlots(cls, l.level)
              return (
                <tr key={l.level} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '4px 8px' }}>{l.level}</td>
                  <td style={{ padding: '4px 8px' }}>{fmtMod(l.prof)}</td>
                  <td style={{ padding: '4px 8px' }}>{(l.features || []).map(f => features[f]?.name || f).join(', ') || '—'}</td>
                  {slotCols.map(n => <td key={n} style={{ padding: '4px 6px' }}>{slots[n] || '—'}</td>)}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div style={label}>Class features</div>
      <FeatureList ids={cls.levels.flatMap(l => l.features || [])} features={features} />

      {cls.subclasses?.map(sub => (
        <div key={sub.id} style={{ marginTop: 16 }}>
          <div style={label}>{sub.flavor}</div>
          <div style={{ fontFamily: 'var(--font-title)', fontSize: 15, color: 'var(--gold)', marginBottom: 6 }}>{sub.name}</div>
          <MiniMarkdown text={sub.desc} compact />
          <FeatureList ids={sub.levels.flatMap(l => l.features || [])} features={features} />
        </div>
      ))}
    </>
  )
}

function TraitList({ ids, traits }) {
  return ids?.map(t => traits[t] && (
    <div key={t} style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{traits[t].name}</div>
      <MiniMarkdown text={traits[t].desc} compact />
    </div>
  ))
}

function RaceDetail({ race, srd }) {
  return (
    <>
      <div style={title}>{race.name}</div>
      <div style={{ marginBottom: 12 }}>
        <Chip>Speed {race.speed} ft</Chip><Chip>{race.size}</Chip>
        {race.abilityBonuses?.map(b => <Chip key={b.ability}>{ABILITY_NAMES[b.ability]} {fmtMod(b.bonus)}</Chip>)}
        {race.abilityBonusOptions && <Chip>+1 to {race.abilityBonusOptions.choose} other abilities</Chip>}
      </div>
      <div style={label}>Age</div><div style={text}>{race.age}</div>
      <div style={label}>Alignment</div><div style={text}>{race.alignment}</div>
      <div style={label}>Size</div><div style={text}>{race.sizeDesc}</div>
      <div style={label}>Languages</div><div style={text}>{race.languageDesc}</div>
      <div style={label}>Traits</div>
      <TraitList ids={race.traits} traits={srd.traits} />
      {race.subraces?.map(sr => (
        <div key={sr.id} style={{ marginTop: 16 }}>
          <div style={{ fontFamily: 'var(--font-title)', fontSize: 15, color: 'var(--gold)', marginBottom: 6 }}>{sr.name}</div>
          <div style={{ marginBottom: 6 }}>{sr.abilityBonuses?.map(b => <Chip key={b.ability}>{ABILITY_NAMES[b.ability]} {fmtMod(b.bonus)}</Chip>)}</div>
          <div style={text}>{sr.desc}</div>
          <TraitList ids={sr.traits} traits={srd.traits} />
        </div>
      ))}
    </>
  )
}

function EquipmentDetail({ item, srd }) {
  const props = Object.fromEntries(srd.core.weaponProperties.map(p => [p.id, p.name]))
  return (
    <>
      <div style={title}>{item.name}</div>
      <div style={{ marginBottom: 12 }}>
        {item.cost && <Chip>{item.cost}</Chip>}
        {item.weight != null && <Chip>{item.weight} lb</Chip>}
        {item.weaponCategory && <Chip>{item.weaponCategory} {item.weaponRange}</Chip>}
        {item.damage && <Chip>{item.damage.dice} {item.damage.type}</Chip>}
        {item.twoHandedDamage && <Chip>Versatile {item.twoHandedDamage.dice}</Chip>}
        {item.armorCategory && <Chip>{item.armorCategory} armor</Chip>}
        {item.ac && <Chip>AC {item.ac.base}{item.ac.dexBonus ? ` + Dex${item.ac.maxDex != null ? ` (max ${item.ac.maxDex})` : ''}` : ''}</Chip>}
        {item.strMin && <Chip>Str {item.strMin}</Chip>}
        {item.stealthDisadvantage && <Chip>Stealth disadvantage</Chip>}
        {item.range && <Chip>Range {item.range.normal}{item.range.long ? `/${item.range.long}` : ''} ft</Chip>}
      </div>
      {item.properties?.length > 0 && <div style={text}>Properties: {item.properties.map(p => props[p] || p).join(', ')}</div>}
      {item.desc && <MiniMarkdown text={item.desc} />}
    </>
  )
}

export default function RulesReference() {
  const [tab, setTab] = useState('Rules')
  const [srd, setSrd] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    loadSrdMany('core', 'rules', 'classes', 'races', 'traits', 'features', 'equipment', 'spells')
      .then(setSrd).catch(() => setError('Could not load the rules data.'))
  }, [])

  return (
    <div className="page-content">
      <div className="page-header-row" style={{ marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 22, marginBottom: 4 }}>5e Rules Reference</h2>
          <p style={{ color: 'var(--text-2)', fontSize: 13, margin: 0 }}>Searchable rules, classes, races, gear and spells. 5E compatible.</p>
        </div>
      </div>

      <div role="tablist" style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid var(--border)', overflowX: 'auto' }}>
        {TABS.map(t => (
          <div key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            style={{ padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', color: tab === t ? 'var(--gold)' : 'var(--text-3)', borderBottom: `2px solid ${tab === t ? 'var(--gold)' : 'transparent'}`, marginBottom: -1 }}>
            {t}
          </div>
        ))}
      </div>

      {error && <div style={{ color: 'var(--red)', fontSize: 13 }}>{error}</div>}
      {!srd && !error && <div style={{ color: 'var(--text-3)', fontSize: 13 }}>Loading…</div>}

      {srd && tab === 'Rules' && (
        <Browser placeholder="Search rules…" items={srd.rules}
          render={r => <><div style={title}>{r.name}</div><MiniMarkdown text={r.desc.replace(/^#{1,2}\s.*\n+/, '')} /></>} />
      )}
      {srd && tab === 'Conditions' && (
        <Browser placeholder="Search conditions…" items={srd.core.conditions}
          render={c => <><div style={title}>{c.name}</div><MiniMarkdown text={c.desc} /></>} />
      )}
      {srd && tab === 'Classes' && <Browser placeholder="Search classes…" items={srd.classes} render={c => <ClassDetail cls={c} srd={srd} />} />}
      {srd && tab === 'Races' && <Browser placeholder="Search races…" items={srd.races} render={r => <RaceDetail race={r} srd={srd} />} />}
      {srd && tab === 'Equipment' && <Browser placeholder="Search equipment…" items={srd.equipment} render={i => <EquipmentDetail item={i} srd={srd} />} />}
      {srd && tab === 'Spells' && <SpellBrowser srd={srd} />}

      <SrdAttribution />
    </div>
  )
}
