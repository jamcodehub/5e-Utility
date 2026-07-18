import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

// In dev, Vite proxies /api → localhost:4000
// In prod, set VITE_API_URL in Netlify env vars to your Render backend URL
const API = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api'
export const api = async (path, opts = {}) => {
  const token = localStorage.getItem('ll_token')
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
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
    localStorage.setItem('ll_token', data.token)
    setUser(data.user)
  }

  const register = async (username, email, password) => {
    const data = await api('/auth/register', { method: 'POST', body: { username, email, password } })
    localStorage.setItem('ll_token', data.token)
    setUser(data.user)
  }

  const logout = () => { localStorage.removeItem('ll_token'); setUser(null) }

  return <AuthContext.Provider value={{ user, login, register, logout, loading }}>{children}</AuthContext.Provider>
}
