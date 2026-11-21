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

  return (
    <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <h2 style={{ fontSize: 22, marginBottom: 4 }}>Map generator</h2>
        <p style={{ color: 'var(--text-2)', fontSize: 14, margin: 0 }}>
          Make a dungeon, city, camp, mountains and more, look at it flat or in 3D, then press the green <b>Save to my maps</b> button
          {campaign ? <> to add it to <b>{campaign.name}</b>.</> : '.'}
        </p>
      </div>

      <div aria-live="polite" style={{ minHeight: 0 }}>
        {!campaign && !error && <div role="status" style={{ fontSize: 13, color: 'var(--text-2)' }}>{NEEDS_CAMPAIGN}</div>}
        {status && <div role="status" style={{ fontSize: 14, fontWeight: 600, color: 'var(--green)' }}>{status}</div>}
        {error && <div role="alert" style={{ fontSize: 13, color: 'var(--red)' }}>{error}</div>}
      </div>

      <div style={{ position: 'relative', width: '100%', height: 'min(80vh, 820px)', minHeight: 420 }}>
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
    </div>
  )
}
