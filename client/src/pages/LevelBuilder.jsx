import { useDebouncedSave } from '../hooks/useDebouncedSave'
import { useState, useEffect, useCallback, useMemo, useRef, useId } from 'react'
import { createPortal } from 'react-dom'
import { useSearchParams } from 'react-router-dom'
import { api } from '../context/AuthContext'
import { useCampaign } from '../context/CampaignContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../hooks/useToast'
import { getSocket } from '../utils/socket'
import { isPublicDemoPath } from '../utils/demoRuntime'
import { SkeletonBlock } from '../components/Skeleton'
import { TILES, OBJECT_TILES } from '../data/levelTiles'
import { THEMES, DEFAULT_THEME, resolveThemeId, getThemeTiles } from '../data/levelThemes'
// Note: module-level TILES / OBJECT_TILES above are the base (Medieval) set, used for
// logic that doesn't depend on artwork. MapThumb and LevelBuilder shadow them with the
// active theme's tiles (same ids, different art).

// A3 landscape ratio ≈ 420/297
const GRID_W = 32
const GRID_H = 22

const TORCH_LIGHT_RADIUS = OBJECT_TILES.find(tile => tile.id === 'torch').lightRadius
const DARKVISION_RADIUS = 6

const blankGrid = () => Array.from({ length: GRID_H }, () => Array.from({ length: GRID_W }, () => 'empty'))
const blankObjectGrid = () => Array.from({ length: GRID_H }, () => Array.from({ length: GRID_W }, () => null))
const blankDoorStates = () => Array.from({ length: GRID_H }, () => Array.from({ length: GRID_W }, () => false))
const blankStairLinks = () => Array.from({ length: GRID_H }, () => Array.from({ length: GRID_W }, () => null))

function normalizeGrid(value, fallback) {
  return Array.from({ length: GRID_H }, (_, r) =>
    Array.from({ length: GRID_W }, (_, c) => value?.[r]?.[c] ?? fallback)
  )
}

function parseMapContent(content) {
  try {
    const parsed = JSON.parse(content)
    if (Array.isArray(parsed)) return {
      ground: normalizeGrid(parsed, 'empty'),
      objects: blankObjectGrid(),
      stairLinks: blankStairLinks(),
    }
    if (parsed && Array.isArray(parsed.ground)) {
      return {
        ground: normalizeGrid(parsed.ground, 'empty'),
        objects: normalizeGrid(parsed.objects, null),
        stairLinks: normalizeGrid(parsed.stairLinks, null),
      }
    }
  } catch {
    // Older maps may have empty or malformed content; use an empty object layer.
  }
  return { ground: blankGrid(), objects: blankObjectGrid(), stairLinks: blankStairLinks() }
}

function normalizeDoorStates(value) {
  return normalizeGrid(value, false).map(row => row.map(Boolean))
}

function blocksVision(ground, doorStates, row, col) {
  const tileId = ground[row]?.[col]
  const tile = TILES.find(item => item.id === tileId)
  return tileId === 'wall' || tile?.blocksVision === true || (tileId === 'door' && !doorStates[row]?.[col])
}

function hasLineOfSight(ground, doorStates, from, to) {
  let x = from.col
  let y = from.row
  const dx = Math.abs(to.col - x)
  const dy = Math.abs(to.row - y)
  const sx = x < to.col ? 1 : -1
  const sy = y < to.row ? 1 : -1
  let error = dx - dy

  while (x !== to.col || y !== to.row) {
    const previousX = x
    const previousY = y
    const doubledError = error * 2
    if (doubledError > -dy) { error -= dy; x += sx }
    if (doubledError < dx) { error += dx; y += sy }
    if (x !== previousX && y !== previousY
      && (blocksVision(ground, doorStates, previousY, x) || blocksVision(ground, doorStates, y, previousX))) return false
    if (x === to.col && y === to.row) return true
    if (blocksVision(ground, doorStates, y, x)) return false
  }
  return true
}

function canSeeFrom(ground, doorStates, source, row, col, radius) {
  return Math.max(Math.abs(source.row - row), Math.abs(source.col - col)) <= radius
    && hasLineOfSight(ground, doorStates, source, { row, col })
}

function tileColor(id) {
  const t = TILES.find(x => x.id === id)
  return t && t.color !== 'transparent' ? t.color : '#f5f4f1'
}

function objectTile(id) {
  return OBJECT_TILES.find(tile => tile.id === id)
}

function TileIconPlaceholder({ tile, style = {} }) {
  if (tile.imageUrl) {
    return <img
      src={tile.imageUrl}
      alt=""
      aria-hidden="true"
      draggable="false"
      style={{ width: '94%', height: '94%', objectFit: 'contain', pointerEvents: 'none', ...style }}
    />
  }

  return tile.iconUrl
    ? <span aria-hidden="true" style={{
        width: '72%',
        height: '72%',
        backgroundColor: tile.iconColor || '#444',
        maskImage: `url("${tile.iconUrl}")`,
        maskRepeat: 'no-repeat',
        maskPosition: 'center',
        maskSize: 'contain',
        WebkitMaskImage: `url("${tile.iconUrl}")`,
        WebkitMaskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        WebkitMaskSize: 'contain',
        transform: tile.id === 'stairs-down' ? 'rotate(180deg)' : undefined,
        pointerEvents: 'none',
        ...style,
      }} />
    : <span aria-hidden="true" style={{
        width: tile.id.startsWith('rock-') ? `${Math.min((tile.size || 12) * 4, 68)}%` : '58%',
        aspectRatio: '1',
        borderRadius: tile.id.startsWith('rock-') ? '50%' : 4,
        background: tile.color || 'rgba(255,255,255,0.65)',
        border: '1px dashed rgba(0,0,0,0.32)',
        boxSizing: 'border-box',
        pointerEvents: 'none',
        ...style,
      }} />
}

function MapThumb({ content, theme }) {
  const { TILES, OBJECT_TILES } = getThemeTiles(theme)
  const objectTile = id => OBJECT_TILES.find(tile => tile.id === id)
  const tintId = useId().replace(/:/g, '')
  const iconColors = [...new Set([...TILES, ...OBJECT_TILES].map(tile => tile.iconColor).filter(Boolean))]
  const grid = useMemo(() => {
    return parseMapContent(content)
  }, [content])

  return (
    <svg
      viewBox={`0 0 ${GRID_W} ${GRID_H}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      style={{
        display: 'block',
        width: '100%',
        aspectRatio: `${GRID_W}/${GRID_H}`,
        borderRadius: 4,
        background: '#f5f4f1',
        shapeRendering: 'crispEdges',
      }}
    >
        <defs>
          {iconColors.map(color => {
            const red = parseInt(color.slice(1, 3), 16) / 255
            const green = parseInt(color.slice(3, 5), 16) / 255
            const blue = parseInt(color.slice(5, 7), 16) / 255
            return (
              <filter key={color} id={`${tintId}-${color.slice(1)}`} colorInterpolationFilters="sRGB">
                <feColorMatrix type="matrix" values={`0 0 0 0 ${red} 0 0 0 0 ${green} 0 0 0 0 ${blue} 0 0 0 1 0`} />
              </filter>
            )
          })}
        </defs>
        {grid.ground.flatMap((row, r) => row.map((cell, c) => (
          <rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" fill={tileColor(cell)} />
        )))}
        {grid.ground.flatMap((row, r) => row.map((id, c) => {
          const tile = TILES.find(item => item.id === id)
          return tile?.imageUrl
            ? <image key={`ground-image-${r}-${c}`} href={tile.imageUrl} x={c} y={r} width="1" height="1" preserveAspectRatio="none" />
            : null
        }))}
        {grid.objects.flatMap((row, r) => row.map((id, c) => {
          const tile = objectTile(id)
          if (!tile) return null
          if (tile.imageUrl) return <image key={`object-${r}-${c}`} href={tile.imageUrl} x={c + 0.03} y={r + 0.03} width="0.94" height="0.94" preserveAspectRatio="xMidYMid meet" />
          if (tile.iconUrl) return <image key={`object-${r}-${c}`} href={tile.iconUrl} x={c + 0.12} y={r + 0.12} width="0.76" height="0.76" preserveAspectRatio="xMidYMid meet" filter={`url(#${tintId}-${tile.iconColor.slice(1)})`} />
        if (id.startsWith('rock-')) return <circle key={`object-${r}-${c}`} cx={c + 0.5} cy={r + 0.5} r={id === 'rock-small' ? 0.18 : id === 'rock-medium' ? 0.28 : 0.36} fill={tile.color} />
        return <rect key={`object-${r}-${c}`} x={c + 0.22} y={r + 0.22} width="0.56" height="0.56" rx="0.08" fill={tile.color || '#fff'} fillOpacity="0.7" stroke="#333" strokeOpacity="0.55" strokeDasharray="0.08 0.05" strokeWidth="0.04" />
      }))}
      {grid.ground.flatMap((row, r) => row.map((id, c) => {
        const tile = TILES.find(item => item.id === id && item.iconUrl)
        if (!tile) return null
        return <image key={`ground-${r}-${c}`} href={tile.iconUrl} x={c + 0.12} y={r + 0.12} width="0.76" height="0.76" preserveAspectRatio="xMidYMid meet" filter={tile.iconColor ? `url(#${tintId}-${tile.iconColor.slice(1)})` : undefined} />
      }))}
      <path
        d={[...Array.from({ length: GRID_W + 1 }, (_, x) => `M${x} 0V${GRID_H}`), ...Array.from({ length: GRID_H + 1 }, (_, y) => `M0 ${y}H${GRID_W}`)].join(' ')}
        fill="none"
        stroke="rgba(0,0,0,0.24)"
        strokeWidth="0.045"
        vectorEffect="non-scaling-stroke"
        shapeRendering="crispEdges"
      />
    </svg>
  )
}

