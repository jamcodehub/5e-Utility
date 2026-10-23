import { useEffect, useRef, useState } from 'react'
import { loadSrdMany } from '../utils/srd'
import { ABILITIES, ABILITY_NAMES, abilityMod, fmtMod, proficiencyBonus, hpAtFirstLevel, averageHpGain } from '../utils/rules5e'
import { useCampaign } from '../context/CampaignContext'
import SrdAttribution from './SrdAttribution'

const STEPS = ['Campaign', 'Race', 'Class', 'Abilities', 'Background', 'Review']
const chip = (on) => ({
  padding: '5px 11px', borderRadius: 999, fontSize: 12, cursor: 'pointer', userSelect: 'none',
  background: on ? 'var(--gold-bg)' : 'var(--surface2)', color: on ? 'var(--gold)' : 'var(--text-2)',
  border: `1px solid ${on ? 'var(--gold-border)' : 'var(--border)'}`,
})
const label = { fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '14px 0 6px', display: 'block' }
const skillName = (id) => id.replace('skill-', '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

// Free-form character builder — the only way to create a character. Races and
// classes offer SRD suggestions as clickable chips, but a homebrew name can
// always be typed in instead; nothing is restricted to the SRD list.
export default function CustomCharacterBuilder({ onClose, onComplete, draftKey = 'custom_draft' }) {
  const { campaigns, activeCampaign } = useCampaign()
  const draft = useRef(null)
  if (draft.current === null) {
    try { draft.current = JSON.parse(localStorage.getItem(draftKey)) || {} } catch { draft.current = {} }
  }
  const d = draft.current
  const [data, setData] = useState(null)
  const [step, setStep] = useState(d.step ?? 0)
  const [campaignId, setCampaignId] = useState(d.campaignId ?? activeCampaign?._id ?? '')
  const [race, setRace] = useState(d.race ?? '')
  const [speed, setSpeed] = useState(d.speed ?? 30)
  const [languages, setLanguages] = useState(d.languages ?? '')
  const [className, setClassName] = useState(d.className ?? '')
  const [level, setLevel] = useState(d.level ?? 1)
  const [hpMax, setHpMax] = useState(d.hpMax ?? '')
  const [ac, setAc] = useState(d.ac ?? 10)
  const [stats, setStats] = useState(d.stats ?? Object.fromEntries(ABILITIES.map(a => [a, 10])))
  const [background, setBackground] = useState(d.background ?? '')
  const [skills, setSkills] = useState(d.skills ?? [])
  const [extraProf, setExtraProf] = useState(d.extraProf ?? '')
  const [name, setName] = useState(d.name ?? '')

  useEffect(() => {
    localStorage.setItem(draftKey, JSON.stringify({ step, campaignId, race, speed, languages, className, level, hpMax, ac, stats, background, skills, extraProf, name }))
  }, [draftKey, step, campaignId, race, speed, languages, className, level, hpMax, ac, stats, background, skills, extraProf, name])

  useEffect(() => { loadSrdMany('core', 'classes', 'races', 'backgrounds').then(setData) }, [])

  const srdClass = data?.classes.find(c => c.name.toLowerCase() === className.trim().toLowerCase())
  const lvl = Math.max(1, Math.min(20, Number(level) || 1))
  const conMod = abilityMod(stats.con)
  const suggestedHp = srdClass ? hpAtFirstLevel(srdClass.hitDie, conMod) + (lvl - 1) * Math.max(1, averageHpGain(srdClass.hitDie) + conMod) : 10
  const hp = hpMax === '' ? suggestedHp : Math.max(1, Number(hpMax) || 1)

  const stepName = STEPS[step]
  const valid = () => {
    if (stepName === 'Campaign') return !!campaignId && campaigns.some(c => c._id === campaignId)
    if (stepName === 'Race') return !!race.trim()
    if (stepName === 'Class') return !!className.trim()
    if (stepName === 'Review') return !!name.trim()
    return true
  }

  const finish = () => {
    localStorage.removeItem(draftKey)
    onComplete(campaignId, {
      name: name.trim(),
      race: race.trim(),
      class: className.trim(),
      level: lvl,
      stats,
      hp: { current: hp, max: hp },
      ac: Number(ac) || 10,
      profBonus: proficiencyBonus(lvl),
      proficiencies: [...skills.map(skillName), ...extraProf.split(',').map(s => s.trim()).filter(Boolean)],
      background: background.trim(),
      // `custom` keeps guided level-up off, since SRD progression wouldn't match a free-form build
      srd: {
        classId: srdClass?.id || '', raceId: '', backgroundId: 'custom', abilityMethod: 'manual', custom: true,
        skills, languages: languages.split(',').map(s => s.trim()).filter(Boolean), equipment: [], features: [], hpRolls: [], asiLog: [],
      },
    })
  }

  const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }
  return (
    <div style={overlay} onClick={onClose}>
      <div className="card" style={{ width: '100%', maxWidth: 680, maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: 0 }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 17 }}>Custom Character</h3>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>Step {step + 1} of {STEPS.length}: {stepName}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--text-2)' }}>✕</button>
        </div>

        <div style={{ padding: '4px 20px 16px', overflowY: 'auto', flex: 1 }}>
          {stepName === 'Campaign' && (
            <>
              <span style={label}>Which campaign is this character for?</span>
              {campaigns.length === 0 && <div style={{ fontSize: 13, color: 'var(--text-2)' }}>You haven't joined a campaign yet.</div>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {campaigns.map(c => <span key={c._id} style={{ ...chip(campaignId === c._id), borderRadius: 8, fontSize: 13 }} onClick={() => setCampaignId(c._id)}>{c.name}</span>)}
              </div>
            </>
          )}

          {stepName === 'Race' && (
            <>
              <span style={label}>Race / Species</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {data?.races.map(r => (
                  <span key={r.id} style={chip(race.trim().toLowerCase() === r.name.toLowerCase())} onClick={() => setRace(r.name)}>{r.name}</span>
                ))}
              </div>
              <span style={label}>Or your own (homebrew)</span>
              <input className="input" value={race} onChange={e => setRace(e.target.value)} placeholder="Name your race / species" />
              <span style={label}>Speed (ft.)</span>
              <input className="input" type="number" value={speed} onChange={e => setSpeed(e.target.value)} style={{ maxWidth: 120 }} />
              <span style={label}>Languages (comma separated)</span>
              <input className="input" value={languages} onChange={e => setLanguages(e.target.value)} placeholder="Common, Elvish" />
            </>
          )}

          {stepName === 'Class' && (
            <>
              <span style={label}>Class</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {data?.classes.map(c => (
                  <span key={c.id} style={chip(className.trim().toLowerCase() === c.name.toLowerCase())} onClick={() => setClassName(c.name)}>{c.name}</span>
                ))}
              </div>
              <span style={label}>Or your own (homebrew)</span>
              <input className="input" value={className} onChange={e => setClassName(e.target.value)} placeholder="Name your class" />
              <span style={label}>Level</span>
              <input className="input" type="number" min={1} max={20} value={level} onChange={e => setLevel(e.target.value)} style={{ maxWidth: 120 }} />
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 8 }}>
                {srdClass ? `Recognised SRD class: d${srdClass.hitDie} hit die${srdClass.spellcasting ? ', spellcaster' : ''}. Proficiency bonus +${proficiencyBonus(lvl)}.` : `Proficiency bonus +${proficiencyBonus(lvl)}.`}
              </div>
            </>
          )}

          {stepName === 'Abilities' && (
            <>
              <span style={label}>Ability scores (enter your final scores)</span>
              <div className="stat-grid-6">
                {ABILITIES.map(a => (
                  <div key={a} className="card" style={{ padding: '10px 6px', textAlign: 'center' }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase' }} title={ABILITY_NAMES[a]}>{a}</div>
                    <input className="input" type="number" min={1} max={30} style={{ textAlign: 'center', padding: 4, margin: '4px 0' }}
                      value={stats[a]} onChange={e => setStats(s => ({ ...s, [a]: Math.max(1, Math.min(30, +e.target.value || 1)) }))} />
                    <div style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 600 }}>{fmtMod(abilityMod(stats[a]))}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {stepName === 'Background' && (
            <>
              <span style={label}>Background</span>
              <input className="input" list="cb-bgs" value={background} onChange={e => setBackground(e.target.value)} placeholder="e.g. Acolyte, Sailor, or your own" />
              <datalist id="cb-bgs">{data?.backgrounds.map(b => <option key={b.id} value={b.name} />)}</datalist>
              <span style={label}>Skill proficiencies ({skills.length})</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {data?.core.skills.map(s => { const id = `skill-${s.id}`; return <span key={id} style={chip(skills.includes(id))} onClick={() => setSkills(c => c.includes(id) ? c.filter(x => x !== id) : [...c, id])}>{s.name}</span> })}
              </div>
              <span style={label}>Other proficiencies (comma separated)</span>
              <input className="input" value={extraProf} onChange={e => setExtraProf(e.target.value)} placeholder="Thieves' tools, Light armor" />
            </>
          )}

          {stepName === 'Review' && (
            <>
              <span style={label}>Character name</span>
              <input className="input" autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Name your hero" />
              <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                <div><span style={label}>Max HP</span><input className="input" type="number" style={{ width: 100 }} value={hpMax} placeholder={String(suggestedHp)} onChange={e => setHpMax(e.target.value)} /></div>
                <div><span style={label}>Armor Class</span><input className="input" type="number" style={{ width: 100 }} value={ac} onChange={e => setAc(e.target.value)} /></div>
              </div>
              <div style={{ marginTop: 14, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7 }}>
                <div><strong>{race} {className}</strong>, level {lvl}{background ? ` · ${background}` : ''}</div>
                <div>HP {hp} · AC {Number(ac) || 10} · Prof +{proficiencyBonus(lvl)} · Speed {speed} ft.</div>
                <div>{ABILITIES.map(a => `${a.toUpperCase()} ${stats[a]}`).join(' · ')}</div>
              </div>
            </>
          )}
          {(stepName === 'Race' || stepName === 'Class' || stepName === 'Background') && <SrdAttribution />}
        </div>

        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
          <button className="btn btn-ghost btn-sm" onClick={step === 0 ? onClose : () => setStep(s => s - 1)}>{step === 0 ? 'Cancel' : 'Back'}</button>
          {stepName === 'Review'
            ? <button className="btn btn-primary btn-sm" disabled={!valid()} onClick={finish}>Create character</button>
            : <button className="btn btn-primary btn-sm" disabled={!valid()} onClick={() => setStep(s => s + 1)}>Next</button>}
        </div>
      </div>
    </div>
  )
}
