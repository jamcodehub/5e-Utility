import { createContext, useContext, useState, useEffect } from 'react'
import { api } from './AuthContext'
import { useAuth } from './AuthContext'

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

  const createCampaign = async (body) => {
    const c = await api('/campaigns', { method: 'POST', body })
    setCampaigns(p => [c, ...p])
    setActive(c)
    return c
  }

  const updateCampaign = async (id, body) => {
    const c = await api(`/campaigns/${id}`, { method: 'PUT', body })
    setCampaigns(p => p.map(x => x._id === id ? c : x))
    if (activeCampaign?._id === id) setActive(c)
  }

  const deleteCampaign = async (id) => {
    await api(`/campaigns/${id}`, { method: 'DELETE' })
    setCampaigns(p => p.filter(x => x._id !== id))
    if (activeCampaign?._id === id) setActive(null)
  }

  return (
    <CampaignContext.Provider value={{ campaigns, activeCampaign, setActive, createCampaign, updateCampaign, deleteCampaign, reload: load }}>
      {children}
    </CampaignContext.Provider>
  )
}
