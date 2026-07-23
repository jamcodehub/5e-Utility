import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { CampaignProvider } from './context/CampaignContext'
import { ThemeProvider } from './context/ThemeContext'
import Shell from './components/Shell'
import Auth from './pages/Auth'
import Journal from './pages/Journal'
import Storyboard from './pages/Storyboard'
import Lore from './pages/Lore'
import Character from './pages/Character'
import Inventory from './pages/Inventory'
import Dice from './pages/Dice'
import Premium from './pages/Premium'
import IdeaGenerator from './pages/IdeaGenerator'
import RulesReference from './pages/RulesReference'
import MusicPlayer from './pages/MusicPlayer'
import LevelBuilder from './pages/LevelBuilder'

function Guard() {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', fontFamily: 'Cinzel, serif' }}>Loading...</div>
  if (!user) return <Auth />
  return (
    <CampaignProvider>
      <Shell>
        <Routes>
          <Route path="/"           element={<Navigate to="/journal" replace />} />
          <Route path="/journal"    element={<Journal />} />
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
          <Route path="*"           element={<Navigate to="/journal" replace />} />
        </Routes>
      </Shell>
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
