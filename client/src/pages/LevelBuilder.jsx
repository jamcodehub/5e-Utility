import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '../context/AuthContext'
import { useCampaign } from '../context/CampaignContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../hooks/useToast'

// A3 landscape ratio ≈ 420/297
const GRID_W = 32
const GRID_H = 22

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
  return t && t.color !== 'transparent' ? t.color : '#f5f4f1'
}

function MapThumb({ content }) {
  let grid = null
  try { const p = JSON.parse(content); if (Array.isArray(p)) grid = p } catch { /* */ }
  if (!grid) return <div style={{ width: '100%', aspectRatio: `${GRID_W}/${GRID_H}`, background: '#eee', borderRadius: 4 }} />
  return (
    <div style={{ width: '100%', aspectRatio: `${GRID_W}/${GRID_H}`, display: 'grid', gridTemplateColumns: `repeat(${GRID_W}, 1fr)`, borderRadius: 4, overflow: 'hidden' }}>
      {grid.map((row, r) => row.map((c, ci) => <div key={`${r}-${ci}`} style={{ background: tileColor(c) }} />))}
    </div>
  )
}

// Token component — draggable circle showing avatar or initials
function Token({ token, cellSize, onDragStart }) {
  const initials = token.name?.[0]?.toUpperCase() || '?'
  return (
    <div
      draggable
      onDragStart={e => { e.dataTransfer.setData('tokenId', token.id); onDragStart(token.id) }}
      title={token.name}
      style={{
        position: 'absolute',
        inset: 2,
        borderRadius: '50%',
        overflow: 'hidden',
        background: token.color || '#6366f1',
        border: '2px solid rgba(255,255,255,0.8)',
        boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'grab',
        zIndex: 10,
        userSelect: 'none',
      }}
    >
      {token.avatar
        ? <img src={token.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <span style={{ fontSize: Math.max(8, cellSize * 0.35), color: '#fff', fontWeight: 700, fontFamily: 'Cinzel, serif' }}>{initials}</span>
      }
    </div>
  )
}

export default function LevelBuilder() {
  const { activeCampaign } = useCampaign()
  const { isPremium } = useAuth()
  const { toast, ToastContainer } = useToast()

  // ── Map gallery state ──
  const [plans, setPlans] = useState([])
  const [selectedPlanId, setSelectedPlanId] = useState(null)

  // ── Editor state ──
  const [mode, setMode] = useState('gallery') // 'gallery' | 'editor' | 'play'
  const [editTitle, setEditTitle] = useState('')
  const [editPlanId, setEditPlanId] = useState(null) // null = new
  const [grid, setGrid] = useState(blankGrid())
  const [tool, setTool] = useState('wall')
  const [painting, setPainting] = useState(false)

  // ── Play mode state ──
  const [tokens, setTokens] = useState([]) // { id, name, avatar, color, row, col, hp, maxHp }
  const [availableTokens, setAvailableTokens] = useState([]) // sidebar token pool
  const [dragTokenId, setDragTokenId] = useState(null)
  const [cellSize, setCellSize] = useState(28)
  const gridRef = useRef(null)

  // ── Data loading ──
  const loadPlans = useCallback(async () => {
    if (!activeCampaign) return
    const data = await api(`/levels/${activeCampaign._id}`)
    setPlans(data || [])
  }, [activeCampaign])

  useEffect(() => { loadPlans() }, [loadPlans])

  // Load party members + lore combatants for token pool
  useEffect(() => {
    if (!activeCampaign) return
    const pool = []

    // Party characters
    api(`/campaigns/${activeCampaign._id}/members/characters`)
      .then(members => {
        ;(members || []).forEach(m => {
          if (m.character) pool.push({
            id: `char-${m.userId}`,
            name: m.character.name || m.username,
            avatar: m.character.avatarUrl || null,
            color: '#6366f1',
            hp: m.character.hp?.current ?? m.character.hp?.max ?? 10,
            maxHp: m.character.hp?.max ?? 10,
            type: 'player',
          })
        })
      }).catch(() => {})

    // Lore combatants (npc, enemy, boss)
    api(`/lore/${activeCampaign._id}`)
      .then(lore => {
        ;(lore || []).filter(l => ['npc', 'enemy', 'boss'].includes(l.tag)).forEach(l => {
          pool.push({
            id: `lore-${l._id}`,
            loreId: l._id,
            name: l.title,
            avatar: null,
            color: l.tag === 'boss' ? '#f59e0b' : l.tag === 'enemy' ? '#ef4444' : '#10b981',
            hp: l.hp ?? l.maxHp ?? 10,
            maxHp: l.maxHp ?? 10,
            type: l.tag,
          })
        })
        setAvailableTokens([...pool])
      }).catch(() => { setAvailableTokens([...pool]) })
  }, [activeCampaign?._id, mode])

  // Measure cell size from grid DOM
  useEffect(() => {
    if (!gridRef.current) return
    const obs = new ResizeObserver(() => {
      if (gridRef.current) setCellSize(gridRef.current.offsetWidth / GRID_W)
    })
    obs.observe(gridRef.current)
    return () => obs.disconnect()
  }, [mode])

  // ── Gallery actions ──
  const openEditor = (plan = null) => {
    if (plan) {
      setEditPlanId(plan._id)
      setEditTitle(plan.title)
      try { const g = JSON.parse(plan.content); if (Array.isArray(g)) { setGrid(g); } else setGrid(blankGrid()) }
      catch { setGrid(blankGrid()) }
    } else {
      setEditPlanId(null)
      setEditTitle('')
      setGrid(blankGrid())
    }
    setMode('editor')
  }

  const openPlay = (plan) => {
    setSelectedPlanId(plan._id)
    try { const g = JSON.parse(plan.content); if (Array.isArray(g)) setGrid(g) }
    catch { setGrid(blankGrid()) }
    setTokens([])
    setMode('play')
  }

  const saveMap = async () => {
    if (!editTitle.trim() || !activeCampaign) return
    try {
      const body = { title: editTitle, content: JSON.stringify(grid) }
      const plan = editPlanId
        ? await api(`/levels/${editPlanId}`, { method: 'PUT', body })
        : await api(`/levels/${activeCampaign._id}`, { method: 'POST', body })
      setPlans(p => editPlanId ? p.map(x => x._id === plan._id ? plan : x) : [...p, plan])
      setEditPlanId(plan._id)
      toast('Map saved')
      setMode('gallery')
    } catch (e) { toast(e.message || 'Failed to save') }
  }

  const deleteMap = async (id, e) => {
    e.stopPropagation()
    if (!window.confirm('Delete this map?')) return
    await api(`/levels/${id}`, { method: 'DELETE' })
    setPlans(p => p.filter(x => x._id !== id))
    if (selectedPlanId === id) { setSelectedPlanId(null); setMode('gallery') }
    toast('Map deleted')
  }

  // ── Paint ──
  const paint = (r, c) => setGrid(g => { const n = g.map(row => row.slice()); n[r][c] = tool; return n })

  // ── Token drag onto grid ──
  const dropOnCell = (e, r, c) => {
    e.preventDefault()
    const tokenId = e.dataTransfer.getData('tokenId')
    if (!tokenId) return

    // If token already on map, move it
    if (tokens.find(t => t.id === tokenId)) {
      setTokens(ts => ts.map(t => t.id === tokenId ? { ...t, row: r, col: c } : t))
      return
    }
    // Otherwise place from pool
    const src = availableTokens.find(t => t.id === tokenId)
    if (!src) return
    // Don't place same token twice
    if (tokens.find(t => t.id === tokenId)) return
    setTokens(ts => [...ts, { ...src, row: r, col: c }])
  }

  const removeToken = (id) => setTokens(ts => ts.filter(t => t.id !== id))

  const adjustTokenHp = (id, delta) => {
    setTokens(ts => ts.map(t => t.id === id
      ? { ...t, hp: Math.max(0, Math.min(t.maxHp, (t.hp || 0) + delta)) }
      : t
    ))
  }

  // ── Render ──
  const selectedPlan = plans.find(p => p._id === selectedPlanId)

  if (!activeCampaign) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}>
      Select a campaign.
    </div>
  )

  // ── EDITOR MODE ──
  if (mode === 'editor') return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <style>{`
        .lb-cell { aspect-ratio: 1; border: 0.5px solid rgba(0,0,0,0.1); cursor: crosshair; touch-action: none; }
        @media print {
          @page { size: A3 landscape; margin: 4mm; }
          html, body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body * { visibility: hidden; }
          #level-print, #level-print * { visibility: visible; }
          #level-print { position: fixed; inset: 0; width: 100vw; height: 100vh; display: grid; grid-template-columns: repeat(${GRID_W}, 1fr); background: #fff; }
          #level-print > div { border: 0.3pt solid rgba(0,0,0,0.15); -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      {/* Editor toolbar */}
      <div style={{ padding: '10px 16px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, flexWrap: 'wrap' }}>
        <input className="input" placeholder="Map title" value={editTitle} onChange={e => setEditTitle(e.target.value)} style={{ width: 200 }} />
        <div style={{ display: 'flex', gap: 4, flex: 1, flexWrap: 'wrap' }}>
          {TILES.map(t => (
            <button key={t.id} onClick={() => setTool(t.id)} className="btn btn-sm" style={{
              display: 'flex', alignItems: 'center', gap: 5,
              border: tool === t.id ? '2px solid var(--gold)' : '1px solid var(--border)',
              background: tool === t.id ? 'var(--gold-bg)' : 'var(--surface)', color: 'var(--text)',
            }}>
              <span style={{ width: 12, height: 12, borderRadius: 2, background: t.color === 'transparent' ? 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 50%/6px 6px' : t.color, border: '1px solid rgba(0,0,0,0.2)', flexShrink: 0 }} />
              {t.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setMode('gallery')}>✕ Cancel</button>
          <button className="btn btn-ghost btn-sm" onClick={() => window.print()}>Print</button>
          <button className="btn btn-primary btn-sm" onClick={saveMap} disabled={!editTitle.trim()}>Save & Close</button>
        </div>
      </div>

      {/* Grid — fills remaining height */}
      <div style={{ flex: 1, overflow: 'auto', padding: 16, background: '#2a2a2a', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
        <div
          onMouseUp={() => setPainting(false)}
          onMouseLeave={() => setPainting(false)}
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${GRID_W}, 1fr)`,
            width: '100%',
            maxWidth: `calc((100vh - 120px) * ${GRID_W / GRID_H})`,
            background: '#fff',
            border: '3px solid #4a3f33',
            borderRadius: 4,
            overflow: 'hidden',
            userSelect: 'none',
          }}
        >
          {grid.map((row, r) => row.map((cellId, c) => {
            const t = TILES.find(x => x.id === cellId) || TILES[TILES.length - 1]
            return (
              <div key={`${r}-${c}`} className="lb-cell"
                onMouseDown={() => { setPainting(true); paint(r, c) }}
                onMouseEnter={() => { if (painting) paint(r, c) }}
                onTouchStart={() => paint(r, c)}
                style={{ background: t.color === 'transparent' ? '#f5f4f1' : t.color }}
              />
            )
          }))}
        </div>
      </div>
    </div>
  )

  // ── PLAY MODE ──
  if (mode === 'play') return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Play toolbar */}
      <div style={{ padding: '10px 16px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <span style={{ fontFamily: 'Cinzel, serif', fontSize: 14, fontWeight: 600, flex: 1 }}>{selectedPlan?.title}</span>
        <button className="btn btn-ghost btn-sm" onClick={() => { setTokens([]); setMode('gallery') }}>← Back</button>
        <button className="btn btn-primary btn-sm" onClick={() => openEditor(selectedPlan)}>Edit Map</button>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Map area */}
        <div style={{ flex: 1, overflow: 'auto', padding: 12, background: '#1a1a1a', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
          <div
            ref={gridRef}
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${GRID_W}, 1fr)`,
              width: '100%',
              maxWidth: `calc((100vh - 120px) * ${GRID_W / GRID_H})`,
              background: '#fff',
              border: '3px solid #4a3f33',
              borderRadius: 4,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {grid.map((row, r) => row.map((cellId, c) => {
              const token = tokens.find(t => t.row === r && t.col === c)
              return (
                <div
                  key={`${r}-${c}`}
                  style={{
                    aspectRatio: '1',
                    background: tileColor(cellId),
                    border: '0.5px solid rgba(0,0,0,0.08)',
                    position: 'relative',
                  }}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => dropOnCell(e, r, c)}
                >
                  {token && (
                    <Token
                      token={token}
                      cellSize={cellSize}
                      onDragStart={setDragTokenId}
                    />
                  )}
                </div>
              )
            }))}
          </div>
        </div>

        {/* Token sidebar */}
        <div style={{ width: 220, flexShrink: 0, background: 'var(--surface)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Tokens — drag onto map
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
            {/* Section: Players */}
            {availableTokens.filter(t => t.type === 'player').length > 0 && (
              <>
                <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 4, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Party</div>
                {availableTokens.filter(t => t.type === 'player').map(t => (
                  <SidebarToken key={t.id} token={t} placed={!!tokens.find(x => x.id === t.id)} />
                ))}
              </>
            )}
            {/* Section: NPCs */}
            {availableTokens.filter(t => t.type === 'npc').length > 0 && (
              <>
                <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 4, marginTop: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>NPCs</div>
                {availableTokens.filter(t => t.type === 'npc').map(t => (
                  <SidebarToken key={t.id} token={t} placed={!!tokens.find(x => x.id === t.id)} />
                ))}
              </>
            )}
            {/* Section: Enemies */}
            {availableTokens.filter(t => t.type === 'enemy').length > 0 && (
              <>
                <div style={{ fontSize: 10, color: '#ef4444', marginBottom: 4, marginTop: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Enemies</div>
                {availableTokens.filter(t => t.type === 'enemy').map(t => (
                  <SidebarToken key={t.id} token={t} placed={!!tokens.find(x => x.id === t.id)} />
                ))}
              </>
            )}
            {/* Section: Bosses */}
            {availableTokens.filter(t => t.type === 'boss').length > 0 && (
              <>
                <div style={{ fontSize: 10, color: '#f59e0b', marginBottom: 4, marginTop: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bosses</div>
                {availableTokens.filter(t => t.type === 'boss').map(t => (
                  <SidebarToken key={t.id} token={t} placed={!!tokens.find(x => x.id === t.id)} />
                ))}
              </>
            )}
            {availableTokens.length === 0 && (
              <div style={{ fontSize: 12, color: 'var(--text-3)', padding: '12px 4px', lineHeight: 1.6 }}>
                No tokens available. Add party members to the campaign, or add NPCs/enemies/bosses in the Lore section.
              </div>
            )}
          </div>

          {/* Placed tokens HP bar */}
          {tokens.length > 0 && (
            <div style={{ borderTop: '1px solid var(--border)', padding: 8 }}>
              <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>On map</div>
              {tokens.map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontSize: 12 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: t.color, border: '1px solid rgba(255,255,255,0.3)', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {t.avatar
                      ? <img src={t.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: 9, color: '#fff', fontWeight: 700 }}>{t.name?.[0]}</span>
                    }
                  </div>
                  <span style={{ flex: 1, fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <button onClick={() => adjustTokenHp(t.id, -1)} style={{ width: 16, height: 16, borderRadius: 3, border: '1px solid var(--border)', background: 'transparent', color: 'var(--red)', fontSize: 11, cursor: 'pointer', lineHeight: 1, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                    <span style={{ fontSize: 10, color: t.hp === 0 ? 'var(--red)' : 'var(--text-2)', minWidth: 28, textAlign: 'center' }}>{t.hp}/{t.maxHp}</span>
                    <button onClick={() => adjustTokenHp(t.id, 1)} style={{ width: 16, height: 16, borderRadius: 3, border: '1px solid var(--border)', background: 'transparent', color: 'var(--green)', fontSize: 11, cursor: 'pointer', lineHeight: 1, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                    <button onClick={() => removeToken(t.id)} style={{ marginLeft: 2, width: 16, height: 16, borderRadius: 3, border: 'none', background: 'transparent', color: 'var(--text-3)', fontSize: 12, cursor: 'pointer', lineHeight: 1, padding: 0 }}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  // ── GALLERY MODE ──
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, background: 'var(--surface)' }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 20, marginBottom: 2 }}>Level Builder</h2>
          <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
            Draw tile maps, then enter play mode to position your party. {!isPremium && `(${plans.length}/5 free)`}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => openEditor(null)}>+ Create New Map</button>
      </div>

      {/* Horizontal scroll gallery */}
      {plans.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, color: 'var(--text-3)' }}>
          <div style={{ fontSize: 40, opacity: 0.3 }}>...</div>
          <div style={{ fontSize: 14 }}>No maps yet. Create your first one above.</div>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 16 }}>
            {plans.map(plan => (
              <div
                key={plan._id}
                onClick={() => openPlay(plan)}
                style={{
                  flexShrink: 0,
                  width: 280,
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'transform .15s, box-shadow .15s, border-color .15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)'; e.currentTarget.style.borderColor = 'var(--gold)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = 'var(--border)' }}
              >
                <MapThumb content={plan.content} />
                <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: 'Cinzel, serif', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{plan.title}</span>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button onClick={e => { e.stopPropagation(); openEditor(plan) }} title="Edit tiles"
                      style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 13 }}>✎</button>
                    <button onClick={e => deleteMap(plan._id, e)} title="Delete"
                      style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 13 }}>✕</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  )
}

// Sidebar token pill — draggable from the panel onto the map
function SidebarToken({ token, placed }) {
  return (
    <div
      draggable={!placed}
      onDragStart={e => { if (!placed) e.dataTransfer.setData('tokenId', token.id) }}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px',
        borderRadius: 8, marginBottom: 4,
        background: placed ? 'var(--surface2)' : 'var(--surface)',
        border: '1px solid var(--border)',
        opacity: placed ? 0.45 : 1,
        cursor: placed ? 'default' : 'grab',
        userSelect: 'none',
      }}
    >
      <div style={{ width: 28, height: 28, borderRadius: '50%', background: token.color, border: '2px solid rgba(255,255,255,0.2)', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {token.avatar
          ? <img src={token.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: 12, color: '#fff', fontWeight: 700 }}>{token.name?.[0]?.toUpperCase()}</span>
        }
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{token.name}</div>
        {token.maxHp > 0 && <div style={{ fontSize: 10, color: 'var(--text-3)' }}>HP {token.hp}/{token.maxHp}</div>}
      </div>
      {placed && <span style={{ fontSize: 9, color: 'var(--text-3)' }}>placed</span>}
    </div>
  )
}