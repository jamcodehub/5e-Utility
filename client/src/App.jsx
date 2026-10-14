import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { CampaignProvider } from './context/CampaignContext'
import { ThemeProvider } from './context/ThemeContext'
import { MusicProvider } from './context/MusicContext'
import Shell from './components/Shell'
import Auth from './pages/Auth'
import Journal from './pages/Journal'
import SessionPlanner from './pages/SessionPlanner'
import { useCampaign } from './context/CampaignContext'
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
  SkeletonRulesPage,
  SkeletonShell,
} from './components/Skeleton'
import { lazy, Suspense } from 'react'

// Keep both role-specific landing pages in the initial bundle so the first
// authenticated screen never waits for a route chunk.
// Secondary pages are downloaded only when needed.
const Storyboard    = lazy(() => import('./pages/Storyboard'))
const Lore          = lazy(() => import('./pages/Lore'))
const Character     = lazy(() => import('./pages/Character'))
const Inventory     = lazy(() => import('./pages/Inventory'))
const Dice          = lazy(() => import('./pages/Dice'))
const Premium       = lazy(() => import('./pages/Premium'))
const IdeaGenerator = lazy(() => import('./pages/IdeaGenerator'))
const RulesReference = lazy(() => import('./pages/RulesReference'))
const MusicPlayer   = lazy(() => import('./pages/MusicPlayer'))
const LevelBuilder  = lazy(() => import('./pages/LevelBuilder'))
const RoleplayAssistant = lazy(() => import('./pages/RoleplayAssistant'))
const CampaignGuide = lazy(() => import('./pages/CampaignGuide'))
const HpTracker      = lazy(() => import('./pages/HPtracker'))

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
  if (pathname === '/roleplay') {
    return <div className="page-content"><div className="page-header-row"><h2 style={{ fontSize: 20 }}>Roleplay Assistant</h2></div></div>
  }
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
            <h2 style={{ fontSize: 22, marginBottom: 4 }}>Inventory</h2>
            <p style={{ color: 'var(--text-2)', fontSize: 14, margin: 0 }}>Track your gear and coin purse.</p>
          </div>
        </div>
        <SkeletonInventoryContent />
      </div>
    )
  }
  if (pathname === '/lore') return <SkeletonLorePage />
  if (pathname === '/roleplay') return <SkeletonRoleplayPage />
  if (pathname === '/music') return <SkeletonMusicPage />
  if (pathname === '/rules') return <SkeletonRulesPage />
  if (pathname === '/premium') return <SkeletonPremiumPage />
  if (pathname === '/dice') return <SkeletonDicePage />
  if (pathname === '/combat') return <SkeletonCombatPage />
  return <SkeletonPage />
}

function Guard() {
  const { user, loading } = useAuth()

  if (loading) return <SkeletonShell cards={6} />
  if (!user) return <Auth />
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
        <AuthProvider>
          <Guard />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}
