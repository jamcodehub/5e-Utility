import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'

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
  const { login, register, verifyTwoFactor, loginWithGoogle } = useAuth()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ username: '', email: '', password: '', phone: '', role: 'player' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Two-factor step: once login() reports requires2FA, we show a code form.
  const [twoFA, setTwoFA] = useState(null) // { userId } | null
  const [code, setCode] = useState('')

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      if (mode === 'login') {
        const result = await login(form.email, form.password)
        if (result?.requires2FA) setTwoFA({ userId: result.userId })
      } else {
        await register(form.username, form.email, form.password, form.phone, form.role)
      }
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
        <div style={{ marginBottom: 28, textAlign: 'center' }}>
          <div style={{ fontFamily: 'Cinzel, serif', fontSize: 24, fontWeight: 600, color: 'var(--gold)', marginBottom: 4 }}>
            Lore &amp; Ledger
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-2)' }}>Your D&amp;D campaign companion</div>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--red)', marginBottom: 16 }}>
            {error}
          </div>
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
