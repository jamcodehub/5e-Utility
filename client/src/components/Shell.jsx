import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth, api } from '../context/AuthContext'
import { useCampaign } from '../context/CampaignContext'
import { useMusic, MOODS } from '../context/MusicContext'
import { useTheme } from '../context/ThemeContext'
import { getSocket } from '../utils/socket'
import { useState, useEffect, useRef } from 'react'
import SettingsModal from './SettingsModal'
import { CloudinaryImage } from '@cloudinary/url-gen'
import { quality, format } from '@cloudinary/url-gen/actions/delivery'
import { auto as autoQuality } from '@cloudinary/url-gen/qualifiers/quality'
import { auto as autoFormat } from '@cloudinary/url-gen/qualifiers/format'

const CLOUD_NAME = 'crcbzpw6'

const logoUrl = new CloudinaryImage('5e_Utillity', { cloudName: CLOUD_NAME })
  .delivery(quality(autoQuality()))
  .delivery(format(autoFormat()))
  .toURL()

function preloadStoryboard() {
  import('../pages/Storyboard').catch(error => {
    console.error('Failed to preload Storyboard', error)
  })
}

// ─── Infinite swipe carousel nav ────────────────────────────────────────────
function SwipeNav({ items, navLinkStyle, darkMode }) {
  const location = useLocation()
  const containerRef = useRef(null)
  const COPIES = 5
  const CENTER_COPY = 2
  const tripled = Array.from({ length: COPIES }, () => items).flat()
  const ITEM_W = 88 // px per nav item
  const GAP = 4
  const fontSizeFor = (label) => {
    if (label.length <= 6) return 12
    if (label.length <= 9) return 11
    return 10
  }

  // Native horizontal scrolling supplies touch momentum and scroll snapping.
  // Identical copies on either side make recentering visually seamless.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const segment = items.length * (ITEM_W + GAP)
    const activeIndex = Math.max(0, items.findIndex(item => item.to === location.pathname))
    el.scrollLeft = segment * CENTER_COPY + activeIndex * (ITEM_W + GAP) - (el.clientWidth - ITEM_W) / 2

    const recenter = () => {
      if (el.scrollLeft < segment) el.scrollLeft += segment
      else if (el.scrollLeft > segment * (COPIES - 2)) el.scrollLeft -= segment
    }
    el.addEventListener('scroll', recenter, { passive: true })
    return () => el.removeEventListener('scroll', recenter)
  }, [items, location.pathname])

  return (
    <div
      ref={containerRef}
      className="pill-carousel-track"
      style={{
        flex: 1,
        overflowX: 'auto',
        overflowY: 'hidden',
        display: 'flex',
        alignItems: 'center',
        touchAction: 'pan-x',
        WebkitOverflowScrolling: 'touch',
        scrollSnapType: 'x mandatory',
        overscrollBehaviorX: 'contain',
        scrollbarWidth: 'none',
      }}
    >
      {tripled.map((item, idx) => {
        return (
            <NavLink
              key={`${item.to}-${idx}`}
              to={item.to}
              draggable={false}
              onMouseEnter={() => { if (item.to === '/storyboard') preloadStoryboard() }}
              onFocus={() => { if (item.to === '/storyboard') preloadStoryboard() }}
              onTouchStart={() => { if (item.to === '/storyboard') preloadStoryboard() }}
              style={({ isActive: a }) => ({
                ...navLinkStyle(a),
                width: ITEM_W,
                marginRight: GAP,
                flexShrink: 0,
                scrollSnapAlign: 'center',
                justifyContent: 'center',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                fontSize: fontSizeFor(item.label),
              })}
            >
              <span style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, width: '100%', whiteSpace: 'nowrap', userSelect: 'none', WebkitUserSelect: 'none' }}>
                {item.iconUrl && <img src={item.iconUrl} alt="" aria-hidden="true" style={{ width: 16, height: 16, objectFit: 'contain', flexShrink: 0, filter: darkMode ? 'brightness(0) invert(1)' : 'none' }} />}
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
              </span>
            </NavLink>
          )
        })}
    </div>
  )
}

