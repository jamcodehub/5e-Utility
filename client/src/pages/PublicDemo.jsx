import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { CloudinaryImage } from '@cloudinary/url-gen'
import { quality, format } from '@cloudinary/url-gen/actions/delivery'
import { auto as autoQuality } from '@cloudinary/url-gen/qualifiers/quality'
import { auto as autoFormat } from '@cloudinary/url-gen/qualifiers/format'
import './PublicDemo.css'

const signInIconUrl = 'https://res.cloudinary.com/crcbzpw6/image/upload/v1792051212/right-to-bracket-solid-full.svg'
const heroLogoUrl = new CloudinaryImage('5e_Utillity', { cloudName: 'crcbzpw6' })
  .delivery(quality(autoQuality()))
  .delivery(format(autoFormat()))
  .toURL()

const DemoStoryboardPage = lazy(() => import('./Storyboard'))
const DemoJournalPage = lazy(() => import('./Journal'))
const DemoBattleMapPage = lazy(() => import('./LevelBuilder'))
const DemoBattleTrackerPage = lazy(() => import('./HPtracker'))
const DemoRoleplayPage = lazy(() => import('./RoleplayAssistant'))

const FEATURES = [
  { id: 'battle-map', label: 'Battle Map', iconUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1791792887/map-solid-full.svg', description: 'Build a battlefield and move your party.' },
  { id: 'journal', label: 'Journal', iconUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1791790758/01_fantasy_15_feather.png', description: 'Keep every character’s story close.' },
  { id: 'battle-tracker', label: 'Battle Tracker', iconUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1791791406/hand-fist-solid-full.svg', description: 'Keep initiative and hit points in hand.' },
  { id: 'storyboard', label: 'Storyboard', iconUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1791791388/book-solid-full.svg', description: 'Bring your campaign scenes to life.' },
  { id: 'roleplay', label: 'Roleplay', iconUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1791792735/comment-solid-full.svg', description: 'Find your character’s voice.' },
]

function DemoSidebar({ active }) {
  return (
    <aside className="demo-sidebar">
      <Link to="/" className="demo-brand" aria-label="5eUtility home">
        <img src="https://res.cloudinary.com/crcbzpw6/image/upload/v1792054744/house-solid-full.svg" alt="" aria-hidden="true" className="demo-home-icon" />
      </Link>
      <div className="demo-sidebar-label">EXPLORE THE DEMO</div>
      <nav className="demo-nav" aria-label="Demo pages">
        {FEATURES.map(feature => (
          <Link
            key={feature.id}
            to={`/demo/${feature.id}`}
            className={`demo-nav-link${active === feature.id ? ' is-active' : ''}`}
            aria-current={active === feature.id ? 'page' : undefined}
          >
            <img className="demo-nav-icon" src={feature.iconUrl} alt="" aria-hidden="true" />
            <span>{feature.label}</span>
            <span className="demo-nav-arrow" aria-hidden="true">›</span>
          </Link>
        ))}
      </nav>
      <Link to="/register" className="demo-sidebar-signin">Sign up to save your content</Link>
    </aside>
  )
}

function DemoMobileNav({ active }) {
  const trackRef = useRef(null)
  const copies = 5
  const centerCopy = 2
  const itemWidth = 88
  const gap = 4
  const items = Array.from({ length: copies }, (_, copyIndex) =>
    FEATURES.map(feature => ({ ...feature, copyIndex })),
  ).flat()

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    const segmentWidth = FEATURES.length * (itemWidth + gap)
    const activeIndex = Math.max(0, FEATURES.findIndex(feature => feature.id === active))
    track.scrollLeft = segmentWidth * centerCopy + activeIndex * (itemWidth + gap)
      - (track.clientWidth - itemWidth) / 2

    const recenter = () => {
      if (track.scrollLeft < segmentWidth) track.scrollLeft += segmentWidth
      else if (track.scrollLeft > segmentWidth * (copies - 2)) track.scrollLeft -= segmentWidth
    }
    track.addEventListener('scroll', recenter, { passive: true })
    return () => track.removeEventListener('scroll', recenter)
  }, [active])

  return (
    <nav className="demo-mobile-nav" aria-label="Demo pages">
      <div className="demo-mobile-nav-track" ref={trackRef}>
        {items.map(feature => (
          <Link
            key={`${feature.id}-${feature.copyIndex}`}
            to={`/demo/${feature.id}`}
            className={`demo-mobile-nav-link${active === feature.id ? ' is-active' : ''}`}
            aria-current={active === feature.id ? 'page' : undefined}
            aria-label={feature.label}
          >
            <img className="demo-mobile-nav-icon" src={feature.iconUrl} alt="" aria-hidden="true" />
            <span>{feature.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}

function DemoLanding({ onExplore }) {
  const videoRef = useRef(null)
  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = 0.4
  }, [])
  const speedVideo = event => { event.currentTarget.playbackRate = 0.7 }

  return (
    <section className="demo-hero">
      <div className="demo-hero-backdrop" aria-hidden="true">
        <video ref={videoRef} className="demo-hero-video" autoPlay muted loop playsInline preload="auto" aria-hidden="true" onLoadedMetadata={speedVideo} onPlay={speedVideo}>
          <source src="https://res.cloudinary.com/crcbzpw6/video/upload/so_0.1/v1792053072/dithered-video.mp4" type="video/mp4" />
        </video>
        <div className="demo-hero-shade" />
      </div>
      <div className="demo-hero-content">
        <img className="demo-hero-logo" src={heroLogoUrl} alt="5e Utility" />
        <div className="demo-hero-actions">
          <button type="button" className="demo-hero-cta" onClick={onExplore}>Explore the demo <span aria-hidden="true">→</span></button>
        </div>
      </div>
      <nav className="demo-legal-links" aria-label="Legal">
        <Link to="/privacy">Privacy Policy</Link>
        <span aria-hidden="true">·</span>
        <Link to="/terms">Terms of Service</Link>
      </nav>
    </section>
  )
}

export default function PublicDemo() {
  const [showSignupCta, setShowSignupCta] = useState(false)
  const { feature } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const onLanding = location.pathname === '/'
  const activeFeature = FEATURES.find(item => item.id === feature)
  const demoPages = {
    storyboard: DemoStoryboardPage,
    journal: DemoJournalPage,
    'battle-map': DemoBattleMapPage,
    'battle-tracker': DemoBattleTrackerPage,
    roleplay: DemoRoleplayPage,
  }
  const DemoPage = demoPages[feature]

  const explore = () => navigate(`/demo/${FEATURES[0].id}`)
  const content = onLanding
    ? <DemoLanding onExplore={explore} />
    : !activeFeature
      ? <section className="demo-not-found"><h1>That page isn’t in this preview.</h1><Link to={`/demo/${FEATURES[0].id}`}>Explore the demo</Link></section>
      : (
        <div className="demo-actual-page" onClickCapture={() => setShowSignupCta(true)}>
          <Suspense fallback={<div className="demo-page-loading">Preparing the preview…</div>}><DemoPage /></Suspense>
          {showSignupCta && (
            <div className="demo-interaction-prompt">
              <span>Your {activeFeature.label} is just a preview.</span>
              <Link to="/register">Sign up to save your progress</Link>
            </div>
          )}
        </div>
      )

  return (
    <div className="demo-app" data-theme="light">
      <DemoSidebar active={feature} />
      <main className="demo-main">
        <header className="demo-topbar">
          <Link to="/" className="demo-mobile-brand" aria-label="5eUtility home">
            <img src="https://res.cloudinary.com/crcbzpw6/image/upload/v1792054744/house-solid-full.svg" alt="" aria-hidden="true" align="center" className="demo-home-icon" />
          </Link>
          <Link to="/login" className="demo-topbar-login">Sign in</Link>
          <Link to="/register" className="demo-topbar-signin">
            <img src={signInIconUrl} alt="" aria-hidden="true" />
            <span>Sign up</span>
          </Link>
        </header>
        {content}
        {!onLanding && <DemoMobileNav active={feature} />}
      </main>
    </div>
  )
}
