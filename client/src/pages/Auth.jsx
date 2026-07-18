import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Auth() {
  const { login, register } = useAuth()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      if (mode === 'login') await login(form.email, form.password)
      else await register(form.username, form.email, form.password)
    } catch (err) { setError(err.message) }
    setLoading(false)
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
