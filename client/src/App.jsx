import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { CampaignProvider } from './context/CampaignContext'
import { ThemeProvider } from './context/ThemeContext'
import { MusicProvider } from './context/MusicContext'
import Shell from './components/Shell'
import Auth from './pages/Auth'
import Journal from './pages/Journal'
import { SkeletonPage, SkeletonShell } from './components/Skeleton'
import { lazy, Suspense, useEffect } from 'react'

// Journal loads in the initial bundle (first page users land on).
// Every other page is code-split — downloaded in the background after login.
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
const SessionPlanner = lazy(() => import('./pages/SessionPlanner'))
const HpTracker      = lazy(() => import('./pages/HPtracker'))

// Kick off all remaining chunk downloads in idle time after Journal renders.
// Uses requestIdleCallback so it never competes with the first paint.
const prefetchAll = () => {
  const pages = [
    () => import('./pages/Storyboard'),
    () => import('./pages/Lore'),
    () => import('./pages/Character'),
    () => import('./pages/Inventory'),
    () => import('./pages/Dice'),
    () => import('./pages/Premium'),
    () => import('./pages/IdeaGenerator'),
    () => import('./pages/RulesReference'),
    () => import('./pages/MusicPlayer'),
    () => import('./pages/LevelBuilder'),
    () => import('./pages/RoleplayAssistant'),
    () => import('./pages/CampaignGuide'),
    () => import('./pages/SessionPlanner'),
    () => import('./pages/HPtracker'),
  ]
  const schedule = window.requestIdleCallback || ((cb) => setTimeout(cb, 200))
  let i = 0
  const next = (deadline) => {
    // Load one chunk per idle slice to avoid blocking the main thread
    while (i < pages.length && (!deadline || deadline.timeRemaining() > 5)) {
      pages[i++]().catch(() => {})
    }
    if (i < pages.length) schedule(next)
  }
  schedule(next)
}

const PageLoader = () => <SkeletonPage />

function Guard() {
  const { user, loading } = useAuth()

  // Start prefetching all other pages in the background as soon as the user
  // is authenticated — runs once, quietly, without blocking the UI.
  useEffect(() => {
    if (user) prefetchAll()
  }, [!!user])

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
