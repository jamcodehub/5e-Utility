import { useState, useEffect, useCallback } from 'react'
import { api } from '../context/AuthContext'
import { useCampaign } from '../context/CampaignContext'
import { useToast } from '../hooks/useToast'

const TAGS = ['npc', 'location', 'item', 'faction', 'event']

export default function Lore() {
  const { activeCampaign } = useCampaign()
  const { toast, ToastContainer } = useToast()
  const [lore, setLore] = useState([])
  const [filter, setFilter] = useState('all')
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ title: '', tag: 'npc', content: '' })
  const [editing, setEditing] = useState(null)

  const load = useCallback(async () => {
    if (!activeCampaign) return
    setLore(await api(`/lore/${activeCampaign._id}`))
  }, [activeCampaign])

  useEffect(() => { load() }, [load])

  const save = async () => {
    if (!form.title.trim()) return
    try {
      if (editing) {
        const updated = await api(`/lore/${editing}`, { method: 'PUT', body: form })
        setLore(p => p.map(l => l._id === editing ? updated : l))
        toast('Entry updated')
      } else {
        const entry = await api(`/lore/${activeCampaign._id}`, { method: 'POST', body: form })
        setLore(p => [entry, ...p])
        toast('Entry added')
      }
      setAdding(false); setEditing(null); setForm({ title: '', tag: 'npc', content: '' })
    } catch { toast('Failed to save') }
  }

  const del = async (id) => {
    await api(`/lore/${id}`, { method: 'DELETE' })
    setLore(p => p.filter(l => l._id !== id))
    toast('Deleted')
  }

  const startEdit = (l) => { setEditing(l._id); setForm({ title: l.title, tag: l.tag, content: l.content }); setAdding(true) }

  const filtered = filter === 'all' ? lore : lore.filter(l => l.tag === filter)

  if (!activeCampaign) return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}>Select a campaign.</div>

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, flex: 1 }}>Info & Lore</h2>
        <div style={{ display: 'flex', gap: 4 }}>
          {['all', ...TAGS].map(t => (
            <button key={t} onClick={() => setFilter(t)} className={`btn btn-sm ${filter === t ? 'btn-primary' : 'btn-ghost'}`}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <button className="btn btn-gold btn-sm" onClick={() => { setAdding(true); setEditing(null); setForm({ title: '', tag: 'npc', content: '' }) }}>+ Add entry</button>
      </div>

      {adding && (
        <div className="card" style={{ padding: 18, marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            <input className="input" placeholder="Title" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} style={{ flex: 1 }} />
            <select className="input" style={{ width: 130 }} value={form.tag} onChange={e => setForm(p => ({ ...p, tag: e.target.value }))}>
              {TAGS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
          <textarea className="input" rows={3} placeholder="Description..." value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} style={{ resize: 'vertical', marginBottom: 10 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary btn-sm" onClick={save}>Save</button>
            <button className="btn btn-ghost btn-sm" onClick={() => { setAdding(false); setEditing(null) }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
        {filtered.map(l => (
          <div key={l._id} className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Cinzel, serif', fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{l.title}</div>
                <span className={`tag tag-${l.tag}`}>{l.tag}</span>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => startEdit(l)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 14 }}>✎</button>
                <button onClick={() => del(l._id)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 14 }}>✕</button>
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>{l.content}</div>
          </div>
        ))}
        {!filtered.length && (
          <div style={{ gridColumn: '1/-1', color: 'var(--text-3)', textAlign: 'center', padding: 40, fontSize: 13 }}>
            No {filter === 'all' ? 'lore entries' : filter + 's'} yet.
          </div>
        )}
      </div>
      <ToastContainer />
    </div>
  )
}
