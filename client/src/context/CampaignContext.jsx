import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { api, useAuth } from './AuthContext'
import { getSocket } from '../utils/socket'

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
  // The role the current campaign list was fetched for. The list differs per
  // role, so until it matches the user's role it must not be exposed.
  const [loadedRole, setLoadedRole] = useState(null)
  const loadSeq = useRef(0)
  // A player who asked to join a campaign that needs the DM's approval: remember which one, so that once the DM approves it
  // becomes the selected campaign by itself (this device only; dropped after a week).
  const [joinRequestId, setJoinRequestId] = useState(null)
  const joinKey = (role) => `joinRequest:${role || 'player'}`
  const readJoinRequest = (role) => {
    try {
      const v = JSON.parse(localStorage.getItem(joinKey(role)))
      if (v?.id && Date.now() - v.at < 7 * 24 * 3600 * 1000) return String(v.id)
      localStorage.removeItem(joinKey(role))
    } catch { /* ignore */ }
    return null
  }
  const loadRef = useRef(null)

  // The last campaign is remembered separately for each mode, so switching between
  // player and DM returns to the campaign you were last using in that mode.
  const roleKey = (role) => `activeCampaignId:${role || 'player'}`

  const setActive = (c) => {
    setActiveRaw(c)
    const key = roleKey(user?.role)
    if (c?._id) localStorage.setItem(key, c._id)
    else localStorage.removeItem(key)
  }

  const load = async (quiet = false) => {
    if (!user) {
      setCampaignsLoading(false)
      return
    }
    const seq = ++loadSeq.current
    const role = user.role
    if (!quiet) setCampaignsLoading(true)
    setCampaignsError('')
    try {
      const data = await api('/campaigns')
      if (seq !== loadSeq.current) return
      setCampaigns(data)
      // The DM approved the request: go straight to that campaign, even if another one was selected.
      const wanted = readJoinRequest(role)
      const joined = wanted && data.find(c => String(c._id) === wanted)
      setJoinRequestId(joined ? null : wanted)
      if (joined) {
        localStorage.removeItem(joinKey(role))
        localStorage.setItem(roleKey(role), joined._id)
        setActiveRaw(joined)
        setLoadedRole(role)
        return
      }
      // Keep the current selection if it's still valid (e.g. a background
      // reload shouldn't yank the user to a different campaign); otherwise
      // restore whichever one they were last viewing, or fall back to the
      // first available (which the server always provisions — at minimum
      // the personal "My Journal" space — so this never leaves Journal/Lore
      // stranded after the active campaign is deleted or left).
      setActiveRaw(prev => {
        if (prev && data.some(c => c._id === prev._id)) return prev
        // Falls back to the old single-key value for people who selected a campaign before per-mode memory existed.
        const lastId = localStorage.getItem(roleKey(role)) || localStorage.getItem('activeCampaignId')
        const restored = lastId && data.find(c => c._id === lastId)
        // Prefer a real campaign over the personal "My Journal" space, which the UI shows as "no campaign selected".
        const next = restored || data.find(c => !c.isPersonal) || data[0] || null
        if (next?._id) localStorage.setItem(roleKey(role), next._id)
        else localStorage.removeItem(roleKey(role))
        return next
      })
      setLoadedRole(role)
    } catch (err) {
      if (seq !== loadSeq.current) return
      setCampaignsError(err.message || 'Failed to load campaigns')
      setLoadedRole(role)
    } finally {
      if (seq === loadSeq.current) setCampaignsLoading(false)
    }
  }

  useEffect(() => { load() }, [user?.id || user?._id, user?.role])
  loadRef.current = load

  // While a join request waits for the DM: the server tells this page the moment it is approved, so the campaign is selected at
  // once. As a fallback (a dropped connection, a request sent before this existed) it also looks again every so often and when
  // the tab is opened again, without a loading flash.
  useEffect(() => {
    if (!joinRequestId) return undefined
    const look = () => { if (!document.hidden) loadRef.current?.(true) }
    const timer = setInterval(look, 15000)
    window.addEventListener('focus', look)
    let socket = null
    const approved = () => loadRef.current?.(true)
    try { socket = getSocket(); socket.on('campaign:approved', approved) } catch { /* the timer still covers it */ }
    return () => {
      clearInterval(timer)
      window.removeEventListener('focus', look)
      try { socket?.off('campaign:approved', approved) } catch { /* ignore */ }
    }
  }, [joinRequestId])

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
      if (res.pending) {
        if (res.campaignId) {
          try { localStorage.setItem(joinKey(user?.role), JSON.stringify({ id: String(res.campaignId), at: Date.now() })) } catch { /* ignore */ }
          setJoinRequestId(String(res.campaignId))
        }
        return 'pending'
      }
      const c = res.campaign || res
      setCampaigns(p => p.some(x => x._id === c._id) ? p.map(x => x._id === c._id ? c : x) : [c, ...p])
      setActive(c)
      return null
    } catch (e) {
      return e.message
    }
  }

  const stale = loadedRole !== user?.role
  return (
    <CampaignContext.Provider value={{ campaigns: stale ? [] : campaigns, activeCampaign: stale ? null : activeCampaign, campaignsLoading: campaignsLoading || stale, campaignsError, setActive, createCampaign, updateCampaign, deleteCampaign, leaveCampaign, joinCampaign, joinRequestId, reload: () => load() }}>
      {children}
    </CampaignContext.Provider>
  )
}
