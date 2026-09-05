import { createContext, useContext, useState, useEffect } from 'react'
import { api, useAuth } from './AuthContext'

const CampaignContext = createContext(null)
export const useCampaign = () => useContext(CampaignContext)

export function CampaignProvider({ children }) {
  const { user } = useAuth()
  const [campaigns, setCampaigns]   = useState([])
  const [activeCampaign, setActiveRaw] = useState(null)

  const setActive = (c) => {
    setActiveRaw(c)
    if (c?._id) localStorage.setItem('activeCampaignId', c._id)
    else localStorage.removeItem('activeCampaignId')
  }

  const load = async () => {
    if (!user) return
    const data = await api('/campaigns')
    setCampaigns(data)
    if (data.length && !activeCampaign) {
      // Restore the campaign the user was last viewing instead of always
      // defaulting to the most-recently-updated one (data[0]) — otherwise
      // background activity in another campaign (e.g. a DM edit) can bump
      // that campaign to the top and silently switch users onto a
      // different, empty character sheet on next login.
      const lastId = localStorage.getItem('activeCampaignId')
      const restored = lastId && data.find(c => c._id === lastId)
      setActive(restored || data[0])
    }
  }

  useEffect(() => { load() }, [user])

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
  // name client-side; confirmName is also re-checked server-side.
  const deleteCampaign = async (id, confirmName) => {
    await api(`/campaigns/${id}`, { method: 'DELETE', body: { confirmName } })
    setCampaigns(p => p.filter(x => x._id !== id))
    if (activeCampaign?._id === id) setActive(campaigns.find(x => x._id !== id) || null)
  }

  const leaveCampaign = async (id, confirmName) => {
    await api(`/campaigns/${id}/leave`, { method: 'POST', body: { confirmName } })
    setCampaigns(p => p.filter(x => x._id !== id))
    if (activeCampaign?._id === id) setActive(campaigns.find(x => x._id !== id) || null)
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
    <CampaignContext.Provider value={{ campaigns, activeCampaign, setActive, createCampaign, updateCampaign, deleteCampaign, leaveCampaign, joinCampaign, reload: load }}>
      {children}
    </CampaignContext.Provider>
  )
}
