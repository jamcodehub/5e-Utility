import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, DemoAuthProvider, useAuth } from './context/AuthContext'
import { CampaignProvider, DemoCampaignProvider } from './context/CampaignContext'
import { ThemeProvider } from './context/ThemeContext'
import { MusicProvider } from './context/MusicContext'
import Shell from './components/Shell'
import Auth from './pages/Auth'
import PublicDemo from './pages/PublicDemo'
import SessionPlanner from './pages/SessionPlanner'
import { useCampaign } from './context/CampaignContext'
import { resetDemoApi } from './utils/demoRuntime'
import {
  SkeletonCharacterPage,
  SkeletonCombatPage,
  SkeletonCampaignGuideContent,
  SkeletonDicePage,
  SkeletonInventoryContent,
  SkeletonLorePage,
  SkeletonMusicPage,
  SkeletonPage,
  SkeletonPremiumPage,
  SkeletonIdeaGeneratorContent,
  SkeletonRoleplayPage,
  SkeletonRulesPage,
  SkeletonShell,
} from './components/Skeleton'
import { lazy, Suspense, useEffect } from 'react'

// Keep both role-specific landing pages in the initial bundle so the first
// authenticated screen never waits for a route chunk
// Secondary pages are downloaded only when needed.
const loadStoryboard = () => import('./pages/Storyboard')
const loadJournal = () => import('./pages/Journal')
const loadLore = () => import('./pages/Lore')
const loadCharacter = () => import('./pages/Character')
const loadInventory = () => import('./pages/Inventory')
const loadDice = () => import('./pages/Dice')
const loadPremium = () => import('./pages/Premium')
const loadIdeaGenerator = () => import('./pages/IdeaGenerator')
const loadRulesReference = () => import('./pages/RulesReference')
const loadMusicPlayer = () => import('./pages/MusicPlayer')
const loadLevelBuilder = () => import('./pages/LevelBuilder')
const loadRoleplayAssistant = () => import('./pages/RoleplayAssistant')
const loadCampaignGuide = () => import('./pages/CampaignGuide')
const loadHpTracker = () => import('./pages/HPtracker')

const routeChunkLoaders = [
  loadStoryboard,
  loadJournal,
  loadLore,
  loadCharacter,
  loadInventory,
  loadDice,
  loadPremium,
  loadIdeaGenerator,
  loadRulesReference,
  loadMusicPlayer,
  loadLevelBuilder,
  loadRoleplayAssistant,
  loadCampaignGuide,
  loadHpTracker,
]

const Storyboard = lazy(loadStoryboard)
const Journal = lazy(loadJournal)
const Lore = lazy(loadLore)
const Character = lazy(loadCharacter)
const Inventory = lazy(loadInventory)
const Dice = lazy(loadDice)
const Premium = lazy(loadPremium)
const IdeaGenerator = lazy(loadIdeaGenerator)
const RulesReference = lazy(loadRulesReference)
const SharedSheet = lazy(() => import('./pages/SharedSheet'))
const Privacy = lazy(() => import('./pages/legal/Privacy'))
const Terms = lazy(() => import('./pages/legal/Terms'))
const MusicPlayer = lazy(loadMusicPlayer)
const LevelBuilder = lazy(loadLevelBuilder)
const RoleplayAssistant = lazy(loadRoleplayAssistant)
const CampaignGuide = lazy(loadCampaignGuide)
const HpTracker = lazy(loadHpTracker)

function PageLoader() {
  const { pathname } = useLocation()
  const { activeCampaign } = useCampaign()
  const { user } = useAuth()
  if (pathname === '/storyboard') {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--sb-outer)', color: 'var(--text)' }}>
        <div style={{ padding: '8px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--sb-bar)', borderBottom: '1px solid var(--sb-bar-border)', flexShrink: 0 }}>
          <div style={{ fontFamily: 'Cinzel, serif', fontSize: 12, color: 'var(--sb-page-meta)' }}>{activeCampaign?.name || 'Storyboard'}</div>
          <button className="btn btn-primary btn-sm" disabled>+ Add Scene</button>
        </div>
        <div style={{ flex: 1 }} />
      </div>
    )
  }
  if (pathname === '/roleplay') return <SkeletonRoleplayPage />
  if (pathname === '/levels') {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0 }}>
          <h2 style={{ fontSize: 20, marginBottom: 2 }}>Battle Map</h2>
          <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
            {user?.role === 'dm'
              ? 'Draw tile maps, then enter play mode to position your party.'
              : 'Open a map below to view and move your token — everyone sees moves live.'}
          </p>
        </div>
        <div style={{ flex: 1 }} />
      </div>
    )
  }
  if (pathname === '/campaign-guide') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', paddingTop: 16 }}>
        <div style={{ padding: '0 24px', marginBottom: 10, flexShrink: 0 }}>
          <h2 style={{ fontSize: 18, marginBottom: 3 }}>Campaign Guide</h2>
          <p style={{ color: 'var(--text-2)', fontSize: 12, margin: 0, lineHeight: 1.5 }}>Players' Roleplay Assistant reads this automatically. Gold fields personalise each player's session plan.</p>
        </div>
        <SkeletonCampaignGuideContent />
      </div>
    )
  }
  if (pathname === '/ideas') {
    return (
      <div className="page-content">
        <div className="page-header-row" style={{ marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 22, marginBottom: 4 }}>Idea Generator</h2>
            <p style={{ color: 'var(--text-2)', fontSize: 14, margin: 0 }}>Instant inspiration when the table goes quiet.</p>
          </div>
        </div>
        <SkeletonIdeaGeneratorContent />
      </div>
    )
  }
  if (pathname === '/character') return <SkeletonCharacterPage />
  if (pathname === '/inventory') {
    return (
      <div className="page-content">
        <div className="page-header-row" style={{ marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 22, marginBottom: 4 }}>{user?.role === 'dm' ? 'Shop Items' : 'Inventory'}</h2>
            <p style={{ color: 'var(--text-2)', fontSize: 14, margin: 0 }}>Track your gear and coin purse.</p>
          </div>
        </div>
        <SkeletonInventoryContent />
      </div>
    )
  }
  if (pathname === '/lore') return <SkeletonLorePage />
  if (pathname === '/music') return <SkeletonMusicPage />
  if (pathname === '/rules') return <SkeletonRulesPage />
  if (pathname === '/premium') return <SkeletonPremiumPage />
  if (pathname === '/dice') return <SkeletonDicePage />
  if (pathname === '/combat') return <SkeletonCombatPage />
  return <SkeletonPage />
}

