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

function tileColor(id) {
  const t = TILES.find(x => x.id === id)
  return t && t.color !== 'transparent' ? t.color : '#fff'
}

function MapPreview({ content }) {
  let grid = null
  try { const parsed = JSON.parse(content); if (Array.isArray(parsed)) grid = parsed } catch { /* legacy */ }
  if (!grid) return (
    <div style={{ width: '100%', aspectRatio: `${GRID_W} / ${GRID_H}`, background: '#fff', border: '1px solid rgba(0,0,0,0.15)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#999' }}>No preview</div>
  )
  return (
    <div style={{ width: '100%', aspectRatio: `${GRID_W} / ${GRID_H}`, display: 'grid', gridTemplateColumns: `repeat(${GRID_W}, 1fr)`, border: '1px solid rgba(0,0,0,0.15)', borderRadius: 4, overflow: 'hidden' }}>
      {grid.map((row, r) => row.map((cellId, c) => (
        <div key={`${r}-${c}`} style={{ background: tileColor(cellId) }} />
      )))}
    </div>
  )
}

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

  const [printTarget, setPrintTarget] = useState(null) // grid array to print, or null

  const printMap = (content) => {
    let parsedGrid = null
    try { const parsed = JSON.parse(content); if (Array.isArray(parsed)) parsedGrid = parsed } catch { /* legacy */ }
    setPrintTarget(parsedGrid || blankGrid())
    // Wait a full frame for React to render the print target, THEN open the
    // dialog. Clean up only after the dialog closes via the afterprint event.
    setTimeout(() => {
      const cleanup = () => { setPrintTarget(null); window.removeEventListener('afterprint', cleanup) }
      window.addEventListener('afterprint', cleanup)
      window.print()
    }, 120)
  }

  if (!activeCampaign) return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}>Select a campaign.</div>

  return (
    <div className="page-content">
      <style>{`
        @media print {
          /* Force landscape on both A4 and A3 — the browser will scale to fit
             whichever paper the user picks in the print dialog. */
          @page { size: auto landscape; margin: 6mm; }
          body * { visibility: hidden; }
          #level-print, #level-print * { visibility: visible; }
          /* Fill the full printable area edge-to-edge */
          #level-print {
            position: fixed; inset: 0;
            width: 100vw; height: 100vh;
            display: grid;
            grid-template-columns: repeat(${GRID_W}, 1fr);
            box-sizing: border-box;
          }
          #level-print > div { border: 0.4pt solid rgba(0,0,0,0.18); }
        }
        .lb-cell { aspect-ratio: 1; border: 1px solid rgba(0,0,0,0.12); cursor: pointer; touch-action: none; }
        .lb-map-card { transition: transform .1s ease, box-shadow .1s ease, border-color .1s ease; }
        .lb-map-card:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,0,0,0.25); border-color: var(--gold) !important; }
      `}</style>

      <div className="page-header-row" style={{ marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 22, marginBottom: 4 }}>Level Builder</h2>
          <p style={{ color: 'var(--text-2)', fontSize: 14, margin: 0 }}>
            Paint a sky-view tile map, save it, then print from the map list. {!isPremium && `(${plans.length}/5 free maps used)`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={newMap}>+ New map</button>

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

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 480px', minWidth: 0 }}>
          <div
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
        </div>

        <div style={{ flex: '0 1 260px', minWidth: 220, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Saved maps</div>
          {plans.map(p => (
            <div
              key={p._id}
              className="card lb-map-card"
              onClick={() => openPlan(p)}
              style={{ padding: 10, cursor: 'pointer', border: activePlanId === p._id ? '2px solid var(--gold)' : '1px solid var(--border)' }}
            >
              <MapPreview content={p.content} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <span style={{ color: activePlanId === p._id ? 'var(--gold)' : 'var(--text)', fontFamily: 'Cinzel, serif', fontSize: 13 }}>{p.title}</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={(e) => { e.stopPropagation(); printMap(p.content) }} title="Print this map" style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 13 }}>�</button>
                  <button onClick={(e) => { e.stopPropagation(); remove(p._id) }} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 13 }}>✕</button>
                </div>
              </div>
            </div>
          ))}
          {plans.length === 0 && <div style={{ color: 'var(--text-3)', fontSize: 13 }}>No maps yet.</div>}
        </div>
      </div>

      {printTarget && (
        <div id="level-print">
          {printTarget.map((row, r) => row.map((cellId, c) => (
            <div key={`${r}-${c}`} style={{ background: tileColor(cellId) }} />
          )))}
        </div>
      )}
      <ToastContainer />
    </div>
  )
}
