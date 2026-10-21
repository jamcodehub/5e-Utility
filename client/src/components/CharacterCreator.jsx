import { useEffect, useMemo, useRef, useState } from 'react'
import { loadSrdMany } from '../utils/srd'
import {
  ABILITIES, ABILITY_NAMES, STANDARD_ARRAY, abilityMod, fmtMod, proficiencyBonus, pointBuyCost, POINT_BUY_BUDGET,
  canRaise, canLower, hpAtFirstLevel, isCaster, featuresThrough, subclassLevel,
} from '../utils/rules5e'
import SpellsStep from './SpellsStep'
import SrdAttribution from './SrdAttribution'
import { useCampaign } from '../context/CampaignContext'

const STEPS = ['Campaign', 'Race', 'Class', 'Abilities', 'Skills', 'Spells', 'Review']
const chip = (on) => ({
  padding: '6px 12px', borderRadius: 8, fontSize: 13, cursor: 'pointer', userSelect: 'none',
  background: on ? 'var(--gold-bg)' : 'var(--surface2)', color: on ? 'var(--gold)' : 'var(--text-2)',
  border: `1px solid ${on ? 'var(--gold-border)' : 'var(--border)'}`,
})
const label = { fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '14px 0 6px', display: 'block' }
const roll4d6 = () => {
  const d = Array.from({ length: 4 }, () => 1 + Math.floor(Math.random() * 6)).sort((a, b) => a - b)
  return d[1] + d[2] + d[3]
}
const skillName = (id) => id.replace('skill-', '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
const bonusText = (list) => (list || []).map(b => `${ABILITY_NAMES[b.ability]} +${b.bonus}`).join(', ')

export default function CharacterCreator({ onClose, onComplete, draftKey = 'creator_draft' }) {
  const { campaigns, activeCampaign } = useCampaign()
  const draft = useRef(null)
  if (draft.current === null) {
    try { draft.current = JSON.parse(localStorage.getItem(draftKey)) || {} } catch { draft.current = {} }
  }
  const d = draft.current
  const [campaignId, setCampaignId] = useState(d.campaignId ?? activeCampaign?._id ?? '')
  const [data, setData] = useState(null)
  const [step, setStep] = useState(d.step ?? 0)
  const [raceId, setRaceId] = useState(d.raceId ?? '')
  const [subraceId, setSubraceId] = useState(d.subraceId ?? '')
  const [flexBonus, setFlexBonus] = useState(d.flexBonus ?? [])
  const [classId, setClassId] = useState(d.classId ?? '')
  const [method, setMethod] = useState(d.method ?? 'standard')
  const [pool, setPool] = useState(d.pool ?? STANDARD_ARRAY)
  const [assign, setAssign] = useState(d.assign ?? {})
  const [buy, setBuy] = useState(d.buy ?? Object.fromEntries(ABILITIES.map(a => [a, 8])))
  const [bgMode, setBgMode] = useState(d.bgMode ?? 'acolyte')
  const [bgSkills, setBgSkills] = useState(d.bgSkills ?? [])
  const [classSkills, setClassSkills] = useState(d.classSkills ?? [])
  const [name, setName] = useState(d.name ?? '')
  const [spellSel, setSpellSel] = useState(d.spellSel ?? { cantrips: [], known: [], prepared: [] })

  // Auto-save progress so closing the wizard doesn't lose it
  useEffect(() => {
    localStorage.setItem(draftKey, JSON.stringify({ campaignId, step, raceId, subraceId, flexBonus, classId, method, pool, assign, buy, bgMode, bgSkills, classSkills, name, spellSel }))
  }, [draftKey, campaignId, step, raceId, subraceId, flexBonus, classId, method, pool, assign, buy, bgMode, bgSkills, classSkills, name, spellSel])

  useEffect(() => { loadSrdMany('core', 'classes', 'races', 'backgrounds', 'spells', 'equipment').then(setData) }, [])

  const race = data?.races.find(r => r.id === raceId)
  const subrace = race?.subraces?.find(s => s.id === subraceId)
  const cls = data?.classes.find(c => c.id === classId)
  const acolyte = data?.backgrounds.find(b => b.id === 'acolyte')

  const base = useMemo(() => {
    if (method === 'pointbuy') return buy
    return Object.fromEntries(ABILITIES.map(a => [a, assign[a] ?? null]))
  }, [method, buy, assign])

  const racial = useMemo(() => {
    const out = {}
    const add = (b) => { out[b.ability] = (out[b.ability] || 0) + b.bonus }
    race?.abilityBonuses?.forEach(add)
    subrace?.abilityBonuses?.forEach(add)
    flexBonus.forEach(a => add({ ability: a, bonus: 1 }))
    return out
  }, [race, subrace, flexBonus])

  const stats = useMemo(() => Object.fromEntries(ABILITIES.map(a => [a, (base[a] ?? 10) + (racial[a] || 0)])), [base, racial])

  const skillChoice = cls?.proficiencyChoices?.find(p => p.from?.[0]?.startsWith('skill-'))
  const bgFixed = bgMode === 'acolyte' ? acolyte?.proficiencies || [] : []
  const bgPick = bgMode === 'custom' ? 2 : 0
  const casting = isCaster(cls) && cls.spellcasting.level <= 1
  const flexNeeded = race?.abilityBonusOptions?.choose || 0

  const stepValid = () => {
    switch (STEPS[step]) {
      case 'Campaign': return !!campaignId && campaigns.some(c => c._id === campaignId)
      case 'Race': return !!race && flexBonus.length === flexNeeded
      case 'Class': return !!cls
      case 'Abilities': return method === 'pointbuy' ? pointBuyCost(buy) <= POINT_BUY_BUDGET : ABILITIES.every(a => assign[a] != null)
      case 'Skills': return classSkills.length === (skillChoice?.choose || 0) && bgSkills.length === bgPick
      case 'Spells': return true
      default: return !!name.trim()
    }
  }
  const steps = STEPS.filter(s => s !== 'Spells' || casting)

  const next = () => setStep(s => { let n = s + 1; if (STEPS[n] === 'Spells' && !casting) n++; return n })
  const back = () => setStep(s => { let n = s - 1; if (STEPS[n] === 'Spells' && !casting) n--; return Math.max(0, n) })

  const finish = () => {
    const prof = proficiencyBonus(1)
    const conMod = abilityMod(stats.con)
    const hp = hpAtFirstLevel(cls.hitDie, conMod)
    const skills = [...new Set([...classSkills, ...bgFixed.filter(p => p.startsWith('skill-')), ...bgSkills])]
    const equipment = (cls.startingEquipment || []).map(e => ({ id: e.id, qty: e.qty }))
    const dexMod = abilityMod(stats.dex)
    const hasArmor = equipment.some(e => /armor|mail/.test(e.id))
    const ac = hasArmor && /leather/.test(equipment.map(e => e.id).join()) ? 11 + dexMod : 10 + dexMod
    localStorage.removeItem(draftKey)
    onComplete(campaignId, {
      name: name.trim(),
      race: subrace?.name || race.name,
      class: cls.name,
      level: 1,
      stats,
      hp: { current: hp, max: hp },
      ac,
      profBonus: prof,
      proficiencies: [...(cls.proficiencies || []), ...skills],
      background: bgMode === 'acolyte' ? 'Acolyte' : '',
      srd: {
        raceId, subraceId, classId, subclassId: subclassLevel(cls) === 1 ? cls.subclasses?.[0]?.id || '' : '',
        backgroundId: bgMode === 'acolyte' ? 'acolyte' : 'custom',
        abilityMethod: method, skills, expertise: [],
        languages: race.languages || [],
        features: featuresThrough(cls, subclassLevel(cls) === 1 ? cls.subclasses?.[0]?.id : null, 1),
        equipment, hpRolls: [], hitDiceUsed: 0, asiLog: [],
      },
      spells: casting
        ? { cantrips: spellSel.cantrips, known: spellSel.known, prepared: spellSel.prepared, slotsUsed: {} }
        : { cantrips: [], known: [], prepared: [], slotsUsed: {} },
    })
  }

  const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }
  const stepName = STEPS[step]

  return (
    <div style={overlay} onClick={onClose}>
      <div className="card" style={{ width: '100%', maxWidth: 680, maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: 0 }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 17 }}>Character Creator</h3>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
              Step {steps.indexOf(stepName) + 1} of {steps.length}: {stepName}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--text-2)' }}>✕</button>
        </div>

        <div style={{ padding: '4px 20px 16px', overflowY: 'auto', flex: 1 }}>
          {!data && <div style={{ padding: 20, color: 'var(--text-3)' }}>Loading rules…</div>}

          {stepName === 'Campaign' && (
            <>
              <span style={label}>Which campaign is this character for?</span>
              {campaigns.length === 0 && <div style={{ fontSize: 13, color: 'var(--text-2)' }}>You haven't joined a campaign yet. Create or join one first.</div>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {campaigns.map(c => <span key={c._id} style={chip(campaignId === c._id)} onClick={() => setCampaignId(c._id)}>{c.name}</span>)}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 10 }}>The character will be saved to this campaign and only appear there.</div>
            </>
          )}

          {data && stepName === 'Race' && (
            <>
              <span style={label}>Race</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {data.races.map(r => <span key={r.id} style={chip(raceId === r.id)} onClick={() => { setRaceId(r.id); setSubraceId(''); setFlexBonus([]) }}>{r.name}</span>)}
              </div>
              {race && (
                <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
                  <div><strong>Ability bonuses:</strong> {bonusText(race.abilityBonuses) || '—'}{flexNeeded ? ` + ${flexNeeded} others of your choice (+1 each)` : ''}</div>
                  <div><strong>Size / Speed:</strong> {race.size}, {race.speed} ft.</div>
                  <div><strong>Languages:</strong> {(race.languages || []).join(', ')}</div>
                </div>
              )}
              {race?.subraces?.length > 0 && (
                <>
                  <span style={label}>Subrace (optional)</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {race.subraces.map(s => <span key={s.id} style={chip(subraceId === s.id)} onClick={() => setSubraceId(subraceId === s.id ? '' : s.id)}>{s.name} ({bonusText(s.abilityBonuses)})</span>)}
                  </div>
                </>
              )}
              {flexNeeded > 0 && (
                <>
                  <span style={label}>Choose {flexNeeded} abilities for +1 ({flexBonus.length}/{flexNeeded})</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {race.abilityBonusOptions.from.filter(o => o.ability !== 'cha').map(o => (
                      <span key={o.ability} style={chip(flexBonus.includes(o.ability))}
                        onClick={() => setFlexBonus(f => f.includes(o.ability) ? f.filter(x => x !== o.ability) : f.length < flexNeeded ? [...f, o.ability] : f)}>
                        {ABILITY_NAMES[o.ability]}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {data && stepName === 'Class' && (
            <>
              <span style={label}>Class</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {data.classes.map(c => <span key={c.id} style={chip(classId === c.id)} onClick={() => { setClassId(c.id); setClassSkills([]); setSpellSel({ cantrips: [], known: [], prepared: [] }) }}>{c.name}</span>)}
              </div>
              {cls && (
                <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
                  <div><strong>Hit die:</strong> d{cls.hitDie}</div>
                  <div><strong>Saving throws:</strong> {(cls.saves || []).map(s => ABILITY_NAMES[s] || s).join(', ')}</div>
                  <div><strong>Proficiencies:</strong> {(cls.proficiencies || []).filter(p => !p.startsWith('saving-throw')).map(p => p.replace(/-/g, ' ')).join(', ')}</div>
                  <div><strong>Spellcasting:</strong> {cls.spellcasting ? `Yes (${ABILITY_NAMES[cls.spellcasting.ability]}), from level ${cls.spellcasting.level}` : 'No'}</div>
                </div>
              )}
            </>
          )}

          {data && stepName === 'Abilities' && (
            <>
              <span style={label}>Method</span>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[['standard', 'Standard array'], ['roll', 'Roll 4d6'], ['pointbuy', 'Point buy']].map(([m, t]) => (
                  <span key={m} style={chip(method === m)} onClick={() => {
                    setMethod(m); setAssign({})
                    if (m === 'standard') setPool(STANDARD_ARRAY)
                    if (m === 'roll') setPool(Array.from({ length: 6 }, roll4d6).sort((a, b) => b - a))
                  }}>{t}</span>
                ))}
                {method === 'roll' && <button className="btn btn-ghost btn-sm" onClick={() => { setPool(Array.from({ length: 6 }, roll4d6).sort((a, b) => b - a)); setAssign({}) }}>Re-roll</button>}
              </div>
              {method === 'pointbuy' && <div style={{ fontSize: 12, color: 'var(--text-2)', margin: '10px 0' }}>Points spent: {pointBuyCost(buy)} / {POINT_BUY_BUDGET}</div>}
              {method !== 'pointbuy' && <div style={{ fontSize: 12, color: 'var(--text-2)', margin: '10px 0' }}>Values: {pool.join(', ')}. Assign each to one ability.</div>}
              <div className="stat-grid-6" style={{ marginTop: 8 }}>
                {ABILITIES.map(a => {
                  const used = Object.entries(assign).filter(([k]) => k !== a).map(([, v]) => v)
                  const avail = pool.filter(v => { const free = pool.filter(x => x === v).length - used.filter(x => x === v).length; return free > 0 })
                  return (
                    <div key={a} className="card" style={{ padding: '10px 6px', textAlign: 'center' }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase' }}>{a}</div>
                      {method === 'pointbuy' ? (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, margin: '4px 0' }}>
                          <button className="btn btn-ghost btn-sm" disabled={!canLower(buy, a)} onClick={() => setBuy(b => ({ ...b, [a]: b[a] - 1 }))}>−</button>
                          <strong>{buy[a]}</strong>
                          <button className="btn btn-ghost btn-sm" disabled={!canRaise(buy, a)} onClick={() => setBuy(b => ({ ...b, [a]: b[a] + 1 }))}>+</button>
                        </div>
                      ) : (
                        <select className="input" style={{ padding: 4, fontSize: 13, margin: '4px 0' }} value={assign[a] ?? ''} onChange={e => setAssign(s => { const n = { ...s }; if (e.target.value === '') delete n[a]; else n[a] = +e.target.value; return n })}>
                          <option value="">—</option>
                          {[...new Set(avail.concat(assign[a] != null ? [assign[a]] : []))].sort((x, y) => y - x).map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      )}
                      <div style={{ fontSize: 11, color: 'var(--text-2)' }}>
                        {racial[a] ? `+${racial[a]} race → ` : ''}<strong style={{ color: 'var(--gold)' }}>{base[a] != null ? `${stats[a]} (${fmtMod(abilityMod(stats[a]))})` : '—'}</strong>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {data && stepName === 'Skills' && cls && (
            <>
              {skillChoice && (
                <>
                  <span style={label}>{cls.name} skills: {skillChoice.desc} ({classSkills.length}/{skillChoice.choose})</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {skillChoice.from.map(s => (
                      <span key={s} style={{ ...chip(classSkills.includes(s)), opacity: bgFixed.includes(s) || bgSkills.includes(s) ? 0.4 : 1 }}
                        onClick={() => !bgFixed.includes(s) && !bgSkills.includes(s) && setClassSkills(c => c.includes(s) ? c.filter(x => x !== s) : c.length < skillChoice.choose ? [...c, s] : c)}>{skillName(s)}</span>
                    ))}
                  </div>
                </>
              )}
              <span style={label}>Background</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={chip(bgMode === 'acolyte')} onClick={() => { setBgMode('acolyte'); setBgSkills([]) }}>Acolyte (SRD)</span>
                <span style={chip(bgMode === 'custom')} onClick={() => { setBgMode('custom'); }}>Custom</span>
              </div>
              {bgMode === 'acolyte' && <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 8 }}>Grants {bgFixed.map(skillName).join(' and ')}. If you already have those from your class, pick different class skills.</div>}
              {bgMode === 'custom' && (
                <>
                  <span style={label}>Pick 2 background skills ({bgSkills.length}/2)</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {data.core.skills.map(s => `skill-${s.id}`).map(s => (
                      <span key={s} style={{ ...chip(bgSkills.includes(s)), opacity: classSkills.includes(s) ? 0.4 : 1 }}
                        onClick={() => !classSkills.includes(s) && setBgSkills(c => c.includes(s) ? c.filter(x => x !== s) : c.length < 2 ? [...c, s] : c)}>{skillName(s)}</span>
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {data && stepName === 'Spells' && cls && (
            <SpellsStep cls={cls} level={1} stats={stats} spells={data.spells} value={spellSel} onChange={setSpellSel} />
          )}

          {data && stepName === 'Review' && cls && race && (
            <>
              <span style={label}>Character name</span>
              <input className="input" autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Name your hero" />
              <div style={{ marginTop: 14, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7 }}>
                <div><strong>{subrace?.name || race.name} {cls.name}</strong>, level 1</div>
                <div>HP {hpAtFirstLevel(cls.hitDie, abilityMod(stats.con))} · Prof +2 · Speed {race.speed} ft.</div>
                <div>{ABILITIES.map(a => `${a.toUpperCase()} ${stats[a]}`).join(' · ')}</div>
                <div>Skills: {[...new Set([...classSkills, ...bgFixed.filter(p => p.startsWith('skill-')), ...bgSkills])].map(skillName).join(', ')}</div>
                <div>Equipment: {(cls.startingEquipment || []).map(e => `${e.qty > 1 ? e.qty + '× ' : ''}${e.id.replace(/-/g, ' ')}`).join(', ') || '—'}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>Equipment choices and extra proficiencies can be added to your sheet and inventory afterwards.</div>
              </div>
            </>
          )}
          <SrdAttribution />
        </div>

        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
          <button className="btn btn-ghost btn-sm" onClick={step === 0 ? onClose : back}>{step === 0 ? 'Cancel' : 'Back'}</button>
          {stepName === 'Review'
            ? <button className="btn btn-primary btn-sm" disabled={!stepValid()} onClick={finish}>Create character</button>
            : <button className="btn btn-primary btn-sm" disabled={!data || !stepValid()} onClick={next}>Next</button>}
        </div>
      </div>
    </div>
  )
}
