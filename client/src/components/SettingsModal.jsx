import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme, THEMES } from '../context/ThemeContext'
import { api, useAuth, useAuthConfig } from '../context/AuthContext'
import { useCampaign } from '../context/CampaignContext'
import GoogleButton from './GoogleButton'
import ProfileAvatar from './ProfileAvatar'
import { backdropClose } from '../utils/backdrop'

export default function SettingsModal({ onClose }) {
  const { theme, setTheme, lightMode, setLightMode } = useTheme()
  const { logout, user, linkGoogle, isPremium, switchRole, refreshUser } = useAuth()
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
  // The DM's player list for this campaign, and the "type their name to remove them" flow
  const [roster, setRoster] = useState([])
  const [removeTarget, setRemoveTarget] = useState(null) // { userId, label, username }
  const [removeInput, setRemoveInput] = useState('')
  const [removeError, setRemoveError] = useState('')
  const [removeWorking, setRemoveWorking] = useState(false)
  // "Add a test player": a placeholder player with a ready-made character, to try the campaign and use as a token
  const [testOpen, setTestOpen] = useState(false)
  const [testForm, setTestForm] = useState({ name: '', classId: 'fighter', level: 3 })
  const [testError, setTestError] = useState('')
  const [testWorking, setTestWorking] = useState(false)
  const [roleWorking, setRoleWorking] = useState(false)
  const [roleError, setRoleError] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [nameWorking, setNameWorking] = useState(false)
  const [nameMsg, setNameMsg] = useState('') // error text
  const [editingName, setEditingName] = useState(false)

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

  const loadRoster = async () => {
    if (!isOwner || !activeCampaign || activeCampaign.isPersonal) { setRoster([]); return }
    try { setRoster(await api(`/campaigns/${activeCampaign._id}/members/characters`)) } catch { setRoster([]) }
  }
  useEffect(() => { loadRoster() }, [activeCampaign?._id, isOwner]) // eslint-disable-line react-hooks/exhaustive-deps

  // The name the DM must type: the player's character, or their username if they have not made one yet.
  const rosterLabel = (m) => (m.character?.name?.trim() ? m.character.name : m.username)
  const addTestPlayer = async (e) => {
    e?.preventDefault()
    if (!activeCampaign || testWorking) return
    setTestWorking(true); setTestError('')
    try {
      await api(`/campaigns/${activeCampaign._id}/test-players`, { method: 'POST', body: { name: testForm.name, classId: testForm.classId, level: Number(testForm.level) || 1 } })
      setTestOpen(false); setTestForm(f => ({ ...f, name: '' }))
      await loadRoster()
    } catch (err) { setTestError(err?.message || 'Could not add the test player.') }
    setTestWorking(false)
  }
  const removePlayer = async () => {
    if (!removeTarget || !activeCampaign) return
    if (removeInput !== removeTarget.label) { setRemoveError('Name did not match. Check the capitalisation.'); return }
    setRemoveWorking(true); setRemoveError('')
    try {
      await api(`/campaigns/${activeCampaign._id}/members/${removeTarget.userId}`, { method: 'DELETE', body: { confirmName: removeInput } })
      setRemoveTarget(null); setRemoveInput('')
      await loadRoster()
    } catch (err) { setRemoveError(err?.message || 'Could not remove that player.') }
    setRemoveWorking(false)
  }

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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} {...backdropClose(onClose)}>
      <div className="card" style={{ width: '100%', maxWidth: 480, padding: 28, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontSize: 18 }}>Settings</h2>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-3)', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>

        {/* Profile photo (click the circle to change it) with the username beside it: shown as plain text, a pencil edits it.
            Usernames must be unique, whatever the capitalisation. */}
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14 }}>
          <ProfileAvatar size={56} fontSize={22} />
          <div style={{ flex: 1, minWidth: 0 }}>
            {!editingName ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <span style={{ fontFamily: 'var(--font-title)', fontSize: 20, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.username}</span>
                <button type="button" onClick={() => { setNameInput(user?.username || ''); setNameMsg(''); setEditingName(true) }} aria-label="Change username" title="Change username"
                  style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: 'var(--text-3)', display: 'flex', flexShrink: 0 }}>
                  <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M11.5 2.5 13.5 4.5 5.5 12.5 2.5 13.5 3.5 10.5Z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /><path d="M10 4l2 2" stroke="currentColor" strokeWidth="1.4" /></svg>
                </button>
              </div>
            ) : (
              <form onSubmit={async (e) => {
                e.preventDefault()
                const next = nameInput.trim()
                if (!next || next === user?.username) { setEditingName(false); setNameMsg(''); return }
                setNameWorking(true); setNameMsg('')
                try {
                  await api('/auth/username', { method: 'PUT', body: { username: next } })
                  await refreshUser()
                  setEditingName(false)
                } catch (err) { setNameMsg(err?.message || 'Could not change the username.') }
                finally { setNameWorking(false) }
              }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input id="settings-username" className="input" style={{ flex: 1, minWidth: 0 }} value={nameInput} maxLength={24} autoComplete="off" autoFocus onFocus={e => e.target.select()} aria-label="Username"
                    onChange={e => { setNameInput(e.target.value); setNameMsg('') }} onKeyDown={e => { if (e.key === 'Escape') { e.stopPropagation(); setEditingName(false); setNameMsg('') } }} />
                  <button type="submit" className="btn btn-sm" disabled={nameWorking || !nameInput.trim()}>{nameWorking ? 'Saving…' : 'Save'}</button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setEditingName(false); setNameMsg('') }}>Cancel</button>
                </div>
                {nameMsg && <div style={{ fontSize: 12, marginTop: 6, color: 'var(--red)' }} role="alert">{nameMsg}</div>}
              </form>
            )}
            {user?.avatar && !editingName && (
              <button type="button" onClick={async () => { try { await api('/auth/avatar', { method: 'PUT', body: { avatar: '' } }); await refreshUser() } catch { /* ignore */ } }} style={{ background: 'none', border: 'none', padding: 0, marginTop: 2, color: 'var(--text-3)', cursor: 'pointer', fontSize: 12 }}>Remove photo</button>
            )}
          </div>
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
          <div style={{ display: 'flex', gap: 6 }}>
            {[{ v: 'player', label: 'Player' }, { v: 'dm', label: 'Dungeon Master' }].map(opt => {
              const active = user?.role === opt.v
              return (
                <button type="button" key={opt.v} onClick={() => changeRole(opt.v)} disabled={roleWorking} aria-pressed={active} style={{
                  flex: 1, padding: '8px 12px', borderRadius: 3, cursor: active ? 'default' : 'pointer',
                  border: `1px solid ${active ? 'var(--gold)' : 'var(--border)'}`,
                  background: active ? 'var(--gold-bg)' : 'transparent',
                  color: active ? 'var(--gold)' : 'var(--text-2)', fontSize: 13, fontWeight: active ? 600 : 400,
                }}>{opt.label}</button>
              )
            })}
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

        {/* Only shown to accounts that still need to verify and only when Google verification is available, so it is never an empty heading. */}
        {!(verifiedWithGoogle || verifiedWithEmail) && (googleAvailable || channelOpen || twoFAError) && (
        <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>Security</div>
            <>
              {googleAvailable && !channelOpen && (
                <div style={{ padding: '10px 12px', borderRadius: 3, background: 'var(--surface2)', border: '1px solid var(--border)', marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>Secure your account</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8 }}>Verify the Google account that matches your email. We'll then protect sign-ins from new devices automatically. This can't be changed later.</div>
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => setChannelOpen(true)}>Verify with Google</button>
                </div>
              )}
            </>

          {channelOpen && (
            <div style={{ marginTop: 10, padding: 12, borderRadius: 3, border: '1px solid var(--border)' }}>
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
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Players</div>
                  {roster.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-3)' }}>No players have joined yet. Share the join code from the sidebar.</div>}
                  {roster.map(m => {
                    const isMe = String(m.userId) === String(user?._id || user?.id)
                    return (
                      <div key={m.userId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ minWidth: 0, fontSize: 13 }}>
                          <span style={{ color: 'var(--text)' }}>{rosterLabel(m)}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{m.isTest ? ' · test player' : m.character?.name?.trim() ? ` · ${m.username}` : ' · no character yet'}{isMe ? ' (you, as a player)' : ''}</span>
                        </div>
                        <button type="button" onClick={() => { setRemoveTarget({ userId: m.userId, label: rosterLabel(m), username: m.username, isTest: !!m.isTest }); setRemoveInput(''); setRemoveError('') }}
                          style={{ background: 'none', border: 'none', color: 'var(--red)', fontSize: 12, cursor: 'pointer', padding: '2px 4px', flexShrink: 0 }}>Remove</button>
                      </div>
                    )
                  })}
                  <div style={{ marginTop: 8 }}>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setTestOpen(true); setTestError('') }}>+ Add a test player</button>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>A placeholder player with a ready-made character, to try your campaign or use as a token on the battle map.</div>
                  </div>
                </div>
                <button type="button" onClick={() => { setConfirmAction('delete'); setConfirmInput(''); setConfirmError('') }}
                  disabled={!isPremium}
                  style={{ padding: '6px 12px', borderRadius: 3, border: '1px solid var(--border)', background: 'transparent', color: isPremium ? 'var(--red)' : 'var(--text-3)', fontWeight: 500, fontSize: 12, cursor: isPremium ? 'pointer' : 'not-allowed', opacity: isPremium ? 1 : 0.6 }}>
                  Delete Campaign
                </button>
                {!isPremium && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>Deleting a campaign is a Premium feature. <button type="button" onClick={() => { navigate('/premium'); onClose() }} style={{ background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer', fontSize: 11, padding: 0 }}>Upgrade →</button></div>}
              </>
            ) : (
              <button type="button" onClick={() => { setConfirmAction('leave'); setConfirmInput(''); setConfirmError('') }}
                style={{ padding: '6px 12px', borderRadius: 3, border: '1px solid var(--border)', background: 'transparent', color: 'var(--red)', fontWeight: 500, fontSize: 12, cursor: 'pointer' }}>
                Leave Campaign
              </button>
            )}
          </div>
        )}

        <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Account</div>
          <button type="button" onClick={() => { logout(); onClose(); navigate('/login', { replace: true }) }} style={{ width: '100%', padding: '10px 14px', borderRadius: 4, border: '1px solid var(--red)', background: 'transparent', color: 'var(--red)', fontWeight: 600, cursor: 'pointer' }}>
            Logout
          </button>
        </div>
      </div>

      {/* Add a test player */}
      {testOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} {...backdropClose(() => setTestOpen(false))}>
          <form className="card" style={{ width: '100%', maxWidth: 380, padding: 22 }} onClick={e => e.stopPropagation()} onSubmit={addTestPlayer} role="dialog" aria-label="Add a test player">
            <div style={{ fontFamily: 'var(--font-title)', fontSize: 16, fontWeight: 600, marginBottom: 10 }}>Add a test player</div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 14, lineHeight: 1.6 }}>They join this campaign straight away with a ready-made character, and show up in the token tray, battle tracker and player list. You can remove them any time.</div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>Character name (optional)</label>
            <input autoFocus className="input" maxLength={40} placeholder="Test Fighter" value={testForm.name} onChange={e => setTestForm(f => ({ ...f, name: e.target.value }))} style={{ marginBottom: 10 }} />
            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>Class</label>
                <select className="input" value={testForm.classId} onChange={e => setTestForm(f => ({ ...f, classId: e.target.value }))} aria-label="Class">
                  <option value="fighter">Fighter</option><option value="rogue">Rogue</option><option value="wizard">Wizard</option><option value="cleric">Cleric</option>
                </select>
              </div>
              <div style={{ width: 90 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>Level</label>
                <input className="input" type="number" min="1" max="20" value={testForm.level} onChange={e => setTestForm(f => ({ ...f, level: e.target.value }))} aria-label="Level" />
              </div>
            </div>
            {testError && <div style={{ fontSize: 12, color: 'var(--red)', marginBottom: 10 }} role="alert">{testError}</div>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="btn btn-primary btn-sm" disabled={testWorking} style={{ flex: 1 }}>{testWorking ? 'Adding…' : 'Add test player'}</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setTestOpen(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Type-to-confirm: removing a player from the campaign */}
      {removeTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} {...backdropClose(() => setRemoveTarget(null))}>
          <div className="card" style={{ width: '100%', maxWidth: 380, padding: 22 }} onClick={e => e.stopPropagation()} role="dialog" aria-label="Remove player">
            <div style={{ fontFamily: 'var(--font-title)', fontSize: 16, fontWeight: 600, color: 'var(--red)', marginBottom: 10 }}>Remove player</div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 14, lineHeight: 1.6 }}>
              {removeTarget.isTest
                ? 'This test player and their character are deleted.'
                : `${removeTarget.username} loses access to this campaign. Their characters are kept, and you can let them back in later.`}
              {' '}Type <strong style={{ color: 'var(--text)' }}>{removeTarget.label}</strong> exactly to confirm.
            </div>
            <input autoFocus className="input" placeholder={removeTarget.label} value={removeInput} onChange={e => { setRemoveInput(e.target.value); setRemoveError('') }}
              onKeyDown={e => { if (e.key === 'Enter') removePlayer(); if (e.key === 'Escape') setRemoveTarget(null) }} style={{ marginBottom: 10 }} />
            {removeError && <div style={{ fontSize: 12, color: 'var(--red)', marginBottom: 10 }} role="alert">{removeError}</div>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-sm" onClick={removePlayer} disabled={removeWorking || removeInput !== removeTarget.label} style={{ background: 'var(--red)', color: '#fff', border: 'none', flex: 1 }}>
                {removeWorking ? 'Removing…' : 'Remove player'}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setRemoveTarget(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Type-to-confirm modal for Leave/Delete campaign — case-sensitive
          exact name match required, to guard against accidental taps. */}
      {confirmAction && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} {...backdropClose(() => setConfirmAction(null))}>
          <div className="card" style={{ width: '100%', maxWidth: 380, padding: 22 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily: 'var(--font-title)', fontSize: 16, fontWeight: 600, color: 'var(--red)', marginBottom: 10 }}>
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
