import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme, THEMES } from '../context/ThemeContext'
import { api, useAuth, useAuthConfig } from '../context/AuthContext'
import { useCampaign } from '../context/CampaignContext'
import GoogleButton from './GoogleButton'

export default function SettingsModal({ onClose }) {
  const { theme, setTheme, lightMode, setLightMode } = useTheme()
  const { logout, user, linkGoogle, isPremium, switchRole } = useAuth()
  const authConfig = useAuthConfig()
  const googleClientId = authConfig?.googleClientId || import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
  const { activeCampaign, leaveCampaign, deleteCampaign } = useCampaign()
  const navigate = useNavigate()
  const [feedbackType, setFeedbackType] = useState('general')
  const [feedbackMsg, setFeedbackMsg] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [twoFAWorking, setTwoFAWorking] = useState(false)
  const [twoFAError, setTwoFAError] = useState('')
  // "Verify / change Google account" flow
  const [channelOpen, setChannelOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null) // 'leave' | 'delete' | null
  const [confirmInput, setConfirmInput] = useState('')
  const [confirmError, setConfirmError] = useState('')
  const [confirmWorking, setConfirmWorking] = useState(false)
  const [roleWorking, setRoleWorking] = useState(false)
  const [roleError, setRoleError] = useState('')

  const changeRole = async (role) => {
    if (role === user?.role || roleWorking) return
    setRoleError('')
    setRoleWorking(true)
    try {
      await switchRole(role)
      onClose()
      navigate('/', { replace: true })
    } catch (err) {
      setRoleError(err?.message || 'Could not switch role. Please try again.')
    } finally {
      setRoleWorking(false)
    }
  }

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


  const googleAvailable = !!authConfig?.google
  const verifiedWithGoogle = user?.twoFactorMethod === 'google'
  const verifiedWithEmail = !!user?.twoFactorVerified && user?.twoFactorMethod === 'email'

  const closeChannelSetup = () => { setChannelOpen(false); setTwoFAError('') }

  const linkGoogleAccount = async (credential) => {
    setTwoFAError('')
    setTwoFAWorking(true)
    try {
      await linkGoogle(credential)
      closeChannelSetup()
    } catch (err) {
      setTwoFAError(err?.message || 'Could not link that Google account.')
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
              Lighter variant <span style={{ color: 'var(--text-3)' }}></span>
            </label>
          )}
        </div>

        <div style={{ height: 1, background: 'var(--border)', marginBottom: 24 }} />

        {/* Player / DM mode */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Mode</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            {[{ v: 'player', label: 'Player' }, { v: 'dm', label: 'Dungeon Master' }].map(opt => {
              const active = user?.role === opt.v
              return (
                <button type="button" key={opt.v} onClick={() => changeRole(opt.v)} disabled={roleWorking} aria-pressed={active} style={{
                  flex: 1, padding: '8px 12px', borderRadius: 8, cursor: active ? 'default' : 'pointer',
                  border: `1px solid ${active ? 'var(--gold)' : 'var(--border)'}`,
                  background: active ? 'var(--gold-bg)' : 'transparent',
                  color: active ? 'var(--gold)' : 'var(--text-2)', fontSize: 13, fontWeight: active ? 600 : 400,
                }}>{opt.label}</button>
              )
            })}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.5 }}>
            {user?.roles?.length > 1 ? 'Your account is both a player and a DM. ' : ''}
            Switching changes your tools and shows the campaigns you {user?.role === 'dm' ? 'joined as a player' : 'run as a DM'}. Nothing is deleted.
          </div>
          {roleError && <div style={{ fontSize: 12, color: 'var(--red)', marginTop: 8 }}>{roleError}</div>}
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

        {/* Only shown to accounts that still need to verify; verified accounts have nothing to manage. */}
        {!(verifiedWithGoogle || verifiedWithEmail) && (
        <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>Security</div>
            <>
              {googleAvailable && !channelOpen && (
                <div style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--surface2)', border: '1px solid var(--border)', marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>Secure your account</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8 }}>Verify the Google account that matches your email. We'll then protect sign-ins from new devices automatically. This can't be changed later.</div>
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => setChannelOpen(true)}>Verify with Google</button>
                </div>
              )}
            </>

          {channelOpen && (
            <div style={{ marginTop: 10, padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
              <GoogleButton clientId={googleClientId} onCredential={linkGoogleAccount} text="continue_with" width={280} />
              <div style={{ marginTop: 10 }}>
                <button type="button" onClick={closeChannelSetup} style={{ background: 'none', border: 'none', color: 'var(--text-3)', fontSize: 12, cursor: 'pointer', padding: 0 }}>Cancel</button>
              </div>
            </div>
          )}
          {twoFAError && <div style={{ fontSize: 12, color: 'var(--red)', marginTop: 8 }}>{twoFAError}</div>}
        </div>
        )}

        {activeCampaign && !activeCampaign.isPersonal && (
          <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>This Campaign</div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 10 }}>{activeCampaign.name}</div>
            {isOwner ? (
              <>
                <button type="button" onClick={() => { setConfirmAction('delete'); setConfirmInput(''); setConfirmError('') }}
                  disabled={!isPremium}
                  style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: isPremium ? 'var(--red)' : 'var(--text-3)', fontWeight: 500, fontSize: 12, cursor: isPremium ? 'pointer' : 'not-allowed', opacity: isPremium ? 1 : 0.6 }}>
                  Delete Campaign
                </button>
                {!isPremium && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>Deleting a campaign is a Premium feature. <button type="button" onClick={() => { navigate('/premium'); onClose() }} style={{ background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer', fontSize: 11, padding: 0 }}>Upgrade →</button></div>}
              </>
            ) : (
              <button type="button" onClick={() => { setConfirmAction('leave'); setConfirmInput(''); setConfirmError('') }}
                style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--red)', fontWeight: 500, fontSize: 12, cursor: 'pointer' }}>
                Leave Campaign
              </button>
            )}
          </div>
        )}

        <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Account</div>
          <button type="button" onClick={() => { logout(); onClose(); navigate('/login', { replace: true }) }} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--red)', background: 'transparent', color: 'var(--red)', fontWeight: 600, cursor: 'pointer' }}>
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
