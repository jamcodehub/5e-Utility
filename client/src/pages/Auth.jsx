import { useState, useEffect } from 'react'
import { api, useAuth, useAuthConfig } from '../context/AuthContext'
import GoogleButton, { readGoogleCredential } from '../components/GoogleButton'

const FALLBACK_GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-2)', marginBottom: 5 }
const errorBox = { background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--red)', marginBottom: 16 }

export default function Auth() {
  const { login, register, verifyTwoFactor, resendTwoFactor, confirmSignup, resendSignup, loginWithGoogle, forgotPassword, resetPassword } = useAuth()
  const config = useAuthConfig()
  const googleClientId = config?.googleClientId || FALLBACK_GOOGLE_CLIENT_ID || ''
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ username: '', email: '', password: '', phone: '', role: 'player' })
  const [googleSignup, setGoogleSignup] = useState(null) // { credential, email } once Google verified the account
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [serverStatus, setServerStatus] = useState('connecting')

  // Sign-up verification options the server offers: Google (instant) and/or an
  // emailed code. With neither, sign-up is plain email + password.
  const methods = [config?.google && 'google', config?.email && 'email'].filter(Boolean)
  const [pickedMethod, setPickedMethod] = useState('google')
  const method = methods.includes(pickedMethod) ? pickedMethod : methods[0] || ''

  // Challenge step: a new-device login ({ challengeToken, method, hint }) or
  // an email sign-up awaiting its code ({ signupId, signup: true, ... }).
  const [twoFA, setTwoFA] = useState(null)
  const [remember, setRemember] = useState(true)
  const [notice, setNotice] = useState('')
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
        if (result?.requires2FA) { setTwoFA(result); setCode(''); setNotice('') }
      } else {
        if (form.password.length < 8) throw new Error('Password must be at least 8 characters')
        if (method === 'google' && !googleSignup) throw new Error('Verify your Gmail account with Google first')
        const result = await register({
          username: form.username, email: form.email, password: form.password, role: form.role,
          phone: form.phone, credential: method === 'google' ? googleSignup?.credential : undefined,
        })
        if (result?.requires2FA) { setTwoFA({ ...result, signup: true }); setCode(''); setNotice('') }
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
      if (twoFA.signup) await confirmSignup(twoFA.signupId, code.trim(), remember)
      else await verifyTwoFactor(twoFA.challengeToken, { code: code.trim() }, remember)
    } catch (err) { setError(err.message) }
    setLoading(false)
  }

  const handleTwoFactorGoogle = async (credential) => {
    setError(''); setLoading(true)
    try {
      await verifyTwoFactor(twoFA.challengeToken, { credential }, remember)
    } catch (err) { setError(err.message) }
    setLoading(false)
  }

  const resendCode = async () => {
    setError(''); setNotice('')
    try {
      if (twoFA.signup) await resendSignup(twoFA.signupId)
      else await resendTwoFactor(twoFA.challengeToken)
      setNotice('A new code is on its way.')
    } catch (err) { setError(err.message) }
  }

  const handleGoogleSignup = (credential) => {
    setError('')
    const { email } = readGoogleCredential(credential)
    setGoogleSignup({ credential, email: email || 'your Google account' })
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
    const isGoogle = twoFA.method === 'google'
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 20 }}>
        <div className="card" style={{ width: '100%', maxWidth: 380, padding: 32 }}>
          <div style={{ marginBottom: 20, textAlign: 'center' }}>
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: 20, fontWeight: 600, color: 'var(--gold)', marginBottom: 6 }}>
              {twoFA.signup ? 'Confirm your email' : 'Verify this device'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-2)' }}>
              {isGoogle
                ? `Continue with the Google account ${twoFA.hint} to confirm it's you.`
                : `We emailed a 6-digit code to ${twoFA.hint}.`}
              {' '}{twoFA.signup ? 'Enter it to finish creating your account.' : 'You only need to do this on a new device.'}
            </div>
          </div>
          {error && <div style={errorBox}>{error}</div>}
          {notice && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--green)', marginBottom: 16 }}>{notice}</div>}
          {isGoogle ? (
            <div style={{ marginBottom: 16 }}>
              <GoogleButton clientId={googleClientId} onCredential={handleTwoFactorGoogle} />
            </div>
          ) : (
            <form onSubmit={submitCode}>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Verification code</label>
                <input className="input" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="123456" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} required autoFocus style={{ textAlign: 'center', letterSpacing: '0.3em', fontSize: 18 }} />
              </div>
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading || code.length < 6}>
                {loading ? 'Verifying...' : twoFA.signup ? 'Confirm & create account' : 'Verify & sign in'}
              </button>
            </form>
          )}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, fontSize: 12, color: 'var(--text-2)', cursor: 'pointer' }}>
            <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
            Trust this device for 30 days
          </label>
          <div style={{ textAlign: 'center', marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {!isGoogle && (
              <button type="button" onClick={resendCode} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: 13, cursor: 'pointer' }}>Resend code</button>
            )}
            <button onClick={() => { setTwoFA(null); setCode(''); setError(''); setNotice('') }} style={{ background: 'none', border: 'none', color: 'var(--text-3)', fontSize: 13, cursor: 'pointer' }}>{twoFA.signup ? '← Back' : '← Back to sign in'}</button>
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

        {mode === 'login' && googleClientId && (
          <>
            <div style={{ marginBottom: 16 }}>
              <GoogleButton clientId={googleClientId} onCredential={handleGoogleCredential} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0 18px', color: 'var(--text-3)', fontSize: 11 }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span>or use email</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>
          </>
        )}

        <form onSubmit={submit}>
          {mode === 'register' && (
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Username</label>
              <input className="input" placeholder="Boroos" value={form.username} onChange={set('username')} required />
            </div>
          )}
          {!(mode === 'register' && method === 'google') && (
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Email</label>
              <input className="input" type="email" placeholder="adventurer@realm.com" value={form.email} onChange={set('email')} required />
            </div>
          )}
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
          {mode === 'register' && config?.failed && (
            <div style={{ ...errorBox, marginBottom: 12 }}>Can’t reach the server to check verification options. Please reload and try again.</div>
          )}
          {mode === 'register' && methods.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>{methods.length > 1 ? 'Verify your account with' : method === 'google' ? 'Verify your Gmail account' : 'Verify your email'}</label>
              {methods.length > 1 && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  {methods.map(m => (
                    <button key={m} type="button" onClick={() => { setPickedMethod(m); setError('') }} style={{
                      flex: 1, padding: '9px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
                      border: `2px solid ${method === m ? 'var(--gold)' : 'var(--border)'}`,
                      background: method === m ? 'var(--gold-bg)' : 'transparent',
                      color: method === m ? 'var(--gold)' : 'var(--text-2)',
                      fontWeight: method === m ? 600 : 400,
                    }}>{m === 'google' ? 'Gmail' : 'Email code'}</button>
                  ))}
                </div>
              )}
              {method === 'google' && (googleSignup ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '9px 12px', borderRadius: 8, background: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: 13, color: 'var(--green)' }}>
                  <span>✓ {googleSignup.email}</span>
                  <button type="button" onClick={() => setGoogleSignup(null)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', fontSize: 12, cursor: 'pointer' }}>Change</button>
                </div>
              ) : (
                <>
                  <GoogleButton clientId={googleClientId} onCredential={handleGoogleSignup} text="signup_with" />
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 5 }}>Your Google account is verified instantly, becomes your account email, and protects sign-ins from new devices.</div>
                </>
              ))}
              {method === 'email' && (
                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>We’ll email a 6-digit code to confirm your address. After that we’ll automatically email a code whenever you sign in on a new device.</div>
              )}
            </div>
          )}
          {mode === 'register' && config && !config.failed && methods.length === 0 && (
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Phone <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(optional)</span></label>
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
          {(() => {
            const blocked = mode === 'register' && (!config || config.failed || (method === 'google' && !googleSignup))
            return (
              <button className="btn btn-primary" disabled={loading || blocked}
                style={{ width: '100%', justifyContent: 'center', opacity: blocked ? 0.5 : 1, cursor: blocked ? 'not-allowed' : undefined }}>
                {loading ? 'Loading...' : mode === 'login' ? 'Sign in' : method === 'email' ? 'Create account & email me a code' : 'Create account'}
              </button>
            )
          })()}
        </form>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--text-2)' }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have one? '}
          <button onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError('') }}
            style={{ background: 'none', border: 'none', color: 'var(--gold)', fontWeight: 500, cursor: 'pointer', fontSize: 13 }}>
            {mode === 'login' ? 'Register' : 'Sign in'}
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: 14, fontSize: 11, color: 'var(--text-3)', lineHeight: 1.6 }}>
          {mode === 'register' ? 'By creating an account you agree to our ' : 'By continuing you agree to our '}
          <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-2)' }}>Terms of Service</a>
          {' and '}
          <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-2)' }}>Privacy Policy</a>.
        </div>
      </div>
    </div>
  )
}