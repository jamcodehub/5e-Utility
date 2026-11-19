import { useState } from 'react'
import { fmtMod } from '../utils/rules5e'

const label = { fontSize: 10, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }
const chip = (on, danger) => ({
  padding: '4px 10px', borderRadius: 3, fontSize: 12, cursor: 'pointer', userSelect: 'none',
  background: on ? (danger ? 'rgba(220,70,70,0.15)' : 'var(--gold-bg)') : 'var(--surface2)',
  color: on ? (danger ? 'var(--red)' : 'var(--gold)') : 'var(--text-2)',
  border: `1px solid ${on ? (danger ? 'var(--red)' : 'var(--gold-border)') : 'var(--border)'}`,
})
const EXHAUSTION = ['', 'Disadvantage on ability checks', 'Speed halved', 'Disadvantage on attack rolls and saving throws', 'Hit point maximum halved', 'Speed reduced to 0', 'Death']

function Panel({ title, right, children }) {
  return (
    <div className="card" style={{ padding: '14px 18px', marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8 }}>
        <div style={{ ...label, marginBottom: 0 }}>{title}</div>{right}
      </div>
      {children}
    </div>
  )
}

function Stat({ name, value, onClick, sub }) {
  return (
    <div onClick={onClick} style={{ textAlign: 'center', padding: '8px 4px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 3, cursor: onClick ? 'pointer' : 'default' }}>
      <div style={{ fontSize: 9, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{name}</div>
      <div style={{ fontSize: 20, fontFamily: 'var(--font-title)', color: 'var(--gold)' }}>{value}</div>
      {sub && <div style={{ fontSize: 9, color: 'var(--text-3)' }}>{sub}</div>}
    </div>
  )
}

function Pips({ n, max = 3, color, onSet }) {
  return (
    <span style={{ display: 'inline-flex', gap: 5 }}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} onClick={() => onSet(i < n ? i : i + 1)} style={{ width: 16, height: 16, borderRadius: '50%', cursor: 'pointer', border: `1.5px solid ${color}`, background: i < n ? color : 'transparent' }} />
      ))}
    </span>
  )
}

