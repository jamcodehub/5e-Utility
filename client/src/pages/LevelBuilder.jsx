import { useState, useEffect, useCallback } from 'react'
import { api } from '../context/AuthContext'
import { useCampaign } from '../context/CampaignContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../hooks/useToast'

const GRID_W = 16
const GRID_H = 12

const TILES = [
  { id: 'floor',  label: 'Floor',  color: '#e8ddc4' },
  { id: 'wall',   label: 'Wall',   color: '#4a3f33' },
  { id: 'door',   label: 'Door',   color: '#8a5a2b' },
  { id: 'water',  label: 'Water',  color: '#4a7fa5' },
  { id: 'grass',  label: 'Grass',  color: '#5c8a4a' },
  { id: 'trap',   label: 'Trap',   color: '#b03030' },
  { id: 'stairs', label: 'Stairs', color: '#9a8a5a' },
  { id: 'chest',  label: 'Chest',  color: '#c9a227' },
  { id: 'empty',  label: 'Erase',  color: 'transparent' },
]

const blankGrid = () => Array.from({ length: GRID_H }, () => Array.from({ length: GRID_W }, () => 'empty'))

export default function LevelBuilder() {
  const { activeCampaign } = useCampaign()
  const { isPremium } = useAuth()
  const { toast, ToastContainer } = useToast()
  const [plans, setPlans] = useState([])
  const [title, setTitle] = useState('')
  const [error, setError] = useState('')
  const [grid, setGrid] = useState(blankGrid())
  const [tool, setTool] = useState('wall')
  const [painting, setPainting] = useState(false)
  const [activePlanId, setActivePlanId] = useState(null)

  const load = useCallback(async () => {
    if (!activeCampaign) return
    setPlans(await api(`/levels/${activeCampaign._id}`))
  }, [activeCampaign])

  useEffect(() => { load() }, [load])

  const paint = (r, c) => {
    setGrid(g => {
      const next = g.map(row => row.slice())
      next[r][c] = tool
      return next
    })
  }

  const save = async () => {
    if (!title.trim() || !activeCampaign) return
    setError('')
    try {
      const body = { title, content: JSON.stringify(grid) }
      const plan = activePlanId
        ? await api(`/levels/${activePlanId}`, { method: 'PUT', body })
        : await api(`/levels/${activeCampaign._id}`, { method: 'POST', body })
      setPlans(p => activePlanId ? p.map(x => x._id === plan._id ? plan : x) : [...p, plan])
      setActivePlanId(plan._id)
      toast('Map saved')
    } catch (e) { setError(e.message || 'Failed to save') }
  }

  const openPlan = (p) => {
    setActivePlanId(p._id)
    setTitle(p.title)
    try {
      const parsed = JSON.parse(p.content)
      if (Array.isArray(parsed)) { setGrid(parsed); return }
    } catch { /* legacy text-only plan */ }
    setGrid(blankGrid())
  }

  const newMap = () => { setActivePlanId(null); setTitle(''); setGrid(blankGrid()) }

  const remove = async (id) => {
    await api(`/levels/${id}`, { method: 'DELETE' })
    setPlans(p => p.filter(x => x._id !== id))
    if (activePlanId === id) newMap()
  }

  const printMap = () => window.print()

  if (!activeCampaign) return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}>Select a campaign.</div>

  return (
    <div className="page-content">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #level-print, #level-print * { visibility: visible; }
          #level-print { position: fixed; inset: 0; }
        }
        .lb-cell { aspect-ratio: 1; border: 1px solid rgba(0,0,0,0.12); cursor: pointer; touch-action: none; }
      `}</style>

      <div className="page-header-row" style={{ marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 22, marginBottom: 4 }}>Level Builder</h2>
          <p style={{ color: 'var(--text-2)', fontSize: 14, margin: 0 }}>
            Paint a sky-view tile map, then print it for the table. {!isPremium && `(${plans.length}/5 free maps used)`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={newMap}>+ New map</button>
          <button className="btn btn-ghost btn-sm" onClick={printMap}>🖨 Print</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        {TILES.map(t => (
          <button key={t.id} onClick={() => setTool(t.id)} className="btn btn-sm" style={{
            display: 'flex', alignItems: 'center', gap: 6,
            border: tool === t.id ? '2px solid var(--gold)' : '1px solid var(--border)',
            background: tool === t.id ? 'var(--gold-bg)' : 'var(--surface)', color: 'var(--text)',
          }}>
            <span style={{ width: 14, height: 14, borderRadius: 3, background: t.color === 'transparent' ? 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 50% / 6px 6px' : t.color, border: '1px solid rgba(0,0,0,0.2)' }} />
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
        <input className="input" placeholder="Map title" value={title} onChange={e => setTitle(e.target.value)} style={{ maxWidth: 260 }} />
        {error && <div style={{ fontSize: 12, color: 'var(--red)' }}>{error}</div>}
        <button className="btn btn-primary btn-sm" onClick={save} disabled={!title.trim()}>{activePlanId ? 'Update' : 'Save'} map</button>
      </div>

      <div
        id="level-print"
        onMouseUp={() => setPainting(false)}
        onMouseLeave={() => setPainting(false)}
        style={{
          display: 'grid', gridTemplateColumns: `repeat(${GRID_W}, 1fr)`, maxWidth: 720,
          background: '#fff', border: '2px solid #4a3f33', borderRadius: 4, overflow: 'hidden', userSelect: 'none',
        }}
      >
        {grid.map((row, r) => row.map((cellId, c) => {
          const t = TILES.find(x => x.id === cellId) || TILES[TILES.length - 1]
          return (
            <div
              key={`${r}-${c}`}
              className="lb-cell"
              onMouseDown={() => { setPainting(true); paint(r, c) }}
              onMouseEnter={() => { if (painting) paint(r, c) }}
              onTouchStart={() => paint(r, c)}
              style={{ background: t.color === 'transparent' ? '#fff' : t.color }}
            />
          )
        }))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 640, marginTop: 24 }}>
        <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Saved maps</div>
        {plans.map(p => (
          <div key={p._id} className="card" style={{ padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button onClick={() => openPlan(p)} style={{ background: 'none', border: 'none', color: activePlanId === p._id ? 'var(--gold)' : 'var(--text)', cursor: 'pointer', fontFamily: 'Cinzel, serif', fontSize: 14, textAlign: 'left' }}>{p.title}</button>
            <button onClick={() => remove(p._id)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 13 }}>✕</button>
          </div>
        ))}
        {plans.length === 0 && <div style={{ color: 'var(--text-3)', fontSize: 13 }}>No maps yet.</div>}
      </div>
      <ToastContainer />
    </div>
  )
}
