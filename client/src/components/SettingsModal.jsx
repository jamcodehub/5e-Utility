import { useState } from 'react'
import { useTheme, THEMES } from '../context/ThemeContext'
import { api, useAuth } from '../context/AuthContext'

export default function SettingsModal({ onClose }) {
  const { theme, setTheme } = useTheme()
  const { logout } = useAuth()
  const [feedbackType, setFeedbackType] = useState('general')
  const [feedbackMsg, setFeedbackMsg] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const submitFeedback = async () => {
    if (!feedbackMsg.trim()) return
    setSending(true)
    try {
      await api('/feedback', { method: 'POST', body: { type: feedbackType, message: feedbackMsg } })
      setSent(true); setFeedbackMsg('')
      setTimeout(() => setSent(false), 3000)
    } catch { }
    setSending(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div className="card" style={{ width: '100%', maxWidth: 480, padding: 28, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontSize: 18 }}>Settings</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-3)', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>

        {/* Theme */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>Theme</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {Object.entries(THEMES).map(([key, t]) => (
              <button key={key} onClick={() => setTheme(key)} style={{
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
              <button key={t} onClick={() => setFeedbackType(t)} style={{
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
          {sent
            ? <div style={{ fontSize: 13, color: 'var(--green)', padding: '8px 0' }}>✓ Thanks for your feedback!</div>
            : <button className="btn btn-primary" onClick={submitFeedback} disabled={sending || !feedbackMsg.trim()}>
                {sending ? 'Sending...' : 'Send feedback'}
              </button>
          }
        </div>

        <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Account</div>
          <button onClick={() => { logout(); onClose() }} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--red)', background: 'transparent', color: 'var(--red)', fontWeight: 600, cursor: 'pointer' }}>
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}