// Table-play state: HP with temp HP, death saves, concentration, conditions, exhaustion, companions.
export default function CombatPanel({ char, srd, d, roller, onPatch }) {
  const [amount, setAmount] = useState('')
  const [openCond, setOpenCond] = useState(null)
  const [newPet, setNewPet] = useState('')
  const combat = { tempHp: 0, conditions: [], exhaustion: 0, inspiration: false, concentrating: '', deathSaves: { successes: 0, failures: 0 }, ...(char.combat || {}) }
  const hp = { current: 10, max: 10, ...(char.hp || {}) }
  const ds = combat.deathSaves
  const conditions = srd.core.conditions.filter(c => c.id !== 'exhaustion')
  const patchCombat = (p, extra = {}) => onPatch({ combat: { ...combat, ...p }, ...extra })
  const note = (title, text) => roller.push({ title, lines: [{ label: text, total: null, detail: '' }] })

  const damage = () => {
    const n = Math.max(0, parseInt(amount, 10) || 0)
    if (!n) return
    const fromTemp = Math.min(combat.tempHp, n)
    const rest = n - fromTemp
    const current = Math.max(0, hp.current - rest)
    const conds = current === 0 && !combat.conditions.includes('unconscious') ? [...combat.conditions, 'unconscious'] : combat.conditions
    patchCombat({ tempHp: combat.tempHp - fromTemp, conditions: conds }, { hp: { ...hp, current } })
    setAmount('')
    if (rest - hp.current >= hp.max) note('Massive damage', `${n} damage leaves ${rest - hp.current} past 0 — that equals your HP maximum, so you die instantly.`)
    else if (current === 0) note('Down!', 'You fall unconscious and must make death saving throws.')
    if (combat.concentrating && n > 0) {
      const dc = Math.max(10, Math.floor(n / 2))
      const r = roller.rollCheck(`Concentration on ${combat.concentrating} (DC ${dc})`, d.saveMod('con'), { mode: 'normal' })
      if (r && r.total < dc) patchCombat({ tempHp: combat.tempHp - fromTemp, concentrating: '', conditions: conds }, { hp: { ...hp, current } })
    }
  }
  const heal = () => {
    const n = Math.max(0, parseInt(amount, 10) || 0)
    if (!n) return
    const current = Math.min(hp.max, hp.current + n)
    const revived = hp.current === 0 && current > 0
    patchCombat(revived ? { deathSaves: { successes: 0, failures: 0 }, conditions: combat.conditions.filter(c => c !== 'unconscious') } : {}, { hp: { ...hp, current } })
    setAmount('')
  }
  // Temp HP never stacks: keep whichever is higher.
  const setTemp = () => {
    const n = Math.max(0, parseInt(amount, 10) || 0)
    if (n) { patchCombat({ tempHp: Math.max(combat.tempHp, n) }); setAmount('') }
  }
  const deathSave = () => {
    const r = roller.rollCheck('Death saving throw', 0, { mode: 'normal' })
    if (!r) return
    if (r.nat20) {
      patchCombat({ deathSaves: { successes: 0, failures: 0 }, conditions: combat.conditions.filter(c => c !== 'unconscious') }, { hp: { ...hp, current: 1 } })
      note('Natural 20', 'You regain 1 hit point and wake up.')
      return
    }
    let { successes, failures } = ds
    if (r.nat1) failures += 2
    else if (r.total >= 10) successes += 1
    else failures += 1
    successes = Math.min(3, successes); failures = Math.min(3, failures)
    patchCombat({ deathSaves: { successes, failures } })
    if (failures >= 3) note('Dead', 'Three failed death saves.')
    else if (successes >= 3) note('Stable', 'Three successes — you are stable at 0 HP and stop making death saves.')
  }
  const toggleCond = (id) => patchCombat({ conditions: combat.conditions.includes(id) ? combat.conditions.filter(c => c !== id) : [...combat.conditions, id] })

  const companions = char.companions || []
  const setCompanions = (next) => onPatch({ companions: next })
  const addPet = () => {
    if (!newPet.trim()) return
    setCompanions([...companions, { id: `c-${Date.now()}`, name: newPet.trim(), hp: { current: 10, max: 10 }, ac: 10, notes: '' }])
    setNewPet('')
  }
  const editPet = (id, p) => setCompanions(companions.map(c => (c.id === id ? { ...c, ...p } : c)))

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(84px, 1fr))', gap: 8, marginBottom: 16 }}>
        <Stat name="Armor class" value={char.ac ?? d.ac} />
        <Stat name="Initiative" value={fmtMod(d.initiative)} onClick={() => roller.rollCheck('Initiative', d.initiative)} sub="tap to roll" />
        <Stat name="Speed" value={`${d.speed} ft`} sub={d.speed !== d.baseSpeed ? `base ${d.baseSpeed}` : ''} />
        <Stat name="Passive Perc." value={d.passive} />
        <Stat name="Proficiency" value={fmtMod(d.prof)} />
        {d.spellDc != null && <Stat name="Spell save DC" value={d.spellDc} sub={`${d.castAbility?.toUpperCase()} · atk ${fmtMod(d.spellAtk)}`} />}
        <Stat name="Inspiration" value={combat.inspiration ? '★' : '☆'} onClick={() => patchCombat({ inspiration: !combat.inspiration })} sub={combat.inspiration ? 'spend it' : 'none'} />
      </div>

      <Panel title="Hit points" right={combat.concentrating && (
        <span style={chip(true)} onClick={() => patchCombat({ concentrating: '' })} title="Click to stop concentrating">🧠 Concentrating: {combat.concentrating} ✕</span>
      )}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap', marginBottom: 10 }}>
          <span style={{ fontSize: 28, fontFamily: 'var(--font-title)', color: hp.current === 0 ? 'var(--red)' : 'var(--text)' }}>{hp.current}<span style={{ fontSize: 16, color: 'var(--text-3)' }}> / {hp.max}</span></span>
          {combat.tempHp > 0 && <span style={{ fontSize: 14, color: 'var(--gold)' }}>+{combat.tempHp} temp</span>}
          {combat.exhaustion >= 4 && <span style={{ fontSize: 11, color: 'var(--red)' }}>HP maximum halved by exhaustion → {Math.floor(hp.max / 2)}</span>}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <input className="input" type="number" min="0" style={{ width: 90, fontSize: 13 }} placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} />
          <button className="btn btn-ghost btn-sm" onClick={damage}>Damage</button>
          <button className="btn btn-ghost btn-sm" onClick={heal}>Heal</button>
          <button className="btn btn-ghost btn-sm" onClick={setTemp} title="Temporary HP don't stack — you keep the higher number">Set temp HP</button>
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 6 }}>Damage uses temp HP first. If you're concentrating, a Constitution save (DC 10 or half the damage) rolls automatically.</div>

        {hp.current === 0 && (
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            <div style={label}>Death saving throws</div>
            <div style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: 'var(--text-2)' }}>Successes <Pips n={ds.successes} color="var(--green)" onSet={n => patchCombat({ deathSaves: { ...ds, successes: n } })} /></span>
              <span style={{ fontSize: 12, color: 'var(--text-2)' }}>Failures <Pips n={ds.failures} color="var(--red)" onSet={n => patchCombat({ deathSaves: { ...ds, failures: n } })} /></span>
              <button className="btn btn-primary btn-sm" onClick={deathSave}>🎲 Roll death save</button>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 6 }}>10+ is a success, below 10 a failure. A natural 1 counts as two failures, a natural 20 brings you back with 1 HP.</div>
          </div>
        )}
      </Panel>

      <Panel title="Conditions" right={combat.conditions.length ? <button className="btn btn-ghost btn-sm" onClick={() => patchCombat({ conditions: [] })}>Clear all</button> : null}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {conditions.map(c => (
            <span key={c.id} style={chip(combat.conditions.includes(c.id), true)} onClick={() => toggleCond(c.id)} onContextMenu={e => { e.preventDefault(); setOpenCond(o => (o === c.id ? null : c.id)) }}>{c.name}</span>
          ))}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-3)', margin: '6px 0' }}>Click to apply or remove. Right-click (or long-press) a condition to read its rules.</div>
        {combat.conditions.map(id => {
          const c = conditions.find(x => x.id === id)
          return c && (
            <div key={id} style={{ fontSize: 12, color: 'var(--text-2)', padding: '6px 0', borderTop: '1px solid var(--border)' }} onClick={() => setOpenCond(o => (o === id ? null : id))}>
              <strong style={{ color: 'var(--red)' }}>{c.name}</strong>
              {openCond === id ? <div style={{ marginTop: 4 }}>{c.desc.map((l, i) => <div key={i}>{l}</div>)}</div> : <span style={{ color: 'var(--text-3)' }}> — tap for effects</span>}
            </div>
          )
        })}
        {openCond && !combat.conditions.includes(openCond) && (
          <div style={{ fontSize: 12, color: 'var(--text-2)', paddingTop: 6 }}>{conditions.find(c => c.id === openCond)?.desc.map((l, i) => <div key={i}>{l}</div>)}</div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
          <span style={{ fontSize: 12, color: 'var(--text-2)' }}>Exhaustion</span>
          <Pips n={combat.exhaustion} max={6} color="var(--red)" onSet={n => patchCombat({ exhaustion: n })} />
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{combat.exhaustion ? `Level ${combat.exhaustion}: ${EXHAUSTION[combat.exhaustion]}` : 'None'}</span>
        </div>
        {combat.exhaustion >= 3 && <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 4 }}>You have disadvantage on attack rolls and saving throws, and on ability checks.</div>}
        {combat.exhaustion >= 6 && <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 4 }}>Level 6 exhaustion is death.</div>}
      </Panel>

      <Panel title="Companions & mounts">
        {companions.map(c => (
          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
            <span style={{ flex: 1, minWidth: 120, fontSize: 13 }}>{c.name}</span>
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>AC</span>
            <input className="input" type="number" style={{ width: 54, padding: 4, textAlign: 'center' }} defaultValue={c.ac} onBlur={e => editPet(c.id, { ac: +e.target.value })} />
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>HP</span>
            <button className="btn btn-ghost btn-sm" onClick={() => editPet(c.id, { hp: { ...c.hp, current: Math.max(0, c.hp.current - 1) } })}>−</button>
            <span style={{ fontSize: 13, minWidth: 44, textAlign: 'center' }}>{c.hp.current}/<input className="input" type="number" style={{ width: 44, padding: 2, textAlign: 'center', display: 'inline-block' }} defaultValue={c.hp.max} onBlur={e => editPet(c.id, { hp: { ...c.hp, max: +e.target.value } })} /></span>
            <button className="btn btn-ghost btn-sm" onClick={() => editPet(c.id, { hp: { ...c.hp, current: Math.min(c.hp.max, c.hp.current + 1) } })}>+</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setCompanions(companions.filter(x => x.id !== c.id))} title="Remove">✕</button>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <input className="input" style={{ fontSize: 13 }} placeholder="Familiar, pet, mount, hireling…" value={newPet} onChange={e => setNewPet(e.target.value)} onKeyDown={e => e.key === 'Enter' && addPet()} />
          <button className="btn btn-primary btn-sm" onClick={addPet}>Add</button>
        </div>
      </Panel>
    </>
  )
}
