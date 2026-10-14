import { useState, useEffect, useRef } from 'react'
import { api, useAuth } from '../context/AuthContext'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

function GoogleButton({ onCredential }) {
  const ref = useRef(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return
    if (window.google?.accounts?.id) { setReady(true); return }
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.onload = () => setReady(true)
    document.head.appendChild(script)
    return () => { document.head.removeChild(script) }
  }, [])

  useEffect(() => {
    if (!ready || !ref.current || !window.google?.accounts?.id) return
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (resp) => onCredential(resp.credential),
    })
    window.google.accounts.id.renderButton(ref.current, { theme: 'outline', size: 'large', width: 316, text: 'continue_with' })
  }, [ready, onCredential])

  if (!GOOGLE_CLIENT_ID) return null
  return <div ref={ref} style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }} />
}

export default function Auth() {
  const { login, register, verifyTwoFactor, loginWithGoogle, forgotPassword, resetPassword } = useAuth()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ username: '', email: '', password: '', phone: '', role: 'player' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [serverStatus, setServerStatus] = useState('connecting')

  // Two-factor step: once login() reports requires2FA, we show a code form.
  const [twoFA, setTwoFA] = useState(null) // { userId } | null

  // Forgot / reset password state
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)
  const [resetPw, setResetPw] = useState({ password: '', confirm: '' })
  const [resetDone, setResetDone] = useState(false)
  const [code, setCode] = useState('')

  // If the URL contains a reset token (from the emailed link), jump straight
  // into the reset-password form.
  const resetParams = (() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const id = params.get('id')
    return token && id ? { token, id } : null
  })()
  useEffect(() => { if (resetParams) setMode('reset') }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    let cancelled = false
    api('/health')
      .then(() => { if (!cancelled) setServerStatus('ready') })
      .catch(() => { if (!cancelled) setServerStatus('unavailable') })
    return () => { cancelled = true }
  }, [])

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      if (mode === 'login') {
        const result = await login(form.email, form.password)
        if (result?.requires2FA) setTwoFA({ userId: result.userId })
      } else {
        if (form.password.length < 8) throw new Error('Password must be at least 8 characters')
        await register(form.username, form.email, form.password, form.phone, form.role)
      }
    } catch (err) { setError(err.message) }
    setLoading(false)
  }

  const submitForgot = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      await forgotPassword(forgotEmail.trim())
      setForgotSent(true)
    } catch (err) { setError(err.message) }
    setLoading(false)
  }

  const submitReset = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      if (resetPw.password.length < 8) throw new Error('Password must be at least 8 characters')
      if (resetPw.password !== resetPw.confirm) throw new Error('Passwords do not match')
      await resetPassword(resetParams.id, resetParams.token, resetPw.password)
      setResetDone(true)
      // Clean the token out of the URL bar now that it's been used.
      window.history.replaceState({}, '', window.location.pathname)
    } catch (err) { setError(err.message) }
    setLoading(false)
  }

  const submitCode = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      await verifyTwoFactor(twoFA.userId, code.trim())
    } catch (err) { setError(err.message) }
    setLoading(false)
  }

  const handleGoogleCredential = async (credential) => {
    setError('')
    try { await loginWithGoogle(credential) } catch (err) { setError(err.message || 'Google sign-in failed') }
  }

  if (mode === 'forgot') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 20 }}>
        <div className="card" style={{ width: '100%', maxWidth: 380, padding: 32 }}>
          <div style={{ marginBottom: 20, textAlign: 'center' }}>
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: 20, fontWeight: 600, color: 'var(--gold)', marginBottom: 6 }}>Forgot your password?</div>
            <div style={{ fontSize: 13, color: 'var(--text-2)' }}>Enter your account email and we'll send you a reset link.</div>
          </div>
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--red)', marginBottom: 16 }}>{error}</div>
          )}
          {forgotSent ? (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--green)', marginBottom: 16 }}>
              If that email is registered, a reset link has been sent. Check your inbox.
            </div>
          ) : (
            <form onSubmit={submitForgot}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-2)', marginBottom: 5 }}>Email</label>
                <input className="input" type="email" placeholder="adventurer@realm.com" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} required autoFocus />
              </div>
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
            </form>
          )}
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button onClick={() => { setMode('login'); setError(''); setForgotSent(false) }} style={{ background: 'none', border: 'none', color: 'var(--text-3)', fontSize: 13, cursor: 'pointer' }}>← Back to sign in</button>
          </div>
        </div>
      </div>
    )
  }

  if (mode === 'reset') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 20 }}>
        <div className="card" style={{ width: '100%', maxWidth: 380, padding: 32 }}>
          <div style={{ marginBottom: 20, textAlign: 'center' }}>
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: 20, fontWeight: 600, color: 'var(--gold)', marginBottom: 6 }}>Choose a new password</div>
            {!resetDone && <div style={{ fontSize: 13, color: 'var(--text-2)' }}>Your reset link is valid for 1 hour.</div>}
          </div>
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--red)', marginBottom: 16 }}>{error}</div>
          )}
          {!resetParams ? (
            <div style={{ fontSize: 13, color: 'var(--text-2)', textAlign: 'center' }}>This reset link is missing or invalid. Please request a new one.</div>
          ) : resetDone ? (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--green)' }}>
              Password updated — you're now signed in!
            </div>
          ) : (
            <form onSubmit={submitReset}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-2)', marginBottom: 5 }}>New password</label>
                <input className="input" type="password" placeholder="••••••••" value={resetPw.password} onChange={e => setResetPw(p => ({ ...p, password: e.target.value }))} required autoFocus />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-2)', marginBottom: 5 }}>Confirm password</label>
                <input className="input" type="password" placeholder="••••••••" value={resetPw.confirm} onChange={e => setResetPw(p => ({ ...p, confirm: e.target.value }))} required />
              </div>
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
                {loading ? 'Saving...' : 'Reset password'}
              </button>
            </form>
          )}
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button onClick={() => { setMode('login'); setError('') }} style={{ background: 'none', border: 'none', color: 'var(--text-3)', fontSize: 13, cursor: 'pointer' }}>← Back to sign in</button>
          </div>
        </div>
      </div>
    )
  }

  if (twoFA) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 20 }}>
        <div className="card" style={{ width: '100%', maxWidth: 380, padding: 32 }}>
          <div style={{ marginBottom: 20, textAlign: 'center' }}>
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: 20, fontWeight: 600, color: 'var(--gold)', marginBottom: 6 }}>Two-factor verification</div>
            <div style={{ fontSize: 13, color: 'var(--text-2)' }}>Enter the 6-digit code we emailed you.</div>
          </div>
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--red)', marginBottom: 16 }}>{error}</div>
          )}
          <form onSubmit={submitCode}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-2)', marginBottom: 5 }}>Verification code</label>
              <input className="input" inputMode="numeric" maxLength={6} placeholder="123456" value={code} onChange={e => setCode(e.target.value)} required autoFocus style={{ textAlign: 'center', letterSpacing: '0.3em', fontSize: 18 }} />
            </div>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
              {loading ? 'Verifying...' : 'Verify & sign in'}
            </button>
          </form>
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button onClick={() => { setTwoFA(null); setCode(''); setError('') }} style={{ background: 'none', border: 'none', color: 'var(--text-3)', fontSize: 13, cursor: 'pointer' }}>← Back to sign in</button>
          </div>
        </div>
      </div>
    )
  }

