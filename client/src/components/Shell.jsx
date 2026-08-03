import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCampaign } from '../context/CampaignContext'
import { useMusic, MOODS } from '../context/MusicContext'
import { useState, useEffect } from 'react'
import SettingsModal from './SettingsModal'

function MusicMiniPlayer({ bottomOffset }) {
  const { current, volume, play, stop, setVol } = useMusic()
  const [open, setOpen] = useState(false)
  if (!current && !open) {
    // Only show the floating launcher once something is worth multitasking with,
    // but still allow opening it manually via a subtle always-present dot.
  }
  return (
    <div style={{ position: 'fixed', right: 16, bottom: bottomOffset, zIndex: 60 }}>
      {open && (
        <div style={{
          marginBottom: 10, width: 220, background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 12, padding: 12, boxShadow: '0 12px 32px rgba(0,0,0,0.35)',
        }}>
          <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Ambient Music</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
            {MOODS.map(m => (
              <button key={m.id} onClick={() => play(m.id)} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left',
                padding: '6px 8px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12,
                background: current === m.id ? 'var(--gold-bg)' : 'transparent',
                color: current === m.id ? 'var(--gold)' : 'var(--text-2)',
              }}>
                <span>{m.label}</span>
                <span style={{ fontSize: 12, width: 16, textAlign: 'center' }}>{current === m.id ? '⏸' : '▶'}</span>
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Vol</span>
            <input type="range" min={0} max={1} step={0.05} value={volume} onChange={e => setVol(+e.target.value)} style={{ flex: 1 }} />
          </div>
          {current && (
            <button onClick={stop} style={{ marginTop: 8, width: '100%', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-3)', borderRadius: 8, padding: '5px 0', fontSize: 11, cursor: 'pointer' }}>Stop</button>
          )}
        </div>
      )}
      <button
        onClick={() => setOpen(o => !o)}
        title="Music"
        style={{
          width: 48, height: 48, borderRadius: '50%', border: 'none', cursor: 'pointer',
          background: current ? 'var(--gold)' : 'var(--surface)', color: current ? '#2a1a00' : 'var(--text-2)',
          boxShadow: '0 8px 20px rgba(0,0,0,0.3)', fontSize: 18,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: current ? 'none' : '1px solid var(--border)',
        }}
      >
        {current ? '♪' : '♫'}
      </button>
    </div>
  )
}

const NAV_PLAYER = [
  { to: '/journal',    label: 'Journal' },
  { to: '/storyboard', label: 'Storyboard' },
  { to: '/lore',       label: 'Lore' },
  { to: '/character',  label: 'Character' },
  { to: '/inventory',  label: 'Inventory' },
  { to: '/dice',       label: 'Dice' },
  { to: '/roleplay',   label: 'Roleplay' },
]

const NAV_DM = [
  { to: '/journal',    label: 'Journal' },
  { to: '/storyboard', label: 'Storyboard' },
  { to: '/lore',       label: 'Lore' },
  { to: '/character',  label: 'Character' },
  { to: '/inventory',  label: 'Inventory' },
  { to: '/dice',       label: 'Dice' },
  { to: '/ideas',      label: 'Ideas' },
  { to: '/levels',     label: 'Levels' },
  { to: '/rules',      label: 'Rules' },
  { to: '/music',      label: 'Music' },
]

function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth <= 768)
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth <= 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return mobile
}

