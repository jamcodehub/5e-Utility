import { useEffect, useMemo, useState } from 'react'
import { loadSrdMany } from '../utils/srd'
import {
  ABILITIES, ABILITY_NAMES, abilityMod, proficiencyBonus, averageHpGain, hpGain, isCaster,
  featuresThrough, subclassLevel, gainsAbilityScoreImprovement, maxSpellLevel,
} from '../utils/rules5e'
import SpellsStep from './SpellsStep'
import SrdAttribution from './SrdAttribution'

const chip = (on) => ({
  padding: '6px 12px', borderRadius: 8, fontSize: 13, cursor: 'pointer', userSelect: 'none',
  background: on ? 'var(--gold-bg)' : 'var(--surface2)', color: on ? 'var(--gold)' : 'var(--text-2)',
  border: `1px solid ${on ? 'var(--gold-border)' : 'var(--border)'}`,
})
const label = { fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '14px 0 6px', display: 'block' }

// Level up a character that was built with the SRD creator (has char.srd.classId).
export default function LevelUp({ char, onClose, onComplete }) {
  const [data, setData] = useState(null)
  const [hpMode, setHpMode] = useState('average')
  const [rolled, setRolled] = useState(null)
  const [subclassId, setSubclassId] = useState('')
  const [asi, setAsi] = useState([])
  const [spellSel, setSpellSel] = useState(null)

  useEffect(() => { loadSrdMany('classes', 'spells', 'features').then(setData) }, [])

  const cls = data?.classes.find(c => c.id === char.srd?.classId)
  const level = (char.level || 1) + 1
  const needsSubclass = !!cls && level === subclassLevel(cls) && !char.srd?.subclassId && cls.subclasses?.length > 0
  const needsAsi = !!cls && gainsAbilityScoreImprovement(cls, level)
  const casting = !!cls && isCaster(cls) && cls.spellcasting.level <= level
  const currentSpells = char.spells || { cantrips: [], known: [], prepared: [] }

  const stats = useMemo(() => {
    const s = { ...char.stats }
    asi.forEach(a => { s[a] = Math.min(20, (s[a] || 10) + 1) })
    return s
  }, [char.stats, asi])

  useEffect(() => {
    if (cls && !spellSel) setSpellSel({ cantrips: currentSpells.cantrips || [], known: currentSpells.known || [], prepared: currentSpells.prepared || [] })
  }, [cls]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!char.srd?.classId) {
    return (
      <Wrap onClose={onClose}>
        <div style={{ padding: 20, fontSize: 13, color: 'var(--text-2)' }}>
          Guided level-up is available for characters built with the Character Creator. For this sheet, edit the level, HP and stats directly.
        </div>
      </Wrap>
    )
  }
  if (level > 20) return <Wrap onClose={onClose}><div style={{ padding: 20 }}>This character is already level 20.</div></Wrap>

  const conMod = abilityMod(stats.con)
  const newFeatureIds = cls ? featuresThrough(cls, subclassId || char.srd.subclassId, level).filter(f => !(char.srd.features || []).includes(f)) : []
  const hpDelta = hpMode === 'roll' && rolled != null ? hpGain(cls?.hitDie, conMod, rolled) : cls ? hpGain(cls.hitDie, conMod) : 0
  // ASI choice must be exactly 2 points; a +2 to one ability is two picks of the same ability
  const asiOk = !needsAsi || asi.length === 2
  const subOk = !needsSubclass || !!subclassId
  const hpOk = hpMode === 'average' || rolled != null

  const pickAsi = (a) => setAsi(cur => {
    if (cur.length >= 2) return [a]
    if ((char.stats[a] || 10) + cur.filter(x => x === a).length >= 20) return cur
    return [...cur, a]
  })

  const apply = () => {
    const newStats = stats
    const roll = hpMode === 'roll' ? rolled : null
    onComplete({
      level,
      stats: newStats,
      profBonus: proficiencyBonus(level),
      hp: { current: (char.hp?.current ?? 0) + hpDelta, max: (char.hp?.max ?? 0) + hpDelta },
      srd: {
        ...char.srd,
        subclassId: subclassId || char.srd.subclassId || '',
        features: [...new Set([...(char.srd.features || []), ...newFeatureIds])],
        hpRolls: [...(char.srd.hpRolls || []), roll ?? averageHpGain(cls.hitDie)],
        asiLog: needsAsi ? [...(char.srd.asiLog || []), { level, increases: asi }] : char.srd.asiLog || [],
      },
      spells: casting && spellSel ? { ...currentSpells, ...spellSel } : currentSpells,
    })
  }

  return (
    <Wrap onClose={onClose} title={`Level up to ${level}`}>
      <div style={{ padding: '4px 20px 16px', overflowY: 'auto', flex: 1 }}>
        {!data && <div style={{ padding: 20, color: 'var(--text-3)' }}>Loading rules…</div>}
        {data && cls && (
          <>
            <span style={label}>Hit points (d{cls.hitDie}, CON {abilityMod(stats.con) >= 0 ? '+' : ''}{conMod})</span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={chip(hpMode === 'average')} onClick={() => setHpMode('average')}>Average (+{hpGain(cls.hitDie, conMod)})</span>
              <span style={chip(hpMode === 'roll')} onClick={() => { setHpMode('roll'); setRolled(1 + Math.floor(Math.random() * cls.hitDie)) }}>Roll d{cls.hitDie}</span>
              {hpMode === 'roll' && rolled != null && <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Rolled {rolled} → +{hpGain(cls.hitDie, conMod, rolled)} HP</span>}
            </div>

            {needsSubclass && (
              <>
                <span style={label}>Choose your {cls.name} subclass</span>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {cls.subclasses.map(s => <span key={s.id} style={chip(subclassId === s.id)} onClick={() => setSubclassId(s.id)}>{s.name}</span>)}
                </div>
              </>
            )}

            {needsAsi && (
              <>
                <span style={label}>Ability Score Improvement: +2 total ({asi.length}/2)</span>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 6 }}>Click one ability twice for +2, or two abilities for +1 each. Scores cap at 20.</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {ABILITIES.map(a => (
                    <span key={a} style={chip(asi.includes(a))} onClick={() => pickAsi(a)}>
                      {ABILITY_NAMES[a]} {stats[a]}{asi.filter(x => x === a).length ? ` (+${asi.filter(x => x === a).length})` : ''}
                    </span>
                  ))}
                </div>
              </>
            )}

            {newFeatureIds.length > 0 && (
              <>
                <span style={label}>New features</span>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7 }}>
                  {newFeatureIds.map(f => <li key={f}>{data.features[f]?.name || f}</li>)}
                </ul>
              </>
            )}

            {casting && spellSel && (
              <>
                <span style={label}>Spells (up to level {maxSpellLevel(cls, level)})</span>
                <SpellsStep cls={cls} level={level} stats={stats} spells={data.spells} value={spellSel} onChange={setSpellSel} />
              </>
            )}
          </>
        )}
        <SrdAttribution />
      </div>
      <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary btn-sm" disabled={!data || !subOk || !asiOk || !hpOk} onClick={apply}>Level up</button>
      </div>
    </Wrap>
  )
}

function Wrap({ onClose, title = 'Level up', children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div className="card" style={{ width: '100%', maxWidth: 620, maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: 0 }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 17 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--text-2)' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}
