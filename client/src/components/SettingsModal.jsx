import { useState } from 'react'
import { useTheme, THEMES } from '../context/ThemeContext'
import { api, useAuth } from '../context/AuthContext'

export default function SettingsModal({ onClose }) {
  const { theme, setTheme } = useTheme()
  const { logout, user, setTwoFactor } = useAuth()
  const [feedbackType, setFeedbackType] = useState('general')
  const [feedbackMsg, setFeedbackMsg] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [phone, setPhone] = useState(user?.phone || '')
  const [twoFAWorking, setTwoFAWorking] = useState(false)
  const [twoFAError, setTwoFAError] = useState('')

  const toggleTwoFactor = async () => {
    setTwoFAError('')
    setTwoFAWorking(true)
    try {
      await setTwoFactor(!user?.twoFactorEnabled, phone)
    } catch (err) {
      setTwoFAError(err?.message || 'Could not update two-factor settings.')
    } finally {
      setTwoFAWorking(false)
    }
  }

  const submitFeedback = async () => {
    const message = feedbackMsg.trim()
    if (!message) return
    setError('')
    setSending(true)
    const payload = { type: feedbackType?.toLowerCase?.() || 'general', message }
    try {
      await api('/feedback', { method: 'POST', body: payload })
      setSent(true)
      setFeedbackMsg('')
      setTimeout(() => setSent(false), 3000)
    } catch (err) {
      const msg = err?.message || 'Something went wrong while sending feedback.'
      setError(msg === 'The string did not match the expected pattern.' ? 'Could not reach the feedback endpoint. Please check your API URL setting and try again.' : msg)
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div className="card" style={{ width: '100%', maxWidth: 480, padding: 28, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontSize: 18 }}>Settings</h2>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-3)', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>

        {/* Theme */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>Theme</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {Object.entries(THEMES).map(([key, t]) => (
              <button type="button" key={key} onClick={() => setTheme(key)} style={{
                padding: '10px 14px', borderRadius: 8, border: `2px solid ${theme === key ? 'var(--gold)' : 'var(--border)'}`,
                background: theme === key ? 'var(--gold-bg)' : 'var(--surface2)',
                color: theme === key ? 'var(--gold)' : 'var(--text-2)',
                fontSize: 13, fontWeight: theme === key ? 600 : 400, cursor: 'pointer',
                textAlign: 'left', transition: 'all .15s',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ fontSize: 16 }}>
                  {key === 'light' ? '☀️' : key === 'dark' ? '🌙' : key === 'barbarian' ? '⚔️' : key === 'wizard' ? '🔮' : key === 'druid' ? '🌿' : key === 'paladin' ? '🛡️' : '🗡️'}
                </span>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ height: 1, background: 'var(--border)', marginBottom: 24 }} />

        {/* Feedback */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>Send Feedback</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            {['general', 'bug', 'feature'].map(t => (
              <button type="button" key={t} onClick={() => setFeedbackType(t)} style={{
                padding: '5px 12px', borderRadius: 6, border: `1px solid ${feedbackType === t ? 'var(--gold)' : 'var(--border)'}`,
                background: feedbackType === t ? 'var(--gold-bg)' : 'transparent',
                color: feedbackType === t ? 'var(--gold)' : 'var(--text-2)',
                fontSize: 12, cursor: 'pointer',
              }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
            ))}
          </div>
          <textarea className="input" rows={4} placeholder="Tell us what you think, report a bug, or suggest a feature..."
            value={feedbackMsg} onChange={e => setFeedbackMsg(e.target.value)}
            style={{ resize: 'none', marginBottom: 10 }} />
          {error && <div style={{ fontSize: 13, color: 'var(--red)', padding: '8px 0' }}>{error}</div>}
          {sent
            ? <div style={{ fontSize: 13, color: 'var(--green)', padding: '8px 0' }}>✓ Thanks for your feedback!</div>
            : <button type="button" className="btn btn-primary" onClick={submitFeedback} disabled={sending || !feedbackMsg.trim()}>
                {sending ? 'Sending...' : 'Send feedback'}
              </button>
          }
        </div>

        <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>Security</div>
          <div style={{ marginBottom: 10 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-2)', marginBottom: 5 }}>Phone number <span style={{ color: 'var(--text-3)' }}>(for future SMS 2FA)</span></label>
            <input className="input" type="tel" placeholder="+1 555 123 4567" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 12px', borderRadius: 8, background: 'var(--surface2)', border: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Two-factor authentication</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Sends a one-time code to your email at sign-in.</div>
            </div>
            <button type="button" onClick={toggleTwoFactor} disabled={twoFAWorking} className={`btn btn-sm ${user?.twoFactorEnabled ? 'btn-primary' : 'btn-ghost'}`}>
              {twoFAWorking ? '...' : user?.twoFactorEnabled ? 'On' : 'Off'}
            </button>
          </div>
          {twoFAError && <div style={{ fontSize: 12, color: 'var(--red)', marginTop: 8 }}>{twoFAError}</div>}
        </div>

        <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Account</div>
          <button type="button" onClick={() => { logout(); onClose() }} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--red)', background: 'transparent', color: 'var(--red)', fontWeight: 600, cursor: 'pointer' }}>
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}
