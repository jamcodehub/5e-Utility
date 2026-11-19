import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Navigate } from 'react-router-dom'
import { api, useAuth } from '../context/AuthContext'
import { useCampaign } from '../context/CampaignContext'
import { useToast } from '../hooks/useToast'
import { SkeletonBlock } from '../components/Skeleton'
import { useDebouncedSave } from '../hooks/useDebouncedSave'
import { loadSrd, loadSrdMany } from '../utils/srd'
import { derive, weaponStats } from '../utils/sheet'
import { signed } from '../utils/dice'
import {
  abilityMod, rollInitiative, sortByInitiative, nextTurn, resolveAttack, applyDamage, applyHeal, parseAmount, describeAttack, mergeSaved,
} from '../utils/combat'

const nanoid = () => Math.random().toString(36).slice(2, 9)
const ABIL = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA']
const TYPE_COLOR = { boss: '#f59e0b', enemy: '#ef4444', player: '#6366f1', npc: '#10b981' }

function HpBar({ current, max }) {
  if (!max) return null
  const pct = Math.max(0, Math.min(100, (current / max) * 100))
  const color = pct > 60 ? '#2e7d52' : pct > 30 ? '#d97706' : '#dc2626'
  return (
    <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden', marginTop: 4 }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, transition: 'width .2s' }} />
    </div>
  )
}

// Compact summary shown when a card is pressed: the numbers a DM needs mid-fight.
function Summary({ c }) {
  const s = c.sheet || {}
  const attacks = c.attacks || []
  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-2)' }}>
      {s.line && <div style={{ marginBottom: 6, color: 'var(--text)' }}>{s.line}</div>}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 6 }}>
        <span><b>AC</b> {c.ac ?? '—'}</span>
        <span><b>HP</b> {c.hp ?? '—'}/{c.maxHp ?? '—'}</span>
        {s.speed != null && <span><b>Speed</b> {typeof s.speed === 'number' ? `${s.speed} ft.` : s.speed}</span>}
        <span><b>Init</b> {signed(c.initBonus || 0)}</span>
      </div>
      {s.abil && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4, textAlign: 'center', marginBottom: 6 }}>
          {ABIL.map((a, i) => (
            <div key={a} style={{ border: '1px solid var(--border)', borderRadius: 3, padding: '2px 0' }}>
              <div style={{ fontSize: 9, letterSpacing: '0.06em', color: 'var(--text-3)' }}>{a}</div>
              <div style={{ fontWeight: 600, color: 'var(--text)' }}>{s.abil[i] ?? 10}</div>
              <div style={{ fontSize: 10 }}>{signed(abilityMod(s.abil[i]))}</div>
            </div>
          ))}
        </div>
      )}
      {attacks.length > 0 ? (
        <div>
          {attacks.map(a => (
            <div key={a.name}>{a.name}: <b>{signed(a.bonus || 0)}</b> to hit, {a.dmg}{a.type ? ` ${a.type}` : ''}</div>
          ))}
          {s.multi && <div style={{ marginTop: 4, fontStyle: 'italic', color: 'var(--text-3)' }}>{s.multi}</div>}
        </div>
      ) : <div style={{ color: 'var(--text-3)' }}>No attacks listed. Use a custom attack.</div>}
    </div>
  )
}

const selectStyle = { padding: '4px 6px', fontSize: 12, flex: 1, minWidth: 0 }