export default function Shell({ children }) {
  const { user, logout, isPremium } = useAuth()
  const { campaigns, activeCampaign, setActive, createCampaign, joinCampaign } = useCampaign()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const isDM = user?.role === 'dm'
  const NAV = isDM ? NAV_DM : NAV_PLAYER
  const NAV_PAGE_SIZE = 5
  const navPages = []
  for (let i = 0; i < NAV.length; i += NAV_PAGE_SIZE) navPages.push(NAV.slice(i, i + NAV_PAGE_SIZE))
  const [navPage, setNavPage] = useState(0)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName]   = useState('')
  const [error, setError]       = useState('')
  const [joining, setJoining]   = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [joinError, setJoinError] = useState('')
  const [showCampaigns, setShowCampaigns] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!newName.trim()) return
    const err = await createCampaign({ name: newName.trim() })
    if (err) { setError(err); return }
    setNewName(''); setCreating(false); setError(''); setShowCampaigns(false)
  }

  const handleJoin = async (e) => {
    e.preventDefault()
    if (!joinCode.trim()) return
    const err = await joinCampaign(joinCode.trim())
    if (err) { setJoinError(err); return }
    setJoinCode(''); setJoining(false); setJoinError(''); setShowCampaigns(false)
  }

  const realCampaigns = campaigns.filter(c => !c.isPersonal)
  const canCreate = isDM && (isPremium || realCampaigns.length === 0)
  const canJoin = !isDM && (isPremium || realCampaigns.length === 0)

  const navLinkStyle = (isActive) => ({
    display: 'flex', flexDirection: 'row',
    alignItems: 'center', justifyContent: isMobile ? 'center' : 'flex-start',
    gap: 8,
    padding: isMobile ? '10px 14px' : '9px 12px',
    borderRadius: isMobile ? 999 : 8,
    marginBottom: isMobile ? 0 : 2,
    fontSize: isMobile ? 12 : 13,
    fontWeight: isActive ? 600 : 500,
    color: isActive ? 'var(--gold)' : 'var(--text-2)',
    background: isActive ? (isMobile ? 'rgba(255,255,255,0.22)' : 'var(--surface2)') : 'transparent',
    textDecoration: 'none', transition: 'all .12s',
    borderLeft: !isMobile && isActive ? '2px solid var(--gold)' : '2px solid transparent',
    minWidth: 0,
  })

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        {/* Mobile top bar */}
        <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ fontFamily: 'Cinzel, serif', fontSize: 16, fontWeight: 600, color: 'var(--gold)' }}>Lore &amp; Ledger</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={() => setShowCampaigns(s => !s)} style={{ background: 'var(--gold-bg)', border: '1px solid var(--gold-border)', color: 'var(--gold)', padding: '8px 12px', borderRadius: 10, fontSize: 11, cursor: 'pointer', fontFamily: 'Cinzel, serif', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {activeCampaign?.name || 'Campaign'} ▾
            </button>
            {!isPremium && <button onClick={() => navigate('/premium')} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: 18, padding: 8, borderRadius: 10, cursor: 'pointer' }}>✦</button>}
            <button onClick={() => setShowSettings(true)} title="Settings" style={{ background: 'none', border: 'none', color: 'var(--text-3)', fontSize: 18, cursor: 'pointer', padding: 8, borderRadius: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>⚙️</button>
          </div>
        </div>

        {/* Campaign dropdown on mobile */}
        {showCampaigns && (
          <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '10px 16px', flexShrink: 0 }}>
            {campaigns.filter(c => !c.isPersonal).map(c => (
              <button key={c._id} onClick={() => { setActive(c); setShowCampaigns(false) }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 6, border: 'none', background: activeCampaign?._id === c._id ? 'var(--gold-bg)' : 'transparent', color: activeCampaign?._id === c._id ? 'var(--gold)' : 'var(--text-2)', fontSize: 13, cursor: 'pointer', marginBottom: 2 }}>{c.name}</button>
            ))}
            {isDM && activeCampaign?.joinCode && (
              <div style={{ fontSize: 11, color: 'var(--text-3)', padding: '4px 10px 8px' }}>Join code: <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{activeCampaign.joinCode}</span></div>
            )}
            {creating ? (
              <form onSubmit={handleCreate} style={{ marginTop: 6 }}>
                <input autoFocus className="input" style={{ marginBottom: 6, padding: '6px 8px', fontSize: 12 }} placeholder="Campaign name..." value={newName} onChange={e => setNewName(e.target.value)} />
                {error && <div style={{ fontSize: 11, color: 'var(--red)', marginBottom: 6 }}>{error}</div>}
                <div style={{ display: 'flex', gap: 4 }}>
                  <button type="submit" className="btn btn-primary btn-sm" style={{ flex: 1 }}>Create</button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setCreating(false); setError('') }}>✕</button>
                </div>
              </form>
            ) : joining ? (
              <form onSubmit={handleJoin} style={{ marginTop: 6 }}>
                <input autoFocus className="input" style={{ marginBottom: 6, padding: '6px 8px', fontSize: 12, textTransform: 'uppercase' }} placeholder="Join code..." value={joinCode} onChange={e => setJoinCode(e.target.value)} />
                {joinError && <div style={{ fontSize: 11, color: 'var(--red)', marginBottom: 6 }}>{joinError}</div>}
                <div style={{ display: 'flex', gap: 4 }}>
                  <button type="submit" className="btn btn-primary btn-sm" style={{ flex: 1 }}>Join</button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setJoining(false); setJoinError('') }}>✕</button>
                </div>
              </form>
            ) : (
              <div style={{ marginTop: 4 }}>
                {isDM ? (
                  realCampaigns.length === 0 ? (
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', padding: '4px 4px 6px', lineHeight: 1.5 }}>You're a Dungeon Master — create your first campaign.</div>
                      {canCreate
                        ? <button onClick={() => setCreating(true)} style={{ fontSize: 12, color: 'var(--gold)', background: 'var(--gold-bg)', border: '1px solid var(--gold-border)', borderRadius: 8, cursor: 'pointer', padding: '7px 12px', fontWeight: 600, width: '100%' }}>✦ Create Campaign</button>
                        : <button onClick={() => { navigate('/premium'); setShowCampaigns(false) }} style={{ fontSize: 12, color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 4px' }}>✦ Upgrade for more</button>}
                    </div>
                  ) : (
                    canCreate
                      ? <button onClick={() => setCreating(true)} style={{ fontSize: 12, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 4px' }}>+ New Campaign</button>
                      : <button onClick={() => { navigate('/premium'); setShowCampaigns(false) }} style={{ fontSize: 12, color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 4px' }}>✦ Upgrade for more</button>
                  )
                ) : (
                  realCampaigns.length === 0 ? (
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', padding: '4px 4px 6px', lineHeight: 1.5 }}>Ask your DM for a join code to enter their campaign.</div>
                      {canJoin
                        ? <button onClick={() => setJoining(true)} style={{ fontSize: 12, color: 'var(--text-2)', background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', padding: '7px 12px', fontWeight: 600, width: '100%' }}>⚔ Join a Campaign</button>
                        : <button onClick={() => { navigate('/premium'); setShowCampaigns(false) }} style={{ fontSize: 12, color: 'var(--gold)', background: 'var(--gold-bg)', border: '1px solid var(--gold-border)', borderRadius: 8, cursor: 'pointer', padding: '7px 12px', fontWeight: 600, width: '100%' }}>✦ Upgrade for more</button>}
                    </div>
                  ) : (
                    canJoin
                      ? <button onClick={() => setJoining(true)} style={{ fontSize: 12, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 4px' }}>+ Join Campaign</button>
                      : <button onClick={() => { navigate('/premium'); setShowCampaigns(false) }} style={{ fontSize: 12, color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 4px' }}>✦ Upgrade for more</button>
                  )
                )}
              </div>
            )}
          </div>
        )}

        {/* Main content */}
        <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', paddingBottom: '96px' }}>{children}</main>

        {/* Bottom nav */}
        <nav style={{
          position: 'fixed',
          left: '50%',
          bottom: 'calc(12px + env(safe-area-inset-bottom, 12px))',
          transform: 'translateX(-50%)',
          width: 'min(96%, 560px)',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          background: 'rgba(255,255,255,0.12)',
          border: '1px solid rgba(255,255,255,0.14)',
          borderRadius: 999,
          padding: '8px 8px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.08)',
          zIndex: 40,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}>
          {navPages.length > 1 && (
            <button
              onClick={() => setNavPage(p => (p - 1 + navPages.length) % navPages.length)}
              aria-label="Previous nav page"
              style={{ flexShrink: 0, background: 'transparent', border: 'none', color: 'var(--text-2)', fontSize: 16, padding: '6px 4px', cursor: 'pointer' }}
            >&lsaquo;</button>
          )}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', gap: 4, minWidth: 0 }}>
            {navPages[navPage].map(item => (
              <NavLink key={item.to} to={item.to} style={({ isActive }) => navLinkStyle(isActive)}>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
          {navPages.length > 1 && (
            <button
              onClick={() => setNavPage(p => (p + 1) % navPages.length)}
              aria-label="Next nav page"
              style={{ flexShrink: 0, background: 'transparent', border: 'none', color: 'var(--text-2)', fontSize: 16, padding: '6px 4px', cursor: 'pointer' }}
            >&rsaquo;</button>
          )}
        </nav>
        {navPages.length > 1 && (
          <div style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)', bottom: 'calc(4px + env(safe-area-inset-bottom, 4px))', display: 'flex', gap: 4, zIndex: 40 }}>
            {navPages.map((_, i) => (
              <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: i === navPage ? 'var(--gold)' : 'rgba(255,255,255,0.25)' }} />
            ))}
          </div>
        )}
        {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
        {isDM && <MusicMiniPlayer bottomOffset="calc(84px + env(safe-area-inset-bottom, 12px))" />}
      </div>
    )
  }

  // Desktop layout
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <aside style={{ width: 232, flexShrink: 0, background: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontFamily: 'Cinzel, serif', fontSize: 18, fontWeight: 600, color: 'var(--gold)' }}>Lore &amp; Ledger</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>D&amp;D Companion</div>
        </div>

        <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Campaign</div>
          {campaigns.filter(c => !c.isPersonal).map(c => (
            <button key={c._id} onClick={() => setActive(c)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 10px', borderRadius: 8, border: 'none', background: activeCampaign?._id === c._id ? 'var(--gold-bg)' : 'transparent', color: activeCampaign?._id === c._id ? 'var(--gold)' : 'var(--text-2)', fontSize: 13, fontWeight: activeCampaign?._id === c._id ? 500 : 400, cursor: 'pointer', marginBottom: 2, borderLeft: activeCampaign?._id === c._id ? '2px solid var(--gold)' : '2px solid transparent' }}>{c.name}</button>
          ))}
          {isDM && activeCampaign?.joinCode && (
            <div style={{ fontSize: 11, color: 'var(--text-3)', padding: '2px 10px 6px' }}>Join code: <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{activeCampaign.joinCode}</span></div>
          )}
          {creating ? (
            <form onSubmit={handleCreate} style={{ marginTop: 4 }}>
              <input autoFocus className="input" style={{ marginBottom: 4, padding: '6px 8px', fontSize: 12 }} placeholder="Campaign name..." value={newName} onChange={e => setNewName(e.target.value)} />
              {error && <div style={{ fontSize: 11, color: 'var(--red)', marginBottom: 6, lineHeight: 1.4 }}>{error} <button type="button" onClick={() => navigate('/premium')} style={{ background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer', fontSize: 11 }}>Upgrade →</button></div>}
              <div style={{ display: 'flex', gap: 4 }}>
                <button type="submit" className="btn btn-primary btn-sm" style={{ flex: 1 }}>Create</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setCreating(false); setError('') }}>✕</button>
              </div>
            </form>
          ) : joining ? (
            <form onSubmit={handleJoin} style={{ marginTop: 4 }}>
              <input autoFocus className="input" style={{ marginBottom: 4, padding: '6px 8px', fontSize: 12, textTransform: 'uppercase' }} placeholder="Join code..." value={joinCode} onChange={e => setJoinCode(e.target.value)} />
              {joinError && <div style={{ fontSize: 11, color: 'var(--red)', marginBottom: 6 }}>{joinError}</div>}
              <div style={{ display: 'flex', gap: 4 }}>
                <button type="submit" className="btn btn-primary btn-sm" style={{ flex: 1 }}>Join</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setJoining(false); setJoinError('') }}>✕</button>
              </div>
            </form>
          ) : (
            <div style={{ marginTop: 4 }}>
              {isDM ? (
                realCampaigns.length === 0 ? (
                  <div style={{ marginBottom: 6 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6, lineHeight: 1.5 }}>You're a Dungeon Master — create your first campaign to get started.</div>
                    {canCreate
                      ? <button onClick={() => setCreating(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid var(--gold-border)', background: 'var(--gold-bg)', color: 'var(--gold)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>✦ Create Campaign</button>
                      : <button onClick={() => navigate('/premium')} style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '7px 10px', borderRadius: 8, border: 'none', background: 'var(--gold-bg)', color: 'var(--gold)', fontSize: 12, cursor: 'pointer', borderLeft: '2px solid var(--gold-border)' }}>✦ Upgrade for more</button>}
                  </div>
                ) : (
                  canCreate
                    ? <button onClick={() => setCreating(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '6px 10px', borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--text-3)', fontSize: 12, cursor: 'pointer' }}>+ New Campaign</button>
                    : <button onClick={() => navigate('/premium')} style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '6px 10px', borderRadius: 8, border: 'none', background: 'var(--gold-bg)', color: 'var(--gold)', fontSize: 12, cursor: 'pointer', borderLeft: '2px solid var(--gold-border)' }}>✦ Upgrade for more</button>
                )
              ) : (
                realCampaigns.length === 0 ? (
                  <div style={{ marginBottom: 6 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6, lineHeight: 1.5 }}>Ask your DM for a join code to enter their campaign.</div>
                    {canJoin
                      ? <button onClick={() => setJoining(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-2)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>⚔ Join a Campaign</button>
                      : <button onClick={() => navigate('/premium')} style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '7px 10px', borderRadius: 8, border: 'none', background: 'var(--gold-bg)', color: 'var(--gold)', fontSize: 12, cursor: 'pointer', borderLeft: '2px solid var(--gold-border)' }}>✦ Upgrade for more</button>}
                  </div>
                ) : (
                  canJoin
                    ? <button onClick={() => setJoining(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '6px 10px', borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--text-3)', fontSize: 12, cursor: 'pointer' }}>+ Join Campaign</button>
                    : <button onClick={() => navigate('/premium')} style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '6px 10px', borderRadius: 8, border: 'none', background: 'var(--gold-bg)', color: 'var(--gold)', fontSize: 12, cursor: 'pointer', borderLeft: '2px solid var(--gold-border)' }}>✦ Upgrade for more</button>
                )
              )}
            </div>
          )}
        </div>

        <nav style={{ padding: '10px', flex: 1, overflowY: 'auto' }}>
          {NAV.map(item => (
            <NavLink key={item.to} to={item.to} style={({ isActive }) => navLinkStyle(isActive)}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border)' }}>
          {!isPremium && (
            <button onClick={() => navigate('/premium')} className="btn btn-gold" style={{ width: '100%', justifyContent: 'center', marginBottom: 10, fontSize: 12 }}>✦ Upgrade to Premium</button>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: 'var(--gold-bg)', border: '1px solid var(--gold-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cinzel, serif', fontSize: 13, color: 'var(--gold)' }}>{user?.username?.[0]?.toUpperCase()}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.username}{isPremium && <span style={{ fontSize: 10, color: 'var(--gold)', marginLeft: 4 }}>✦ PRO</span>}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
            </div>
            <button onClick={() => setShowSettings(true)} title="Settings" style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 16, padding: 4 }}>⚙️</button>
          </div>
        </div>
      </aside>

      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>{children}</main>
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {isDM && <MusicMiniPlayer bottomOffset="20px" />}
    </div>
  )
}
