import { createContext, useContext, useState, useEffect } from 'react'
import { demoApi, isPublicDemoPath } from '../utils/demoRuntime'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

export function DemoAuthProvider({ children }) {
  const user = {
    id: 'demo-dm',
    _id: 'demo-dm',
    username: 'Game Master',
    email: '',
    role: 'dm',
    roles: ['dm'],
    isPremium: true,
  }

  return (
    <AuthContext.Provider value={{ user, isPremium: true, loading: false, switchRole: async () => {} }}>
      {children}
    </AuthContext.Provider>
  )
}

const API = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api'
const USER_CACHE_KEY = 'll_user'
const DEVICE_KEY = 'll_device_id'

// Stable random id per browser. The server stores only its hash, to
// recognise a device that already passed two-factor.
export const getDeviceId = () => {
  try {
    let id = localStorage.getItem(DEVICE_KEY)
    if (!id) {
      id = Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('')
      localStorage.setItem(DEVICE_KEY, id)
    }
    return id
  } catch { return '' }
}

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
    avatar: user.avatar || '',
    isPremium: !!user.isPremium,   // premium for the role the account is acting as right now
    hasSubscription: !!user.hasSubscription, premiumRole: user.premiumRole || '', isPlayerPremium: !!user.isPlayerPremium, isDmPremium: !!user.isDmPremium, // a subscription exists, and which role it covers
    role: user.role || 'player',
    roles: user.roles?.length ? user.roles : [user.role || 'player'],
    twoFactorEnabled: !!user.twoFactorEnabled,
    twoFactorMethod: user.twoFactorMethod || '',
    twoFactorVerified: !!user.twoFactorVerified,
  }
  localStorage.setItem(USER_CACHE_KEY, JSON.stringify(cachedUser))
  return cachedUser
}

export const api = async (path, opts = {}) => {
  if (isPublicDemoPath()) return demoApi(path, opts)
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

// Which verification channels the server offers (see GET /auth/config).
// `null` while loading; `failed: true` if the server couldn't be reached.
let configRequest = null
export const useAuthConfig = () => {
  const [config, setConfig] = useState(null)
  useEffect(() => {
    let cancelled = false
    if (!configRequest) {
      configRequest = api('/auth/config').catch(() => {
        configRequest = null
        return { google: false, googleClientId: '', email: false, turnstileSiteKey: '', failed: true }
      })
    }
    configRequest.then(c => { if (!cancelled) setConfig(c) })
    return () => { cancelled = true }
  }, [])
  return config
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

  const login = async (email, password, captchaToken) => {
    const data = await api('/auth/login', { method: 'POST', body: { email, password, captchaToken, deviceId: getDeviceId() } })
    if (data.requires2FA) return data // { requires2FA, challengeToken, method, hint }
    authenticate(data)
    return data
  }

  // `proof` is { code } for a texted/emailed code or { credential } for Google.
  const verifyTwoFactor = async (challengeToken, proof, rememberDevice = true) => {
    const data = await api('/auth/2fa/verify', { method: 'POST', body: { challengeToken, ...proof, rememberDevice, deviceId: getDeviceId() } })
    authenticate(data)
    return data
  }

  const resendTwoFactor = (challengeToken) =>
    api('/auth/2fa/resend', { method: 'POST', body: { challengeToken } })

  const loginWithGoogle = async (credential) => {
    const data = await api('/auth/google', { method: 'POST', body: { credential } })
    authenticate(data)
    return data
  }

  // Three sign-up paths, decided by what the server offers:
  //  - `credential` (a Google ID token) verifies the account instantly;
  //  - otherwise, when email verification is on, the result is a pending
  //    sign-up ({ requires2FA, confirming, signupId }) to finish with
  //    confirmSignup(); 
  //  - otherwise it's plain email + password.
  const register = async ({ username, email, password, role, phone = '', credential, captchaToken }) => {
    const data = await api('/auth/register', { method: 'POST', body: { username, email, password, role, phone, credential, captchaToken, deviceId: getDeviceId() } })
    if (data.requires2FA) return data
    authenticate(data)
    return data
  }

  const confirmSignup = async (signupId, code, rememberDevice = true) => {
    const data = await api('/auth/register/confirm', { method: 'POST', body: { signupId, code, rememberDevice, deviceId: getDeviceId() } })
    authenticate(data)
    return data
  }

  const resendSignup = (signupId) =>
    api('/auth/register/resend', { method: 'POST', body: { signupId } })

  // Settings: verify a Google account for this user; it becomes their 2FA.
  const linkGoogle = async (credential) => {
    const u = await api('/auth/2fa/setup', { method: 'POST', body: { credential, deviceId: getDeviceId() } })
    setUser(p => storeUser({ ...p, ...u }))
    return u
  }

  const forgotPassword = async (email, captchaToken) => {
    return api('/auth/forgot-password', { method: 'POST', body: { email, captchaToken } })
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

  // Switches between the player and DM identities. Resolves once the server
  // has confirmed, so callers never render role-specific pages optimistically.
  const switchRole = async (role) => {
    const u = await api('/auth/role', { method: 'POST', body: { role } })
    setUser(p => storeUser({ ...p, ...u }))
  }

  // Call this after successful Stripe payment to refresh user premium status
  const refreshUser = async () => {
    const u = await api('/auth/me')
    setUser(storeUser(u))
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, refreshUser, switchRole, verifyTwoFactor, resendTwoFactor, confirmSignup, resendSignup, loginWithGoogle, linkGoogle, forgotPassword, resetPassword, isPremium: user?.isPremium || false }}>
      {children}
    </AuthContext.Provider>
  )
}
