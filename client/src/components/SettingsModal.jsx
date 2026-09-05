import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme, THEMES } from '../context/ThemeContext'
import { api, useAuth } from '../context/AuthContext'
import { useCampaign } from '../context/CampaignContext'

export default function SettingsModal({ onClose }) {
  const { theme, setTheme, lightMode, setLightMode } = useTheme()
  const { logout, user, setTwoFactor, isPremium } = useAuth()
  const { activeCampaign, leaveCampaign, deleteCampaign } = useCampaign()
  const navigate = useNavigate()
  const [feedbackType, setFeedbackType] = useState('general')
  const [feedbackMsg, setFeedbackMsg] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [phone, setPhone] = useState(user?.phone || '')
  const [twoFAWorking, setTwoFAWorking] = useState(false)
  const [twoFAError, setTwoFAError] = useState('')
  const [confirmAction, setConfirmAction] = useState(null) // 'leave' | 'delete' | null
  const [confirmInput, setConfirmInput] = useState('')
  const [confirmError, setConfirmError] = useState('')
  const [confirmWorking, setConfirmWorking] = useState(false)

  const isOwner = activeCampaign && String(activeCampaign.owner) === String(user?._id || user?.id)

  const runConfirmedAction = async () => {
    if (!activeCampaign) return
    setConfirmError('')
    if (confirmInput !== activeCampaign.name) { setConfirmError('Name did not match — check capitalisation.'); return }
    setConfirmWorking(true)
    try {
      if (confirmAction === 'leave') await leaveCampaign(activeCampaign._id, confirmInput)
      else await deleteCampaign(activeCampaign._id, confirmInput)
      setConfirmAction(null)
      setConfirmInput('')
      onClose()
    } catch (err) {
      setConfirmError(err?.message || 'Something went wrong.')
    } finally {
      setConfirmWorking(false)
    }
  }


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

  const currentThemeLabel = THEMES[theme]?.label || theme

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div className="card" style={{ width: '100%', maxWidth: 480, padding: 28, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontSize: 18 }}>Settings</h2>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-3)', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>

        {/* Theme */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Theme</div>
          <select
            value={theme}
            onChange={e => {
              const key = e.target.value
              if (THEMES[key]?.premium && !isPremium) { navigate('/premium'); onClose(); return }
              setTheme(key)
            }}
            className="input"
            style={{ width: '100%', cursor: 'pointer' }}
          >
            {Object.entries(THEMES).map(([key, t]) => (
              <option key={key} value={key}>
                {t.label}{t.premium ? (isPremium ? ' (Pro)' : ' (Locked)') : ''}
              </option>
            ))}
          </select>
          {theme !== 'light' && theme !== 'dark' && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, fontSize: 12, color: 'var(--text-2)', cursor: 'pointer' }}>
              <input type="checkbox" checked={lightMode} onChange={e => setLightMode(e.target.checked)} />
              Lighter variant <span style={{ color: 'var(--text-3)' }}>(keeps the accent color on light backgrounds)</span>
            </label>
          )}
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
            ? <div style={{ fontSize: 13, color: 'var(--green)', padding: '8px 0' }}>Thanks for your feedback!</div>
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

        {activeCampaign && !activeCampaign.isPersonal && (
          <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>This Campaign</div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 10 }}>{activeCampaign.name}</div>
            {isOwner ? (
              <>
                <button type="button" onClick={() => { setConfirmAction('delete'); setConfirmInput(''); setConfirmError('') }}
                  disabled={!isPremium}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--red)', background: 'transparent', color: isPremium ? 'var(--red)' : 'var(--text-3)', fontWeight: 600, cursor: isPremium ? 'pointer' : 'not-allowed', opacity: isPremium ? 1 : 0.6 }}>
                  Delete Campaign
                </button>
                {!isPremium && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>Deleting a campaign is a Premium feature. <button type="button" onClick={() => { navigate('/premium'); onClose() }} style={{ background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer', fontSize: 11, padding: 0 }}>Upgrade →</button></div>}
              </>
            ) : (
              <button type="button" onClick={() => { setConfirmAction('leave'); setConfirmInput(''); setConfirmError('') }}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--red)', background: 'transparent', color: 'var(--red)', fontWeight: 600, cursor: 'pointer' }}>
                Leave Campaign
              </button>
            )}
          </div>
        )}

        <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Account</div>
          <button type="button" onClick={() => { logout(); onClose() }} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--red)', background: 'transparent', color: 'var(--red)', fontWeight: 600, cursor: 'pointer' }}>
            Logout
          </button>
        </div>
      </div>

      {/* Type-to-confirm modal for Leave/Delete campaign — case-sensitive
          exact name match required, to guard against accidental taps. */}
      {confirmAction && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setConfirmAction(null)}>
          <div className="card" style={{ width: '100%', maxWidth: 380, padding: 22 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: 16, fontWeight: 600, color: 'var(--red)', marginBottom: 10 }}>
              {confirmAction === 'delete' ? 'Delete Campaign' : 'Leave Campaign'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 14, lineHeight: 1.6 }}>
              {confirmAction === 'delete'
                ? 'This permanently deletes the campaign and all its data for every member. This cannot be undone.'
                : 'You will lose access to this campaign\u2019s data until you\u2019re invited back.'}
              {' '}Type <strong style={{ color: 'var(--text)' }}>{activeCampaign?.name}</strong> exactly to confirm.
            </div>
            <input
              autoFocus
              className="input"
              placeholder={activeCampaign?.name}
              value={confirmInput}
              onChange={e => setConfirmInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') runConfirmedAction(); if (e.key === 'Escape') setConfirmAction(null) }}
              style={{ marginBottom: 10 }}
            />
            {confirmError && <div style={{ fontSize: 12, color: 'var(--red)', marginBottom: 10 }}>{confirmError}</div>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-sm"
                onClick={runConfirmedAction}
                disabled={confirmWorking || confirmInput !== activeCampaign?.name}
                style={{ background: 'var(--red)', color: '#fff', border: 'none', flex: 1 }}
              >
                {confirmWorking ? 'Working…' : confirmAction === 'delete' ? 'Delete Forever' : 'Leave Campaign'}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setConfirmAction(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
