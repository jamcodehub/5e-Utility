import { useMemo, useState } from 'react'
import { ABILITIES, ABILITY_NAMES, abilityMod, fmtMod, featuresThrough, proficiencyBonus } from '../utils/rules5e'
import { findAllDice, parseDice, signed } from '../utils/dice'
import { FEATS } from '../utils/sheet'
import { collapseFamilies, featureMechanics, featureUses } from '../utils/featureRolls'
import MiniMarkdown from './MiniMarkdown'

const label = { fontSize: 10, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }
const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 6 }
const DICE = [4, 6, 8, 10, 12, 20, 100]

// Short paraphrases of the standard combat actions
const STANDARD_ACTIONS = [
  ['Attack', 'Make a melee or ranged attack. Some features let you attack more than once with this action.'],
  ['Cast a Spell', 'Cast a spell that has a casting time of 1 action.'],
  ['Dash', 'Gain extra movement equal to your speed for the turn.'],
  ['Disengage', 'Your movement does not provoke opportunity attacks for the rest of the turn.'],
  ['Dodge', 'Until your next turn, attacks against you have disadvantage if you can see the attacker, and you have advantage on Dexterity saves.'],
  ['Help', 'Give an ally advantage on their next ability check, or on their next attack against a creature near you.'],
  ['Hide', 'Make a Dexterity (Stealth) check to become hidden.', 'stealth'],
  ['Ready', 'Choose a trigger and an action; you take that action as a reaction when the trigger happens.'],
  ['Search', 'Make a Wisdom (Perception) or Intelligence (Investigation) check to find something.', 'perception'],
  ['Use an Object', 'Interact with a second object, or use an object that needs your action.'],
]

function Panel({ title, children, right }) {
  return (
    <div className="card" style={{ padding: '14px 18px', marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8 }}>
        <div style={{ ...label, marginBottom: 0 }}>{title}</div>
        {right}
      </div>
      {children}
    </div>
  )
}

function RollButton({ children, onClick, prof, title }) {
  return (
    <button onClick={onClick} title={title}
      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, padding: '6px 10px', fontSize: 12, cursor: 'pointer', borderRadius: 8, textAlign: 'left',
        background: 'var(--surface2)', border: `1px solid ${prof ? 'var(--gold-border)' : 'var(--border)'}`, color: 'var(--text)' }}>
      {children}
    </button>
  )
}

function TextRow({ name, badge, desc, roller, auto, uses, used = 0, onUse }) {
  const [open, setOpen] = useState(false)
  const text = Array.isArray(desc) ? desc.join(' ') : String(desc || '')
  const dice = useMemo(() => (auto?.rolls?.length ? [] : findAllDice(text).filter(d => parseDice(d))), [text, auto])
  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', cursor: 'pointer', gap: 8 }}>
        <span style={{ fontSize: 13 }}>{name}{badge ? <span style={{ fontSize: 10, color: 'var(--text-3)', marginLeft: 8 }}>{badge}</span> : null}</span>
        <span style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
          {auto?.rolls?.map(r => <button key={r.label} className="btn btn-ghost btn-sm" style={{ fontSize: 11, padding: '2px 8px' }} onClick={() => roller.rollExpr(`${name}: ${r.label}`, r.expr)}>🎲 {auto.rolls.length > 1 ? `${r.label} ` : ''}{r.expr}</button>)}
          {dice.map(d => <button key={d} className="btn btn-ghost btn-sm" style={{ fontSize: 11, padding: '2px 8px' }} onClick={() => roller.rollExpr(name, d)}>🎲 {d}</button>)}
        </span>
      </div>
      {uses && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, paddingBottom: 6 }}>
          {Array.from({ length: Math.min(uses.max, 12) }, (_, i) => (
            <span key={i} onClick={() => onUse(i < used ? i : i + 1)} title="Click to spend / restore a use"
              style={{ width: 14, height: 14, borderRadius: '50%', cursor: 'pointer', border: '1.5px solid var(--gold)', background: i < used ? 'transparent' : 'var(--gold)' }} />
          ))}
          <span style={{ fontSize: 10, color: 'var(--text-3)', marginLeft: 6 }}>{Math.max(0, uses.max - used)}/{uses.max} · {uses.recharge === 'short' ? 'short or long rest' : 'long rest'}</span>
        </div>
      )}
      {auto?.info?.length > 0 && <div style={{ fontSize: 11, color: 'var(--gold)', paddingBottom: 6 }}>{auto.info.join(' · ')}</div>}
      {open && <div style={{ padding: '0 0 10px' }}><MiniMarkdown text={desc} /></div>}
    </div>
  )
}

