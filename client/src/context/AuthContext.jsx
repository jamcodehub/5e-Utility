import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

const API = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api'
const USER_CACHE_KEY = 'll_user'

const readCachedUser = () => {
  if (!localStorage.getItem('ll_token')) return null
  try {
    const user = JSON.parse(localStorage.getItem(USER_CACHE_KEY))
    return user && typeof user.id === 'string' && user.role ? user : null
  } catch {
    return null
  }
}

const storeUser = (user) => {
  const cachedUser = {
    id: String(user.id || user._id),
    username: user.username,
    email: user.email,
    phone: user.phone || '',
    isPremium: !!user.isPremium,
    role: user.role || 'player',
    twoFactorEnabled: !!user.twoFactorEnabled,
  }
  localStorage.setItem(USER_CACHE_KEY, JSON.stringify(cachedUser))
  return cachedUser
}

export const api = async (path, opts = {}) => {
  const token = localStorage.getItem('ll_token')
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  })
  let data
  try { data = await res.json() } catch (_e) { data = {} }
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`)
    err.status = res.status
    err.payload = data
    throw err
  }
  return data
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(readCachedUser)
  const [loading, setLoading] = useState(() => !!localStorage.getItem('ll_token') && !readCachedUser())

  useEffect(() => {
    const token = localStorage.getItem('ll_token')
    if (!token) { setLoading(false); return }
    // Only clear the stored token on a genuine 401 (invalid/expired token).
    // Previously ANY failure here — including a transient network blip or
    // the API briefly waking from sleep on Render's free tier — wiped the
    // token and logged the user out, which looked like "doesn't stay
    // logged in" even though the token itself was still valid.
    api('/auth/me').then(u => { setUser(storeUser(u)); setLoading(false) }).catch((err) => {
      if (err?.status === 401) {
        localStorage.removeItem('ll_token')
        localStorage.removeItem(USER_CACHE_KEY)
        setUser(null)
      }
      setLoading(false)
    })
  }, [])

  const authenticate = (data) => {
    localStorage.setItem('ll_token', data.token)
    setUser(storeUser(data.user))
  }

  const login = async (email, password) => {
    const data = await api('/auth/login', { method: 'POST', body: { email, password } })
    if (data.requires2FA) return data // { requires2FA: true, userId }
    authenticate(data)
    return data
  }

  const verifyTwoFactor = async (userId, code) => {
    const data = await api('/auth/2fa/verify', { method: 'POST', body: { userId, code } })
    authenticate(data)
    return data
  }

  const loginWithGoogle = async (credential) => {
    const data = await api('/auth/google', { method: 'POST', body: { credential } })
    authenticate(data)
    return data
  }

  const register = async (username, email, password, phone, role) => {
    const data = await api('/auth/register', { method: 'POST', body: { username, email, password, phone, role } })
    authenticate(data)
  }

  const setTwoFactor = async (enable, phone) => {
    const u = await api('/auth/2fa/toggle', { method: 'POST', body: { enable, phone } })
    setUser(p => storeUser({ ...p, ...u }))
    return u
  }

  const forgotPassword = async (email) => {
    return api('/auth/forgot-password', { method: 'POST', body: { email } })
  }

  const resetPassword = async (id, token, password) => {
    const data = await api('/auth/reset-password', { method: 'POST', body: { id, token, password } })
    authenticate(data)
    return data
  }

  const logout = () => {
    localStorage.removeItem('ll_token')
    localStorage.removeItem(USER_CACHE_KEY)
    setUser(null)
  }

  // Call this after successful Stripe payment to refresh user premium status
  const refreshUser = async () => {
    const u = await api('/auth/me')
    setUser(storeUser(u))
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, refreshUser, verifyTwoFactor, loginWithGoogle, setTwoFactor, forgotPassword, resetPassword, isPremium: user?.isPremium || false }}>
      {children}
    </AuthContext.Provider>
  )
}
