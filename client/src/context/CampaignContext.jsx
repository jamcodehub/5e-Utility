import { createContext, useContext, useState, useEffect } from 'react'
import { api, useAuth } from './AuthContext'

const CampaignContext = createContext(null)
export const useCampaign = () => useContext(CampaignContext)

export function CampaignProvider({ children }) {
  const { user } = useAuth()
  const [campaigns, setCampaigns]   = useState([])
  const [activeCampaign, setActive] = useState(null)

  const load = async () => {
    if (!user) return
    const data = await api('/campaigns')
    setCampaigns(data)
    if (data.length && !activeCampaign) setActive(data[0])
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

  const deleteCampaign = async (id) => {
    await api(`/campaigns/${id}`, { method: 'DELETE' })
    const remaining = campaigns.filter(x => x._id !== id)
    setCampaigns(remaining)
    if (activeCampaign?._id === id) setActive(remaining.find(c => !c.isPersonal) || remaining[0] || null)
  }

  const leaveCampaign = async (id) => {
    await api(`/campaigns/${id}/leave`, { method: 'POST' })
    const remaining = campaigns.filter(x => x._id !== id)
    setCampaigns(remaining)
    if (activeCampaign?._id === id) setActive(remaining.find(c => !c.isPersonal) || remaining[0] || null)
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