return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 20 }}>
      <div className="card" style={{ width: '100%', maxWidth: 380, padding: 32 }}>
        <div style={{ marginBottom: 32, textAlign: 'center', display: 'flex', justifyContent: 'center' }}>
          <img 
            src="https://res.cloudinary.com/crcbzpw6/image/upload/v1786529766/lore-ledger/storyboard/sdniavu2yeigjupqxgou.png" 
            alt="5e Utility" 
            style={{ 
              height: '150px', 
              width: 'auto', 
              maxWidth: '80%', 
              objectFit: 'contain', 
              filter: 'var(--logo-filter, none) drop-shadow(0 4px 12px rgba(0, 0, 0, 0.25))' 
            }} 
          />
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--red)', marginBottom: 16 }}>
            {error}
          </div>
        )}
        {mode === 'login' && serverStatus === 'connecting' && (
          <div role="status" style={{ color: 'var(--text-3)', fontSize: 12, marginBottom: 12 }}>Connecting to the server…</div>
        )}
        {mode === 'login' && serverStatus === 'unavailable' && (
          <div role="status" style={{ color: 'var(--text-3)', fontSize: 12, marginBottom: 12 }}>The server isn’t responding yet. You can still try signing in.</div>
        )}

        <GoogleButton onCredential={handleGoogleCredential} />

        {GOOGLE_CLIENT_ID && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0 18px', color: 'var(--text-3)', fontSize: 11 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span>or use email</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>
        )}

        <form onSubmit={submit}>
          {mode === 'register' && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-2)', marginBottom: 5 }}>Username</label>
              <input className="input" placeholder="Boroos" value={form.username} onChange={set('username')} required />
            </div>
          )}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-2)', marginBottom: 5 }}>Email</label>
            <input className="input" type="email" placeholder="adventurer@realm.com" value={form.email} onChange={set('email')} required />
          </div>
          {mode === 'register' && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-2)', marginBottom: 5 }}>I am a...</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[{ v: 'player', label: 'Player' }, { v: 'dm', label: 'Dungeon Master' }].map(opt => (
                  <button key={opt.v} type="button" onClick={() => setForm(p => ({ ...p, role: opt.v }))} style={{
                    flex: 1, padding: '9px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
                    border: `2px solid ${form.role === opt.v ? 'var(--gold)' : 'var(--border)'}`,
                    background: form.role === opt.v ? 'var(--gold-bg)' : 'transparent',
                    color: form.role === opt.v ? 'var(--gold)' : 'var(--text-2)',
                    fontWeight: form.role === opt.v ? 600 : 400,
                  }}>{opt.label}</button>
                ))}
              </div>
            </div>
          )}
          {mode === 'register' && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-2)', marginBottom: 5 }}>Phone <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(optional, for future SMS 2FA)</span></label>
              <input className="input" type="tel" placeholder="+1 555 123 4567" value={form.phone} onChange={set('phone')} />
            </div>
          )}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-2)', marginBottom: 5 }}>Password</label>
            <input className="input" type="password" placeholder="••••••••" value={form.password} onChange={set('password')} required />
            {mode === 'login' && (
              <div style={{ textAlign: 'right', marginTop: 6 }}>
                <button type="button" onClick={() => { setMode('forgot'); setError(''); setForgotEmail(form.email) }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-3)', fontSize: 12, cursor: 'pointer' }}>Forgot your password?</button>
              </div>
            )}
          </div>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            {loading ? 'Loading...' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--text-2)' }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have one? '}
          <button onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError('') }}
            style={{ background: 'none', border: 'none', color: 'var(--gold)', fontWeight: 500, cursor: 'pointer', fontSize: 13 }}>
            {mode === 'login' ? 'Register' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  )
}