function Guard() {
  const { user, loading } = useAuth()

  useEffect(() => {
    if (user) resetDemoApi()
  }, [user])

  useEffect(() => {
    if (loading || !user) return
    const connection = navigator.connection
    if (connection?.saveData || ['slow-2g', '2g'].includes(connection?.effectiveType)) return

    let cancelled = false
    let loaderIndex = 0
    let startTimer
    let idleCallbackId
    let fallbackTimer

    const loadNextChunk = () => {
      if (cancelled || loaderIndex >= routeChunkLoaders.length) return
      const loadChunk = routeChunkLoaders[loaderIndex++]
      loadChunk()
        .catch(error => console.error('Failed to preload a route', error))
        .finally(scheduleNextChunk)
    }

    const scheduleNextChunk = () => {
      if (cancelled || loaderIndex >= routeChunkLoaders.length) return
      if ('requestIdleCallback' in window) {
        idleCallbackId = window.requestIdleCallback(loadNextChunk, { timeout: 3000 })
      } else {
        fallbackTimer = window.setTimeout(loadNextChunk, 250)
      }
    }

    startTimer = window.setTimeout(scheduleNextChunk, 1500)
    return () => {
      cancelled = true
      window.clearTimeout(startTimer)
      window.clearTimeout(fallbackTimer)
      if (idleCallbackId !== undefined && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleCallbackId)
      }
    }
  }, [loading, user])

  if (loading) return <SkeletonShell cards={6} />
  if (!user) {
    const demoPage = (
      <DemoAuthProvider>
        <DemoCampaignProvider>
          <PublicDemo />
        </DemoCampaignProvider>
      </DemoAuthProvider>
    )
    return (
      <Routes>
        <Route path="/" element={demoPage} />
        <Route path="/demo/:feature" element={demoPage} />
        <Route path="/login" element={<Auth />} />
        <Route path="/register" element={<Auth />} />
        <Route path="/reset-password" element={<Auth />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    )
  }
  // Players land on their Journal; DMs land on their Session Planner.
  const homePath = user.role === 'dm' ? '/session-planner' : '/journal'
  return (
    <CampaignProvider>
      <MusicProvider>
        <Shell>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/"           element={<Navigate to={homePath} replace />} />
              <Route path="/journal"    element={<Journal />} />
              <Route path="/session-planner" element={<SessionPlanner />} />
              <Route path="/storyboard" element={<Storyboard />} />
              <Route path="/lore"       element={<Lore />} />
              <Route path="/character"  element={<Character />} />
              <Route path="/inventory"  element={<Inventory />} />
              <Route path="/dice"       element={<Dice />} />
              <Route path="/premium"    element={<Premium />} />
              <Route path="/ideas"      element={<IdeaGenerator />} />
              <Route path="/rules"      element={<RulesReference />} />
              <Route path="/music"      element={<MusicPlayer />} />
              <Route path="/levels"     element={<LevelBuilder />} />
              <Route path="/roleplay"   element={<RoleplayAssistant />} />
              <Route path="/campaign-guide" element={<CampaignGuide />} />
              <Route path="/combat"     element={<HpTracker />} />
              <Route path="*"           element={<Navigate to={homePath} replace />} />
            </Routes>
          </Suspense>
        </Shell>
      </MusicProvider>
    </CampaignProvider>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/s/:token" element={<Suspense fallback={null}><SharedSheet /></Suspense>} />
          <Route path="/privacy" element={<Suspense fallback={null}><Privacy /></Suspense>} />
          <Route path="/terms" element={<Suspense fallback={null}><Terms /></Suspense>} />
          <Route path="*" element={<AuthProvider><Guard /></AuthProvider>} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
