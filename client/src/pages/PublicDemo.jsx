import { Link, useLocation, useParams } from 'react-router-dom'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { CloudinaryImage } from '@cloudinary/url-gen'
import { quality, format } from '@cloudinary/url-gen/actions/delivery'
import { auto as autoQuality } from '@cloudinary/url-gen/qualifiers/quality'
import { auto as autoFormat } from '@cloudinary/url-gen/qualifiers/format'
import { useTheme } from '../context/ThemeContext'
import { usePageMeta } from '../hooks/usePageMeta'
import ShowcaseCarousel from '../components/ShowcaseCarousel'
import SpinningDice from '../components/SpinningDice'
import { ThemeMontage, PlanTable } from '../components/PremiumVisuals'
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

// What the landing page says about each tool (real text for readers and for search); the demo links are real links.
const ABOUT = [
  { id: 'battle-map', fade: [{ src: '/showcase/battle-map-fog-v2.jpg', alt: 'A ruined chapel on the Battle Map with fog of war on: only the hall around the party is lit, with an enemy token nearby', label: 'Fog of war on' }, { src: '/showcase/battle-map-clear-v2.jpg', alt: 'The same chapel map with fog of war off: the pillared hall, flooded corner, treasure room, bedroom and camp outside', label: 'Fog of war off' }], title: 'Battle Map', text: 'Build a map from themed tiles, drop in tokens for your party and monsters, and switch fog of war on to reveal the dungeon only as your players explore.' },
  { id: 'battle-tracker', image: '/showcase/battle-tracker-v2.jpg', alt: 'The Battle Tracker with a boss, an enemy and a player card in initiative order, each with hit points and attack buttons', title: 'Battle Tracker', text: 'Roll initiative for everyone, work out attacks against armour class and keep hit points straight. Search the SRD monster list to add enemies in a click.' },
  { id: 'storyboard', image: '/showcase/storyboard-v2.jpg', alt: 'A Storyboard page: an illustration of a party of adventurers beside the scene text', title: 'Storyboard', text: 'Lay out the scenes of your adventure as illustrated pages, then print them for the table.' },
  { id: 'journal', image: '/showcase/journal-v2.jpg', alt: 'A Journal entry with the list of days on the left and the session notes on the right', title: 'Journal', text: 'Write session notes for each campaign and character, with the date written and last edit saved on every entry.' },
  { title: 'Campaign Guide', image: '/showcase/campaign-guide-v3.jpg', alt: 'The Campaign Guide with story, current arc, session recap and world notes', text: 'Keep your story, arc, session recap and quests in one guide that your players’ Roleplay Assistant reads automatically. A world-building guide that only asks questions is coming soon.', to: '/register', cta: 'Create a free account' },
  { id: 'roleplay', image: '/showcase/roleplay-v2.jpg', alt: 'The Roleplay Assistant with character basics and character depth fields filled in', title: 'Roleplay', text: 'Fill in your character’s background, personality and goals, and get a session plan that ties them to the story your DM is telling.' },
  { title: 'Lore, characters and dice', visual: <SpinningDice />, text: 'Keep world and NPC lore, build character sheets and roll true 3D d4, d6, d8, d10, d12 and d20 dice.', to: '/register', cta: 'Create a free account' },
  { title: 'Class themes', badge: 'Premium', visual: <ThemeMontage />, text: 'Switch the whole app between class themes such as Barbarian, Wizard, Druid, Paladin, Rogue and Bard. The rest of these screenshots show the default light theme. Light and Dark are free.', to: '/register', cta: 'Create a free account' },
  { title: 'Free to start, Premium to grow', badge: 'Premium', visual: <PlanTable />, text: 'Everything above works on a free account. Premium lifts the limits for bigger campaigns and adds every class theme.', to: '/register', cta: 'Create a free account' },
]

