import { useState, useEffect, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import { api, useAuth } from '../context/AuthContext'
import { useCampaign } from '../context/CampaignContext'
import { useToast } from '../hooks/useToast'
import { SkeletonBlock } from '../components/Skeleton'

const nanoid = () => Math.random().toString(36).slice(2, 9)

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

function CombatantCard({ c, onChange, onRemove }) {
  const [dmgInput, setDmgInput] = useState('')
  const [healInput, setHealInput] = useState('')

  const applyDamage = () => {
    const v = parseInt(dmgInput)
    if (!v || v <= 0) return
    onChange({ ...c, hp: Math.max(0, (c.hp ?? c.maxHp ?? 0) - v) })
    setDmgInput('')
  }
  const applyHeal = () => {
    const v = parseInt(healInput)
    if (!v || v <= 0) return
    onChange({ ...c, hp: Math.min(c.maxHp ?? 999, (c.hp ?? 0) + v) })
    setHealInput('')
  }

  const hp = c.hp ?? c.maxHp ?? 0
  const maxHp = c.maxHp ?? 0
  const isDead = maxHp > 0 && hp === 0
  const tagColor = c.type === 'boss' ? '#f59e0b' : c.type === 'enemy' ? '#ef4444' : c.type === 'player' ? '#6366f1' : '#10b981'

  return (
    <div style={{
      background: 'var(--surface)', border: `1px solid ${isDead ? 'var(--red)' : 'var(--border)'}`,
      borderLeft: `4px solid ${tagColor}`, borderRadius: 4, padding: '12px 14px',
      opacity: isDead ? 0.6 : 1,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        {/* Avatar / initials */}
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: tagColor, border: '2px solid rgba(255,255,255,0.2)', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {c.avatar
            ? <img src={c.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: 14, color: '#fff', fontWeight: 700 }}>{c.name?.[0]?.toUpperCase()}</span>
          }
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-title)', fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {c.name} {isDead && <span style={{ fontSize: 11, color: 'var(--red)' }}>— Down</span>}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'capitalize' }}>{c.type}</div>
        </div>
        <button onClick={() => onRemove(c.id)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 2 }}>✕</button>
      </div>

      {/* HP display */}
      {maxHp > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
            <span style={{ fontSize: 12, color: 'var(--text-2)' }}>HP</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button onClick={() => onChange({ ...c, hp: Math.max(0, hp - 1) })}
                style={{ width: 20, height: 20, borderRadius: 4, border: '1px solid var(--border)', background: 'transparent', color: 'var(--red)', fontSize: 13, cursor: 'pointer', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
              <span style={{ fontSize: 15, fontWeight: 700, color: isDead ? 'var(--red)' : 'var(--text)', minWidth: 60, textAlign: 'center' }}>
                {hp} / {maxHp}
              </span>
              <button onClick={() => onChange({ ...c, hp: Math.min(maxHp, hp + 1) })}
                style={{ width: 20, height: 20, borderRadius: 4, border: '1px solid var(--border)', background: 'transparent', color: 'var(--green)', fontSize: 13, cursor: 'pointer', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
            </div>
          </div>
          <HpBar current={hp} max={maxHp} />
        </>
      )}

      {/* Quick damage / heal inputs */}
      {maxHp > 0 && (
        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
          <div style={{ flex: 1, display: 'flex', gap: 4 }}>
            <input
              className="input" type="number" min={1} placeholder="Dmg"
              value={dmgInput} onChange={e => setDmgInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && applyDamage()}
              style={{ padding: '4px 6px', fontSize: 12, flex: 1 }}
            />
            <button onClick={applyDamage} disabled={!dmgInput}
              style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--red)', background: 'transparent', color: 'var(--red)', fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Hit
            </button>
          </div>
          <div style={{ flex: 1, display: 'flex', gap: 4 }}>
            <input
              className="input" type="number" min={1} placeholder="Heal"
              value={healInput} onChange={e => setHealInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && applyHeal()}
              style={{ padding: '4px 6px', fontSize: 12, flex: 1 }}
            />
            <button onClick={applyHeal} disabled={!healInput}
              style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--green)', background: 'transparent', color: 'var(--green)', fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Heal
            </button>
          </div>
        </div>
      )}

      {/* Editable stats for players */}
      {c.type === 'player' && (
        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          {[['AC', 'ac'], ['Init', 'initiative']].map(([label, field]) => (
            <div key={field} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <span style={{ fontSize: 9, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
              <input type="number" className="input"
                value={c[field] ?? ''}
                onChange={e => onChange({ ...c, [field]: +e.target.value })}
                style={{ width: 44, padding: '2px 4px', fontSize: 12, textAlign: 'center' }}
              />
            </div>
          ))}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <span style={{ fontSize: 9, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Max HP</span>
            <input type="number" className="input"
              value={maxHp}
              onChange={e => onChange({ ...c, maxHp: +e.target.value, hp: Math.min(hp, +e.target.value) })}
              style={{ width: 52, padding: '2px 4px', fontSize: 12, textAlign: 'center' }}
            />
          </div>
        </div>
      )}
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

export default function HpTracker() {
  const mobile = useMobile()
  const { activeCampaign } = useCampaign()
  const { user } = useAuth()
  const { toast, ToastContainer } = useToast()

  const [combatants, setCombatants] = useState([])
  const [lorePool, setLorePool] = useState([])   // available lore entries to add
  const [round, setRound] = useState(1)
  const [dataLoading, setDataLoading] = useState(true)

  // Custom combatant form
  const [customName, setCustomName] = useState('')
  const [customHp, setCustomHp] = useState('')
  const [customType, setCustomType] = useState('enemy')

  const load = useCallback(async () => {
    if (!activeCampaign) {
      setDataLoading(false)
      return
    }
    setDataLoading(true)

    // Load party characters
    try {
      const members = await api(`/campaigns/${activeCampaign._id}/members/characters`)
      const playerCombatants = (members || [])
        .filter(m => m.character)
        .map(m => ({
          id: `player-${m.userId}`,
          userId: m.userId,
          charId: m.character._id,
          name: m.character.name || m.username,
          avatar: m.character.avatarUrl || null,
          type: 'player',
          hp: m.character.hp?.current ?? m.character.hp?.max ?? 10,
          maxHp: m.character.hp?.max ?? 10,
          ac: m.character.ac,
          initiative: null,
          source: 'party',
        }))
      setCombatants(playerCombatants)
    } catch { /* no party yet */ }

    // Load lore pool
    try {
      const lore = await api(`/lore/${activeCampaign._id}`)
      setLorePool((lore || []).filter(l => ['npc', 'enemy', 'boss'].includes(l.tag)))
    } catch { /* */ }
    setDataLoading(false)
  }, [activeCampaign?._id])

  useEffect(() => { load() }, [load])

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
  const removeCombatant = (id) => setCombatants(cs => cs.filter(c => c.id !== id))

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
      source: 'custom',
    }])
    setCustomName(''); setCustomHp('')
  }

  const resetAll = () => {
    if (!window.confirm('Reset all HP to max and restart round counter?')) return
    setCombatants(cs => cs.map(c => ({ ...c, hp: c.maxHp })))
    setRound(1)
  }

  const sortedCombatants = [...combatants].sort((a, b) => {
    const order = { player: 0, npc: 1, enemy: 2, boss: 3 }
    return (order[a.type] ?? 4) - (order[b.type] ?? 4)
  })

  const aliveCount = combatants.filter(c => !c.maxHp || c.hp > 0).length
  const downCount  = combatants.filter(c => c.maxHp && c.hp === 0).length

  // This page's data (party members' characters) comes from a DM-only
  // endpoint, so non-DMs are redirected rather than shown a broken page.
  if (user?.role !== 'dm') return <Navigate to="/journal" replace />

  if (!activeCampaign) return (
    <div style={{ height: '100%', padding: 20 }}>
      <div style={{ paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
        <h2 style={{ fontSize: 18, margin: 0 }}>HP Tracker</h2>
      </div>
      <div style={{ color: 'var(--text-3)', marginTop: 20 }}>Select a campaign.</div>
    </div>
  )

  return (
    <div style={mobile ? { display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' } : { display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Main tracker */}
      <div style={mobile ? { display: 'flex', flexDirection: 'column', flexShrink: 0 } : { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 18, marginBottom: 2 }}>HP Tracker</h2>
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
              Round {round} · {aliveCount} active{downCount > 0 ? ` · ${downCount} down` : ''}
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => setRound(r => r + 1)}>Next Round</button>
          <button className="btn btn-ghost btn-sm" onClick={resetAll}>Reset</button>
        </div>

        {/* Combatant grid */}
        <div style={mobile ? { padding: 16 } : { flex: 1, overflowY: 'auto', padding: 16 }}>
          {dataLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {Array.from({ length: 4 }).map((_, i) => <SkeletonBlock key={i} height={156} radius={10} />)}
            </div>
          ) : combatants.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-3)', padding: 60, fontSize: 13, lineHeight: 1.8 }}>
              No combatants yet.<br />Party members are loaded automatically.<br />Add enemies from the panel on the right.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {sortedCombatants.map(c => (
                <CombatantCard key={c.id} c={c} onChange={updateCombatant} onRemove={removeCombatant} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right sidebar — add combatants */}
      <div style={mobile
        ? { flexShrink: 0, borderTop: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', flexDirection: 'column' }
        : { width: 260, flexShrink: 0, borderLeft: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Lore entries */}
        <div style={mobile ? { padding: 12 } : { flex: 1, overflowY: 'auto', padding: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Add from Lore
          </div>
          {dataLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Array.from({ length: 5 }).map((_, i) => <SkeletonBlock key={i} height={48} radius={8} />)}
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
                <div style={{ fontSize: 10, color: type === 'boss' ? '#f59e0b' : type === 'enemy' ? '#ef4444' : 'var(--text-3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{type}s</div>
                {entries.map(l => {
                  const added = !!combatants.find(c => c.id === `lore-${l._id}`)
                  return (
                    <button key={l._id} onClick={() => addFromLore(l)} disabled={added}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left',
                        padding: '6px 8px', marginBottom: 4, borderRadius: 6,
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
            Quick Add
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