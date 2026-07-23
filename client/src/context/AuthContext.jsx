import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

const API = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api'

export const api = async (path, opts = {}) => {
  const token = localStorage.getItem('ll_token')
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  })
  const data = await res.json()
  if (!res.ok) {
    const err = new Error(data.error || 'Request failed')
    err.status = res.status
    err.payload = data
    throw err
  }
  return data
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('ll_token')
    if (!token) { setLoading(false); return }
    api('/auth/me').then(u => { setUser(u); setLoading(false) }).catch(() => { localStorage.removeItem('ll_token'); setLoading(false) })
  }, [])

  const login = async (email, password) => {
    const data = await api('/auth/login', { method: 'POST', body: { email, password } })
    if (data.requires2FA) return data // { requires2FA: true, userId }
    localStorage.setItem('ll_token', data.token)
    setUser(data.user)
    return data
  }

  const verifyTwoFactor = async (userId, code) => {
    const data = await api('/auth/2fa/verify', { method: 'POST', body: { userId, code } })
    localStorage.setItem('ll_token', data.token)
    setUser(data.user)
    return data
  }

  const loginWithGoogle = async (credential) => {
    const data = await api('/auth/google', { method: 'POST', body: { credential } })
    localStorage.setItem('ll_token', data.token)
    setUser(data.user)
    return data
  }

  const register = async (username, email, password, phone, role) => {
    const data = await api('/auth/register', { method: 'POST', body: { username, email, password, phone, role } })
    localStorage.setItem('ll_token', data.token)
    setUser(data.user)
  }

  const setTwoFactor = async (enable, phone) => {
    const u = await api('/auth/2fa/toggle', { method: 'POST', body: { enable, phone } })
    setUser(p => ({ ...p, ...u }))
    return u
  }

  const logout = () => { localStorage.removeItem('ll_token'); setUser(null) }

  // Call this after successful Stripe payment to refresh user premium status
  const refreshUser = async () => {
    const u = await api('/auth/me')
    setUser(u)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, refreshUser, verifyTwoFactor, loginWithGoogle, setTwoFactor, isPremium: user?.isPremium || false }}>
      {children}
    </AuthContext.Provider>
  )
}