function MapSkeleton() {
  return (
    <div style={{ width: '100%', aspectRatio: `${GRID_W}/${GRID_H}`, position: 'relative' }}>
      <SkeletonBlock width="100%" height="100%" radius={4} />
      <div aria-hidden="true" style={{
        position: 'absolute',
        inset: 0,
        borderRadius: 4,
        backgroundImage: 'linear-gradient(to right, rgba(0,0,0,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.12) 1px, transparent 1px)',
        backgroundSize: `${100 / GRID_W}% ${100 / GRID_H}%`,
        pointerEvents: 'none',
      }} />
    </div>
  )
}

// Token component — draggable circle showing avatar or initials
// Small overlapping "peeking" avatars — a minimal presence indicator showing
// who else is currently viewing this board live (collaborative Play mode).
function PeekingViewers({ viewers }) {
  if (!viewers.length) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center' }} title={viewers.map(v => v.username).join(', ')}>
      {viewers.slice(0, 5).map((v, i) => (
        <div key={v.userId} style={{
          width: 24, height: 24, borderRadius: '50%', overflow: 'hidden',
          background: 'var(--gold-bg)', border: '2px solid var(--surface)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginLeft: i === 0 ? 0 : -8, boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
          flexShrink: 0, position: 'relative', zIndex: 5 - i,
        }}>
          {v.avatar
            ? <img src={v.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--gold)', fontFamily: 'var(--font-title)' }}>{v.username?.[0]?.toUpperCase()}</span>
          }
        </div>
      ))}
      {viewers.length > 5 && (
        <span style={{ marginLeft: 4, fontSize: 11, color: 'var(--text-3)' }}>+{viewers.length - 5}</span>
      )}
    </div>
  )
}

const dragPreviewTransform = ({ x, y }) => `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(1.08)`

function Token({ token, cellSize, onDragStart, dragging }) {
  const initials = token.name?.[0]?.toUpperCase() || '?'
  return (
    <div
      onPointerDown={e => onDragStart(e, token.id)}
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
        cursor: dragging ? 'grabbing' : 'grab',
        opacity: dragging ? 0.25 : 1,
        zIndex: 10,
        userSelect: 'none',
        touchAction: 'none',
      }}
    >
      {token.avatar
        ? <img src={token.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <span style={{ fontSize: Math.max(8, cellSize * 0.35), color: '#fff', fontWeight: 700, fontFamily: 'var(--font-title)' }}>{initials}</span>
      }
    </div>
  )
}