// Everything you can *do*: checks, saves, attacks, features, traits — each one rollable.
export default function CharacterActions({ char, srd, roller, onPatch }) {
  const [expr, setExpr] = useState('')
  const [adding, setAdding] = useState('')

  const level = char.level || 1
  const prof = char.profBonus || proficiencyBonus(level)
  const stats = char.stats || {}
  const mod = (a) => abilityMod(stats[a])
  const cls = srd.classes.find(c => c.id === char.srd?.classId)
    || srd.classes.find(c => c.name.toLowerCase() === (char.class || '').trim().toLowerCase())

  const profText = useMemo(() => new Set([...(char.proficiencies || []), ...(char.srd?.skills || [])].map(p => String(p).toLowerCase())), [char.proficiencies, char.srd?.skills])
  const classProfs = useMemo(() => new Set([...(cls?.proficiencies || []), ...(char.proficiencies || [])].map(p => String(p).toLowerCase())), [cls, char.proficiencies])

  const skillProf = (s) => profText.has(`skill-${s.id}`) || profText.has(s.name.toLowerCase())
  const expertise = (s) => (char.srd?.expertise || []).includes(`skill-${s.id}`)
  const skillMod = (s) => mod(s.ability) + (skillProf(s) ? prof : 0) + (expertise(s) ? prof : 0)
  const saveProf = (a) => !!cls?.saves?.includes(a) || classProfs.has(`saving-throw-${a}`)
  const saveMod = (a) => mod(a) + (saveProf(a) ? prof : 0)

  // Weapons the character carries
  const equipment = char.srd?.equipment || []
  const equipById = useMemo(() => Object.fromEntries(srd.equipment.map(e => [e.id, e])), [srd.equipment])
  const weapons = equipment.map(e => equipById[e.id]).filter(e => e?.category === 'weapon')
  const allWeapons = useMemo(() => srd.equipment.filter(e => e.category === 'weapon').sort((a, b) => a.name.localeCompare(b.name)), [srd.equipment])

  const weaponProficient = (w) => {
    if (!cls) return true // unknown/homebrew class: assume trained
    const cat = String(w.weaponCategory || '').toLowerCase()
    return classProfs.has(`${cat}-weapons`) || classProfs.has(`${w.id}s`) || classProfs.has(w.id)
  }
  const attackAbility = (w) => {
    const finesse = w.properties?.includes('finesse')
    const ranged = w.weaponRange === 'Ranged'
    if (finesse) return mod('dex') >= mod('str') ? 'dex' : 'str'
    return ranged ? 'dex' : 'str'
  }
  const damageExpr = (dice, m) => `${dice}${m ? signed(m) : ''}`

  const patchEquipment = (next) => onPatch({ srd: { ...(char.srd || {}), equipment: next } })
  const addWeapon = () => {
    if (!adding || equipment.some(e => e.id === adding)) return setAdding('')
    patchEquipment([...equipment, { id: adding, qty: 1 }])
    setAdding('')
  }

  // Features and traits
  const featureIds = useMemo(
    () => [...new Set([...(char.srd?.features || []), ...(cls ? featuresThrough(cls, char.srd?.subclassId, level) : [])])],
    [char.srd?.features, char.srd?.subclassId, cls, level])
  const features = collapseFamilies(featureIds.map(id => ({ id, ...srd.features[id] })).filter(f => f.name && f.desc)
    .filter(f => f.name !== 'Ability Score Improvement').sort((a, b) => (a.level || 0) - (b.level || 0)))

  const raceName = (char.race || '').trim().toLowerCase()
  const race = srd.races.find(r => r.id === char.srd?.raceId) || srd.races.find(r => r.name.toLowerCase() === raceName)
    || srd.races.find(r => r.subraces?.some(s => s.name.toLowerCase() === raceName))
  const subrace = race?.subraces?.find(s => s.id === char.srd?.subraceId || s.name.toLowerCase() === raceName)
  const traits = [...(race?.traits || []), ...(subrace?.traits || [])].map(id => ({ id, ...srd.traits[id] })).filter(t => t.name && t.desc)

  const skillRoll = (id) => { const s = srd.core.skills.find(x => x.id === id); if (s) roller.rollCheck(`${s.name} check`, skillMod(s)) }
  const runExpr = () => {
    if (!parseDice(expr)) { roller.push({ title: 'Roll', lines: [{ label: 'Not a dice expression', total: null, detail: 'Try 2d6+3 or d20' }] }); return }
    roller.rollExpr(expr.trim(), expr)
  }

  return (
    <>
      <Panel title="Quick roll">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {DICE.map(n => (
            <button key={n} className="btn btn-ghost btn-sm" onClick={() => (n === 20 ? roller.rollCheck('d20', 0) : roller.rollExpr(`d${n}`, `d${n}`))}>d{n}</button>
          ))}
          <button className="btn btn-primary btn-sm" onClick={() => roller.rollCheck(`Initiative`, mod('dex'))}>Initiative {fmtMod(mod('dex'))}</button>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <input className="input" placeholder="Custom: 2d6+3, 4d8, d20-1…" value={expr} onChange={e => setExpr(e.target.value)} onKeyDown={e => e.key === 'Enter' && runExpr()} style={{ fontSize: 13 }} />
          <button className="btn btn-primary btn-sm" onClick={runExpr}>Roll</button>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>d20 rolls follow the Normal / Adv / Dis switch in the roll panel.</div>
      </Panel>

      <Panel title="Attacks" right={
        <div style={{ display: 'flex', gap: 6 }}>
          <select className="input" style={{ fontSize: 12, padding: '3px 6px', width: 150 }} value={adding} onChange={e => setAdding(e.target.value)}>
            <option value="">Add weapon…</option>
            {allWeapons.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
          <button className="btn btn-ghost btn-sm" disabled={!adding} onClick={addWeapon}>Add</button>
        </div>
      }>
        {[...weapons.map(w => {
          const a = attackAbility(w)
          const bonus = mod(a) + (weaponProficient(w) ? prof : 0)
          return { key: w.id, name: w.name, w, a, bonus, dice: w.damage?.dice, type: w.damage?.type }
        })].map(({ key, name, w, a, bonus, dice, type }) => (
          <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid var(--border)', gap: 8, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 13 }}>{name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                {fmtMod(bonus)} to hit · {dice ? damageExpr(dice, mod(a)) : '—'} {type}
                {w.range?.normal ? ` · ${w.weaponRange === 'Ranged' || w.range.long ? `range ${w.range.normal}${w.range.long ? `/${w.range.long}` : ''}` : `reach ${w.range.normal}`}` : ''}
                {w.properties?.length ? ` · ${w.properties.join(', ')}` : ''}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button className="btn btn-primary btn-sm" onClick={() => roller.rollAttack(name, bonus, dice ? { expr: damageExpr(dice, mod(a)), type } : null)}>🎲 Attack</button>
              {w.twoHandedDamage?.dice && (
                <button className="btn btn-ghost btn-sm" title="Versatile, held in two hands"
                  onClick={() => roller.rollAttack(`${name} (two-handed)`, bonus, { expr: damageExpr(w.twoHandedDamage.dice, mod(a)), type: w.twoHandedDamage.type })}>2H</button>
              )}
              <button onClick={() => patchEquipment(equipment.filter(e => e.id !== key))} title="Remove" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 12 }}>✕</button>
            </div>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', gap: 8 }}>
          <div>
            <div style={{ fontSize: 13 }}>Unarmed Strike</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{fmtMod(mod('str') + prof)} to hit · {Math.max(0, 1 + mod('str'))} bludgeoning</div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => roller.rollAttack('Unarmed Strike', mod('str') + prof, { expr: String(Math.max(0, 1 + mod('str'))), type: 'bludgeoning' })}>🎲 Attack</button>
        </div>
        {!weapons.length && <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Add the weapons you carry to roll attacks and damage with them.</div>}
      </Panel>

      <Panel title="Ability checks & saving throws">
        <div style={{ ...grid, marginBottom: 12 }}>
          {ABILITIES.map(a => (
            <RollButton key={a} onClick={() => roller.rollCheck(`${ABILITY_NAMES[a]} check`, mod(a))}>
              <span>{ABILITY_NAMES[a]}</span><strong style={{ color: 'var(--gold)' }}>{fmtMod(mod(a))}</strong>
            </RollButton>
          ))}
        </div>
        <div style={label}>Saving throws</div>
        <div style={grid}>
          {ABILITIES.map(a => (
            <RollButton key={a} prof={saveProf(a)} title={saveProf(a) ? 'Proficient' : ''} onClick={() => roller.rollCheck(`${ABILITY_NAMES[a]} save`, saveMod(a))}>
              <span>{saveProf(a) ? '● ' : ''}{a.toUpperCase()} save</span><strong style={{ color: 'var(--gold)' }}>{fmtMod(saveMod(a))}</strong>
            </RollButton>
          ))}
        </div>
      </Panel>

      <Panel title="Skills">
        <div style={grid}>
          {[...srd.core.skills].sort((a, b) => a.name.localeCompare(b.name)).map(s => (
            <RollButton key={s.id} prof={skillProf(s)} title={`${ABILITY_NAMES[s.ability]}${expertise(s) ? ' · expertise' : skillProf(s) ? ' · proficient' : ''}`} onClick={() => roller.rollCheck(`${s.name} check`, skillMod(s))}>
              <span>{expertise(s) ? '◆ ' : skillProf(s) ? '● ' : ''}{s.name} <span style={{ color: 'var(--text-3)', fontSize: 10 }}>{s.ability.toUpperCase()}</span></span>
              <strong style={{ color: 'var(--gold)' }}>{fmtMod(skillMod(s))}</strong>
            </RollButton>
          ))}
        </div>
      </Panel>

      <Panel title={cls ? `${cls.name} features` : 'Class features'}>
        {features.length ? features.map(f => <TextRow key={f.id} name={f.name} badge={f.level ? `Lv ${f.level}` : ''} desc={f.desc} roller={roller} auto={featureMechanics(f.id, { level, stats, prof, classId: cls?.id })}
          uses={featureUses(f.id, { level, stats, classId: cls?.id })} used={(char.srd?.featureUsed || {})[f.id] || 0}
          onUse={(n) => onPatch({ srd: { ...(char.srd || {}), featureUsed: { ...(char.srd?.featureUsed || {}), [f.id]: n } } })} />)
          : <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{cls ? 'No features yet.' : 'Set your class (e.g. Fighter) on the sheet to list its features here.'}</div>}
      </Panel>

      {(char.srd?.feats || []).length > 0 && (
        <Panel title="Feats">
          {char.srd.feats.map(id => FEATS[id] && <TextRow key={id} name={FEATS[id].name} badge={FEATS[id].prereq} desc={FEATS[id].desc} roller={roller} />)}
        </Panel>
      )}

      {traits.length > 0 && (
        <Panel title={`${subrace?.name || race?.name} traits`}>
          {traits.map(t => <TextRow key={t.id} name={t.name} desc={t.desc} roller={roller} />)}
        </Panel>
      )}

      <Panel title="Actions in combat">
        {STANDARD_ACTIONS.map(([name, text, skill]) => (
          <div key={name} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
            <div><div style={{ fontSize: 13 }}>{name}</div><div style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.5 }}>{text}</div></div>
            {skill && <button className="btn btn-ghost btn-sm" onClick={() => skillRoll(skill)}>🎲 {skill === 'stealth' ? 'Stealth' : 'Perception'}</button>}
          </div>
        ))}
      </Panel>
    </>
  )
}
