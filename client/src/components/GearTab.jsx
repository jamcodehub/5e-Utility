import { useMemo, useState } from 'react'
import { armorClass } from '../utils/rules5e'
import { COINS, itemWeight } from '../utils/sheet'

const label = { fontSize: 10, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }
const CATS = [['all', 'All'], ['weapon', 'Weapons'], ['armor', 'Armor'], ['adventuring-gear', 'Gear'], ['tools', 'Tools'], ['mounts-and-vehicles', 'Mounts']]
const fmtLb = (n) => `${Math.round(n * 10) / 10} lb`

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

function Coin({ k, name, value, onSave }) {
  const [v, setV] = useState(String(value || 0))
  return (
    <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase' }}>
      {k}
      <input className="input" type="number" min="0" title={name} style={{ width: 70, textAlign: 'center', padding: '4px' }} value={v}
        onChange={e => setV(e.target.value)} onBlur={() => onSave(Math.max(0, parseInt(v, 10) || 0))} />
    </label>
  )
}

export default function GearTab({ char, srd, d, onPatch }) {
  const [cat, setCat] = useState('all')
  const [q, setQ] = useState('')
  const [custom, setCustom] = useState({ name: '', weight: '', qty: 1, note: '' })
  const equipment = char.srd?.equipment || []
  const attuned = equipment.filter(e => e.attuned).length

  const catalog = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return srd.equipment
      .filter(e => (cat === 'all' || e.category === cat) && (!needle || e.name.toLowerCase().includes(needle)))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [srd.equipment, cat, q])

  // Saves the inventory and keeps Armor Class in step when armor or a shield changes.
  const save = (next, touchesArmor) => {
    const patch = { srd: { ...(char.srd || {}), equipment: next } }
    if (touchesArmor) {
      const worn = next.filter(e => e.equipped).map(e => d.equipById[e.id]).filter(Boolean)
      patch.ac = armorClass({
        stats: char.stats || {}, classId: d.cls?.id,
        armor: worn.find(w => w.category === 'armor' && w.armorCategory !== 'Shield'),
        shield: worn.find(w => w.armorCategory === 'Shield'),
      })
    }
    onPatch(patch)
  }
  const isArmor = (e) => d.equipById[e.id]?.category === 'armor'

  const add = (def) => {
    const i = equipment.findIndex(e => e.id === def.id && !e.custom)
    save(i >= 0 ? equipment.map((e, n) => (n === i ? { ...e, qty: (e.qty || 1) + 1 } : e)) : [...equipment, { id: def.id, qty: 1 }])
  }
  const addCustom = () => {
    if (!custom.name.trim()) return
    save([...equipment, { id: `custom-${Date.now()}`, custom: true, name: custom.name.trim(), weight: Number(custom.weight) || 0, qty: Math.max(1, Number(custom.qty) || 1), note: custom.note.trim() }])
    setCustom({ name: '', weight: '', qty: 1, note: '' })
  }
  const setQty = (i, qty) => save(qty < 1 ? equipment.filter((_, n) => n !== i) : equipment.map((e, n) => (n === i ? { ...e, qty } : e)), qty < 1 && isArmor(equipment[i]))
  const toggleEquip = (i) => {
    const target = equipment[i]
    const def = d.equipById[target.id]
    const on = !target.equipped
    const sameSlot = (e) => {
      const o = d.equipById[e.id]
      return def?.category === 'armor' && o?.category === 'armor' && (def.armorCategory === 'Shield') === (o.armorCategory === 'Shield')
    }
    save(equipment.map((e, n) => (n === i ? { ...e, equipped: on } : on && sameSlot(e) ? { ...e, equipped: false } : e)), def?.category === 'armor')
  }
  const toggleAttune = (i) => {
    if (!equipment[i].attuned && attuned >= 3) return
    save(equipment.map((e, n) => (n === i ? { ...e, attuned: !e.attuned } : e)))
  }

  const rows = d.items.map((it, i) => ({ it, i })).sort((a, b) => Number(!!b.it.equipped) - Number(!!a.it.equipped))
  const enc = { none: ['var(--green)', 'Unencumbered'], encumbered: ['var(--gold)', 'Encumbered (speed −10 ft)'], heavy: ['var(--red)', 'Heavily encumbered (speed −20 ft, disadvantage on STR/DEX/CON checks, attacks and saves)'] }[d.encumbrance]
  const acMismatch = (char.ac ?? 10) !== d.ac

  return (
    <>
      <Panel title="Armor class & load">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 26, fontFamily: 'var(--font-title)', color: 'var(--gold)' }}>{d.ac}</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Calculated AC{d.armor ? ` · ${d.armor.name}` : d.cls?.id === 'barbarian' || d.cls?.id === 'monk' ? ' · Unarmored Defense' : ' · no armor'}{d.shield ? ' + shield' : ''}</div>
            {acMismatch && <button className="btn btn-ghost btn-sm" style={{ marginTop: 6 }} onClick={() => onPatch({ ac: d.ac })}>Set sheet AC to {d.ac} (now {char.ac ?? 10})</button>}
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontSize: 13 }}>{fmtLb(d.weight)} carried <span style={{ color: 'var(--text-3)' }}>of {d.capacity} lb capacity</span></div>
            <div style={{ height: 6, background: 'var(--surface2)', borderRadius: 3, margin: '6px 0', overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, (d.weight / d.capacity) * 100)}%`, height: '100%', background: enc[0] }} />
            </div>
            <div style={{ fontSize: 11, color: enc[0] }}>{enc[1]}</div>
            <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 4 }}>Variant encumbrance (SRD): encumbered above {(char.stats?.str || 10) * 5} lb, heavily above {(char.stats?.str || 10) * 10} lb. Capacity is Strength × 15.</div>
          </div>
        </div>
      </Panel>

      <Panel title="Coin" right={<span style={{ fontSize: 11, color: 'var(--text-3)' }}>50 coins = 1 lb</span>}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {COINS.map(([k, name]) => <Coin key={`${k}-${char.currency?.[k] || 0}`} k={k} name={name} value={char.currency?.[k]} onSave={n => onPatch({ currency: { ...(char.currency || {}), [k]: n } })} />)}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 6 }}>1 pp = 10 gp · 1 gp = 2 ep = 10 sp = 100 cp</div>
      </Panel>

      <Panel title={`Inventory (${equipment.length})`} right={attuned > 0 || equipment.some(e => e.custom) ? <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Attuned {attuned}/3</span> : null}>
        {!rows.length && <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Nothing yet. Add items below.</div>}
        {rows.map(({ it, i }) => {
          const def = it.def
          const wearable = def?.category === 'armor'
          const detail = it.custom ? it.note
            : wearable ? `${def.armorCategory === 'Shield' ? '+2 AC' : `AC ${def.ac.base}${def.ac.dexBonus ? ` + Dex${def.ac.maxDex != null ? ` (max ${def.ac.maxDex})` : ''}` : ''}`}${def.strMin ? ` · Str ${def.strMin}` : ''}${def.stealthDisadvantage ? ' · Stealth disadv.' : ''}`
            : def?.category === 'weapon' ? `${def.damage?.dice || ''} ${def.damage?.type || ''}${def.properties?.length ? ` · ${def.properties.join(', ')}` : ''}` : ''
          return (
            <div key={`${it.id}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ fontSize: 13 }}>{it.custom ? it.name : def?.name || it.id}{it.equipped && <span style={{ fontSize: 10, color: 'var(--gold)', marginLeft: 8 }}>EQUIPPED</span>}</div>
                {detail && <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{detail}</div>}
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-3)', width: 56, textAlign: 'right' }}>{fmtLb(itemWeight(it))}</span>
              {(wearable || def?.category === 'weapon') && <button className={`btn btn-sm ${it.equipped ? 'btn-primary' : 'btn-ghost'}`} onClick={() => toggleEquip(i)}>{it.equipped ? 'Unequip' : 'Equip'}</button>}
              {it.custom && <label style={{ fontSize: 11, color: 'var(--text-3)', display: 'flex', gap: 4, alignItems: 'center' }}><input type="checkbox" checked={!!it.attuned} onChange={() => toggleAttune(i)} />Attuned</label>}
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setQty(i, (it.qty || 1) - 1)} title="Remove one">−</button>
                <span style={{ minWidth: 22, textAlign: 'center', fontSize: 13 }}>{it.qty || 1}</span>
                <button className="btn btn-ghost btn-sm" onClick={() => setQty(i, (it.qty || 1) + 1)}>+</button>
              </span>
            </div>
          )
        })}
      </Panel>

      <Panel title="Add items">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {CATS.map(([id, name]) => <button key={id} className={`btn btn-sm ${cat === id ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setCat(id)}>{name}</button>)}
          <input className="input" style={{ flex: 1, minWidth: 140, fontSize: 13 }} placeholder="Search equipment…" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <div style={{ maxHeight: 240, overflowY: 'auto' }}>
          {catalog.map(e => (
            <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
              <span>{e.name} <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{e.cost} · {e.weight ?? 0} lb</span></span>
              <button className="btn btn-ghost btn-sm" onClick={() => add(e)}>Add</button>
            </div>
          ))}
          {!catalog.length && <div style={{ fontSize: 12, color: 'var(--text-3)' }}>No matches.</div>}
        </div>
        <div style={{ ...label, marginTop: 14 }}>Custom item (homebrew or magic item from your DM)</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <input className="input" style={{ flex: 2, minWidth: 140, fontSize: 13 }} placeholder="Name" value={custom.name} onChange={e => setCustom(c => ({ ...c, name: e.target.value }))} />
          <input className="input" type="number" min="0" style={{ width: 80, fontSize: 13 }} placeholder="lb" value={custom.weight} onChange={e => setCustom(c => ({ ...c, weight: e.target.value }))} />
          <input className="input" type="number" min="1" style={{ width: 70, fontSize: 13 }} placeholder="Qty" value={custom.qty} onChange={e => setCustom(c => ({ ...c, qty: e.target.value }))} />
          <input className="input" style={{ flex: 3, minWidth: 160, fontSize: 13 }} placeholder="Notes" value={custom.note} onChange={e => setCustom(c => ({ ...c, note: e.target.value }))} />
          <button className="btn btn-primary btn-sm" onClick={addCustom}>Add</button>
        </div>
      </Panel>
    </>
  )
}