export default function LevelBuilder() {
  const { activeCampaign, campaignsLoading, campaignsError, reload: reloadCampaigns } = useCampaign()
  const { isPremium, user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const isDm = user?.role === 'dm'
  const { toast, ToastContainer } = useToast()

  // ── Map gallery state ──
  const [plans, setPlans] = useState([])
  const [plansLoading, setPlansLoading] = useState(true)
  const [plansError, setPlansError] = useState('')
  const [selectedPlanId, setSelectedPlanId] = useState(null)

  // ── Editor state ──
  const [mode, setMode] = useState('gallery') // 'gallery' | 'editor' | 'play'
  const [editTitle, setEditTitle] = useState('')
  const [editPlanId, setEditPlanId] = useState(null) // null = new
  const [grid, setGrid] = useState(blankGrid())
  const [objectGrid, setObjectGrid] = useState(blankObjectGrid())
  const [stairLinks, setStairLinks] = useState(blankStairLinks())
  const [editLayer, setEditLayer] = useState('ground')
  const [linkMode, setLinkMode] = useState(false)
  const [pendingStair, setPendingStair] = useState(null)
  const [linkDestinationId, setLinkDestinationId] = useState('')
  const [tool, setTool] = useState('wall')
  const [painting, setPainting] = useState(false)
  const lastTouchCell = useRef(null)

  // ── Play mode state ──
  const [tokens, setTokens] = useState([]) // { id, name, avatar, color, row, col, hp, maxHp }
  const [darkMode, setDarkMode] = useState(false)
  const [doorStates, setDoorStates] = useState(blankDoorStates())
  const [availableTokens, setAvailableTokens] = useState([]) // sidebar token pool
  const [dragTokenId, setDragTokenId] = useState(null)
  const [dragPreviewToken, setDragPreviewToken] = useState(null)
  const dragPosRef = useRef({ x: 0, y: 0 })
  const [tapToPlaceTokenId, setTapToPlaceTokenId] = useState(null)
  const [cellSize, setCellSize] = useState(28)
  const gridRef = useRef(null)
  const scrollRef = useRef(null)
  const playRootRef = useRef(null)
  const panRef = useRef(null)
  const [zoom, setZoom] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showTokens, setShowTokens] = useState(true)

  // ── Tile theme ── (map grids store tile ids, so a theme only swaps the artwork)
  const [editTheme, setEditTheme] = useState(DEFAULT_THEME)
  const themeId = mode === 'editor'
    ? editTheme
    : resolveThemeId(plans.find(p => p._id === selectedPlanId)?.theme)
  const { TILES, OBJECT_TILES } = getThemeTiles(themeId)
  const objectTile = id => OBJECT_TILES.find(tile => tile.id === id)
  const dragPreviewRef = useRef(null)
  const remoteUpdateRef = useRef(false)
  const [viewers, setViewers] = useState([]) // who's currently looking at this board
  const plansRef = useRef(plans)
  plansRef.current = plans
  const toastRef = useRef(toast)
  toastRef.current = toast

  const startTokenDrag = (e, tokenId) => {
    e.preventDefault?.()
    e.stopPropagation?.()
    setDragTokenId(tokenId)
    setDragPreviewToken(tokens.find(token => token.id === tokenId) || availableTokens.find(token => token.id === tokenId))
    dragPosRef.current = { x: e.clientX, y: e.clientY }
  }

  const changeZoom = (delta, reset = false) => setZoom(z => reset ? 1 : Math.max(1, Math.min(4, z + delta)))

  const toggleFullscreen = () => {
    if (document.fullscreenElement) Promise.resolve(document.exitFullscreen?.()).catch(() => {})
    else Promise.resolve(playRootRef.current?.requestFullscreen?.()).catch(() => {})
  }

  useEffect(() => {
    const sync = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', sync)
    return () => document.removeEventListener('fullscreenchange', sync)
  }, [])

  // Drag-to-pan on the zoomed map (scrollbars are hidden)
  const startPan = (e) => {
    const el = scrollRef.current
    if (!el || zoom <= 1 || e.button > 0 || e.target.closest('button')) return
    panRef.current = { x: e.clientX, y: e.clientY, left: el.scrollLeft, top: el.scrollTop }
    const move = (ev) => {
      const p = panRef.current
      if (!p) return
      el.scrollLeft = p.left - (ev.clientX - p.x)
      el.scrollTop = p.top - (ev.clientY - p.y)
    }
    const up = () => {
      panRef.current = null
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  useEffect(() => {
    if (mode !== 'play' || !selectedPlanId || !dragTokenId) return

    const preventTouchScroll = (event) => event.preventDefault()
    window.addEventListener('touchmove', preventTouchScroll, { passive: false })

    const finishDrag = (e) => {
      const cell = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-map-cell]')
      if (cell) {
        const row = Number(cell.dataset.row)
        const col = Number(cell.dataset.col)
        setTokens(current => {
          if (current.some(token => token.id === dragTokenId)) {
            return current.map(token => token.id === dragTokenId ? { ...token, row, col } : token)
          }
          const source = availableTokens.find(token => token.id === dragTokenId)
          return source ? [...current, { ...source, row, col }] : current
        })
      }
      setDragTokenId(null)
      setDragPreviewToken(null)
    }
    // Move the preview straight in the DOM: no React re-render of the whole grid per pointermove
    const moveDrag = (e) => {
      dragPosRef.current = { x: e.clientX, y: e.clientY }
      const node = dragPreviewRef.current
      if (node) node.style.transform = dragPreviewTransform(dragPosRef.current)
    }
    const cancelDrag = () => {
      setDragTokenId(null)
      setDragPreviewToken(null)
    }

    window.addEventListener('pointermove', moveDrag)
    window.addEventListener('pointerup', finishDrag)
    window.addEventListener('pointercancel', cancelDrag)
    return () => {
      window.removeEventListener('pointermove', moveDrag)
      window.removeEventListener('pointerup', finishDrag)
      window.removeEventListener('pointercancel', cancelDrag)
      window.removeEventListener('touchmove', preventTouchScroll)
    }
  }, [availableTokens, dragTokenId, mode, selectedPlanId])

  // ── Data loading ──
  const loadPlans = useCallback(async () => {
    if (!activeCampaign) return
    setPlansLoading(true)
    setPlansError('')
    try {
      const data = await api(`/levels/${activeCampaign._id}`)
      setPlans(data || [])
    } catch (err) {
      setPlansError(err.message || 'Failed to load maps')
    } finally {
      setPlansLoading(false)
    }
  }, [activeCampaign])

  useEffect(() => { loadPlans() }, [loadPlans])

  // Load party members + lore combatants for token pool.
  // Both requests are fetched in parallel via Promise.allSettled and the
  // pool is only committed to state once BOTH have resolved — previously
  // this called setAvailableTokens() inside the lore .then() alone, so if
  // the lore request finished before the (usually slower) members/characters
  // request, party members would silently be dropped from the pool and
  // players could never be dragged onto the map.
  useEffect(() => {
    if (!activeCampaign) return
    let cancelled = false

    Promise.allSettled([
      api(`/campaigns/${activeCampaign._id}/members/characters`),
      api(`/lore/${activeCampaign._id}`),
    ]).then(([membersRes, loreRes]) => {
      if (cancelled) return
      const pool = []

      const members = membersRes.status === 'fulfilled' ? membersRes.value : []
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

      const lore = loreRes.status === 'fulfilled' ? loreRes.value : []
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

      setAvailableTokens(pool)
    })

    return () => { cancelled = true }
  }, [activeCampaign?._id, mode])

  // Measure cell size from grid DOM
  useEffect(() => {
    if (!gridRef.current) return
    let frame = 0
    const obs = new ResizeObserver(() => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const el = gridRef.current
        if (!el || !el.offsetWidth || !el.offsetHeight) return
        const size = Math.min(el.offsetWidth / GRID_W, el.offsetHeight / GRID_H)
        setCellSize(prev => Math.abs(prev - size) < 0.5 ? prev : size)
      })
    })
    obs.observe(gridRef.current)
    return () => { cancelAnimationFrame(frame); obs.disconnect() }
  }, [mode])

  // ── Real-time collaborative board ──
  // Join the room for this map while in Play mode so every DM/player looking
  // at the same board sees token moves, adds, removes, and HP changes live.
  useEffect(() => {
    if (mode !== 'play' || !selectedPlanId) return
    const socket = getSocket()
    const onTokens = (remoteTokens) => {
      remoteUpdateRef.current = true
      setTokens(Array.isArray(remoteTokens) ? remoteTokens : [])
    }
    const onPresence = (users) => setViewers(Array.isArray(users) ? users : [])
    const onDarkMode = (enabled) => {
      setDarkMode(Boolean(enabled))
      setPlans(current => current.map(plan => plan._id === selectedPlanId ? { ...plan, darkMode: Boolean(enabled) } : plan))
    }
    const onDoorStates = (states) => {
      const normalized = normalizeDoorStates(states)
      setDoorStates(normalized)
      setPlans(current => current.map(plan => plan._id === selectedPlanId ? { ...plan, doorStates: normalized } : plan))
    }
    const onTravel = ({ destinationId, destinationPlan } = {}) => {
      const existingPlan = plansRef.current.find(plan => plan._id === destinationId)
      const destination = destinationPlan ? { ...(existingPlan || {}), ...destinationPlan } : existingPlan
      if (!destination) {
        toastRef.current('The linked map is not available in this campaign')
        return
      }
      setPlans(current => current.some(plan => plan._id === destination._id)
        ? current.map(plan => plan._id === destination._id ? destination : plan)
        : [...current, destination])
      const parsed = parseMapContent(destination.content)
      setSelectedPlanId(destination._id)
      setGrid(parsed.ground)
      setObjectGrid(parsed.objects)
      setStairLinks(parsed.stairLinks)
      setTokens(Array.isArray(destination.tokens) ? destination.tokens : [])
      setDarkMode(Boolean(destination.darkMode))
      setDoorStates(normalizeDoorStates(destination.doorStates))
    }
    const onDoorState = ({ row, col, open } = {}) => {
      if (!Number.isInteger(row) || !Number.isInteger(col) || row < 0 || row >= GRID_H || col < 0 || col >= GRID_W || typeof open !== 'boolean') return
      setDoorStates(current => current.map((cells, r) => r === row
        ? cells.map((isOpen, c) => c === col ? open : isOpen)
        : cells))
      setPlans(current => current.map(plan => {
        if (plan._id !== selectedPlanId) return plan
        const states = normalizeDoorStates(plan.doorStates)
        states[row][col] = open
        return { ...plan, doorStates: states }
      }))
    }
    socket.on('level:tokens', onTokens)
    socket.on('level:presence', onPresence)
    socket.on('level:dark-mode', onDarkMode)
    socket.on('level:doors', onDoorStates)
    socket.on('level:door', onDoorState)
    socket.on('level:travel', onTravel)
    socket.emit('level:join', selectedPlanId)
    return () => {
      socket.off('level:tokens', onTokens)
      socket.off('level:presence', onPresence)
      socket.off('level:dark-mode', onDarkMode)
      socket.off('level:doors', onDoorStates)
      socket.off('level:door', onDoorState)
      socket.off('level:travel', onTravel)
      socket.emit('level:leave', selectedPlanId)
      setViewers([])
    }
  }, [mode, selectedPlanId])

  // Broadcast + persist whenever the local token layout changes — but not
  // when the change just arrived from someone else, to avoid an echo loop.
  useEffect(() => {
    if (mode !== 'play' || !selectedPlanId) return
    if (remoteUpdateRef.current) { remoteUpdateRef.current = false; return }
    if (isPublicDemoPath()) {
      setPlans(current => current.map(plan => plan._id === selectedPlanId ? { ...plan, tokens } : plan))
    }
    getSocket().emit('level:tokens', { planId: selectedPlanId, tokens })
  }, [tokens, mode, selectedPlanId])

  // ── Gallery actions ──
  const openEditor = (plan = null) => {
    if (!isDm) return
    if (plan) {
      setEditPlanId(plan._id)
      setEditTitle(plan.title)
      setDarkMode(Boolean(plan.darkMode))
      const parsed = parseMapContent(plan.content)
      setGrid(parsed.ground)
      setObjectGrid(parsed.objects)
      setStairLinks(parsed.stairLinks)
      setDoorStates(normalizeDoorStates(plan.doorStates))
    } else {
      setEditPlanId(null)
      setEditTitle('')
      setDarkMode(false)
      setGrid(blankGrid())
      setObjectGrid(blankObjectGrid())
      setStairLinks(blankStairLinks())
      setDoorStates(blankDoorStates())
    }
    setEditTheme(resolveThemeId(plan?.theme))
    setEditLayer('ground')
    setTool('wall')
    setLinkMode(false)
    setPendingStair(null)
    setMode('editor')
  }

  const openPlay = (plan) => {
    setSelectedPlanId(plan._id)
    const parsed = parseMapContent(plan.content)
    setGrid(parsed.ground)
    setObjectGrid(parsed.objects)
    setStairLinks(parsed.stairLinks)
    setDarkMode(Boolean(plan.darkMode))
    setDoorStates(normalizeDoorStates(plan.doorStates))
    setTokens(Array.isArray(plan.tokens) ? plan.tokens : [])
    setMode('play')
    if (isDm && activeCampaign && !activeCampaign.isPersonal) {
      getSocket().timeout(5000).emit('level:show', {
        campaignId: activeCampaign._id,
        planId: plan._id,
      }, (error, response) => {
        if (error) toast('Could not open the map for players')
        else if (!response?.ok) toast(response?.error || 'Could not open the map for players')
      })
    }
  }

  useEffect(() => {
    const planId = searchParams.get('map')
    if (!planId || !activeCampaign || plansLoading || mode === 'editor') return
    const plan = plans.find(item => item._id === planId)
    if (!plan) return
    openPlay(plan)
    setSearchParams(current => {
      const next = new URLSearchParams(current)
      next.delete('map')
      return next
    }, { replace: true })
  }, [activeCampaign, mode, plans, plansLoading, searchParams, setSearchParams])

  // If the DM saves without naming the map, auto-assign the next free
  // "Map N" name (Map1, Map2, ...) instead of blocking/prompting them.
  const nextAutoMapName = () => {
    let n = 1
    const taken = new Set(plans.map(p => (p.title || '').trim().toLowerCase()))
    while (taken.has(`map${n}`.toLowerCase())) n++
    return `Map${n}`
  }

  const saveMap = async () => {
    if (!activeCampaign) return
    const title = editTitle.trim() || nextAutoMapName()
    try {
      const body = {
        title,
        content: JSON.stringify({ ground: grid, objects: objectGrid, stairLinks }),
        doorStates,
        theme: editTheme,
      }
      const plan = editPlanId
        ? await api(`/levels/${editPlanId}`, { method: 'PUT', body })
        : await api(`/levels/${activeCampaign._id}`, { method: 'POST', body })
      setPlans(p => editPlanId ? p.map(x => x._id === plan._id ? plan : x) : [...p, plan])
      setEditPlanId(plan._id)
      setEditTitle(title)
      toast('Map saved')
      setMode('gallery')
    } catch (e) { toast(e.message || 'Failed to save') }
  }

  // Autosave an existing map 1.5s after any edit (tiles, doors, stairs, theme or title).
  // The first run for a map just records what was loaded, so opening a map saves nothing.
  const { schedule: scheduleMapSave, flush: flushMapSave } = useDebouncedSave(1500)
  const mapBaseline = useRef({ id: null, snap: '' })
  useEffect(() => {
    if (mode !== 'editor' || !editPlanId) { mapBaseline.current = { id: null, snap: '' }; return }
    const snap = JSON.stringify([grid, objectGrid, stairLinks, doorStates, editTheme, editTitle])
    if (mapBaseline.current.id !== editPlanId) { mapBaseline.current = { id: editPlanId, snap }; return }
    if (mapBaseline.current.snap === snap) return
    const id = editPlanId, title = editTitle.trim()
    const body = { content: JSON.stringify({ ground: grid, objects: objectGrid, stairLinks }), doorStates, theme: editTheme, ...(title ? { title } : {}) }
    scheduleMapSave(async () => {
      try {
        const plan = await api(`/levels/${id}`, { method: 'PUT', body })
        setPlans(p => p.map(x => x._id === plan._id ? plan : x))
        if (mapBaseline.current.id === id) mapBaseline.current.snap = snap
      } catch (e) { toastRef.current(e.message || 'Could not autosave the map') }
    })
  }, [grid, objectGrid, stairLinks, doorStates, editTheme, editTitle, mode, editPlanId]) // eslint-disable-line react-hooks/exhaustive-deps

  const deleteMap = async (id, e) => {
    e.stopPropagation()
    if (!window.confirm('Delete this map?')) return
    await api(`/levels/${id}`, { method: 'DELETE' })
    setPlans(p => p.filter(x => x._id !== id))
    if (selectedPlanId === id) { setSelectedPlanId(null); setMode('gallery') }
    toast('Map deleted')
  }

  // ── Paint ──
  const paint = (r, c) => {
    if (editLayer === 'objects') {
      setObjectGrid(current => {
        const next = current.map(row => row.slice())
        next[r][c] = tool === 'object-erase' ? null : tool
        return next
      })
      return
    }
    setGrid(current => {
      const next = current.map(row => row.slice())
      next[r][c] = tool
      return next
    })
    if (!['stairs', 'stairs-down'].includes(tool)) {
      setStairLinks(current => {
        const next = current.map(row => row.slice())
        next[r][c] = null
        return next
      })
    }
    if (tool !== 'door') {
      setDoorStates(current => current.map((row, index) =>
        index === r ? row.map((isOpen, col) => col === c ? false : isOpen) : row
      ))
    }
  }

  const handleEditorCellClick = (row, col) => {
    if (!linkMode) return
    if (!['stairs', 'stairs-down'].includes(grid[row]?.[col])) {
      toast('Place a stairs tile before linking it')
      return
    }
    setPendingStair({ row, col, direction: grid[row][col] === 'stairs' ? 'up' : 'down' })
    setLinkDestinationId(stairLinks[row]?.[col] || '')
  }

  const saveStairLink = () => {
    if (!pendingStair || !linkDestinationId) return
    setStairLinks(current => {
      const next = current.map(row => row.slice())
      next[pendingStair.row][pendingStair.col] = linkDestinationId
      return next
    })
    setPendingStair(null)
    setLinkDestinationId('')
  }

  const removeStairLink = () => {
    if (!pendingStair) return
    setStairLinks(current => {
      const next = current.map(row => row.slice())
      next[pendingStair.row][pendingStair.col] = null
      return next
    })
    setPendingStair(null)
  }

  const toggleDoor = (row, col) => {
    const socket = getSocket()
    socket.timeout(5000).emit('level:door', {
      planId: selectedPlanId,
      row,
      col,
      open: !doorStates[row]?.[col],
    }, (error, response) => {
      if (error) toast('Could not update the door')
      else if (!response?.ok) toast(response?.error || 'Could not update the door')
    })
  }

  const travelViaStair = (row, col) => {
    if (!stairLinks[row]?.[col]) {
      toast('These stairs are not linked to another map')
      return
    }
    getSocket().timeout(5000).emit('level:travel', { planId: selectedPlanId, row, col }, (error, response) => {
      if (error) toast('Could not travel to the linked map')
      else if (!response?.ok) toast(response?.error || 'Could not travel to the linked map')
    })
  }

  const handlePlayCellClick = (event, row, col) => {
    if ((!tapToPlaceTokenId && event.target !== event.currentTarget) || !visibility.visible[row]?.[col]) return
    if (tapToPlaceTokenId) {
      setTokens(current => {
        if (current.some(token => token.id === tapToPlaceTokenId)) {
          return current.map(token => token.id === tapToPlaceTokenId ? { ...token, row, col } : token)
        }
        const source = availableTokens.find(token => token.id === tapToPlaceTokenId)
        return source ? [...current, { ...source, row, col }] : current
      })
      setTapToPlaceTokenId(null)
      return
    }
    if (grid[row]?.[col] === 'door') {
      toggleDoor(row, col)
      return
    }
    if (grid[row]?.[col] === 'stairs' || grid[row]?.[col] === 'stairs-down') travelViaStair(row, col)
  }

  const toggleTokenVision = (id, field) => {
    if (!isDm) return
    setTokens(current => current.map(token => token.id === id ? { ...token, [field]: !token[field] } : token))
  }

  const toggleDarkMode = (planId = selectedPlanId) => {
    if (!isDm || !planId) return
    const socket = getSocket()
    socket.timeout(5000).emit('level:dark-mode', { planId, darkMode: !darkMode }, (error, response) => {
      if (error) {
        toast('Could not update map lighting')
        return
      }
      if (!response?.ok) {
        toast(response?.error || 'Could not update map lighting')
        return
      }
      setDarkMode(response.darkMode)
      setPlans(current => current.map(plan => plan._id === planId ? { ...plan, darkMode: response.darkMode } : plan))
    })
  }

  const removeToken = (id) => setTokens(ts => ts.filter(t => t.id !== id))

  // Adjusting HP on the map now persists back to the source Lore entry (for
  // npc/enemy/boss tokens) via the existing PATCH /lore/:id/hp endpoint —
  // previously this only updated local component state, so HP changes were
  // lost on reload and lore combatants kept reverting to their default/10.
  const adjustTokenHp = (id, delta) => {
    if (!isDm) return
    setTokens(ts => ts.map(t => {
      if (t.id !== id) return t
      const nextHp = Math.max(0, Math.min(t.maxHp, (t.hp || 0) + delta))
      if (t.loreId) {
        api(`/lore/${t.loreId}/hp`, { method: 'PATCH', body: { hp: nextHp } }).catch(() => {})
        setAvailableTokens(ats => ats.map(a => a.id === t.id ? { ...a, hp: nextHp } : a))
      }
      return { ...t, hp: nextHp }
    }))
  }

  // ── Render ──
  const selectedPlan = plans.find(p => p._id === selectedPlanId)
  const isDemo = isPublicDemoPath()
  const mapLightSources = useMemo(
    () => isDemo ? [] : objectGrid.flatMap((row, r) => row.flatMap((id, c) => {
      const tile = objectTile(id)
      return tile?.lightRadius ? [{ row: r, col: c, radius: tile.lightRadius }] : []
    })),
    [isDemo, objectGrid],
  )
  const sharedLightSources = useMemo(() => [
    ...mapLightSources,
    ...tokens
      .filter(token => token.lightSource && Number.isInteger(token.row) && Number.isInteger(token.col))
      .map(token => ({ ...token, radius: TORCH_LIGHT_RADIUS })),
  ], [mapLightSources, tokens])
  const localPlayerToken = tokens.find(token => token.id === `char-${user?.id}`)
  const darkvisionSources = useMemo(() => isDm
    ? tokens.filter(token => token.darkvision && Number.isInteger(token.row) && Number.isInteger(token.col))
    : localPlayerToken?.darkvision ? [localPlayerToken] : [],
  [isDm, localPlayerToken, tokens])
  const visibility = useMemo(() => {
    const visible = []
    const torchlit = []
    const darkvision = []
    const lightStrength = []
    for (let row = 0; row < GRID_H; row++) {
      visible[row] = []
      torchlit[row] = []
      darkvision[row] = []
      lightStrength[row] = []
      for (let col = 0; col < GRID_W; col++) {
        const nearbyLights = sharedLightSources
          .filter(source => canSeeFrom(grid, doorStates, source, row, col, source.radius))
          .map(source => ({
            distance: Math.max(Math.abs(source.row - row), Math.abs(source.col - col)),
            radius: source.radius,
          }))
        const sharedLight = nearbyLights.length > 0
        const hasDarkvision = darkvisionSources.some(source =>
          canSeeFrom(grid, doorStates, source, row, col, DARKVISION_RADIUS)
        )
        visible[row][col] = !darkMode || sharedLight || hasDarkvision
        torchlit[row][col] = !darkMode || sharedLight
        darkvision[row][col] = darkMode && hasDarkvision && !sharedLight
        lightStrength[row][col] = sharedLight
          ? Math.max(...nearbyLights.map(({ distance, radius }) => {
              const coreRadius = Math.floor(radius * 0.6)
              return distance <= coreRadius
                ? 1
                : 1 - ((distance - coreRadius) / Math.max(1, radius - coreRadius)) * 0.55
            }))
          : 0
      }
    }
    return { visible, torchlit, darkvision, lightStrength }
  }, [darkMode, doorStates, grid, isDm, darkvisionSources, sharedLightSources])

  if (!activeCampaign && !campaignsLoading) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}>
      {campaignsError
        ? <div style={{ textAlign: 'center' }}>
            <p style={{ marginBottom: 12 }}>{campaignsError}</p>
            <button className="btn btn-ghost" onClick={reloadCampaigns}>Retry</button>
          </div>
        : 'Select a campaign.'}
    </div>
  )

  // ── EDITOR MODE ──
  if (mode === 'editor') return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <style>{`
        .lb-cell { aspect-ratio: 1; border: 0.5px solid rgba(0,0,0,0.1); cursor: crosshair; touch-action: none; }
        .lb-editor-canvas-wrap, .lb-editor-canvas-wrap * { user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; }
        .lb-editor-workspace { display: flex; flex: 1; min-height: 0; overflow: hidden; }
        .lb-editor-tools { width: 248px; flex: 0 0 248px; padding: 10px; overflow-y: auto; background: var(--surface); border-right: 1px solid var(--border); }
        .lb-tool-palettes { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
        .lb-tool-palette { min-width: 0; padding: 7px; border: 1px solid var(--border); border-radius: 8px; background: var(--surface2); }
        .lb-tool-palette-title { margin-bottom: 4px; color: var(--text-3); font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }
        .lb-tool-palette-buttons { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 4px; }
        .lb-tool-palette-buttons .btn { justify-content: flex-start; min-width: 0; padding: 5px 6px; font-size: 10px; }
        .lb-tool-palette-buttons .btn span:last-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .lb-editor-map { flex: 1; min-width: 0; min-height: 0; overflow: hidden; padding: 0; background: #2a2a2a; display: flex; flex-direction: column; align-items: stretch; }
        .lb-editor-canvas-wrap { flex: 1; min-height: 0; width: 100%; overflow: auto; padding: 16px; display: flex; align-items: flex-start; justify-content: center; }
        .level-darkness-toggle {
          position: relative;
          display: inline-flex;
          align-items: center;
          width: 190px;
          height: 34px;
          padding: 3px;
          border: 1px solid var(--border);
          border-radius: 999px;
          background: #f3cf72;
          color: #44320a;
          cursor: pointer;
          flex-shrink: 0;
          transition: background-color 220ms ease, border-color 220ms ease;
        }
        .level-darkness-toggle[data-dark="true"] { background: #303541; border-color: #596273; color: #fff; }
        .level-darkness-toggle:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }
        .level-darkness-toggle-label {
          z-index: 1;
          width: 50%;
          text-align: center;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.02em;
          transition: color 220ms ease;
        }
        .level-darkness-toggle-thumb {
          position: absolute;
          top: 3px;
          left: 3px;
          width: calc(50% - 3px);
          height: calc(100% - 6px);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.92);
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.24);
          transform: translateX(0);
          transition: transform 220ms cubic-bezier(0.4, 0.0, 0.2, 1);
        }
        .level-darkness-toggle[data-dark="true"] .level-darkness-toggle-thumb { transform: translateX(100%); background: #8993a6; }
        .level-darkness-toggle:disabled { opacity: 0.65; cursor: wait; }
        @media (max-width: 700px) {
          .lb-editor-workspace { flex-direction: column; }
          .lb-editor-tools { width: auto; flex: 0 0 auto; max-height: 28vh; padding: 6px; border-right: 0; border-bottom: 1px solid var(--border); }
          .lb-tool-palettes { flex-direction: row; align-items: stretch; }
          .lb-tool-palette { flex: 1; }
          .lb-tool-palette-buttons { max-height: 84px; overflow-y: auto; }
          .lb-tool-palette-buttons .btn { font-size: 9px; }
          .lb-editor-canvas-wrap { padding: 8px; }
        }
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
        <select
          className="input"
          aria-label="Tile theme"
          title="Tile theme"
          value={editTheme}
          onChange={e => setEditTheme(resolveThemeId(e.target.value))}
          style={{ width: 190 }}
        >
          {THEMES.map(theme => (
            <option key={theme.id} value={theme.id} disabled={!theme.available}>{theme.label}</option>
          ))}
        </select>
        {isDm && editPlanId && (
          <button
            type="button"
            className="level-darkness-toggle"
            data-dark={darkMode}
            onClick={() => toggleDarkMode(editPlanId)}
            aria-label="Fog of war (map darkness for players)"
            aria-pressed={darkMode}
            title={darkMode ? 'Fog of war is on for players' : 'Fog of war is off for players'}
          >
            <span className="level-darkness-toggle-thumb" aria-hidden="true" />
            <span className="level-darkness-toggle-label">☀ Fog off</span>
            <span className="level-darkness-toggle-label">☾ Fog of war</span>
          </button>
        )}
        <div style={{ display: 'flex', gap: 8, flexShrink: 0, marginLeft: 'auto' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => { flushMapSave(); setMode('gallery') }}>{editPlanId ? '← Back' : '✕ Cancel'}</button>
          <button className="btn btn-ghost btn-sm" onClick={() => window.print()}>Print</button>
          <button className="btn btn-primary btn-sm" onClick={saveMap}>Save & Close</button>
        </div>
      </div>

      <div className="lb-editor-workspace">
      <aside className="lb-editor-tools" aria-label="Map tile selection">
        <div className="lb-tool-palettes">
          {[
            { layer: 'ground', title: 'Ground Tiles', tiles: TILES.filter(tile => tile.id !== 'chest') },
            { layer: 'objects', title: 'Upper Layer Objects', tiles: OBJECT_TILES },
          ].map(palette => (
            <div key={palette.layer} className="lb-tool-palette" style={{
              borderColor: editLayer === palette.layer && !linkMode ? 'var(--gold)' : 'var(--border)',
              boxShadow: editLayer === palette.layer && !linkMode ? 'inset 0 0 0 1px var(--gold)' : undefined,
            }}>
              <div className="lb-tool-palette-title">{palette.title}</div>
              <div className="lb-tool-palette-buttons">
                {palette.tiles.map(tile => {
                  const selected = editLayer === palette.layer && tool === tile.id && !linkMode
                  return (
                    <button key={tile.id} type="button" onClick={() => {
                      setEditLayer(palette.layer)
                      setTool(tile.id)
                      setLinkMode(false)
                      setPendingStair(null)
                    }} className="btn btn-sm" aria-pressed={selected} style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      border: selected ? '2px solid var(--gold)' : '1px solid var(--border)',
                      background: selected ? 'var(--gold-bg)' : 'var(--surface)', color: 'var(--text)',
                    }}>
                      {tile.imageUrl || tile.iconUrl || tile.id.startsWith('rock-')
                        ? <TileIconPlaceholder tile={tile} style={{ width: 14, height: 14, flexShrink: 0 }} />
                        : <span style={{ width: 12, height: 12, borderRadius: 2, background: tile.color === 'transparent' || !tile.color ? 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 50%/6px 6px' : tile.color, border: '1px solid rgba(0,0,0,0.2)', flexShrink: 0 }} />
                      }
                      <span title={tile.label} style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tile.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
        <button type="button" className="btn btn-ghost btn-sm" aria-pressed={linkMode} onClick={() => {
          setEditLayer('ground')
          setTool('wall')
          setLinkMode(current => !current)
          setPendingStair(null)
          setPainting(false)
        }} style={{ width: '100%', marginTop: 8, justifyContent: 'center' }}>🔗 Link stairs</button>
      </aside>
      <main className="lb-editor-map">
      {linkMode && pendingStair && (
        <div style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface2)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <span style={{ fontSize: 12, color: 'var(--text-2)' }}>
            Link {pendingStair.direction} stairs at ({pendingStair.row + 1}, {pendingStair.col + 1}) to:
          </span>
          <select className="input" value={linkDestinationId} onChange={event => setLinkDestinationId(event.target.value)} style={{ width: 220, padding: '5px 8px' }}>
            <option value="">Choose a map…</option>
            {plans.filter(plan => plan._id !== editPlanId).map(plan => (
              <option key={plan._id} value={plan._id}>{plan.title}</option>
            ))}
          </select>
          <button type="button" className="btn btn-primary btn-sm" disabled={!linkDestinationId} onClick={saveStairLink}>Link</button>
          {stairLinks[pendingStair.row]?.[pendingStair.col] && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={removeStairLink}>Unlink</button>
          )}
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPendingStair(null)}>Cancel</button>
          {!plans.some(plan => plan._id !== editPlanId) && <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Save another map in this campaign first.</span>}
        </div>
      )}

      {/* Grid — fills remaining height */}
      <div className="lb-editor-canvas-wrap">
        <div
          id="level-print"
          onTouchMove={e => {
            // Finger-drag painting: paint every cell the finger passes over.
            if (linkMode) return
            const t = e.touches[0]
            const el = t && document.elementFromPoint(t.clientX, t.clientY)?.closest('[data-lb-cell]')
            if (!el || el.dataset.lbCell === lastTouchCell.current) return
            lastTouchCell.current = el.dataset.lbCell
            const [r, c] = el.dataset.lbCell.split('-').map(Number)
            paint(r, c)
          }}
          onTouchEnd={() => { lastTouchCell.current = null }}
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
            const object = objectTile(objectGrid[r]?.[c])
            return (
              <div key={`${r}-${c}`} className="lb-cell" data-lb-cell={`${r}-${c}`}
                onMouseDown={() => { if (linkMode) return; setPainting(true); paint(r, c) }}
                onMouseEnter={() => { if (painting && !linkMode) paint(r, c) }}
                onClick={() => handleEditorCellClick(r, c)}
                onTouchStart={() => { if (!linkMode) paint(r, c) }}
                style={{ background: t.color === 'transparent' ? '#f5f4f1' : t.color, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}
              >
                {t.imageUrl && <TileIconPlaceholder tile={t} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
                {t.iconUrl && <TileIconPlaceholder tile={t} style={{ position: 'absolute', inset: '21%', width: '58%', height: '58%' }} />}
                {stairLinks[r]?.[c] && <span aria-label="Linked stairs" style={{ position: 'absolute', top: 0, right: 1, color: '#fff', fontSize: 8, textShadow: '0 1px 2px #000', pointerEvents: 'none' }}>↗</span>}
                {object && object.id !== 'object-erase' && (object.imageUrl || object.iconUrl || object.id.startsWith('rock-')) && <TileIconPlaceholder tile={object} style={{ position: 'absolute', zIndex: 1 }} />}
                {darkMode && !visibility.torchlit[r]?.[c] && !visibility.darkvision[r]?.[c] && (
                  <div
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      zIndex: 5,
                      background: isDemo ? '#000' : 'rgba(0, 0, 0, 0.86)',
                      pointerEvents: 'none',
                    }}
                  />
                )}
              </div>
            )
          }))}
        </div>
      </div>
      </main>
      </div>
    </div>
  )

  // ── PLAY MODE ──
  if (mode === 'play') return (
    <div ref={playRootRef} className="level-play" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: isFullscreen ? '#000' : 'var(--bg, #111)' }}>
      <style>{`
        .level-play-scroll { scrollbar-width: none; -ms-overflow-style: none; }
        .level-play-scroll::-webkit-scrollbar { display: none; }
        .level-play-map, .level-play-map * { user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; }
        .level-play-content { min-height: 0; }
        .level-play-controls { right: 18px; }
        .level-play-controls[data-tokens-open="true"] { right: 258px; }
        .level-play-tokens { border-left: 1px solid var(--border); overflow: hidden; }
        .level-play-token-list { flex: 1; overflow-y: auto; padding: 8px; }
        .level-play-token-heading { font-size: 10px; color: var(--text-3); margin-bottom: 4px; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.05em; }
        .level-play-token-entry { margin-bottom: 4px; }
        .level-play-on-map { border-top: 1px solid var(--border); padding: 8px; }
        .level-play-on-map-list { max-height: 220px; overflow-y: auto; }
        .level-play-on-map-row { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; font-size: 12px; }
        .level-darkness-toggle {
          position: relative;
          display: inline-flex;
          align-items: center;
          width: 190px;
          height: 34px;
          padding: 3px;
          border: 1px solid var(--border);
          border-radius: 999px;
          background: #f3cf72;
          color: #44320a;
          cursor: pointer;
          flex-shrink: 0;
          transition: background-color 220ms ease, border-color 220ms ease;
        }
        .level-darkness-toggle[data-dark="true"] {
          background: #303541;
          border-color: #596273;
          color: #fff;
        }
        .level-darkness-toggle:focus-visible {
          outline: 2px solid var(--gold);
          outline-offset: 2px;
        }
        .level-darkness-toggle-label {
          z-index: 1;
          width: 50%;
          text-align: center;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.02em;
          transition: color 220ms ease;
        }
        .level-darkness-toggle-thumb {
          position: absolute;
          top: 3px;
          left: 3px;
          width: calc(50% - 3px);
          height: calc(100% - 6px);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.92);
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.24);
          transform: translateX(0);
          transition: transform 220ms cubic-bezier(0.4, 0.0, 0.2, 1);
        }
        .level-darkness-toggle[data-dark="true"] .level-darkness-toggle-thumb {
          transform: translateX(100%);
          background: #8993a6;
        }
        .level-darkness-toggle:disabled {
          opacity: 0.65;
          cursor: wait;
        }
        @media (max-width: 700px) {
          .level-play { height: 100%; min-height: 0; }
          .level-play-toolbar { gap: 6px !important; padding: 8px !important; flex-wrap: wrap; overflow-x: hidden; }
          .level-play-toolbar > span:first-child { flex: 1 0 100%; }
          .level-play-content { flex-direction: column; }
          .level-play-map { min-height: 0; flex: 1 1 auto !important; padding: 0 !important; }
          .level-play-map > div { width: 100% !important; max-width: 100% !important; }
          .level-play-tokens { top: auto !important; left: 0 !important; right: 0 !important; bottom: 0 !important; width: 100% !important; height: 34vh; min-height: 155px; max-height: 270px; border-left: 0 !important; border-top: 1px solid var(--border); }
          .level-play-map > .level-play-controls { left: auto !important; right: 10px !important; bottom: 10px !important; width: max-content !important; max-width: calc(100% - 20px) !important; }
          .level-play-map > .level-play-controls[data-tokens-open="true"] { bottom: calc(max(155px, min(34vh, 270px)) + 10px) !important; }
          .level-play-toolbar > span:first-child { font-size: 15px; }
          .level-play-token-list { display: flex; flex: 1 1 auto; flex-direction: row; align-items: stretch; gap: 6px; overflow-x: auto; overflow-y: hidden; padding: 6px 8px; }
          .level-play-token-heading { display: none; }
          .level-play-token-entry { flex: 0 0 148px; margin: 0; }
          .level-play-token-empty { flex: 0 0 100%; }
          .level-play-on-map { flex: 0 0 43%; min-height: 0; overflow: hidden; padding: 6px 8px; }
          .level-play-on-map-list { display: flex; gap: 6px; max-height: none; height: 100%; overflow-x: auto; overflow-y: hidden; }
          .level-play-on-map-row { flex: 0 0 225px; margin: 0; padding: 5px; border: 1px solid var(--border); border-radius: 8px; }
          .level-play-on-map-row button { min-width: 30px !important; min-height: 30px !important; }
        }
      `}</style>
      {/* Play toolbar */}
      {!isFullscreen && <div className="level-play-toolbar" style={{ padding: '10px 16px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <span style={{ fontFamily: 'var(--font-title)', fontSize: 14, fontWeight: 600, flex: 1 }}>{selectedPlan?.title}</span>
        <PeekingViewers viewers={viewers} />
        {isDm && (
          <button
            type="button"
            className="level-darkness-toggle"
            data-dark={darkMode}
            onClick={() => toggleDarkMode(selectedPlanId)}
            aria-label="Fog of war (map darkness for players)"
            aria-pressed={darkMode}
            title={darkMode ? 'Fog of war is on for players' : 'Fog of war is off for players'}
          >
            <span className="level-darkness-toggle-thumb" aria-hidden="true" />
            <span className="level-darkness-toggle-label">☀ Fog off</span>
            <span className="level-darkness-toggle-label">☾ Fog of war</span>
          </button>
        )}
        <button className="btn btn-ghost btn-sm" onClick={() => { setTokens([]); setMode('gallery') }}>← Back</button>
        {isDm && <button className="btn btn-primary btn-sm" onClick={() => openEditor(selectedPlan)}>Edit Map</button>}
      </div>}

      <div className="level-play-content" style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Map area */}
        <div className="level-play-map" style={{ flex: 1, minWidth: 0, position: 'relative', overflow: 'hidden', padding: 0, background: '#000' }}>
          <div
            ref={scrollRef}
            className="level-play-scroll"
            onPointerDown={startPan}
            style={{ position: 'absolute', inset: 0, overflow: 'auto', cursor: zoom > 1 && !dragTokenId ? 'grab' : undefined, touchAction: dragTokenId ? 'none' : undefined }}
          >
          <div
            ref={gridRef}
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${GRID_W}, 1fr)`,
              gridTemplateRows: `repeat(${GRID_H}, 1fr)`,
              width: `${zoom * 100}%`,
              height: `${zoom * 100}%`,
              background: darkMode ? '#000' : '#fff',
              border: 'none',
              borderRadius: 0,
              overflow: 'hidden',
              position: 'relative',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              WebkitTouchCallout: 'none',
            }}
          >
            {grid.map((row, r) => row.map((cellId, c) => {
              const token = tokens.find(t => t.row === r && t.col === c)
              const object = objectTile(objectGrid[r]?.[c])
              const visible = visibility.visible[r]?.[c]
              const torchlit = visibility.torchlit[r]?.[c]
              const darkvision = visibility.darkvision[r]?.[c]
              const doorOpen = Boolean(doorStates[r]?.[c])
              const isDoor = cellId === 'door'
              const isStair = cellId === 'stairs' || cellId === 'stairs-down'
              const cellBase = isDoor && doorOpen ? 'floor' : cellId
              const lightStrength = visibility.lightStrength[r]?.[c] || 0
              const groundTile = TILES.find(tile => tile.id === cellBase)
              return (
                <div
                  key={`${r}-${c}`}
                  data-map-cell
                  data-row={r}
                  data-col={c}
                  onClick={event => handlePlayCellClick(event, r, c)}
                  title={visible && isDoor ? (doorOpen ? 'Click to close door' : 'Click to open door') : visible && isStair ? 'Click to use stairs' : undefined}
                  style={{
                    minWidth: 0,
                    minHeight: 0,
                    background: darkMode && !visible ? '#000' : tileColor(cellBase),
                    border: `0.5px solid ${darkMode && !visible ? 'transparent' : 'rgba(0,0,0,0.08)'}`,
                    position: 'relative',
                    filter: darkvision
                      ? 'brightness(0.35)'
                      : !isDm && darkMode && torchlit && lightStrength
                        ? `brightness(${0.45 + lightStrength * 0.55})`
                        : undefined,
                    cursor: visible && (isDoor || isStair) ? 'pointer' : undefined,
                  }}
                >
                  {groundTile?.imageUrl && visible && (
                    <img
                      src={groundTile.imageUrl}
                      alt=""
                      aria-hidden="true"
                      draggable="false"
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
                    />
                  )}
                  {groundTile?.iconUrl && visible && !(isDoor && doorOpen) && (
                    <TileIconPlaceholder tile={groundTile} style={{ position: 'absolute', inset: '21%', width: '58%', height: '58%', filter: darkvision ? 'brightness(0.35)' : undefined }} />
                  )}
                  {object && visible && (
                    <TileIconPlaceholder tile={object} style={{ position: 'absolute', zIndex: 1, filter: darkvision ? 'brightness(0.35)' : undefined }} />
                  )}
                  {token && (
                    <Token
                      token={token}
                      cellSize={cellSize}
                      onDragStart={startTokenDrag}
                      dragging={dragTokenId === token.id}
                    />
                  )}
                  {token?.lightSource && <span aria-hidden="true" style={{ position: 'absolute', top: -5, right: -3, zIndex: 11, fontSize: 10, pointerEvents: 'none' }}>🔥</span>}
                </div>
              )
            }))}
          </div>
          </div>
          <div className="level-play-controls" data-tokens-open={isDm && showTokens && !isFullscreen} style={{ position: 'absolute', bottom: 18, display: 'flex', gap: 4, opacity: 0.35, transition: 'opacity .15s', zIndex: 20 }} onMouseEnter={e => { e.currentTarget.style.opacity = 0.95 }} onMouseLeave={e => { e.currentTarget.style.opacity = 0.35 }}>
            {[
              ...(isDm && !isFullscreen ? [{ label: '☰', title: showTokens ? 'Hide tokens panel' : 'Show tokens panel', onClick: () => setShowTokens(v => !v) }] : []),
              { label: '−', title: 'Zoom out', onClick: () => changeZoom(-0.5), disabled: zoom <= 1 },
              { label: `${Math.round(zoom * 100)}%`, title: 'Reset zoom', onClick: () => changeZoom(0, true), disabled: zoom === 1 },
              { label: '+', title: 'Zoom in', onClick: () => changeZoom(0.5), disabled: zoom >= 4 },
              { label: isFullscreen ? '⤡' : '⤢', title: isFullscreen ? 'Exit fullscreen' : 'Fullscreen', onClick: toggleFullscreen },
            ].map(b => (
              <button key={b.title} type="button" title={b.title} aria-label={b.title} disabled={b.disabled} onClick={b.onClick}
                style={{ minWidth: 32, height: 32, padding: '0 8px', border: '1px solid rgba(255,255,255,0.35)', borderRadius: 6, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 13, cursor: 'pointer' }}>{b.label}</button>
            ))}
          </div>
        {/* Token panel (DM only) — overlays the map so the map keeps the same size for everyone; hidden in fullscreen */}
        {isDm && showTokens && !isFullscreen && (
        <div className="level-play-tokens" style={{ position: 'absolute', top: 0, right: 0, bottom: 0, zIndex: 15, width: 240, display: 'flex', flexDirection: 'column', background: 'var(--surface)', borderLeft: '1px solid var(--border)', overflow: 'hidden' }}>
        <div className="level-play-token-list">
            {/* Section: Players */}
            {availableTokens.filter(t => t.type === 'player').length > 0 && (
              <>
                <div className="level-play-token-heading">Party</div>
                {availableTokens.filter(t => t.type === 'player').map(t => (
                  <SidebarToken key={t.id} token={t} placed={!!tokens.find(x => x.id === t.id)} dragging={dragTokenId === t.id} selected={tapToPlaceTokenId === t.id} onDragStart={startTokenDrag} onSelect={setTapToPlaceTokenId} />
                ))}
              </>
            )}
            {/* Section: NPCs */}
            {availableTokens.filter(t => t.type === 'npc').length > 0 && (
              <>
                <div className="level-play-token-heading">NPCs</div>
                {availableTokens.filter(t => t.type === 'npc').map(t => (
                  <SidebarToken key={t.id} token={t} placed={!!tokens.find(x => x.id === t.id)} dragging={dragTokenId === t.id} selected={tapToPlaceTokenId === t.id} onDragStart={startTokenDrag} onSelect={setTapToPlaceTokenId} />
                ))}
              </>
            )}
            {/* Section: Enemies */}
            {availableTokens.filter(t => t.type === 'enemy').length > 0 && (
              <>
                <div className="level-play-token-heading" style={{ color: '#ef4444' }}>Enemies</div>
                {availableTokens.filter(t => t.type === 'enemy').map(t => (
                  <SidebarToken key={t.id} token={t} placed={!!tokens.find(x => x.id === t.id)} dragging={dragTokenId === t.id} selected={tapToPlaceTokenId === t.id} onDragStart={startTokenDrag} onSelect={setTapToPlaceTokenId} />
                ))}
              </>
            )}
            {/* Section: Bosses */}
            {availableTokens.filter(t => t.type === 'boss').length > 0 && (
              <>
                <div className="level-play-token-heading" style={{ color: '#f59e0b' }}>Bosses</div>
                {availableTokens.filter(t => t.type === 'boss').map(t => (
                  <SidebarToken key={t.id} token={t} placed={!!tokens.find(x => x.id === t.id)} dragging={dragTokenId === t.id} selected={tapToPlaceTokenId === t.id} onDragStart={startTokenDrag} onSelect={setTapToPlaceTokenId} />
                ))}
              </>
            )}
            {availableTokens.length === 0 && (
              <div className="level-play-token-empty" style={{ fontSize: 12, color: 'var(--text-3)', padding: '12px 4px', lineHeight: 1.6 }}>
                No tokens available. Add party members to the campaign, or add NPCs/enemies/bosses in the Lore section.
              </div>
            )}
          </div>

          {/* Placed tokens HP bar */}
          {tokens.length > 0 && (
            <div className="level-play-on-map">
              <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>On map</div>
              <div className="level-play-on-map-list">
              {tokens.map(t => (
                <div key={t.id} className="level-play-on-map-row">
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: t.color, border: '1px solid rgba(255,255,255,0.3)', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {t.avatar
                      ? <img src={t.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: 9, color: '#fff', fontWeight: 700 }}>{t.name?.[0]}</span>
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
                    {isDm && t.type === 'player' && (
                      <div style={{ display: 'flex', gap: 3, marginTop: 3 }}>
                        <button type="button" aria-pressed={Boolean(t.lightSource)} onClick={() => toggleTokenVision(t.id, 'lightSource')} title="Toggle shared torchlight" style={{ padding: '2px 4px', border: '1px solid var(--border)', borderRadius: 4, background: t.lightSource ? 'var(--gold-bg)' : 'transparent', color: 'var(--text-2)', fontSize: 9 }}>🔥 Light {t.lightSource ? 'On' : 'Off'}</button>
                        <button type="button" aria-pressed={Boolean(t.darkvision)} onClick={() => toggleTokenVision(t.id, 'darkvision')} title="Toggle this character’s darkvision" style={{ padding: '2px 4px', border: '1px solid var(--border)', borderRadius: 4, background: t.darkvision ? 'var(--gold-bg)' : 'transparent', color: 'var(--text-2)', fontSize: 9 }}>◉ Darkvision {t.darkvision ? 'On' : 'Off'}</button>
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <button onClick={() => adjustTokenHp(t.id, -1)} style={{ width: 16, height: 16, borderRadius: 3, border: '1px solid var(--border)', background: 'transparent', color: 'var(--red)', fontSize: 11, cursor: 'pointer', lineHeight: 1, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                    <span style={{ fontSize: 10, color: t.hp === 0 ? 'var(--red)' : 'var(--text-2)', minWidth: 28, textAlign: 'center' }}>{t.hp}/{t.maxHp}</span>
                    <button onClick={() => adjustTokenHp(t.id, 1)} style={{ width: 16, height: 16, borderRadius: 3, border: '1px solid var(--border)', background: 'transparent', color: 'var(--green)', fontSize: 11, cursor: 'pointer', lineHeight: 1, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                    <button onClick={() => removeToken(t.id)} style={{ marginLeft: 2, width: 16, height: 16, borderRadius: 3, border: 'none', background: 'transparent', color: 'var(--text-3)', fontSize: 12, cursor: 'pointer', lineHeight: 1, padding: 0 }}>✕</button>
                  </div>
                </div>
              ))}
              </div>
            </div>
          )}
        </div>
        )}
        </div>
      </div>
      {dragPreviewToken && createPortal(
        <div
          ref={dragPreviewRef}
          aria-hidden="true"
          style={{
            position: 'fixed',
            left: 0,
            top: 0,
            willChange: 'transform',
            width: Math.max(24, cellSize - 4),
            height: Math.max(24, cellSize - 4),
            transform: dragPreviewTransform(dragPosRef.current),
            borderRadius: '50%',
            overflow: 'hidden',
            background: dragPreviewToken.color || '#6366f1',
            border: '2px solid rgba(255,255,255,0.9)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: 10000,
          }}
        >
          {dragPreviewToken.avatar
            ? <img src={dragPreviewToken.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: Math.max(10, cellSize * 0.35), color: '#fff', fontWeight: 700, fontFamily: 'var(--font-title)' }}>{dragPreviewToken.name?.[0]?.toUpperCase() || '?'}</span>
          }
        </div>,
        playRootRef.current || document.body,
      )}
    </div>
  )

  // ── GALLERY MODE ──
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, background: 'var(--surface)' }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 20, marginBottom: 2 }}>Battle Map</h2>
        </div>
        {isDm && <button className="btn btn-primary" onClick={() => openEditor(null)}>+ Create New Map</button>}
      </div>

      {plansLoading ? (
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16, alignContent: 'start' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                <MapSkeleton />
                <div style={{ padding: '12px 14px' }}><SkeletonBlock width="62%" height={12} /></div>
              </div>
            ))}
          </div>
        </div>
      ) : plansError ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--text-2)' }}>
          <p>{plansError}</p>
          <button className="btn btn-ghost" onClick={loadPlans}>Retry</button>
        </div>
      ) : plans.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, color: 'var(--text-3)' }}>
          <div style={{ fontSize: 40, opacity: 0.3 }}>...</div>
          <div style={{ fontSize: 14 }}>No maps yet. </div>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: 16, alignContent: 'start' }}>
            {plans.map(plan => (
              <div
                key={plan._id}
                onClick={() => openPlay(plan)}
                style={{
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
                <MapThumb content={plan.content} theme={plan.theme} />
                <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: 'var(--font-title)', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{plan.title}</span>
                  {isDm && (
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button onClick={e => { e.stopPropagation(); openEditor(plan) }} title="Edit tiles"
                        style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 13 }}>✎</button>
                      <button onClick={e => deleteMap(plan._id, e)} title="Delete"
                        style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 13 }}>✕</button>
                    </div>
                  )}
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
function SidebarToken({ token, placed, dragging, selected, onDragStart, onSelect }) {
  const holdTimer = useRef(null)
  const pointerOrigin = useRef(null)

  const handlePointerDown = (event) => {
    if (placed) return
    if (event.pointerType !== 'touch') {
      onDragStart(event, token.id)
      return
    }

    pointerOrigin.current = { x: event.clientX, y: event.clientY }
    holdTimer.current = window.setTimeout(() => {
      onDragStart({ clientX: event.clientX, clientY: event.clientY, preventDefault() {} }, token.id)
      holdTimer.current = null
    }, 450)
  }

  const cancelHold = () => {
    if (holdTimer.current !== null) {
      window.clearTimeout(holdTimer.current)
      holdTimer.current = null
    }
  }

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={event => {
        const origin = pointerOrigin.current
        if (origin && Math.hypot(event.clientX - origin.x, event.clientY - origin.y) > 8) cancelHold()
      }}
      onPointerUp={cancelHold}
      onPointerCancel={cancelHold}
      className="level-play-token-entry"
      style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px',
        borderRadius: 8, marginBottom: 4,
        background: selected ? 'var(--gold-bg)' : placed ? 'var(--surface2)' : 'var(--surface)',
        border: `1px solid ${selected ? 'var(--gold)' : 'var(--border)'}`,
        opacity: placed ? 0.45 : dragging ? 0.25 : 1,
        cursor: placed ? 'default' : 'grab',
        userSelect: 'none',
        touchAction: 'pan-x',
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
      <button
        type="button"
        aria-pressed={selected}
        aria-label={`${selected ? 'Selected' : 'Select'} ${token.name} to place on map`}
        onPointerDown={event => event.stopPropagation()}
        onClick={event => { event.stopPropagation(); onSelect(selected ? null : token.id) }}
        style={{ border: `1px solid ${selected ? 'var(--gold)' : 'var(--border)'}`, borderRadius: 5, background: selected ? 'var(--gold-bg)' : 'transparent', color: selected ? 'var(--gold)' : 'var(--text-2)', fontSize: 10, padding: '5px 7px', minHeight: 30, cursor: 'pointer', whiteSpace: 'nowrap' }}
      >{selected ? 'Tap map' : placed ? 'Move' : 'Place'}</button>
    </div>
  )
}