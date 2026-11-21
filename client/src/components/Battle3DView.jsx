import { useEffect, useMemo, useRef, useState } from 'react'
import { GAME_URL } from '../utils/godotGame'
import { viewerUrl, buildMapMessage, buildStateMessage, readViewerMessage } from '../utils/viewer3d'

// The live 3D view of the battle map: the Godot game in viewer mode, fed by this page (see utils/viewer3d.js). Only loaded when
// someone switches to 3D, so it adds nothing for everyone else.
export default function Battle3DView({ ground, objects, heights, doorStates, doorLocks, theme, tokens, levels, darkMode, night, focusId, classOf, onClick, onKey, tokensOpen }) {
  const frame = useRef(null)
  const [installed, setInstalled] = useState(null) // null while checking
  const [ready, setReady] = useState(false)
  const [syncKey, setSyncKey] = useState(0)        // bumped when the game (re)starts, so everything is sent again
  const src = useMemo(() => viewerUrl(GAME_URL), [])
  const gameOrigin = useMemo(() => new URL(GAME_URL, window.location.href).origin, [])
  const rows = ground.length
  const cols = ground[0]?.length || 0
  const callbacks = useRef({})
  callbacks.current = { onClick, onKey, rows, cols }

  // Is the game installed on this server? Only checkable when it is served from here: a missing file would otherwise come back
  // as the site's own page, so look for the game's own text in what comes back.
  useEffect(() => {
    if (gameOrigin !== window.location.origin) { setInstalled(true); return undefined }
    let cancelled = false
    fetch(GAME_URL).then(r => (r.ok ? r.text() : '')).then(t => { if (!cancelled) setInstalled(/godot/i.test(t)) }).catch(() => { if (!cancelled) setInstalled(false) })
    return () => { cancelled = true }
  }, [gameOrigin])

  // Only messages from the game in this frame, and only ones that pass the checks.
  useEffect(() => {
    const onMessage = (e) => {
      if (e.origin !== gameOrigin || e.source !== frame.current?.contentWindow) return
      const msg = readViewerMessage(e.data, callbacks.current.rows, callbacks.current.cols)
      if (!msg) return
      if (msg.type === 'ready') { setReady(true); setSyncKey(k => k + 1) }
      else if (msg.type === 'click') callbacks.current.onClick?.(msg)
      else if (msg.type === 'key') callbacks.current.onKey?.(msg.key)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [gameOrigin])

  const post = (message) => frame.current?.contentWindow?.postMessage(message, gameOrigin)

  // The map first (it changes rarely: new map, or a door opening), then who is where and how lit it is.
  useEffect(() => {
    if (ready) post(buildMapMessage({ ground, objects, doorStates, doorLocks, heights, theme }))
  }, [ready, syncKey, ground, objects, heights, doorStates, doorLocks, theme]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (ready) post(buildStateMessage({ tokens, levels, darkMode, night, focusId, classOf }))
  }, [ready, syncKey, tokens, levels, darkMode, night, focusId]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="level-play-scroll" data-tokens-open={Boolean(tokensOpen)} style={{ position: 'absolute', inset: 0, zIndex: 10, background: '#14110d' }}>
      {installed === false ? (
        <div style={{ padding: 24, color: 'var(--text-2)', fontSize: 14, lineHeight: 1.6 }}>
          <b style={{ color: 'var(--text)' }}>The 3D view is not installed on this server yet.</b><br />
          The game files are expected at <code>{GAME_URL}</code>.
        </div>
      ) : (
        <>
          <iframe ref={frame} src={src} title="3D view of the battle map" allow="fullscreen" onLoad={() => frame.current?.focus()}
            style={{ width: '100%', height: '100%', border: 0, display: 'block', background: '#14110d' }} />
          {!ready && <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: 'var(--text-3)', pointerEvents: 'none', fontSize: 14 }}>Loading the 3D view…</div>}
        </>
      )}
    </div>
  )
}
