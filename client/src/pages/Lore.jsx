import { useState, useEffect, useCallback } from 'react'
import { api } from '../context/AuthContext'
import { useCampaign } from '../context/CampaignContext'
import { useToast } from '../hooks/useToast'
import { SkeletonBlock } from '../components/Skeleton'

const TAGS = ['npc', 'location', 'item', 'faction', 'event', 'enemy', 'boss']
const HP_TAGS = ['npc', 'enemy', 'boss'] // these get HP fields

const TAG_COLORS = {
  npc:      { bg: '#eff6ff', color: '#1d4ed8' },
  location: { bg: '#f0fdf4', color: '#166534' },
  item:     { bg: '#fdf4ff', color: '#7e22ce' },
  faction:  { bg: '#fff7ed', color: '#c2410c' },
  event:    { bg: '#fef9c3', color: '#854d0e' },
  enemy:    { bg: '#fef2f2', color: '#991b1b' },
  boss:     { bg: '#1a0a00', color: '#f59e0b' },
}

function TagBadge({ tag }) {
  const s = TAG_COLORS[tag] || { bg: 'var(--surface2)', color: 'var(--text-2)' }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: s.bg, color: s.color }}>
      {tag}
    </span>
  )
}

export default function Lore() {
  const { activeCampaign, campaignsLoading, campaignsError, reload: reloadCampaigns } = useCampaign()
  const { toast, ToastContainer } = useToast()
  const [lore, setLore] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [filter, setFilter] = useState('all')
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ title: '', tag: 'npc', content: '', hp: '', maxHp: '' })
  const [editing, setEditing] = useState(null)

  const load = useCallback(async () => {
    if (!activeCampaign) {
      setLoading(false)
      return
    }
    setLoading(true)
    setLoadError('')
    try {
      setLore(await api(`/lore/${activeCampaign._id}`))
    } catch (err) {
      setLoadError(err.message || 'Failed to load lore')
    } finally {
      setLoading(false)
    }
  }, [activeCampaign])

  useEffect(() => { load() }, [load])

  const save = async () => {
    if (!form.title.trim()) return
    try {
      const body = { title: form.title, tag: form.tag, content: form.content }
      if (HP_TAGS.includes(form.tag) && form.maxHp) {
        body.maxHp = parseInt(form.maxHp) || 0
        body.hp    = parseInt(form.hp) || body.maxHp
      }
      if (editing) {
        const updated = await api(`/lore/${editing}`, { method: 'PUT', body })
        setLore(p => p.map(l => l._id === editing ? updated : l))
        toast('Entry updated')
      } else {
        const entry = await api(`/lore/${activeCampaign._id}`, { method: 'POST', body })
        setLore(p => [entry, ...p])
        toast('Entry added')
      }
      setAdding(false); setEditing(null); setForm({ title: '', tag: 'npc', content: '', hp: '', maxHp: '' })
    } catch { toast('Failed to save') }
  }

  const del = async (id) => {
    await api(`/lore/${id}`, { method: 'DELETE' })
    setLore(p => p.filter(l => l._id !== id))
    toast('Deleted')
  }

  const startEdit = (l) => {
    setEditing(l._id)
    setForm({ title: l.title, tag: l.tag, content: l.content, hp: l.hp ?? '', maxHp: l.maxHp ?? '' })
    setAdding(true)
  }

  const filtered = filter === 'all' ? lore : lore.filter(l => l.tag === filter)
  const showHp = HP_TAGS.includes(form.tag)

  if (!activeCampaign) return (
    <div className="page-content">
      <div className="page-header-row" style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, flex: 1 }}>Info & Lore</h2>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {['all', ...TAGS].map(t => <button key={t} className="btn btn-ghost btn-sm" disabled>{t.charAt(0).toUpperCase() + t.slice(1)}</button>)}
        </div>
        <button className="btn btn-gold btn-sm" disabled>+ Add entry</button>
      </div>
      {campaignsLoading
        ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {Array.from({ length: 4 }).map((_, i) => <SkeletonBlock key={i} height={130} radius={12} />)}
          </div>
        : campaignsError
          ? <div style={{ color: 'var(--text-2)' }}>
              <p style={{ marginBottom: 12 }}>{campaignsError}</p>
              <button className="btn btn-ghost" onClick={reloadCampaigns}>Retry</button>
            </div>
          : <p style={{ color: 'var(--text-3)' }}>Select a campaign.</p>}
    </div>
  )

  return (
    <div className="page-content">
      <div className="page-header-row" style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, flex: 1 }}>Info & Lore</h2>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {['all', ...TAGS].map(t => (
            <button key={t} onClick={() => setFilter(t)} className={`btn btn-sm ${filter === t ? 'btn-primary' : 'btn-ghost'}`}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <button className="btn btn-gold btn-sm" onClick={() => { setAdding(true); setEditing(null); setForm({ title: '', tag: filter !== 'all' ? filter : 'npc', content: '', hp: '', maxHp: '' }) }}>+ Add entry</button>
      </div>

      {adding && (
        <div className="card" style={{ padding: 18, marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
            <input className="input" placeholder="Title" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} style={{ flex: 1, minWidth: 160 }} />
            <select className="input" style={{ width: 130 }} value={form.tag} onChange={e => setForm(p => ({ ...p, tag: e.target.value }))}>
              {TAGS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
          {showHp && (
            <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>Max HP</label>
                <input className="input" type="number" placeholder="e.g. 45" value={form.maxHp}
                  onChange={e => setForm(p => ({ ...p, maxHp: e.target.value, hp: e.target.value }))} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>Current HP</label>
                <input className="input" type="number" placeholder="Defaults to max" value={form.hp}
                  onChange={e => setForm(p => ({ ...p, hp: e.target.value }))} />
              </div>
            </div>
          )}
          <textarea className="input" rows={3} placeholder="Description..." value={form.content}
            onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
            style={{ resize: 'vertical', marginBottom: 10 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary btn-sm" onClick={save}>Save</button>
            <button className="btn btn-ghost btn-sm" onClick={() => { setAdding(false); setEditing(null) }}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {Array.from({ length: 4 }).map((_, i) => <SkeletonBlock key={i} height={130} radius={12} />)}
        </div>
      ) : loadError ? (
        <div style={{ color: 'var(--text-2)' }}>
          <p style={{ marginBottom: 12 }}>{loadError}</p>
          <button className="btn btn-ghost" onClick={load}>Retry</button>
        </div>
      ) : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
        {filtered.map(l => (
          <div key={l._id} className="card" style={{ padding: 16, borderLeft: (l.tag === 'boss') ? '3px solid #f59e0b' : (l.tag === 'enemy') ? '3px solid #ef4444' : undefined }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Cinzel, serif', fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{l.title}</div>
                <TagBadge tag={l.tag} />
                {l.maxHp > 0 && (
                  <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text-3)' }}>
                    HP {l.hp ?? l.maxHp}/{l.maxHp}
                  </span>
                )}
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
      }
      <ToastContainer />
    </div>
  )
}