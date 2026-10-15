import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { lazy, Suspense, useEffect, useRef } from 'react'
import { CloudinaryImage } from '@cloudinary/url-gen'
import { quality, format } from '@cloudinary/url-gen/actions/delivery'
import { auto as autoQuality } from '@cloudinary/url-gen/qualifiers/quality'
import { auto as autoFormat } from '@cloudinary/url-gen/qualifiers/format'
import './PublicDemo.css'

const logoUrl = new CloudinaryImage('5e_Utillity', { cloudName: 'crcbzpw6' })
  .delivery(quality(autoQuality()))
  .delivery(format(autoFormat()))
  .toURL()
const signInIconUrl = 'https://res.cloudinary.com/crcbzpw6/image/upload/v1792051212/right-to-bracket-solid-full.svg'

const DemoStoryboardPage = lazy(() => import('./Storyboard'))
const DemoJournalPage = lazy(() => import('./Journal'))
const DemoBattleMapPage = lazy(() => import('./LevelBuilder'))
const DemoBattleTrackerPage = lazy(() => import('./HPtracker'))
const DemoRoleplayPage = lazy(() => import('./RoleplayAssistant'))

const FEATURES = [
  { id: 'storyboard', label: 'Storyboard', icon: '▤', description: 'Bring your campaign scenes to life.' },
  { id: 'journal', label: 'Journal', icon: '✎', description: 'Keep every character’s story close.' },
  { id: 'battle-map', label: 'Battle Map', icon: '▦', description: 'Build a battlefield and move your party.' },
  { id: 'battle-tracker', label: 'Battle Tracker', icon: '⚔', description: 'Keep initiative and hit points in hand.' },
  { id: 'roleplay', label: 'Roleplay', icon: '❖', description: 'Find your character’s voice.' },
]

function DemoSidebar({ active }) {
  return (
    <aside className="demo-sidebar">
      <Link to="/" className="demo-brand" aria-label="5eUtility home">
        <img src={logoUrl} alt="5eUtility" />
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
            <span className="demo-nav-icon" aria-hidden="true">{feature.icon}</span>
            <span>{feature.label}</span>
            <span className="demo-nav-arrow" aria-hidden="true">›</span>
          </Link>
        ))}
      </nav>
      <Link to="/login" className="demo-sidebar-signin">Sign in to save your content</Link>
    </aside>
  )
}

function DemoLanding({ onExplore }) {
  const videoRef = useRef(null)
  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = 0.5
  }, [])
  const slowVideo = event => { event.currentTarget.playbackRate = 0.5 }

  return (
    <section className="demo-hero">
      <div className="demo-hero-backdrop" aria-hidden="true">
        <video ref={videoRef} className="demo-hero-video" autoPlay muted loop playsInline preload="metadata" aria-hidden="true" onLoadedMetadata={slowVideo} onPlay={slowVideo}>
          <source src="https://res.cloudinary.com/crcbzpw6/video/upload/v1792050326/tmpq4v_63hj.mp4" type="video/mp4" />
        </video>
        <div className="demo-hero-shade" />
      </div>
      <div className="demo-hero-content">
        <h1>Every great story<br /><em>needs a place to begin.</em></h1>
        <p>Bring your characters, campaign, and adventures together in one welcoming home for your D&amp;D table.</p>
        <div className="demo-hero-actions">
          <button type="button" className="demo-hero-cta" onClick={onExplore}>Explore the demo <span aria-hidden="true">→</span></button>
        </div>
        <div className="demo-hero-footnote"><span>01 / 05</span><span>YOUR ADVENTURE STARTS HERE</span></div>
      </div>
    </section>
  )
}

export default function PublicDemo() {
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
      : <div className="demo-actual-page"><Suspense fallback={<div className="demo-page-loading">Preparing the preview…</div>}><DemoPage /></Suspense></div>

  return (
    <div className="demo-app">
      <DemoSidebar active={feature} />
      <main className="demo-main">
        <header className="demo-topbar">
          <span>{onLanding ? 'EXPLORE 5EUTILITY' : `${activeFeature?.label || 'DEMO'} PREVIEW`}</span>
          <Link to="/login" className="demo-topbar-signin">
            <img src={signInIconUrl} alt="" aria-hidden="true" />
            <span>Sign in</span>
          </Link>
        </header>
        {content}
      </main>
    </div>
  )
}
