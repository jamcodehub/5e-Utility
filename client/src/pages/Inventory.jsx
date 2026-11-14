import { useDebouncedSave } from '../hooks/useDebouncedSave'
import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '../context/AuthContext'
import { useAuth } from '../context/AuthContext'
import { useCampaign } from '../context/CampaignContext'
import { useToast } from '../hooks/useToast'
import { SkeletonInventoryContent } from '../components/Skeleton'

const CURRENCY = [
  { key: 'pp', label: 'Platinum',  abbr: 'pp', sub: '1 pp = 10 gp',   color: '#b0cce0' },
  { key: 'gp', label: 'Gold',      abbr: 'gp', sub: null,              color: '#c9a227' },
  { key: 'ep', label: 'Electrum',  abbr: 'ep', sub: '1 gp = 2 ep',    color: '#8ec6c5' },
  { key: 'sp', label: 'Silver',    abbr: 'sp', sub: '1 gp = 10 sp',   color: '#aaaaaa' },
  { key: 'cp', label: 'Copper',    abbr: 'cp', sub: '1 gp = 100 cp',  color: '#b87333' },
]

const DEFAULT_INV = { currency: { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 }, items: [] }
const newItem = () => ({ id: Math.random().toString(36).slice(2), name: '', qty: 1, weight: '', value: '', notes: '', equipped: false })

function ItemForm({ form, setForm }) {
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div>
        <label style={{ display: 'block', fontSize: 12, color: 'var(--text-2)', marginBottom: 4 }}>Name *</label>
        <input className="input" placeholder="e.g. Longsword +1" value={form.name} onChange={set('name')} autoFocus />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: 12, color: 'var(--text-2)', marginBottom: 4 }}>Qty</label>
          <input className="input" type="number" min={1} value={form.qty} onChange={e => setForm(p => ({ ...p, qty: Math.max(1, parseInt(e.target.value) || 1) }))} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: 12, color: 'var(--text-2)', marginBottom: 4 }}>Weight (lb)</label>
          <input className="input" type="number" min={0} step={0.1} placeholder="0" value={form.weight} onChange={set('weight')} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: 12, color: 'var(--text-2)', marginBottom: 4 }}>Value</label>
          <input className="input" placeholder="e.g. 15 gp" value={form.value} onChange={set('value')} />
        </div>
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 12, color: 'var(--text-2)', marginBottom: 4 }}>Notes</label>
        <input className="input" placeholder="Description, properties..." value={form.notes} onChange={set('notes')} />
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text-2)' }}>
        <input type="checkbox" checked={form.equipped} onChange={e => setForm(p => ({ ...p, equipped: e.target.checked }))} />
        Equipped
      </label>
    </div>
  )
}

