import { useEffect, useRef, useState } from 'react'

// Google Identity Services ("Sign in with Google") — the button hands back a
// signed ID token (`credential`) which the server verifies. Loaded once.
let gsiPromise = null
const loadGsi = () => {
  if (window.google?.accounts?.id) return Promise.resolve()
  if (!gsiPromise) {
    gsiPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.onload = resolve
      script.onerror = () => { gsiPromise = null; reject(new Error('Could not load Google sign-in')) }
      document.head.appendChild(script)
    })
  }
  return gsiPromise
}

// Display-only decode of the ID token (never trusted — the server verifies it).
export const readGoogleCredential = (credential) => {
  try {
    const json = atob(credential.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decodeURIComponent(Array.from(json, c => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`).join('')))
  } catch { return {} }
}

// GSI should be initialised once; the callback is routed to whichever
// GoogleButton is currently mounted.
let initializedClientId = null
let activeHandler = null

// The width Google's button is drawn at: never wider than the space it sits in, and a bit slimmer on phones.
const fitWidth = (el, wanted) => {
  const avail = el?.parentElement?.clientWidth || wanted
  const cap = window.innerWidth <= 480 ? 260 : 400
  return Math.round(Math.min(wanted, cap, Math.max(200, avail)))
}

export default function GoogleButton({ clientId, onCredential, text = 'continue_with', width = 316 }) {
  const ref = useRef(null)
  const callback = useRef(onCredential)
  callback.current = onCredential
  const [ready, setReady] = useState(false)   // Google's own button has been drawn
  const [failed, setFailed] = useState(false) // the Google script could not be loaded

  useEffect(() => {
    if (!clientId) return
    let cancelled = false, timer = null, tries = 0
    setReady(false); setFailed(false)
    const draw = () => {
      loadGsi().then(() => {
        if (cancelled || !ref.current) return
        activeHandler = callback
        if (initializedClientId !== clientId) {
          window.google.accounts.id.initialize({ client_id: clientId, callback: (resp) => activeHandler?.current?.(resp.credential) })
          initializedClientId = clientId
        }
        ref.current.innerHTML = ''
        window.google.accounts.id.renderButton(ref.current, { theme: 'outline', size: 'large', width: fitWidth(ref.current, width), text })
        setReady(true); setFailed(false)
      }).catch(() => {
        // A slow or dropped connection (common on mobile): try again a few times instead of leaving an empty gap.
        if (cancelled) return
        if (++tries < 4) timer = setTimeout(draw, 1500 * tries)
        else setFailed(true)
      })
    }
    draw()
    return () => {
      cancelled = true
      clearTimeout(timer)
      if (activeHandler === callback) activeHandler = null
    }
  }, [clientId, width, text])

  if (!clientId) return null
  return (
    <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', minHeight: 44 }}>
      <div ref={ref} style={{ display: 'flex', justifyContent: 'center', minHeight: 44, width: '100%' }} />
      {/* Shown straight away so the spot is never blank while Google's script is still loading */}
      {!ready && (
        <div aria-hidden={!failed} style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ width: `min(${Math.min(width, 260)}px, 100%)`, height: 40, border: '1px solid var(--border)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: 'var(--text-3)', background: 'var(--surface)' }}>
            {failed ? 'Google sign-in could not load. Refresh to try again.' : 'Loading Google sign-in…'}
          </div>
        </div>
      )}
    </div>
  )
}
