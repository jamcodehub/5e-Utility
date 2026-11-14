import { useState, useEffect, useMemo, useRef } from 'react'
import { api } from '../context/AuthContext'
import { loadSrdMany } from '../utils/srd'
import { derive } from '../utils/sheet'
import { spellSlots } from '../utils/rules5e'
import { spellTip, equipTip, abilityTip, conditionTip } from '../utils/ruleTips'
import RuleTip from './RuleTip'

const ABILITIES = [['str', 'STR'], ['dex', 'DEX'], ['con', 'CON'], ['int', 'INT'], ['wis', 'WIS'], ['cha', 'CHA']]
const signed = (n) => (n >= 0 ? `+${n}` : `${n}`)
const label = { fontSize: 10, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '14px 0 6px' }

// The player's character at a glance, available on every page. Hover (or tap) anything
// for a short-form rules summary. Re-reads the sheet every 15s and when the page changes.
export default function CharacterOverview({ campaignId, refreshKey }) {
  const [chars, setChars] = useState(null)
  const [srd, setSrd] = useState(null)
  const [error, setError] = useState('')
  const alive = useRef(true)

  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])
  useEffect(() => { loadSrdMany('core', 'classes', 'races', 'equipment', 'spells').then(d => alive.current && setSrd(d)).catch(() => {}) }, [])
  useEffect(() => {
    let off = false
    const read = () => api(`/campaigns/${campaignId}/characters`)
      .then(list => { if (!off) { setChars(list); setError('') } })
      .catch(e => { if (!off) setError(e.message || 'Could not load your character') })
    setChars(null); read()
    const timer = setInterval(read, 15000)
    return () => { off = true; clearInterval(timer) }
  }, [campaignId, refreshKey])

  const char = useMemo(() => {
    if (!chars?.length) return null
    let remembered = null
    try { remembered = localStorage.getItem(`lastChar:${campaignId}`) } catch { /* ignore */ }
    return chars.find(c => c._id === remembered) || chars.find(c => c.isPrimary) || chars[0]
  }, [chars, campaignId])
  const d = useMemo(() => (char && srd ? derive(char, srd) : null), [char, srd])

  if (error) return <div style={{ padding: 16, fontSize: 12, color: 'var(--red)' }}>{error}</div>
  if (!chars || (char && !srd)) return <div style={{ padding: 16, fontSize: 12, color: 'var(--text-3)' }}>Loading your character…</div>
  if (!char) return <div style={{ padding: 16, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>No character in this campaign yet. Create one on the Character page and it will show up here.</div>

  const hp = char.hp || {}, max = hp.max || 0, cur = Math.max(0, hp.current ?? max), temp = char.combat?.tempHp || 0
  const pct = max ? Math.min(100, Math.round((cur / max) * 100)) : 0
  const slots = d.cls?.spellcasting ? spellSlots(d.cls, d.level) : {}
  const used = char.spells?.slotsUsed || {}
  const spellsById = Object.fromEntries(srd.spells.map(s => [s.id, s]))
  const spellIds = [...new Set([...(char.spells?.cantrips || []), ...(char.spells?.prepared?.length ? char.spells.prepared : char.spells?.known || [])])]
  const equipped = d.items.filter(i => i.equipped)
  const carried = d.items.filter(i => !i.equipped)
  const itemName = (i) => i.def?.name || i.name || i.id

  return (
    <div style={{ padding: '14px 14px 24px' }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--gold-bg)', border: '1px solid var(--gold-border)', overflow: 'hidden', flexShrink: 0, display: 'grid', placeItems: 'center', color: 'var(--gold)', fontFamily: 'var(--font-title)' }}>
          {char.avatarUrl ? <img src={char.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (char.name || 'H')[0]}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-title)', fontSize: 15, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{char.name || 'Unnamed Hero'}</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Level {d.level} {[char.race, char.class].filter(Boolean).join(' ')}</div>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-2)', marginBottom: 4 }}>
          <span>HP</span><span><strong style={{ color: 'var(--text)' }}>{cur}</strong> / {max}{temp ? ` (+${temp} temp)` : ''}</span>
        </div>
        <div style={{ height: 7, background: 'var(--surface2)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: pct > 50 ? 'var(--green)' : pct > 25 ? 'var(--gold)' : 'var(--red)', transition: 'width .4s ease' }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginTop: 10 }}>
        {[['AC', d.ac], ['Init', signed(d.initiative)], ['Speed', `${d.speed} ft`]].map(([k, v]) => (
          <div key={k} style={{ textAlign: 'center', padding: '6px 4px', background: 'var(--surface2)', borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 9, color: 'var(--text-3)', textTransform: 'uppercase' }}>{k}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{v}</div>
          </div>
        ))}
      </div>

      {Object.keys(slots).length > 0 && (
        <>
          <div style={label}>Spell slots (mana)</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {Object.entries(slots).map(([lvl, total]) => (
              <span key={lvl} style={{ fontSize: 12, padding: '3px 8px', borderRadius: 6, background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text-2)' }}>
                L{lvl} <strong style={{ color: 'var(--text)' }}>{Math.max(0, total - (used[lvl] || 0))}</strong>/{total}
              </span>
            ))}
          </div>
        </>
      )}

      <div style={label}>Abilities</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
        {ABILITIES.map(([id, abbr]) => (
          <RuleTip key={id} tip={abilityTip(srd.core, id)} as="div" style={{ textAlign: 'center', padding: '6px 2px', background: 'var(--surface2)', borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 9, color: 'var(--text-3)' }}>{abbr}{id === 'dex' ? ' · agility' : ''}</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{char.stats?.[id] ?? 10}</div>
            <div style={{ fontSize: 11, color: 'var(--gold)' }}>{signed(d.mod(id))}</div>
          </RuleTip>
        ))}
      </div>

      {(char.combat?.conditions || []).length > 0 && (
        <>
          <div style={label}>Conditions</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {char.combat.conditions.map(c => (
              <RuleTip key={c} tip={conditionTip(srd.core, c)} style={{ fontSize: 12, padding: '2px 8px', borderRadius: 6, background: 'var(--surface2)', color: 'var(--red)', border: '1px solid var(--border)' }}>{c}</RuleTip>
            ))}
          </div>
        </>
      )}

      <div style={label}>Equipped</div>
      {equipped.length ? equipped.map(i => (
        <div key={i.id} style={{ fontSize: 13, padding: '3px 0' }}><RuleTip tip={equipTip(i.def)} style={{ color: 'var(--text)', borderBottom: '1px dotted var(--text-3)' }}>{itemName(i)}</RuleTip></div>
      )) : <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Nothing equipped</div>}

      <div style={label}>Items</div>
      {carried.length ? carried.map(i => (
        <div key={i.id} style={{ fontSize: 13, padding: '3px 0', color: 'var(--text-2)' }}>
          <RuleTip tip={equipTip(i.def)} style={{ borderBottom: '1px dotted var(--text-3)' }}>{itemName(i)}</RuleTip>{i.qty > 1 ? ` ×${i.qty}` : ''}
        </div>
      )) : <div style={{ fontSize: 12, color: 'var(--text-3)' }}>No other items</div>}

      {spellIds.length > 0 && (
        <>
          <div style={label}>Spells</div>
          {spellIds.map(id => spellsById[id] && (
            <div key={id} style={{ fontSize: 13, padding: '3px 0', color: 'var(--text-2)' }}>
              <RuleTip tip={spellTip(spellsById[id])} style={{ borderBottom: '1px dotted var(--text-3)' }}>{spellsById[id].name}</RuleTip>
              <span style={{ fontSize: 10, color: 'var(--text-3)', marginLeft: 6 }}>{spellsById[id].level ? `L${spellsById[id].level}` : 'cantrip'}</span>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
