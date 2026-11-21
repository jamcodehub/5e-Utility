import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, useAuth } from '../context/AuthContext'
import { useCampaign } from '../context/CampaignContext'
import { useToast } from '../hooks/useToast'
import { TILES } from '../data/levelTiles'
import { MESSAGE_TYPE, readGeneratedMap } from '../utils/generatedMap'

// The Godot game (web export). Set VITE_GODOT_MAP_URL to host it somewhere else; otherwise it is served from this site.
const GAME_URL = import.meta.env.VITE_GODOT_MAP_URL || '/godot/map-generator/index.html'
const GROUND_COLOR = Object.fromEntries(TILES.map(t => [t.id, t.color]))

// A small flat picture of the map that was just generated, so the DM can see what they are about to save.
function MapPreview({ content }) {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    let data
    try { data = JSON.parse(content) } catch { return }
    const h = data.ground.length
    const w = data.ground[0].length
    const cell = Math.max(4, Math.floor(440 / w))
    canvas.width = w * cell
    canvas.height = h * cell
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#1b1712'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const id = data.ground[y][x]
        if (id === 'empty') continue
        const color = GROUND_COLOR[id]
        ctx.fillStyle = color && color !== 'transparent' ? color : '#888888'
        ctx.fillRect(x * cell, y * cell, cell, cell)
        if (data.objects[y][x]) {
          ctx.fillStyle = 'rgba(255,255,255,0.55)'
          ctx.fillRect(x * cell + cell * 0.3, y * cell + cell * 0.3, cell * 0.4, cell * 0.4)
        }
      }
    }
  }, [content])
  return <canvas ref={ref} aria-label="Preview of the generated map" style={{ width: '100%', height: 'auto', borderRadius: 6, border: '1px solid var(--border)', display: 'block' }} />
}

// The DM makes a map in the Godot generator (embedded here), presses "Send to website" in it, and saves it as a battle map.
export default function MapGenerator() {
  const { user } = useAuth()
  const { activeCampaign } = useCampaign()
  const navigate = useNavigate()
  const { toast, ToastContainer } = useToast()
  const frame = useRef(null)
  const [installed, setInstalled] = useState(null) // null while checking
  const [loaded, setLoaded] = useState(false)
  const [received, setReceived] = useState(null)   // a checked map: { title, theme, content, width, height }
  const [title, setTitle] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const isDm = user?.role === 'dm'
  const gameOrigin = useMemo(() => new URL(GAME_URL, window.location.href).origin, [])
  const hasCampaign = !!activeCampaign && !activeCampaign.isPersonal

  // Is the game installed on this server? Only checkable when it is served from here: a missing file would otherwise come back
  // as the site's own page, so look for the game's own text in what comes back.
  useEffect(() => {
    if (gameOrigin !== window.location.origin) { setInstalled(true); return undefined }
    let cancelled = false
    fetch(GAME_URL).then(r => (r.ok ? r.text() : '')).then(t => { if (!cancelled) setInstalled(/godot/i.test(t)) }).catch(() => { if (!cancelled) setInstalled(false) })
    return () => { cancelled = true }
  }, [gameOrigin])

  // Only messages from the embedded game itself, and only maps that pass the checks.
  useEffect(() => {
    const onMessage = (e) => {
      if (e.origin !== gameOrigin || e.source !== frame.current?.contentWindow) return
      if (!e.data || e.data.type !== MESSAGE_TYPE) return
      const result = readGeneratedMap(e.data.map)
      if (result.error) { setError(result.error); setReceived(null); return }
      setError('')
      setReceived(result)
      setTitle(result.title)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [gameOrigin])

  const save = async () => {
    if (!received || !hasCampaign || saving) return
    setSaving(true)
    setError('')
    try {
      await api(`/levels/${activeCampaign._id}`, { method: 'POST', body: { title: title.trim() || received.title, content: received.content, theme: received.theme } })
      toast('Saved as a battle map')
      navigate('/levels')
    } catch (e) { setError(e.message || 'Could not save the map.') }
    setSaving(false)
  }

  if (!isDm) {
    return (
      <div className="page-content">
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>Map generator</h2>
        <div style={{ color: 'var(--text-3)' }}>Only Dungeon Masters can make maps. Switch to DM mode in Settings.</div>
      </div>
    )
  }

  return (
    <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <h2 style={{ fontSize: 22, marginBottom: 4 }}>Map generator</h2>
        <p style={{ color: 'var(--text-2)', fontSize: 14, margin: 0 }}>Make a dungeon, cave or village, look at it flat or in 3D, then press <b>Send to website</b> to save it as a battle map.</p>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ flex: '3 1 560px', minWidth: 0, position: 'relative', height: 'min(78vh, 760px)', minHeight: 420 }}>
          {installed === false ? (
            <div className="card" style={{ padding: 24, color: 'var(--text-2)', fontSize: 14, lineHeight: 1.6, height: '100%' }}>
              <b style={{ color: 'var(--text)' }}>The map generator is not installed on this server yet.</b><br />
              The game files are expected at <code>{GAME_URL}</code>.
            </div>
          ) : (
            <>
              <iframe ref={frame} src={GAME_URL} title="Map generator" allow="fullscreen" onLoad={() => setLoaded(true)}
                style={{ width: '100%', height: '100%', border: '1px solid var(--border)', borderRadius: 6, background: '#14110d', display: 'block' }} />
              {!loaded && <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: 'var(--text-3)', pointerEvents: 'none', fontSize: 14 }}>Loading the generator…</div>}
            </>
          )}
        </div>

        <aside className="card" style={{ flex: '1 1 280px', maxWidth: 480, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }} aria-live="polite">
          {received ? (
            <>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Your map</div>
              <MapPreview content={received.content} />
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{received.width} × {received.height}, {received.theme === 'scifi' ? 'Sci Fi' : received.theme === 'cartoon' ? 'Stylized Cartoon' : 'Medieval'} look</div>
              <label htmlFor="mapgen-title" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Map title</label>
              <input id="mapgen-title" className="input" maxLength={80} value={title} onChange={e => setTitle(e.target.value)} />
              {hasCampaign
                ? <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : `Save to ${activeCampaign.name}`}</button>
                : <div style={{ fontSize: 13, color: 'var(--text-2)' }}>Pick one of your campaigns in the menu at the top first. Maps are saved inside a campaign.</div>}
            </>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Your map</div>
              Nothing sent yet. Change the settings on the left until you like the map, then press <b>Send to website</b>. It appears here with a preview, ready to save.
            </div>
          )}
          {error && <div role="alert" style={{ fontSize: 13, color: 'var(--red)' }}>{error}</div>}
        </aside>
      </div>
      <ToastContainer />
    </div>
  )
}