function CombatantCard({ c, others, isTurn, expanded, onToggle, onChange, onRemove, onAttack, onHeal }) {
  const [dmgInput, setDmgInput] = useState('')
  const [healInput, setHealInput] = useState('')
  const [panel, setPanel] = useState(null) // 'attack' | 'heal' | null
  // attack form
  const [attackIdx, setAttackIdx] = useState(0)
  const [custom, setCustom] = useState({ bonus: '0', dmg: '1d6' })
  const [targetId, setTargetId] = useState('')
  const [mode, setMode] = useState('normal')
  // heal form
  const [healTarget, setHealTarget] = useState('')
  const [healAmount, setHealAmount] = useState('')

  const attacks = c.attacks || []
  const isCustom = attackIdx === attacks.length
  const validTargets = others.filter(o => o.id !== c.id)
  // you can't attack someone who is already down (you can still heal them)
  const attackTargets = validTargets.filter(o => !o.maxHp || (o.hp ?? 0) > 0)
  const tid = attackTargets.some(o => o.id === targetId) ? targetId : attackTargets[0]?.id || ''
  const htid = validTargets.some(o => o.id === healTarget) ? healTarget : c.id

  const applyDmg = () => {
    const v = parseInt(dmgInput)
    if (!v || v <= 0) return
    onChange(applyDamage(c, v))
    setDmgInput('')
  }
  const applyHealManual = () => {
    const v = parseInt(healInput)
    if (!v || v <= 0) return
    onChange(applyHeal(c, v))
    setHealInput('')
  }

  const doAttack = () => {
    const attack = isCustom
      ? { name: 'Attack', bonus: parseInt(custom.bonus) || 0, dmg: custom.dmg.trim(), type: '' }
      : attacks[attackIdx]
    if (!attack || !tid) return
    onAttack({ attackerId: c.id, attack, targetId: tid, mode })
  }
  const doHeal = () => {
    if (onHeal({ healerId: c.id, targetId: htid, amount: healAmount })) setHealAmount('')
  }

  const hp = c.hp ?? c.maxHp ?? 0
  const maxHp = c.maxHp ?? 0
  const isDead = maxHp > 0 && hp === 0
  const tagColor = TYPE_COLOR[c.type] || '#10b981'
  const outline = isTurn ? '2px solid var(--gold-fill, var(--gold))' : undefined

  return (
    <div style={{
      background: 'var(--surface)', border: `1px solid ${isDead ? 'var(--red)' : 'var(--border)'}`,
      borderLeft: `4px solid ${tagColor}`, borderRadius: 4, padding: '12px 14px',
      opacity: isDead ? 0.6 : 1, outline, outlineOffset: -1,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        {/* Avatar / initials */}
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: tagColor, border: '2px solid rgba(255,255,255,0.2)', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {c.avatar
            ? <img src={c.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: 14, color: '#fff', fontWeight: 700 }}>{c.name?.[0]?.toUpperCase()}</span>}
        </div>
        <button type="button" onClick={onToggle} aria-expanded={expanded} title="Show or hide details"
          style={{ flex: 1, minWidth: 0, textAlign: 'left', background: 'none', border: 'none', padding: 0, color: 'inherit', cursor: 'pointer' }}>
          <div style={{ fontFamily: 'var(--font-title)', fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {c.name} {isDead && <span style={{ fontSize: 11, color: 'var(--red)' }}>— Down</span>}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'capitalize' }}>{c.type} · {expanded ? 'hide details' : 'details'}</div>
        </button>
        {c.init != null && (
          <div title="Initiative" style={{ minWidth: 30, height: 30, borderRadius: 4, border: '1px solid var(--border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>{c.init}</div>
        )}
        <button onClick={() => onRemove(c.id)} aria-label={`Remove ${c.name}`} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 4 }}>✕</button>
      </div>

      {/* HP display */}
      {maxHp > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
            <span style={{ fontSize: 12, color: 'var(--text-2)' }}>HP{c.ac != null ? ` · AC ${c.ac}` : ''}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button onClick={() => onChange({ ...c, hp: Math.max(0, hp - 1) })} aria-label="Lose 1 HP"
                style={{ width: 20, height: 20, borderRadius: 4, border: '1px solid var(--border)', background: 'transparent', color: 'var(--red)', fontSize: 13, cursor: 'pointer', lineHeight: 1 }}>−</button>
              <span style={{ fontSize: 15, fontWeight: 700, color: isDead ? 'var(--red)' : 'var(--text)', minWidth: 60, textAlign: 'center' }}>
                {hp} / {maxHp}
              </span>
              <button onClick={() => onChange({ ...c, hp: Math.min(maxHp, hp + 1) })} aria-label="Gain 1 HP"
                style={{ width: 20, height: 20, borderRadius: 4, border: '1px solid var(--border)', background: 'transparent', color: 'var(--green)', fontSize: 13, cursor: 'pointer', lineHeight: 1 }}>+</button>
            </div>
          </div>
          <HpBar current={hp} max={maxHp} />
        </>
      )}

      {/* Actions */}
      {maxHp > 0 && (
        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
          <button className="btn btn-ghost btn-sm" aria-pressed={panel === 'attack'} onClick={() => setPanel(p => p === 'attack' ? null : 'attack')}
            disabled={isDead} style={{ flex: 1, justifyContent: 'center' }}>Attack</button>
          <button className="btn btn-ghost btn-sm" aria-pressed={panel === 'heal'} onClick={() => setPanel(p => p === 'heal' ? null : 'heal')}
            disabled={isDead} style={{ flex: 1, justifyContent: 'center' }}>Heal</button>
        </div>
      )}

      {panel === 'attack' && (
        <div style={{ marginTop: 8, padding: 8, background: 'var(--surface2)', borderRadius: 4, display: 'grid', gap: 6 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <select className="input" aria-label="Attack" value={attackIdx} onChange={e => setAttackIdx(+e.target.value)} style={selectStyle}>
              {attacks.map((a, i) => <option key={a.name + i} value={i}>{a.name} ({signed(a.bonus || 0)}, {a.dmg})</option>)}
              <option value={attacks.length}>Custom attack…</option>
            </select>
          </div>
          {isCustom && (
            <div style={{ display: 'flex', gap: 6 }}>
              <input className="input" aria-label="To-hit bonus" type="number" placeholder="To hit" value={custom.bonus} onChange={e => setCustom(s => ({ ...s, bonus: e.target.value }))} style={{ ...selectStyle, flex: '0 0 70px' }} />
              <input className="input" aria-label="Damage dice" placeholder="Damage, e.g. 1d8+3" value={custom.dmg} onChange={e => setCustom(s => ({ ...s, dmg: e.target.value }))} style={selectStyle} />
            </div>
          )}
          <div style={{ display: 'flex', gap: 6 }}>
            <select className="input" aria-label="Target" value={tid} onChange={e => setTargetId(e.target.value)} style={selectStyle}>
              {attackTargets.length === 0 && <option value="">No targets standing</option>}
              {attackTargets.map(o => <option key={o.id} value={o.id}>{o.name}{o.ac != null ? ` (AC ${o.ac})` : ''}</option>)}
            </select>
            <select className="input" aria-label="Roll mode" value={mode} onChange={e => setMode(e.target.value)} style={{ ...selectStyle, flex: '0 0 96px' }}>
              <option value="normal">Normal</option><option value="adv">Advantage</option><option value="dis">Disadvantage</option>
            </select>
          </div>
          <button className="btn btn-primary btn-sm" onClick={doAttack} disabled={!tid || (isCustom && !custom.dmg.trim())} style={{ justifyContent: 'center' }}>Roll attack</button>
        </div>
      )}

      {panel === 'heal' && (
        <div style={{ marginTop: 8, padding: 8, background: 'var(--surface2)', borderRadius: 4, display: 'grid', gap: 6 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <select className="input" aria-label="Heal target" value={htid} onChange={e => setHealTarget(e.target.value)} style={selectStyle}>
              <option value={c.id}>{c.name} (self)</option>
              {validTargets.map(o => <option key={o.id} value={o.id}>{o.name} ({o.hp ?? 0}/{o.maxHp ?? 0})</option>)}
            </select>
            <input className="input" aria-label="Healing amount" placeholder="8 or 2d4+2" value={healAmount} onChange={e => setHealAmount(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doHeal()} style={{ ...selectStyle, flex: '0 0 110px' }} />
          </div>
          <button className="btn btn-primary btn-sm" onClick={doHeal} disabled={!healAmount.trim()} style={{ justifyContent: 'center' }}>Heal</button>
        </div>
      )}

      {/* Manual quick damage / heal (for anything that isn't an attack) */}
      {maxHp > 0 && (
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <div style={{ flex: 1, display: 'flex', gap: 4 }}>
            <input className="input" type="number" min={1} placeholder="Dmg" aria-label="Manual damage"
              value={dmgInput} onChange={e => setDmgInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && applyDmg()}
              style={{ padding: '4px 6px', fontSize: 12, flex: 1, minWidth: 0 }} />
            <button onClick={applyDmg} disabled={!dmgInput}
              style={{ padding: '4px 8px', borderRadius: 3, border: '1px solid var(--red)', background: 'transparent', color: 'var(--red)', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>Hit</button>
          </div>
          <div style={{ flex: 1, display: 'flex', gap: 4 }}>
            <input className="input" type="number" min={1} placeholder="Heal" aria-label="Manual healing"
              value={healInput} onChange={e => setHealInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && applyHealManual()}
              style={{ padding: '4px 6px', fontSize: 12, flex: 1, minWidth: 0 }} />
            <button onClick={applyHealManual} disabled={!healInput}
              style={{ padding: '4px 8px', borderRadius: 3, border: '1px solid var(--green)', background: 'transparent', color: 'var(--green)', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>Heal</button>
          </div>
        </div>
      )}

      {expanded && <Summary c={c} />}

      {/* Editable stats */}
      <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
        {[['AC', 'ac', 44], ['Init', 'init', 44]].map(([label, field, w]) => (
          <div key={field} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <span style={{ fontSize: 9, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
            <input type="number" className="input" aria-label={label} value={c[field] ?? ''}
              onChange={e => onChange({ ...c, [field]: e.target.value === '' ? null : +e.target.value })}
              style={{ width: w, padding: '2px 4px', fontSize: 12, textAlign: 'center' }} />
          </div>
        ))}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <span style={{ fontSize: 9, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Max HP</span>
          <input type="number" className="input" aria-label="Max HP" value={maxHp}
            onChange={e => onChange({ ...c, maxHp: +e.target.value, hp: Math.min(hp, +e.target.value) })}
            style={{ width: 52, padding: '2px 4px', fontSize: 12, textAlign: 'center' }} />
        </div>
      </div>
    </div>
  )
}

function useMobile() {
  const [m, setM] = useState(() => window.matchMedia('(max-width: 768px)').matches)
  useEffect(() => {
    const q = window.matchMedia('(max-width: 768px)')
    const f = () => setM(q.matches)
    q.addEventListener('change', f)
    return () => q.removeEventListener('change', f)
  }, [])
  return m
}

// What the compact summary and the attack picker need for a party member, from the character sheet + SRD.
function playerCombatant(m, srd) {
  const ch = m.character
  const base = {
    id: `player-${m.userId}`, userId: m.userId, charId: ch._id, name: ch.name || m.username, avatar: ch.avatarUrl || null,
    type: 'player', hp: ch.hp?.current ?? ch.hp?.max ?? 10, maxHp: ch.hp?.max ?? 10, ac: ch.ac, init: null, source: 'party',
    initBonus: 0, attacks: [], sheet: { line: [ch.race, ch.class, ch.level && `level ${ch.level}`].filter(Boolean).join(' ') },
  }
  if (!srd) return base
  try {
    const d = derive(ch, srd)
    const attacks = d.items.filter(i => i.def?.category === 'weapon' && i.def.damage?.dice)
      .map(i => { const st = weaponStats(i.def, d); return { name: i.def.name, bonus: st.atk, dmg: st.dmg, type: st.type } })
    if (!attacks.length) {
      const str = d.mod('str')
      attacks.push({ name: 'Unarmed strike', bonus: str + d.prof, dmg: String(Math.max(1, 1 + str)), type: 'bludgeoning' })
    }
    return {
      ...base, ac: ch.ac ?? d.ac, initBonus: d.initiative, attacks,
      sheet: { ...base.sheet, speed: d.speed, abil: ['str', 'dex', 'con', 'int', 'wis', 'cha'].map(k => ch.stats?.[k] ?? 10) },
    }
  } catch { return base }
}

// A bundled SRD monster, ready to fight.
function monsterCombatant(m, n) {
  return {
    id: `srd-${m.id}-${nanoid()}`, name: n ? `${m.name} ${n}` : m.name, avatar: null, type: 'enemy', source: 'srd',
    hp: m.hp, maxHp: m.hp, ac: m.ac, init: null, initBonus: abilityMod(m.abil[1]),
    attacks: m.attacks || [],
    sheet: { line: `${m.size} ${m.type} · CR ${m.cr}`, speed: m.speed, abil: m.abil, multi: m.multi },
  }
}

export default function HpTracker() {
  const mobile = useMobile()
  const { activeCampaign } = useCampaign()
  const { user } = useAuth()
  const { toast, ToastContainer } = useToast()

  const [combatants, setCombatants] = useState([])
  const [lorePool, setLorePool] = useState([])   // available lore entries to add
  const [round, setRound] = useState(1)
  const [turnId, setTurnId] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [log, setLog] = useState([])
  const [dataLoading, setDataLoading] = useState(true)
  const [monsters, setMonsters] = useState([])
  const srdRef = useRef(null)
  // The fight is saved per campaign. `hydrated` holds the campaign whose saved battle has been loaded, and nothing
  // is written until then, so a failed load can never overwrite a good save with an empty one.
  const hydrated = useRef(null)
  const [saveStatus, setSaveStatus] = useState('')
  const { schedule: scheduleSave } = useDebouncedSave(700)
  const logEnd = useRef(null)

  // Custom combatant form
  const [customName, setCustomName] = useState('')
  const [customHp, setCustomHp] = useState('')
  const [customType, setCustomType] = useState('enemy')
  // SRD monster picker
  const [monsterQuery, setMonsterQuery] = useState('')
  const [monsterQty, setMonsterQty] = useState(1)

  const pushLog = (line) => setLog(l => [...l.slice(-40), line])

  const load = useCallback(async () => {
    if (!activeCampaign) {
      setDataLoading(false)
      return
    }
    setDataLoading(true)

    // SRD data (sheet maths for party members + the monster list); the tracker still works without it
    try {
      srdRef.current = await loadSrdMany('core', 'classes', 'races', 'equipment')
      setMonsters(await loadSrd('monsters'))
    } catch { /* the manual tools keep working */ }

    // Load party characters, then restore the saved fight on top of them
    hydrated.current = null
    let party = []
    try {
      const members = await api(`/campaigns/${activeCampaign._id}/members/characters`)
      party = (members || []).filter(m => m.character).map(m => playerCombatant(m, srdRef.current))
    } catch { /* no party yet */ }
    let saved = null, savedOk = false
    try { saved = (await api(`/battle/${activeCampaign._id}`)).state; savedOk = true } catch { /* offline: the fight just won't be restored */ }
    if (saved) {
      const merged = mergeSaved(party, saved.combatants)
      setCombatants(merged)
      setRound(saved.round || 1)
      setTurnId(merged.some(c => c.id === saved.turnId) ? saved.turnId : null)
      setLog(saved.log || [])
    } else {
      setCombatants(party); setRound(1); setTurnId(null); setLog([])
    }
    setExpandedId(null)
    if (savedOk) { hydrated.current = activeCampaign._id; setSaveStatus('saved') } else setSaveStatus('error')

    // Load lore pool
    try {
      const lore = await api(`/lore/${activeCampaign._id}`)
      setLorePool((lore || []).filter(l => ['npc', 'enemy', 'boss'].includes(l.tag)))
    } catch { /* */ }
    setDataLoading(false)
  }, [activeCampaign?._id])

  useEffect(() => { load() }, [load])

  // Save the whole fight (combatants, initiative, turn, round, log) a moment after any change.
  useEffect(() => {
    const cid = activeCampaign?._id
    if (!cid || hydrated.current !== cid) return
    const state = { combatants, round, turnId, log }
    setSaveStatus('saving')
    scheduleSave(async () => {
      try { await api(`/battle/${cid}`, { method: 'PUT', body: { state } }); setSaveStatus('saved') }
      catch { setSaveStatus('error') }
    })
  }, [combatants, round, turnId, log]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { logEnd.current?.scrollTo?.({ top: logEnd.current.scrollHeight }) }, [log])

  const updateCombatant = (updated) => {
    setCombatants(cs => cs.map(c => c.id === updated.id ? updated : c))
    // Persist HP back to the source record so it doesn't reset to default
    // next time this page (or Character.jsx / the Levels tilemap) loads it.
    if (updated.source === 'lore' && updated.loreId && updated.hp !== undefined) {
      api(`/lore/${updated.loreId}/hp`, { method: 'PATCH', body: { hp: updated.hp } }).catch(() => {})
    } else if (updated.source === 'party' && updated.userId && updated.hp !== undefined) {
      api(`/campaigns/${activeCampaign._id}/characters/${updated.charId}`, { method: 'PUT', body: { hp: { current: updated.hp, max: updated.maxHp } } }).catch(() => {})
    }
  }
  const removeCombatant = (id) => {
    setCombatants(cs => cs.filter(c => c.id !== id))
    if (turnId === id) setTurnId(null)
  }

  const addFromLore = (loreEntry) => {
    if (combatants.find(c => c.id === `lore-${loreEntry._id}`)) return
    setCombatants(cs => [...cs, {
      id: `lore-${loreEntry._id}`,
      loreId: loreEntry._id,
      name: loreEntry.title,
      avatar: null,
      type: loreEntry.tag,
      hp: loreEntry.hp ?? loreEntry.maxHp ?? 10,
      maxHp: loreEntry.maxHp ?? 10,
      attacks: [], initBonus: 0, init: null,
      source: 'lore',
    }])
  }

  const addCustom = () => {
    if (!customName.trim()) return
    const maxHp = parseInt(customHp) || 10
    setCombatants(cs => [...cs, {
      id: `custom-${nanoid()}`,
      name: customName.trim(),
      avatar: null,
      type: customType,
      hp: maxHp,
      maxHp,
      attacks: [], initBonus: 0, init: null,
      source: 'custom',
    }])
    setCustomName(''); setCustomHp('')
  }

  const addMonster = (m) => {
    const qty = Math.max(1, Math.min(20, parseInt(monsterQty) || 1))
    const taken = combatants.filter(c => c.source === 'srd' && c.name.startsWith(m.name)).length
    setCombatants(cs => [...cs, ...Array.from({ length: qty }, (_, i) => monsterCombatant(m, qty > 1 || taken ? taken + i + 1 : 0))])
    toast(qty > 1 ? `Added ${qty} × ${m.name}` : `Added ${m.name}`)
  }

  const rollAllInitiative = () => {
    if (!combatants.length) return
    const rolled = rollInitiative(combatants)
    const next = combatants.map(c => ({ ...c, init: rolled[c.id].total }))
    setCombatants(next)
    const order = sortByInitiative(next)
    setTurnId(order.find(c => !c.maxHp || c.hp > 0)?.id || null)
    setRound(1)
    pushLog(`Initiative rolled: ${order.map(c => `${c.name} ${c.init}`).join(', ')}`)
  }

  const advanceTurn = () => {
    const r = nextTurn(sortedCombatants, turnId, round)
    setTurnId(r.turnId)
    if (r.round !== round) { setRound(r.round); pushLog(`Round ${r.round}`) }
  }

  const doAttack = ({ attackerId, attack, targetId, mode }) => {
    const attacker = combatants.find(c => c.id === attackerId)
    const target = combatants.find(c => c.id === targetId)
    if (!attacker || !target) return
    let r
    try { r = resolveAttack({ attack, target, mode }) } catch { toast('That damage expression isn’t valid. Try something like 1d8+3.'); return }
    if (r.hit && r.damage) updateCombatant(applyDamage(target, r.damage))
    pushLog(describeAttack(attacker, target, attack, r))
    if (r.hit && r.damage && target.maxHp && (target.hp ?? 0) > 0 && (target.hp ?? 0) - r.damage <= 0) pushLog(`${target.name} is down.`)
  }

  const doHeal = ({ healerId, targetId, amount }) => {
    const healer = combatants.find(c => c.id === healerId)
    const target = combatants.find(c => c.id === targetId)
    const a = parseAmount(amount)
    if (!healer || !target) return false
    if (!a) { toast('Enter a number or dice, like 8 or 2d4+2.'); return false }
    const healed = applyHeal(target, a.total)
    updateCombatant(healed)
    const gained = (healed.hp ?? 0) - (target.hp ?? 0)
    pushLog(`${healer.name} heals ${target.id === healer.id ? 'themselves' : target.name} for ${gained} (${a.text}).`)
    return true
  }

  const resetAll = () => {
    if (!window.confirm('Reset all HP to max, clear initiative and restart the round counter?')) return
    // updateCombatant also writes the restored HP back to each party member's character and lore entry
    combatants.forEach(c => updateCombatant({ ...c, hp: c.maxHp, init: null }))
    setRound(1); setTurnId(null); setLog([])
  }

  const sortedCombatants = useMemo(() => sortByInitiative(combatants), [combatants])

  const aliveCount = combatants.filter(c => !c.maxHp || c.hp > 0).length
  const downCount  = combatants.filter(c => c.maxHp && c.hp === 0).length

  const monsterResults = useMemo(() => {
    const q = monsterQuery.trim().toLowerCase()
    if (!q) return []
    return monsters.filter(m => m.name.toLowerCase().includes(q)).slice(0, 8)
  }, [monsters, monsterQuery])

  // This page's data (party members' characters) comes from a DM-only
  // endpoint, so non-DMs are redirected rather than shown a broken page.
  if (user?.role !== 'dm') return <Navigate to="/journal" replace />

  if (!activeCampaign) return (
    <div style={{ height: '100%', padding: 20 }}>
      <div style={{ paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
        <h2 style={{ fontSize: 18, margin: 0 }}>Battle Tracker</h2>
      </div>
      <div style={{ color: 'var(--text-3)', marginTop: 20 }}>Select a campaign.</div>
    </div>
  )

  const hasInit = combatants.some(c => c.init != null)

  return (
    <div style={mobile ? { display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' } : { display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Main tracker */}
      <div style={mobile ? { display: 'flex', flexDirection: 'column', flexShrink: 0 } : { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 140 }}>
            <h2 style={{ fontSize: 18, marginBottom: 2 }}>Battle Tracker</h2>
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
              Round {round} · {aliveCount} active{downCount > 0 ? ` · ${downCount} down` : ''}
              {saveStatus && <span role="status" style={{ marginLeft: 8, color: saveStatus === 'error' ? 'var(--red)' : 'var(--text-3)' }}>· {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved' : 'Not saved. Check your connection'}</span>}
            </div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={rollAllInitiative} disabled={!combatants.length}>Roll initiative</button>
          <button className="btn btn-ghost btn-sm" onClick={advanceTurn} disabled={!hasInit}>Next turn</button>
          <button className="btn btn-ghost btn-sm" onClick={() => { setRound(r => r + 1); pushLog(`Round ${round + 1}`) }}>Next Round</button>
          <button className="btn btn-ghost btn-sm" onClick={resetAll}>Reset</button>
        </div>

        {/* Combatant grid */}
        <div style={mobile ? { padding: 16 } : { flex: 1, overflowY: 'auto', padding: 16 }}>
          {dataLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {Array.from({ length: 4 }).map((_, i) => <SkeletonBlock key={i} height={156} radius={5} />)}
            </div>
          ) : combatants.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-3)', padding: 60, fontSize: 13, lineHeight: 1.8 }}>
              No combatants yet.<br />Party members are loaded automatically.<br />Add monsters from the panel on the right.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, alignItems: 'start' }}>
              {sortedCombatants.map(c => (
                <CombatantCard key={c.id} c={c} others={sortedCombatants} isTurn={c.id === turnId}
                  expanded={expandedId === c.id} onToggle={() => setExpandedId(id => id === c.id ? null : c.id)}
                  onChange={updateCombatant} onRemove={removeCombatant} onAttack={doAttack} onHeal={doHeal} />
              ))}
            </div>
          )}
        </div>

        {/* Combat log */}
        {log.length > 0 && (
          <div ref={logEnd} role="log" aria-label="Combat log" style={{ flexShrink: 0, maxHeight: 110, overflowY: 'auto', borderTop: '1px solid var(--border)', background: 'var(--surface)', padding: '8px 20px', fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>
            {log.map((l, i) => <div key={i}>{l}</div>)}
          </div>
        )}
      </div>

      {/* Right sidebar — add combatants */}
      <div style={mobile
        ? { flexShrink: 0, borderTop: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', flexDirection: 'column' }
        : { width: 270, flexShrink: 0, borderLeft: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        <div style={mobile ? { padding: 12 } : { flex: 1, overflowY: 'auto', padding: 12 }}>
          {/* SRD monsters */}
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Add monster
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            <input className="input" placeholder="Search monsters…" aria-label="Search monsters" value={monsterQuery}
              onChange={e => setMonsterQuery(e.target.value)} style={{ flex: 1, fontSize: 12, minWidth: 0 }} />
            <input className="input" type="number" min={1} max={20} aria-label="How many" value={monsterQty}
              onChange={e => setMonsterQty(e.target.value)} style={{ width: 52, fontSize: 12 }} />
          </div>
          {monsterQuery.trim() && monsterResults.length === 0 && (
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 8 }}>{monsters.length ? 'No monster matches that.' : 'Monster list unavailable.'}</div>
          )}
          {monsterResults.map(m => (
            <button key={m.id} onClick={() => addMonster(m)}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '6px 8px', marginBottom: 4, borderRadius: 3, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 12, cursor: 'pointer' }}>
              <div style={{ fontWeight: 600 }}>{m.name}</div>
              <div style={{ fontSize: 10, color: 'var(--text-3)' }}>CR {m.cr} · AC {m.ac} · {m.hp} HP · {m.type}</div>
            </button>
          ))}

          {/* Lore entries */}
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '14px 0 8px' }}>
            Add from Lore
          </div>
          {dataLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Array.from({ length: 5 }).map((_, i) => <SkeletonBlock key={i} height={48} radius={3} />)}
            </div>
          ) : lorePool.length === 0 && (
            <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.6 }}>
              No lore combatants. Add NPCs, enemies or bosses in the Lore section.
            </div>
          )}
          {['boss', 'enemy', 'npc'].map(type => {
            const entries = lorePool.filter(l => l.tag === type)
            if (!entries.length) return null
            return (
              <div key={type} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, color: type === 'boss' ? '#f59e0b' : type === 'enemy' ? '#ef4444' : 'var(--text-3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {type === 'npc' ? 'NPCs' : type === 'boss' ? 'Bosses' : 'Enemies'}
                </div>
                {entries.map(l => {
                  const added = !!combatants.find(c => c.id === `lore-${l._id}`)
                  return (
                    <button key={l._id} onClick={() => addFromLore(l)} disabled={added}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left',
                        padding: '6px 8px', marginBottom: 4, borderRadius: 3,
                        border: '1px solid var(--border)', background: added ? 'var(--surface2)' : 'var(--surface)',
                        color: added ? 'var(--text-3)' : 'var(--text)', fontSize: 12, cursor: added ? 'default' : 'pointer',
                        opacity: added ? 0.6 : 1,
                      }}>
                      <div style={{ fontWeight: 500 }}>{l.title}</div>
                      {l.maxHp && <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{l.hp ?? l.maxHp} / {l.maxHp} HP</div>}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>

        {/* Custom combatant creator */}
        <div style={{ padding: 12, borderTop: '1px solid var(--border)', background: 'var(--surface2)' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Custom
          </div>
          <input className="input" placeholder="Name" value={customName}
            onChange={e => setCustomName(e.target.value)}
            style={{ marginBottom: 6, fontSize: 12 }} />
          <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            <input className="input" type="number" placeholder="Max HP" value={customHp}
              onChange={e => setCustomHp(e.target.value)}
              style={{ flex: 1, fontSize: 12 }} />
            <select className="input" value={customType} onChange={e => setCustomType(e.target.value)}
              style={{ flex: 1, fontSize: 12 }}>
              <option value="enemy">Enemy</option>
              <option value="boss">Boss</option>
              <option value="npc">NPC</option>
            </select>
          </div>
          <button className="btn btn-primary btn-sm" onClick={addCustom}
            disabled={!customName.trim()}
            style={{ width: '100%', justifyContent: 'center' }}>
            + Add
          </button>
        </div>
      </div>

      <ToastContainer />
    </div>
  )
}