// ── Shared party inventory (currency + items), shared by the standalone
// Inventory/ShopItems page and the Character sheet's "Inventory" tab ──
export function InventoryPanel({ toast, isDM = false }) {
  const { activeCampaign } = useCampaign()
  const [inv, setInv] = useState(DEFAULT_INV)
  const [loaded, setLoaded] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [addingItem, setAddingItem] = useState(false)
  const [newItemForm, setNewItemForm] = useState(newItem())
  const [editingCurrency, setEditingCurrency] = useState(false)
  const [currencyDraft, setCurrencyDraft] = useState({ pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 })
  const { schedule: scheduleSave, flush: flushSave } = useDebouncedSave(600)

  const load = useCallback(async () => {
    if (!activeCampaign) return
    try { setInv(await api(`/inventory/${activeCampaign._id}`)) } catch { setInv(DEFAULT_INV) }
    setLoaded(true)
  }, [activeCampaign])

  useEffect(() => { setLoaded(false); load() }, [load])

  useEffect(() => flushSave, [activeCampaign?._id, flushSave])

  const persist = useCallback((next) => {
    const campaignId = activeCampaign._id
    scheduleSave(async () => {
      try { await api(`/inventory/${campaignId}`, { method: 'PUT', body: { currency: next.currency, items: next.items } }) }
      catch { toast('Could not save') }
    })
  }, [activeCampaign, scheduleSave])

  const adjustCurrency = (key, delta) => {
    const next = { ...inv, currency: { ...inv.currency, [key]: Math.max(0, (inv.currency[key] || 0) + delta) } }
    setInv(next); persist(next)
  }

  const saveCurrency = () => {
    const next = { ...inv, currency: { ...currencyDraft } }
    setInv(next); persist(next); setEditingCurrency(false); toast('Currency updated')
  }

  const addItem = () => {
    if (!newItemForm.name.trim()) return
    const next = { ...inv, items: [...inv.items, { ...newItemForm, id: Math.random().toString(36).slice(2) }] }
    setInv(next); persist(next); setNewItemForm(newItem()); setAddingItem(false); toast('Item added')
  }

  const saveItemEdit = () => {
    if (!editingItem) return
    const next = { ...inv, items: inv.items.map(x => x.id === editingItem.id ? editingItem : x) }
    setInv(next); persist(next); setEditingItem(null); toast('Item saved')
  }

  const removeItem = (id) => {
    const next = { ...inv, items: inv.items.filter(x => x.id !== id) }
    setInv(next); persist(next)
  }

  const toggleEquipped = (id) => {
    const next = { ...inv, items: inv.items.map(x => x.id === id ? { ...x, equipped: !x.equipped } : x) }
    setInv(next); persist(next)
  }

  const totalWeight = inv.items.reduce((s, i) => s + (parseFloat(i.weight) || 0) * (i.qty || 1), 0)

  if (!activeCampaign) return <div style={{ color: 'var(--text-3)', fontSize: 13 }}>Select a campaign.</div>
  if (!loaded) return <SkeletonInventoryContent />

  return (
    <>
      {/* ── Currency ── (players only — DMs manage the world, not personal gold) */}
      {!isDM && (
        <div className="card" style={{ padding: '16px 20px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontFamily: 'var(--font-title)', fontSize: 14, fontWeight: 600, color: 'var(--gold)' }}>My Currency</div>
            <button className="btn btn-ghost btn-sm" onClick={() => { setCurrencyDraft({ ...inv.currency }); setEditingCurrency(true) }}>Edit all</button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {CURRENCY.map(c => (
              <div key={c.key} style={{ flex: '1 1 100px', minWidth: 88, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: c.color, flexShrink: 0, border: '1px solid rgba(0,0,0,0.15)' }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{c.label}</span>
                </div>
                {c.sub && <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 6, paddingLeft: 16 }}>{c.sub}</div>}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 16 }}>
                  <button onClick={() => adjustCurrency(c.key, -1)} style={{ width: 20, height: 20, borderRadius: 4, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-2)', fontSize: 13, fontWeight: 700, cursor: 'pointer', lineHeight: 1, padding: 0 }}>−</button>
                  <span style={{ fontFamily: 'var(--font-title)', fontSize: 18, fontWeight: 700, color: c.key === 'gp' ? 'var(--gold)' : 'var(--text)', minWidth: 32, textAlign: 'center' }}>{(inv.currency[c.key] || 0).toLocaleString()}</span>
                  <button onClick={() => adjustCurrency(c.key, 1)} style={{ width: 20, height: 20, borderRadius: 4, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-2)', fontSize: 13, fontWeight: 700, cursor: 'pointer', lineHeight: 1, padding: 0 }}>+</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Items ── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: 'var(--font-title)', fontSize: 14, fontWeight: 600, color: 'var(--gold)' }}>
            Items
            {totalWeight > 0 && <span style={{ fontFamily: 'inherit', fontSize: 11, fontWeight: 400, color: 'var(--text-3)', marginLeft: 10 }}>{totalWeight.toFixed(1)} lb total</span>}
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => { setNewItemForm(newItem()); setAddingItem(true) }}>+ Add item</button>
        </div>

        {inv.items.length === 0 && (
          <div style={{ padding: '24px 16px', color: 'var(--text-3)', fontSize: 13, textAlign: 'center' }}>No items yet. Click <strong>+ Add item</strong> to get started.</div>
        )}

        {inv.items.map((item, i) => (
          <div key={item.id} style={{
            display: 'grid', gridTemplateColumns: '24px 1fr auto auto auto',
            alignItems: 'center', gap: 8, padding: '9px 14px',
            borderBottom: i < inv.items.length - 1 ? '1px solid var(--border)' : 'none',
            background: item.equipped ? 'var(--gold-bg)' : 'transparent',
          }}>
            <button onClick={() => toggleEquipped(item.id)} title={item.equipped ? 'Unequip' : 'Equip'} style={{ width: 16, height: 16, borderRadius: 4, cursor: 'pointer', padding: 0, background: item.equipped ? 'var(--gold)' : 'transparent', border: `2px solid ${item.equipped ? 'var(--gold)' : 'var(--border-strong)'}`, transition: 'all .15s', flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: item.equipped ? 600 : 400, color: item.equipped ? 'var(--text)' : 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
              {item.notes && <div style={{ fontSize: 11, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>{item.notes}</div>}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{item.value || ''}</div>
            <div style={{ fontSize: 12, fontFamily: 'var(--font-title)', color: 'var(--text-2)', minWidth: 24, textAlign: 'center' }}>×{item.qty || 1}</div>
            <div style={{ display: 'flex', gap: 2 }}>
              <button onClick={() => setEditingItem({ ...item })} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 13, padding: '2px 4px' }}>✎</button>
              <button onClick={() => removeItem(item.id)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 13, padding: '2px 4px' }}>✕</button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Add item modal ── */}
      {addingItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setAddingItem(false)}>
          <div className="card" style={{ width: '100%', maxWidth: 440, padding: 24 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily: 'var(--font-title)', fontSize: 16, fontWeight: 600, color: 'var(--gold)', marginBottom: 16 }}>Add Item</div>
            <ItemForm form={newItemForm} setForm={setNewItemForm} />
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={addItem}>Add</button>
              <button className="btn btn-ghost" onClick={() => setAddingItem(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit item modal ── */}
      {editingItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setEditingItem(null)}>
          <div className="card" style={{ width: '100%', maxWidth: 440, padding: 24 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily: 'var(--font-title)', fontSize: 16, fontWeight: 600, color: 'var(--gold)', marginBottom: 16 }}>Edit Item</div>
            <ItemForm form={editingItem} setForm={setEditingItem} />
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={saveItemEdit}>Save</button>
              <button className="btn btn-ghost" onClick={() => setEditingItem(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Currency edit modal ── */}
      {editingCurrency && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setEditingCurrency(false)}>
          <div className="card" style={{ width: '100%', maxWidth: 360, padding: 24 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily: 'var(--font-title)', fontSize: 16, fontWeight: 600, color: 'var(--gold)', marginBottom: 16 }}>Edit Currency</div>
            {CURRENCY.map(c => (
              <div key={c.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: c.color, border: '1px solid rgba(0,0,0,0.15)' }} />
                  <label style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}>{c.label} ({c.abbr})</label>
                </div>
                <input type="number" min={0} className="input" style={{ width: 90, textAlign: 'right', padding: '5px 8px' }} value={currencyDraft[c.key]} onChange={e => setCurrencyDraft(p => ({ ...p, [c.key]: Math.max(0, parseInt(e.target.value) || 0) }))} />
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={saveCurrency}>Save</button>
              <button className="btn btn-ghost" onClick={() => setEditingCurrency(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default function Inventory() {
  const { user } = useAuth()
  const isDM = user?.role === 'dm'
  const { toast, ToastContainer } = useToast()
  return (
    <div className="page-content">
      <div className="page-header-row" style={{ marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, marginBottom: 4 }}>{isDM ? 'Shop Items' : 'Inventory'}</h2>
        </div>
      </div>
      <InventoryPanel toast={toast} isDM={isDM} />
      <ToastContainer />
    </div>
  )
}