// ─── Persistent mini play/pause/skip bar ────────────────────────────────────
// Small, always-visible strip (not hidden behind a toggle) showing whatever
// is currently playing — an ambient mood or an uploaded track — with quick
// prev/play-pause/next controls. Renders nothing when nothing is playing.
function PersistentPlayerBar({ compact }) {
  const { current, activeTrack, trackPlaying, playTrack, skipTrack, play, skipMood, queue } = useMusic()
  if (!current && !activeTrack) return null

  const isTrack = !!activeTrack
  const label = isTrack ? (activeTrack.title || activeTrack.name || 'Track') : MOODS.find(m => m.id === current)?.label
  const playing = isTrack ? trackPlaying : !!current
  const canSkip = isTrack ? queue.length > 1 : true
  const togglePlay = () => { if (isTrack) playTrack(activeTrack); else play(current) }
  const skipPrev = () => { if (isTrack) skipTrack(-1); else skipMood(-1) }
  const skipNext = () => { if (isTrack) skipTrack(1); else skipMood(1) }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: compact ? '6px 10px' : '8px 10px',
      background: 'var(--surface2)', border: '1px solid var(--border)',
      borderRadius: compact ? 999 : 10,
      margin: compact ? 0 : '0 0 10px',
    }}>
      <span style={{ fontSize: 14, flexShrink: 0 }}>{isTrack ? '🎵' : '♪'}</span>
      <span style={{ flex: 1, minWidth: 0, fontSize: 12, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
        {canSkip && (
          <button onClick={skipPrev} title="Previous" style={{ width: 22, height: 22, border: 'none', background: 'none', color: 'var(--text-2)', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⏮</button>
        )}
        <button onClick={togglePlay} title={playing ? 'Pause' : 'Play'} style={{ width: 24, height: 24, borderRadius: '50%', border: 'none', background: 'var(--gold)', color: '#2a1a00', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{playing ? '⏸' : '▶'}</button>
        {canSkip && (
          <button onClick={skipNext} title="Next" style={{ width: 22, height: 22, border: 'none', background: 'none', color: 'var(--text-2)', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⏭</button>
        )}
      </div>
    </div>
  )
}

// ─── Music mini player ───────────────────────────────────────────────────────
function MusicMiniPlayer({ bottomOffset }) {
  const { current, volume, play, stop, setVol } = useMusic()
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position: 'fixed', right: 16, bottom: bottomOffset, zIndex: 60 }}>
      {open && (
        <div style={{ marginBottom: 10, width: 220, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 12, boxShadow: '0 12px 32px rgba(0,0,0,0.35)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Ambient Music</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
            {MOODS.map(m => (
              <button key={m.id} onClick={() => play(m.id)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left', padding: '6px 8px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, background: current === m.id ? 'var(--gold-bg)' : 'transparent', color: current === m.id ? 'var(--gold)' : 'var(--text-2)' }}>
                <span>{m.label}</span>
                <span style={{ fontSize: 12, width: 16, textAlign: 'center' }}>{current === m.id ? '⏸' : '▶'}</span>
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Vol</span>
            <input type="range" min={0} max={1} step={0.05} value={volume} onChange={e => setVol(+e.target.value)} style={{ flex: 1 }} />
          </div>
          {current && <button onClick={stop} style={{ marginTop: 8, width: '100%', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-3)', borderRadius: 8, padding: '5px 0', fontSize: 11, cursor: 'pointer' }}>Stop</button>}
        </div>
      )}
      <button onClick={() => setOpen(o => !o)} title="Music" style={{ width: 48, height: 48, borderRadius: '50%', cursor: 'pointer', background: current ? 'var(--gold)' : 'var(--surface)', color: current ? '#2a1a00' : 'var(--text-2)', boxShadow: '0 8px 20px rgba(0,0,0,0.3)', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', border: current ? 'none' : '1px solid var(--border)' }}>
        {current ? '♪' : '♫'}
      </button>
    </div>
  )
}

const NAV_PLAYER = [
  { to: '/journal',    label: 'Journal',    iconUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1791790758/01_fantasy_15_feather.png' },
  { to: '/storyboard', label: 'Storyboard', iconUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1791791388/book-solid-full.svg' },
  { to: '/lore',       label: 'Lore',       iconUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1791791415/scroll-solid-full.svg' },
  { to: '/character',  label: 'Character',  iconUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1791791397/circle-user-solid-full.svg' },
  { to: '/roleplay',   label: 'Roleplay',   iconUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1791792735/comment-solid-full.svg' },
  { to: '/rules',      label: 'Rules',      iconUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1791793208/gavel-solid-full.svg' },
  { to: '/levels',     label: 'Battle Map', iconUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1791792887/map-solid-full.svg' },
  { to: '/dice',       label: 'Dice',       iconUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1791790757/01_fantasy_01_d20_gem.png' },
]

const NAV_DM = [
  { to: '/campaign-guide', label: 'Campaign',   iconUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1791790757/01_fantasy_04_castle.png' },
  { to: '/session-planner', label: 'Sessions',  iconUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1791790758/01_fantasy_15_feather.png' },
  { to: '/storyboard', label: 'Storyboard',     iconUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1791791388/book-solid-full.svg' },
  { to: '/lore',       label: 'Lore',           iconUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1791791415/scroll-solid-full.svg' },
  { to: '/inventory',  label: 'ShopItems',      iconUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1791792290/coins-solid-full.svg' },
  { to: '/ideas',      label: 'Ideas',          iconUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1791792794/lightbulb-solid-full.svg' },
  { to: '/levels',     label: 'BattleMap',      iconUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1791792887/map-solid-full.svg' },
  { to: '/combat',     label: 'Combat',         iconUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1791791406/hand-fist-solid-full.svg' },
  { to: '/rules',      label: 'Rules',          iconUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1791793208/gavel-solid-full.svg' },
  { to: '/music',      label: 'Music',          iconUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1791793410/mix-brands-solid-full.svg' },
  { to: '/dice',       label: 'Dice',           iconUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1791790757/01_fantasy_01_d20_gem.png' },
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
  const { theme, lightMode } = useTheme()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const isDM = user?.role === 'dm'
  const darkMode = theme !== 'light' && (!lightMode || theme === 'dark')
  const NAV = isDM ? NAV_DM : NAV_PLAYER

  const [creating, setCreating] = useState(false)
  const [newName, setNewName]   = useState('')
  const [error, setError]       = useState('')
  const [joining, setJoining]   = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [joinError, setJoinError] = useState('')
  const [showCampaigns, setShowCampaigns] = useState(false)
  const campaignDropdownTimer = useRef(null)

  const openCampaigns = () => {
    setShowCampaigns(true)
    clearTimeout(campaignDropdownTimer.current)
    campaignDropdownTimer.current = setTimeout(() => setShowCampaigns(false), 5000)
  }
  const closeCampaigns = () => { clearTimeout(campaignDropdownTimer.current); setShowCampaigns(false) }
  const resetDropdownTimer = () => {
    clearTimeout(campaignDropdownTimer.current)
    campaignDropdownTimer.current = setTimeout(() => setShowCampaigns(false), 5000)
  }

  const [showSettings, setShowSettings] = useState(false)
  const [joinPending, setJoinPending] = useState(false)
  const [pendingMembers, setPendingMembers] = useState([])

  useEffect(() => {
    if (!user) return
    const memberCampaigns = campaigns.filter(campaign => !campaign.isPersonal)
    if (!memberCampaigns.length) return
    const socket = getSocket()
    const onShowMap = ({ campaignId, planId } = {}) => {
      const campaign = memberCampaigns.find(item => item._id === campaignId)
      if (!campaign || typeof planId !== 'string') return
      if (activeCampaign?._id !== campaign._id) setActive(campaign)
      navigate(`/levels?map=${encodeURIComponent(planId)}`)
    }
    socket.on('level:show', onShowMap)
    memberCampaigns.forEach(campaign => socket.emit('campaign:join', campaign._id))
    return () => {
      socket.off('level:show', onShowMap)
      memberCampaigns.forEach(campaign => socket.emit('campaign:leave', campaign._id))
    }
  }, [activeCampaign?._id, campaigns, navigate, setActive, user?._id, user?.id])

  useEffect(() => {
    if (!isDM || !activeCampaign) return
    api(`/campaigns/${activeCampaign._id}/pending`).then(setPendingMembers).catch(() => {})
  }, [isDM, activeCampaign?._id])

  const approveMember = async (userId) => {
    await api(`/campaigns/${activeCampaign._id}/approve/${userId}`, { method: 'POST' })
    setPendingMembers(p => p.filter(m => m._id !== userId))
  }
  const rejectMember = async (userId) => {
    await api(`/campaigns/${activeCampaign._id}/pending/${userId}`, { method: 'DELETE' })
    setPendingMembers(p => p.filter(m => m._id !== userId))
  }

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
    if (err === 'pending') { setJoinPending(true); setJoining(false); setJoinCode(''); setShowCampaigns(false); return }
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
    padding: isMobile ? '10px 10px' : '9px 12px',
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
        <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <img src={logoUrl} alt="5e Utility" style={{ height: 32, width: 'auto', objectFit: 'contain', display: 'block', filter: 'var(--logo-filter, none)' }} />
          
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={() => showCampaigns ? closeCampaigns() : openCampaigns()} style={{ background: 'var(--gold-bg)', border: '1px solid var(--gold-border)', color: 'var(--gold)', padding: '8px 12px', borderRadius: 10, fontSize: 11, cursor: 'pointer', fontFamily: 'Cinzel, serif', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {(activeCampaign && !activeCampaign.isPersonal) ? activeCampaign.name : 'Campaign'} ▾
            </button>
            {!isPremium && <button onClick={() => navigate('/premium')} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: 18, padding: 8, borderRadius: 10, cursor: 'pointer' }}>✦</button>}
            <button onClick={() => setShowSettings(true)} title="Settings" style={{ background: 'none', border: 'none', color: 'var(--text-3)', fontSize: 18, cursor: 'pointer', padding: 8, borderRadius: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src="https://res.cloudinary.com/crcbzpw6/image/upload/v1791966298/ellipsis-solid-full.svg" alt="Settings" style={{ width: 18, height: 18 }} />
            </button>
          </div>
        </div>

        {/* Campaign dropdown */}
        {showCampaigns && (
          <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '10px 16px', flexShrink: 0 }} onMouseMove={resetDropdownTimer} onTouchStart={resetDropdownTimer}>
            {campaigns.filter(c => !c.isPersonal).map(c => (
              <button key={c._id} onClick={() => { setActive(c); closeCampaigns() }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 6, border: 'none', background: activeCampaign?._id === c._id ? 'var(--gold-bg)' : 'transparent', color: activeCampaign?._id === c._id ? 'var(--gold)' : 'var(--text-2)', fontSize: 13, cursor: 'pointer', marginBottom: 2 }}>{c.name}</button>
            ))}
            {isDM && activeCampaign?.joinCode && (
              <div style={{ padding: '4px 10px 6px' }}>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: pendingMembers.length > 0 ? 6 : 0 }}>Join code: <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{activeCampaign.joinCode}</span></div>
                {pendingMembers.map(m => (
                  <div key={m._id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', borderTop: '1px solid var(--border)' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.username}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-3)' }}>wants to join</div>
                    </div>
                    <button onClick={() => approveMember(m._id)} style={{ width: 26, height: 26, borderRadius: 6, border: 'none', background: '#1d6a3a', color: '#fff', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✓</button>
                    <button onClick={() => rejectMember(m._id)} style={{ width: 26, height: 26, borderRadius: 6, border: 'none', background: '#7a2020', color: '#fff', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✕</button>
                  </div>
                ))}
              </div>
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
            ) : joinPending ? (
              <div style={{ marginTop: 6, padding: '8px 10px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>Joining pending…</div>
                  <div style={{ fontSize: 10, color: 'var(--text-3)', lineHeight: 1.4 }}>Waiting for the DM to approve your request.</div>
                </div>
                <button onClick={() => setJoinPending(false)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 14, padding: 2 }}>✕</button>
              </div>
            ) : (
              <div style={{ marginTop: 4 }}>
                {isDM ? (
                  realCampaigns.length === 0 ? (
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', padding: '4px 4px 6px', lineHeight: 1.5 }}>You're a Dungeon Master — create your first campaign.</div>
                      {canCreate
                        ? <button onClick={() => setCreating(true)} style={{ fontSize: 12, color: 'var(--gold)', background: 'var(--gold-bg)', border: '1px solid var(--gold-border)', borderRadius: 8, cursor: 'pointer', padding: '7px 12px', fontWeight: 600, width: '100%' }}>✦ Create Campaign</button>
                        : <button onClick={() => { navigate('/premium'); closeCampaigns() }} style={{ fontSize: 12, color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 4px' }}>✦ Upgrade for more</button>}
                    </div>
                  ) : (
                    canCreate
                      ? <button onClick={() => setCreating(true)} style={{ fontSize: 12, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 4px' }}>+ New Campaign</button>
                      : <button onClick={() => { navigate('/premium'); closeCampaigns() }} style={{ fontSize: 12, color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 4px' }}>✦ Upgrade for more</button>
                  )
                ) : (
                  realCampaigns.length === 0 ? (
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', padding: '4px 4px 6px', lineHeight: 1.5 }}>Ask your DM for a join code to enter their campaign.</div>
                      {canJoin
                        ? <button onClick={() => setJoining(true)} style={{ fontSize: 12, color: 'var(--text-2)', background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', padding: '7px 12px', fontWeight: 600, width: '100%' }}>Join a Campaign</button>
                        : <button onClick={() => { navigate('/premium'); closeCampaigns() }} style={{ fontSize: 12, color: 'var(--gold)', background: 'var(--gold-bg)', border: '1px solid var(--gold-border)', borderRadius: 8, cursor: 'pointer', padding: '7px 12px', fontWeight: 600, width: '100%' }}>✦ Upgrade for more</button>}
                    </div>
                  ) : (
                    canJoin
                      ? <button onClick={() => setJoining(true)} style={{ fontSize: 12, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 4px' }}>+ Join Campaign</button>
                      : <button onClick={() => { navigate('/premium'); closeCampaigns() }} style={{ fontSize: 12, color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 4px' }}>✦ Upgrade for more</button>
                  )
                )}
              </div>
            )}
          </div>
        )}

        <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', paddingBottom: '72px' }}>{children}</main>

        {/* Persistent mini play/pause/skip — sits just above the bottom nav */}
        <div style={{
          position: 'fixed', left: '50%', transform: 'translateX(-50%)',
          bottom: 'calc(66px + env(safe-area-inset-bottom, 12px))',
          width: 'min(96%, 560px)', zIndex: 39,
        }}>
          <PersistentPlayerBar compact />
        </div>

        {/* Bottom nav — swipeable infinite carousel */}
        <nav style={{
          position: 'fixed',
          left: '50%',
          bottom: 'calc(12px + env(safe-area-inset-bottom, 12px))',
          transform: 'translateX(-50%)',
          width: 'min(96%, 560px)',
          display: 'flex',
          alignItems: 'center',
          background: 'rgba(255,255,255,0.12)',
          border: '1px solid rgba(255,255,255,0.14)',
          borderRadius: 999,
          padding: '6px 10px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.08)',
          zIndex: 40,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          overflow: 'hidden',
        }}>
          <SwipeNav items={NAV} navLinkStyle={navLinkStyle} darkMode={darkMode} />
        </nav>

        {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      </div>
    )
  }

  // Desktop layout — unchanged
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <aside style={{ width: 232, flexShrink: 0, background: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src="https://res.cloudinary.com/crcbzpw6/image/upload/v1794483597/5E_UTILITY_Pure_Black_2000.png" alt="5e Utility" style={{ width: '100%', maxWidth: 160, height: 'auto', objectFit: 'contain', display: 'block', filter: 'var(--logo-filter, none)' }} />
        </div>

        <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Campaign</div>
          {campaigns.filter(c => !c.isPersonal).map(c => (
            <button key={c._id} onClick={() => setActive(c)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 10px', borderRadius: 8, border: 'none', background: activeCampaign?._id === c._id ? 'var(--gold-bg)' : 'transparent', color: activeCampaign?._id === c._id ? 'var(--gold)' : 'var(--text-2)', fontSize: 13, fontWeight: activeCampaign?._id === c._id ? 500 : 400, cursor: 'pointer', marginBottom: 2, borderLeft: activeCampaign?._id === c._id ? '2px solid var(--gold)' : '2px solid transparent' }}>{c.name}</button>
          ))}
          {isDM && activeCampaign?.joinCode && (
            <div style={{ padding: '2px 10px 6px' }}>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: pendingMembers.length > 0 ? 6 : 0 }}>Join code: <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{activeCampaign.joinCode}</span></div>
              {pendingMembers.map(m => (
                <div key={m._id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 0', borderTop: '1px solid var(--border)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.username}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-3)' }}>wants to join</div>
                  </div>
                  <button onClick={() => approveMember(m._id)} style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: '#1d6a3a', color: '#fff', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✓</button>
                  <button onClick={() => rejectMember(m._id)} style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: '#7a2020', color: '#fff', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✕</button>
                </div>
              ))}
            </div>
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
          ) : joinPending ? (
            <div style={{ marginTop: 4, padding: '8px 10px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <div style={{ fontSize: 12, fontWeight: 500 }}>Joining pending…</div>
                <button onClick={() => setJoinPending(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 13, padding: 0 }}>✕</button>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.5 }}>Waiting for the DM to approve your request.</div>
            </div>
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
            <NavLink
              key={item.to}
              to={item.to}
              onMouseEnter={() => { if (item.to === '/storyboard') preloadStoryboard() }}
              onFocus={() => { if (item.to === '/storyboard') preloadStoryboard() }}
              style={({ isActive }) => navLinkStyle(isActive)}
            >
              {item.iconUrl && <img src={item.iconUrl} alt="" aria-hidden="true" style={{ width: 18, height: 18, objectFit: 'contain', flexShrink: 0, filter: darkMode ? 'brightness(0) invert(1)' : 'none' }} />}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border)' }}>
          <PersistentPlayerBar />
          {!isPremium && (
            <button onClick={() => navigate('/premium')} className="btn btn-gold" style={{ width: '100%', justifyContent: 'center', marginBottom: 10, fontSize: 12 }}>✦ Upgrade to Premium</button>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: 'var(--gold-bg)', border: '1px solid var(--gold-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cinzel, serif', fontSize: 13, color: 'var(--gold)' }}>{user?.username?.[0]?.toUpperCase()}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.username}{isPremium && <span style={{ fontSize: 10, color: 'var(--gold)', marginLeft: 4 }}>✦ PRO</span>}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
            </div>
            <button onClick={() => setShowSettings(true)} title="Settings" aria-label="Settings" style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src="https://res.cloudinary.com/crcbzpw6/image/upload/v1791966298/ellipsis-solid-full.svg" alt="" aria-hidden="true" style={{ width: 16, height: 16, objectFit: 'contain', filter: 'var(--logo-filter, none)' }} />
            </button>
          </div>
        </div>
      </aside>

      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>{children}</main>
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  )
}