function DemoSidebar({ active }) {
  return (
    <aside className="demo-sidebar">
      <Link to="/" className="demo-brand" aria-label="5eUtility home">
        <img src="https://res.cloudinary.com/crcbzpw6/image/upload/v1792054744/house-solid-full.svg" alt="" aria-hidden="true" className="demo-home-icon" width="100px" />
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

function DemoLanding() {
  const { theme, lightMode } = useTheme()
  // same rule the shell uses to decide whether the UI is dark
  const dark = theme !== 'light' && (!lightMode || theme === 'dark')
  const videoRef = useRef(null)
  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = 0.4
  }, [])
  const speedVideo = event => { event.currentTarget.playbackRate = 0.7 }

  return (
    <>
    <section className={`demo-hero${dark ? ' is-dark' : ''}`}>
      <div className="demo-hero-backdrop" aria-hidden="true">
        <video ref={videoRef} className="demo-hero-video" autoPlay muted loop playsInline preload="auto" aria-hidden="true" onLoadedMetadata={speedVideo} onPlay={speedVideo}>
          <source src="https://res.cloudinary.com/crcbzpw6/video/upload/v1794488176/White_Knight_Walk_Loop.mp4" type="video/mp4" />
        </video>
        <div className="demo-hero-shade" />
      </div>
      <div className="demo-hero-content">
        <h1 className="demo-hero-h1"><img className="demo-hero-logo" src="https://res.cloudinary.com/crcbzpw6/image/upload/v1794483597/5E_UTILITY_Pure_Black_2000.png" alt="5e Utility: D&D campaign companion" /></h1>
        <p className="demo-hero-tagline">Your campaign, bound in one place: maps, lore, dice and the DM's best-kept secrets.</p>
        <div className="demo-hero-rule" aria-hidden="true"><i /></div>
        <div className="demo-hero-actions">
          <Link to={`/demo/${FEATURES[0].id}`} className="demo-hero-cta">Explore the demo <span aria-hidden="true">→</span></Link>
        </div>
        <div className="demo-hero-auth">
          <Link to="/login" className="demo-hero-auth-btn is-signin">Sign in</Link>
          <Link to="/register" className="demo-hero-auth-btn is-register">Register</Link>
        </div>
      </div>
      <nav className="demo-legal-links" aria-label="Legal">
        <Link to="/privacy">Privacy Policy</Link>
        <span aria-hidden="true">·</span>
        <Link to="/terms">Terms of Service</Link>
      </nav>
    </section>
    <section className="demo-about" aria-labelledby="demo-about-title">
      <h2 id="demo-about-title">A campaign companion for players and Dungeon Masters</h2>
      <p className="demo-about-lead">5e Utility keeps everything for your Dungeons &amp; Dragons 5th Edition table in one place, so you spend less time hunting through notes and more time playing.</p>
      <ShowcaseCarousel slides={ABOUT} label="What 5e Utility does" />
    </section>
    </>
  )
}

export default function PublicDemo() {
  const [showSignupCta, setShowSignupCta] = useState(false)
  const { feature } = useParams()
  const location = useLocation()
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

  const LANDING_DESC = 'Free D&D 5e campaign companion: session journal, lore, character sheets, battle maps, initiative tracker, 3D dice and more for players and Dungeon Masters.'
  usePageMeta(onLanding
    ? { title: '5e Utility: D&D campaign companion for journals, lore, maps and dice', description: LANDING_DESC, path: '/' }
    : activeFeature
      ? { title: `${activeFeature.label} for D&D 5e: try the demo | 5e Utility`, description: `${activeFeature.description} Try the ${activeFeature.label.toLowerCase()} in the free 5e Utility demo, no sign-up needed.`, path: `/demo/${activeFeature.id}` }
      : { title: 'Page not found | 5e Utility', description: 'That page is not in the 5e Utility preview.', noindex: true })
  const content = onLanding
    ? <DemoLanding />
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
    <div className={`demo-app${onLanding ? ' is-landing' : ''}`} data-theme="light">
      {!onLanding && <DemoSidebar active={feature} />}
      <main className="demo-main">
        {!onLanding && <header className="demo-topbar">
          <Link to="/" className="demo-mobile-brand" aria-label="5eUtility home">
            <img src="https://res.cloudinary.com/crcbzpw6/image/upload/v1792054744/house-solid-full.svg" alt="" aria-hidden="true" align="center" className="demo-home-icon" />
          </Link>
          <Link to="/login" className="demo-topbar-login">Sign in</Link>
          <Link to="/register" className="demo-topbar-signin">
            <img src={signInIconUrl} alt="" aria-hidden="true" />
            <span>Sign up</span>
          </Link>
        </header>}
        {content}
        {!onLanding && <DemoMobileNav active={feature} />}
      </main>
    </div>
  )
}
