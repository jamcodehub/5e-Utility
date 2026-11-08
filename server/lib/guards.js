import { rateLimit, ipKeyGenerator } from 'express-rate-limit'

// Rejects any request body containing a Mongo operator ($set, $ne, ...) or a
// dotted path key at any depth. Several routes pass client bodies straight
// into updates, where `{ "$set": { "owner": "<victim>" } }` would otherwise
// bypass the top-level field stripping.
const hasBadKey = (v, depth = 0) => {
  if (!v || typeof v !== 'object' || Buffer.isBuffer(v) || depth > 12) return false
  if (Array.isArray(v)) return v.some(x => hasBadKey(x, depth + 1))
  return Object.keys(v).some(k => k.startsWith('$') || k.includes('.') || hasBadKey(v[k], depth + 1))
}
export const rejectOperatorKeys = (req, res, next) => {
  if (hasBadKey(req.body) || hasBadKey(req.query)) return res.status(400).json({ error: 'Invalid request' })
  next()
}

// Limiter keyed on the target account (email) as well as the IP, so a botnet
// spreading attempts across many IPs still hits a per-account ceiling.
export const perEmailLimiter = ({ windowMs, max, message }) => rateLimit({
  windowMs, max, standardHeaders: true, legacyHeaders: false, message: { error: message },
  keyGenerator: (req) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase().slice(0, 254) : ''
    return email ? `email:${email}` : ipKeyGenerator(req.ip)
  },
})

// Cloudflare Turnstile. Enforced only when TURNSTILE_SECRET_KEY is set, so a
// deploy without keys keeps working; once set, a missing/invalid token fails.
export const captchaEnabled = () => !!process.env.TURNSTILE_SECRET_KEY
export const requireCaptcha = async (req, res, next) => {
  if (!captchaEnabled()) return next()
  const token = typeof req.body?.captchaToken === 'string' ? req.body.captchaToken : ''
  if (!token) return res.status(400).json({ error: 'Please complete the human check.' })
  try {
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret: process.env.TURNSTILE_SECRET_KEY, response: token, remoteip: req.ip || '' }),
      signal: AbortSignal.timeout(5000),
    })
    const data = await r.json()
    if (!data.success) return res.status(400).json({ error: 'Human check failed. Please try again.' })
    next()
  } catch {
    res.status(503).json({ error: 'Could not verify the human check. Please try again.' })
  }
}
