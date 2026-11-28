import { useDebouncedSave } from '../hooks/useDebouncedSave'
import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '../context/AuthContext'
import { useAuth } from '../context/AuthContext'
import { useCampaign } from '../context/CampaignContext'
import { useToast } from '../hooks/useToast'
import { SkeletonInventoryContent } from '../components/Skeleton'
import { backdropClose } from '../utils/backdrop'

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
        <textarea className="input" rows={6} placeholder="Description, properties..." value={form.notes} onChange={set('notes')} style={{ resize: 'vertical', lineHeight: 1.6, fontFamily: 'inherit' }} />
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
export function InventoryPanel({ toast, isDM = false, char = null, onCurrency = null }) {
  const { activeCampaign } = useCampaign()
  const [inv, setInv] = useState(DEFAULT_INV)
  const [loaded, setLoaded] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [addingItem, setAddingItem] = useState(false)
  const [newItemForm, setNewItemForm] = useState(newItem())
  const [editingCurrency, setEditingCurrency] = useState(false)
  const [currencyDraft, setCurrencyDraft] = useState({ pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 })
  const [viewingItem, setViewingItem] = useState(null)
  const [coinEdit, setCoinEdit] = useState(null) // { key, value } while a coin's number is being typed
  const [ownChar, setOwnChar] = useState(null)   // the character whose coins are shown when the page is used on its own
  const { schedule: scheduleSave, flush: flushSave } = useDebouncedSave(600)

  const load = useCallback(async () => {
    if (!activeCampaign) return
    try { setInv(await api(`/inventory/${activeCampaign._id}`)) } catch { setInv(DEFAULT_INV) }
    if (!isDM && !char) {
      try {
        const list = await api(`/campaigns/${activeCampaign._id}/characters`)
        let remembered = null
        try { remembered = localStorage.getItem(`lastChar:${activeCampaign._id}`) } catch { /* ignore */ }
        setOwnChar(list.find(c => c._id === remembered) || list.find(c => c.isPrimary) || list[0] || null)
      } catch { setOwnChar(null) }
    }
    setLoaded(true)
  }, [activeCampaign, isDM, !!char]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { setLoaded(false); load() }, [load])

  useEffect(() => flushSave, [activeCampaign?._id, flushSave])

  const persist = useCallback((next) => {
    const campaignId = activeCampaign._id
    scheduleSave(async () => {
      try { await api(`/inventory/${campaignId}`, { method: 'PUT', body: { currency: next.currency, items: next.items } }) }
      catch { toast('Could not save') }
    })
  }, [activeCampaign, scheduleSave])

  // A player's coins live on their character sheet (so the D&D Beyond import, the Gear tab and the printed sheet all agree).
  // Only when there is no character yet do the coins fall back to this campaign's inventory.
  const boundChar = char || ownChar
  const coins = { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0, ...(boundChar ? boundChar.currency : inv.currency) }
  const setCoins = (nextCoins) => {
    if (!boundChar) { const next = { ...inv, currency: nextCoins }; setInv(next); persist(next); return }
    if (onCurrency) { onCurrency(nextCoins); return }
    setOwnChar(c => ({ ...c, currency: nextCoins }))
    const campaignId = activeCampaign._id, charId = boundChar._id
    scheduleSave(async () => {
      try { await api(`/campaigns/${campaignId}/characters/${charId}`, { method: 'PUT', body: { currency: nextCoins } }) }
      catch { toast('Could not save') }
    })
  }

  // Coins written in the old per-campaign inventory move onto the character once, so nothing is lost.
  useEffect(() => {
    if (!loaded || isDM || !boundChar) return
    const had = Object.values(inv.currency || {}).some(n => n > 0)
    const has = Object.values(boundChar.currency || {}).some(n => n > 0)
    if (had && !has) {
      setCoins({ pp: 0, gp: 0, ep: 0, sp: 0, cp: 0, ...inv.currency })
      const next = { ...inv, currency: { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 } }
      setInv(next); persist(next)
    }
  }, [loaded, boundChar?._id]) // eslint-disable-line react-hooks/exhaustive-deps

  const adjustCurrency = (key, delta) => setCoins({ ...coins, [key]: Math.max(0, (coins[key] || 0) + delta) })

  const saveCurrency = () => {
    setCoins({ ...currencyDraft }); setEditingCurrency(false); toast('Currency updated')
  }

  const commitCoin = () => {
    if (!coinEdit) return
    const n = Math.max(0, parseInt(coinEdit.value, 10) || 0)
    setCoinEdit(null)
    if (n !== (coins[coinEdit.key] || 0)) setCoins({ ...coins, [coinEdit.key]: n })
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
            <button className="btn btn-ghost btn-sm" onClick={() => { setCurrencyDraft({ ...coins }); setEditingCurrency(true) }}>Edit all</button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {CURRENCY.map(c => (
              <div key={c.key} style={{ flex: '1 1 100px', minWidth: 88, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 5, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: c.color, flexShrink: 0, border: '1px solid rgba(0,0,0,0.15)' }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{c.label}</span>
                </div>
                {c.sub && <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 6, paddingLeft: 16 }}>{c.sub}</div>}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 16 }}>
                  <button onClick={() => adjustCurrency(c.key, -1)} style={{ width: 20, height: 20, borderRadius: 4, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-2)', fontSize: 13, fontWeight: 700, cursor: 'pointer', lineHeight: 1, padding: 0 }}>−</button>
                  {coinEdit?.key === c.key ? (
                    <input autoFocus type="number" min={0} className="input" aria-label={`${c.label} coins`} value={coinEdit.value}
                      onFocus={e => e.target.select()}
                      onChange={e => setCoinEdit({ key: c.key, value: e.target.value })}
                      onBlur={commitCoin}
                      onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') setCoinEdit(null) }}
                      style={{ width: 62, textAlign: 'center', padding: '2px 4px', fontSize: 15, fontFamily: 'var(--font-title)', fontWeight: 700 }} />
                  ) : (
                    <button type="button" onClick={() => setCoinEdit({ key: c.key, value: String(coins[c.key] || 0) })} title="Click to type a new amount"
                      style={{ fontFamily: 'var(--font-title)', fontSize: 18, fontWeight: 700, color: c.key === 'gp' ? 'var(--gold)' : 'var(--text)', minWidth: 32, textAlign: 'center', background: 'none', border: 'none', borderBottom: '1px dotted var(--text-3)', padding: 0, cursor: 'text' }}>{(coins[c.key] || 0).toLocaleString()}</button>
                  )}
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
            <div style={{ minWidth: 0, cursor: 'pointer' }} role="button" tabIndex={0} title="Click to read" onClick={() => setViewingItem(item)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setViewingItem(item) } }}>
              <div style={{ fontSize: 13, fontWeight: item.equipped ? 600 : 400, color: item.equipped ? 'var(--text)' : 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
              {item.notes && <div title={item.notes} style={{ fontSize: 11, color: 'var(--text-3)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', marginTop: 1, lineHeight: 1.4 }}>{item.notes}</div>}
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

      {/* ── Read item window: the whole description, laid out in paragraphs ── */}
      {viewingItem && (() => {
        const item = inv.items.find(x => x.id === viewingItem.id) || viewingItem
        const paras = (item.notes || '').split(/\n\s*\n/).map(t => t.trim()).filter(Boolean)
        const facts = [item.qty > 1 ? `Quantity ${item.qty}` : '', item.value ? `Value ${item.value}` : '', item.weight ? `${item.weight} lb` : '', item.equipped ? 'Equipped' : ''].filter(Boolean)
        return (
          <div role="dialog" aria-modal="true" aria-label={item.name} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} {...backdropClose(() => setViewingItem(null))}>
            <div className="card" style={{ width: '100%', maxWidth: 560, maxHeight: 'calc(100vh - 40px)', display: 'flex', flexDirection: 'column', padding: 0 }} onClick={e => e.stopPropagation()}>
              <div style={{ padding: '20px 24px 10px' }}>
                <div style={{ fontFamily: 'var(--font-title)', fontSize: 20, color: 'var(--gold)', lineHeight: 1.25 }}>{item.name}</div>
                {facts.length > 0 && <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>{facts.join('  ·  ')}</div>}
              </div>
              <div style={{ padding: '4px 24px 16px', overflowY: 'auto', fontSize: 15, lineHeight: 1.75, color: 'var(--text)', fontFamily: 'Georgia, serif' }}>
                {paras.length ? paras.map((t, i) => <p key={i} style={{ margin: '0 0 12px', whiteSpace: 'pre-wrap' }}>{t}</p>) : <p style={{ margin: 0, color: 'var(--text-3)', fontFamily: 'inherit' }}>No description yet. Use Edit to add one.</p>}
              </div>
              <div style={{ display: 'flex', gap: 8, padding: '12px 24px 20px', borderTop: '1px solid var(--border)' }}>
                <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => { setEditingItem({ ...item }); setViewingItem(null) }}>Edit</button>
                <button className="btn btn-ghost" onClick={() => setViewingItem(null)}>Close</button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── Add item modal ── */}
      {addingItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} {...backdropClose(() => setAddingItem(false))}>
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} {...backdropClose(() => setEditingItem(null))}>
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} {...backdropClose(() => setEditingCurrency(false))}>
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
