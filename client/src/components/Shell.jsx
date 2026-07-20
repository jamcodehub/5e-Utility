import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCampaign } from '../context/CampaignContext'
import { useState, useEffect } from 'react'
import SettingsModal from './SettingsModal'

const NAV = [
  { to: '/journal',    label: 'Journal',    icon: '📖' },
  { to: '/storyboard', label: 'Storyboard', icon: '🖼️' },
  { to: '/lore',       label: 'Lore',       icon: '🗺️' },
  { to: '/character',  label: 'Character',  icon: '⚔️' },
  { to: '/inventory',  label: 'Inventory',  icon: '🎒' },
  { to: '/dice',       label: 'Dice',       icon: '🎲' },
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
  const { campaigns, activeCampaign, setActive, createCampaign } = useCampaign()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [creating, setCreating] = useState(false)
  const [newName, setNewName]   = useState('')
  const [error, setError]       = useState('')
  const [showCampaigns, setShowCampaigns] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!newName.trim()) return
    const err = await createCampaign({ name: newName.trim() })
    if (err) { setError(err); return }
    setNewName(''); setCreating(false); setError(''); setShowCampaigns(false)
  }

  const canCreate = isPremium || campaigns.length === 0

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
            {campaigns.map(c => (
              <button key={c._id} onClick={() => { setActive(c); setShowCampaigns(false) }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 6, border: 'none', background: activeCampaign?._id === c._id ? 'var(--gold-bg)' : 'transparent', color: activeCampaign?._id === c._id ? 'var(--gold)' : 'var(--text-2)', fontSize: 13, cursor: 'pointer', marginBottom: 2 }}>{c.name}</button>
            ))}
            {creating ? (
              <form onSubmit={handleCreate} style={{ marginTop: 6 }}>
                <input autoFocus className="input" style={{ marginBottom: 6, padding: '6px 8px', fontSize: 12 }} placeholder="Campaign name..." value={newName} onChange={e => setNewName(e.target.value)} />
                {error && <div style={{ fontSize: 11, color: 'var(--red)', marginBottom: 6 }}>{error}</div>}
                <div style={{ display: 'flex', gap: 4 }}>
                  <button type="submit" className="btn btn-primary btn-sm" style={{ flex: 1 }}>Create</button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setCreating(false); setError('') }}>✕</button>
                </div>
              </form>
            ) : canCreate ? (
              <button onClick={() => setCreating(true)} style={{ fontSize: 12, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 4px' }}>+ New campaign</button>
            ) : (
              <button onClick={() => { navigate('/premium'); setShowCampaigns(false) }} style={{ fontSize: 12, color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 4px' }}>✦ Upgrade for more</button>
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
          justifyContent: 'space-between',
          gap: 8,
          background: 'rgba(255,255,255,0.12)',
          border: '1px solid rgba(255,255,255,0.14)',
          borderRadius: 999,
          padding: '10px 14px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.08)',
          zIndex: 40,
          overflowX: 'auto',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}>
          {NAV.map(item => (
            <NavLink key={item.to} to={item.to} style={({ isActive }) => navLinkStyle(isActive)}>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
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
          {campaigns.map(c => (
            <button key={c._id} onClick={() => setActive(c)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 10px', borderRadius: 8, border: 'none', background: activeCampaign?._id === c._id ? 'var(--gold-bg)' : 'transparent', color: activeCampaign?._id === c._id ? 'var(--gold)' : 'var(--text-2)', fontSize: 13, fontWeight: activeCampaign?._id === c._id ? 500 : 400, cursor: 'pointer', marginBottom: 2, borderLeft: activeCampaign?._id === c._id ? '2px solid var(--gold)' : '2px solid transparent' }}>{c.name}</button>
          ))}
          {creating ? (
            <form onSubmit={handleCreate} style={{ marginTop: 4 }}>
              <input autoFocus className="input" style={{ marginBottom: 4, padding: '6px 8px', fontSize: 12 }} placeholder="Campaign name..." value={newName} onChange={e => setNewName(e.target.value)} />
              {error && <div style={{ fontSize: 11, color: 'var(--red)', marginBottom: 6, lineHeight: 1.4 }}>{error} <button type="button" onClick={() => navigate('/premium')} style={{ background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer', fontSize: 11 }}>Upgrade →</button></div>}
              <div style={{ display: 'flex', gap: 4 }}>
                <button type="submit" className="btn btn-primary btn-sm" style={{ flex: 1 }}>Create</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setCreating(false); setError('') }}>✕</button>
              </div>
            </form>
          ) : canCreate ? (
            <button onClick={() => setCreating(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '6px 10px', borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--text-3)', fontSize: 12, cursor: 'pointer', marginTop: 4 }}>+ New campaign</button>
          ) : (
            <button onClick={() => navigate('/premium')} style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '6px 10px', borderRadius: 8, border: 'none', background: 'var(--gold-bg)', color: 'var(--gold)', fontSize: 12, cursor: 'pointer', marginTop: 4, borderLeft: '2px solid var(--gold-border)' }}>✦ Upgrade for more campaigns</button>
          )}
        </div>

        <nav style={{ padding: '10px', flex: 1, overflowY: 'auto' }}>
          {NAV.map(item => (
            <NavLink key={item.to} to={item.to} style={({ isActive }) => navLinkStyle(isActive)}>
              <span style={{ fontSize: 15 }}>{item.icon}</span>{item.label}
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
            <button onClick={logout} title="Sign out" style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 16, padding: 4 }}>↩</button>
          </div>
        </div>
      </aside>

      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>{children}</main>
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  )
}
