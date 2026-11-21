import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, useAuth } from '../context/AuthContext'
import { useCampaign } from '../context/CampaignContext'
import { MESSAGE_TYPE, readGeneratedMap } from '../utils/generatedMap'
import { GAME_URL } from '../utils/godotGame'

const NEEDS_CAMPAIGN = 'Pick one of your campaigns in the menu at the top first. Maps are saved inside a campaign.'

// The DM makes a map in the Godot generator (embedded here) and presses the green "Save to my maps" button in it. That is the
// last step: the map is checked and saved to the active campaign straight away, and the page goes to the Maps list.
export default function MapGenerator() {
  const { user } = useAuth()
  const { activeCampaign } = useCampaign()
  const navigate = useNavigate()
  const frame = useRef(null)
  const [installed, setInstalled] = useState(null) // null while checking
  const [loaded, setLoaded] = useState(false)
  const [status, setStatus] = useState('')   // 'Saving…' / 'Saved'
  const [error, setError] = useState('')
  const isDm = user?.role === 'dm'
  const gameOrigin = useMemo(() => new URL(GAME_URL, window.location.href).origin, [])
  const campaign = activeCampaign && !activeCampaign.isPersonal ? activeCampaign : null
  const latest = useRef({})
  latest.current = { campaign, navigate }
  const busy = useRef(false)

  // Is the game installed on this server? Only checkable when it is served from here: a missing file would otherwise come back
  // as the site's own page, so look for the game's own text in what comes back.
  useEffect(() => {
    if (gameOrigin !== window.location.origin) { setInstalled(true); return undefined }
    let cancelled = false
    fetch(GAME_URL).then(r => (r.ok ? r.text() : '')).then(t => { if (!cancelled) setInstalled(/godot/i.test(t)) }).catch(() => { if (!cancelled) setInstalled(false) })
    return () => { cancelled = true }
  }, [gameOrigin])

  // Only messages from the embedded game itself, and only maps that pass the checks. A good map is saved at once.
  useEffect(() => {
    const save = async (map, target) => {
      busy.current = true
      setError('')
      setStatus('Saving your map…')
      try {
        await api(`/levels/${target._id}`, { method: 'POST', body: { title: map.title, content: map.content, theme: map.theme } })
        setStatus(`Saved to ${target.name}`)
        setTimeout(() => latest.current.navigate('/levels'), 700)
      } catch (e) {
        setStatus('')
        setError(e.message || 'Could not save the map.')
        busy.current = false
      }
    }
    const onMessage = (e) => {
      if (e.origin !== gameOrigin || e.source !== frame.current?.contentWindow) return
      if (!e.data || e.data.type !== MESSAGE_TYPE || busy.current) return
      const result = readGeneratedMap(e.data.map)
      if (result.error) { setStatus(''); setError(result.error); return }
      const target = latest.current.campaign
      if (!target) { setStatus(''); setError(NEEDS_CAMPAIGN); return }
      save(result, target)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [gameOrigin])

  if (!isDm) {
    return (
      <div className="page-content">
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>Map generator</h2>
        <div style={{ color: 'var(--text-3)' }}>Only Dungeon Masters can make maps. Switch to DM mode in Settings.</div>
      </div>
    )
  }

  // The generator fills everything beside the sidebar: no heading, just the game and a way back to the maps. Anything the page has
  // to say (saving, saved, an error) floats over the top of the game.
  const note = error
    ? { text: error, color: '#ff8a80', role: 'alert' }
    : status
      ? { text: status, color: '#8fe3a8', role: 'status' }
      : !campaign
        ? { text: NEEDS_CAMPAIGN, color: '#f2ead8', role: 'status' }
        : null

  return (
    <div style={{ position: 'relative', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: '#14110d' }}>
      {installed === false ? (
        <div style={{ padding: 24, color: '#d8d0bd', fontSize: 14, lineHeight: 1.6 }}>
          <b style={{ color: '#f2ead8' }}>The map generator is not installed on this server yet.</b><br />
          The game files are expected at <code>{GAME_URL}</code>.
        </div>
      ) : (
        <>
          <iframe ref={frame} src={GAME_URL} title="Map generator" allow="fullscreen" onLoad={() => setLoaded(true)}
            style={{ flex: 1, width: '100%', minHeight: 0, border: 0, display: 'block', background: '#14110d' }} />
          {!loaded && <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: '#a89f8a', pointerEvents: 'none', fontSize: 14 }}>Loading the generator…</div>}
        </>
      )}

      <button type="button" onClick={() => navigate('/levels')}
        style={{ position: 'absolute', top: 10, right: 12, zIndex: 5, padding: '7px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600,
          background: 'rgba(20,17,13,0.85)', color: '#f2ead8', border: '1px solid rgba(255,255,255,0.28)' }}>
        ← Back to Maps
      </button>

      {note && (
        <div role={note.role} aria-live="polite" style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', zIndex: 5, maxWidth: 'min(70%, 560px)',
          padding: '8px 14px', borderRadius: 6, fontSize: 13, fontWeight: 600, textAlign: 'center', background: 'rgba(20,17,13,0.9)', color: note.color, border: '1px solid rgba(255,255,255,0.2)' }}>
          {note.text}
        </div>
      )}
    </div>
  )
}
