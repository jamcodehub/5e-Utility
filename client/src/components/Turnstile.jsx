import { useEffect, useImperativeHandle, useRef, forwardRef } from 'react'

// Cloudflare Turnstile human check. Renders nothing without a site key (the
// server only enforces the check when it has a secret configured). Tokens are
// single-use, so call ref.reset() after every submit attempt.
let scriptPromise = null
const loadScript = () => {
  if (window.turnstile) return Promise.resolve()
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script')
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      s.async = true
      s.onload = resolve
      s.onerror = () => { scriptPromise = null; reject(new Error('Could not load the human check')) }
      document.head.appendChild(s)
    })
  }
  return scriptPromise
}

const Turnstile = forwardRef(function Turnstile({ siteKey, onToken }, ref) {
  const box = useRef(null)
  const widgetId = useRef(null)
  const cb = useRef(onToken)
  cb.current = onToken

  useImperativeHandle(ref, () => ({
    reset: () => { cb.current?.(''); if (widgetId.current != null && window.turnstile) window.turnstile.reset(widgetId.current) },
  }))

  useEffect(() => {
    if (!siteKey) return
    let cancelled = false
    loadScript().then(() => {
      if (cancelled || !box.current) return
      widgetId.current = window.turnstile.render(box.current, {
        sitekey: siteKey,
        callback: (t) => cb.current?.(t),
        'expired-callback': () => cb.current?.(''),
        'error-callback': () => cb.current?.(''),
      })
    }).catch(() => {})
    return () => {
      cancelled = true
      if (widgetId.current != null && window.turnstile) window.turnstile.remove(widgetId.current)
      widgetId.current = null
    }
  }, [siteKey])

  if (!siteKey) return null
  return <div ref={box} style={{ display: 'flex', justifyContent: 'center', margin: '0 0 12px' }} />
})

export default Turnstile
