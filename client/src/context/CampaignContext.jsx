import { createContext, useContext, useState, useEffect } from 'react'
import { api, useAuth } from './AuthContext'

const CampaignContext = createContext(null)
export const useCampaign = () => useContext(CampaignContext)

const DEMO_CAMPAIGN = {
  _id: 'demo-campaign',
  name: 'The Tale of Eldermere',
  isPersonal: false,
  ownerId: 'demo-dm',
}

export function DemoCampaignProvider({ children }) {
  return (
    <CampaignContext.Provider value={{
      campaigns: [DEMO_CAMPAIGN],
      activeCampaign: DEMO_CAMPAIGN,
      campaignsLoading: false,
      campaignsError: '',
      setActive: () => {},
      createCampaign: async () => 'Campaigns are disabled in the demo.',
      updateCampaign: async () => {},
      deleteCampaign: async () => {},
      leaveCampaign: async () => {},
      joinCampaign: async () => 'Campaigns are disabled in the demo.',
      reload: async () => {},
    }}>
      {children}
    </CampaignContext.Provider>
  )
}

export function CampaignProvider({ children }) {
  const { user } = useAuth()
  const [campaigns, setCampaigns]   = useState([])
  const [activeCampaign, setActiveRaw] = useState(null)
  const [campaignsLoading, setCampaignsLoading] = useState(true)
  const [campaignsError, setCampaignsError] = useState('')

  const setActive = (c) => {
    setActiveRaw(c)
    if (c?._id) localStorage.setItem('activeCampaignId', c._id)
    else localStorage.removeItem('activeCampaignId')
  }

  const load = async () => {
    if (!user) {
      setCampaignsLoading(false)
      return
    }
    setCampaignsLoading(true)
    setCampaignsError('')
    try {
      const data = await api('/campaigns')
      setCampaigns(data)
      // Keep the current selection if it's still valid (e.g. a background
      // reload shouldn't yank the user to a different campaign); otherwise
      // restore whichever one they were last viewing, or fall back to the
      // first available (which the server always provisions — at minimum
      // the personal "My Journal" space — so this never leaves Journal/Lore
      // stranded after the active campaign is deleted or left).
      setActiveRaw(prev => {
        if (prev && data.some(c => c._id === prev._id)) return prev
        const lastId = localStorage.getItem('activeCampaignId')
        const restored = lastId && data.find(c => c._id === lastId)
        const next = restored || data[0] || null
        if (next?._id) localStorage.setItem('activeCampaignId', next._id)
        else localStorage.removeItem('activeCampaignId')
        return next
      })
    } catch (err) {
      setCampaignsError(err.message || 'Failed to load campaigns')
    } finally {
      setCampaignsLoading(false)
    }
  }

  useEffect(() => { load() }, [user?.id || user?._id])

  // Returns null on success, error string on failure
  const createCampaign = async (body) => {
    try {
      const c = await api('/campaigns', { method: 'POST', body })
      setCampaigns(p => [c, ...p])
      setActive(c)
      return null
    } catch (e) {
      return e.message
    }
  }

  const updateCampaign = async (id, body) => {
    const c = await api(`/campaigns/${id}`, { method: 'PUT', body })
    setCampaigns(p => p.map(x => x._id === id ? c : x))
    if (activeCampaign?._id === id) setActive(c)
  }

  // Both require the caller to have already confirmed the exact campaign
  // name client-side; confirmName is also re-checked server-side. Reloading
  // afterwards (rather than just filtering locally) means that leaving/
  // deleting your last real campaign re-syncs with the server, which
  // re-provisions the personal "My Journal" space so Journal/Lore keep
  // working immediately instead of requiring a page refresh.
  const deleteCampaign = async (id, confirmName) => {
    await api(`/campaigns/${id}`, { method: 'DELETE', body: { confirmName } })
    await load()
  }

  const leaveCampaign = async (id, confirmName) => {
    await api(`/campaigns/${id}/leave`, { method: 'POST', body: { confirmName } })
    await load()
  }

  // Returns null on success, 'pending' if awaiting DM approval, error string on failure
  const joinCampaign = async (code) => {
    try {
      const res = await api('/campaigns/join', { method: 'POST', body: { code } })
      if (res.pending) return 'pending'
      const c = res.campaign || res
      setCampaigns(p => p.some(x => x._id === c._id) ? p.map(x => x._id === c._id ? c : x) : [c, ...p])
      setActive(c)
      return null
    } catch (e) {
      return e.message
    }
  }

  return (
    <CampaignContext.Provider value={{ campaigns, activeCampaign, campaignsLoading, campaignsError, setActive, createCampaign, updateCampaign, deleteCampaign, leaveCampaign, joinCampaign, reload: load }}>
      {children}
    </CampaignContext.Provider>
  )
}
