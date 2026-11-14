import { useEffect, useRef } from 'react'

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

export default function GoogleButton({ clientId, onCredential, text = 'continue_with', width = 316 }) {
  const ref = useRef(null)
  const callback = useRef(onCredential)
  callback.current = onCredential

  useEffect(() => {
    if (!clientId) return
    let cancelled = false
    loadGsi().then(() => {
      if (cancelled || !ref.current) return
      activeHandler = callback
      if (initializedClientId !== clientId) {
        window.google.accounts.id.initialize({ client_id: clientId, callback: (resp) => activeHandler?.current?.(resp.credential) })
        initializedClientId = clientId
      }
      window.google.accounts.id.renderButton(ref.current, { theme: 'outline', size: 'large', width, text })
    }).catch(() => {})
    return () => {
      cancelled = true
      if (activeHandler === callback) activeHandler = null
    }
  }, [clientId, width, text])

  if (!clientId) return null
  return <div ref={ref} style={{ display: 'flex', justifyContent: 'center', minHeight: 44 }} />
}
