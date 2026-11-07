import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { OAuth2Client } from 'google-auth-library'
import nodemailer from 'nodemailer'
import { User, PendingSignup } from '../models/index.js'
import { emailDomainProblem } from '../lib/emailCheck.js'

const router = Router()

// Long-lived session token — users reported being logged out unexpectedly;
// 30 days was likely fine in theory, but combined with any client-side
// clearing on transient errors this felt like "doesn't stay logged in".
// Bumped to 90 days so a normal browsing cadence never hits expiry.
const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '90d' })

// Guards against NoSQL-operator injection (e.g. sending { "$ne": null } as
// the email/password field to bypass a query). Every value that ends up in
// a Mongo filter or bcrypt.compare must be confirmed to be a plain string
// first — objects/arrays are rejected outright.
const asString = (v) => (typeof v === 'string' ? v : null)

// Built lazily: dotenv.config() runs after this module is imported, so the
// env var isn't necessarily set yet at import time.
let googleClientInstance = null
const getGoogleClient = () => {
  if (!googleClientInstance && process.env.GOOGLE_CLIENT_ID) googleClientInstance = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
  return googleClientInstance
}

// Lazily build a mail transport from env vars. If unset, falls back to
// logging the code to the server console (useful for local dev/testing).
let mailer = null
const getMailer = () => {
  if (mailer) return mailer
  if (!process.env.SMTP_HOST) return null
  mailer = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: +(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  })
  return mailer
}

const sendCodeEmail = async (to, code, { subject, intro }) => {
  const transport = getMailer()
  if (!transport) {
    // Dev fallback — no SMTP configured, just log it so the flow is testable.
    console.log(`[2FA] Verification code for ${to}: ${code}`)
    return
  }
  await transport.sendMail({
    from: process.env.SMTP_FROM || '5e Utility <no-reply@5eutility.com>',
    to,
    subject,
    text: `${intro} ${code}. It expires in 10 minutes. If you didn’t request this, you can ignore this email.`,
  })
}

const sendOtp = (user, code) =>
  sendCodeEmail(user.email, code, { subject: 'Your 5e Utility verification code', intro: 'Your verification code is' })

// Email sign-up needs a way to actually deliver the code. In production that
// means SMTP is configured; elsewhere codes are logged for testing.
const emailVerificationOn = () => !!process.env.SMTP_HOST || process.env.NODE_ENV !== 'production'

// Failed 2FA guesses per user; further guesses are refused until a new code
// is requested.
const otpAttempts = new Map()
const MAX_OTP_ATTEMPTS = 5
const safeEqual = (a, b) => {
  const x = Buffer.from(a), y = Buffer.from(b)
  return x.length === y.length && crypto.timingSafeEqual(x, y)
}

const HOUR_MS = 60 * 60 * 1000
const CODE_TTL_MS = 10 * 60 * 1000
const TRUST_DEVICE_MS = 30 * 24 * HOUR_MS
const MAX_TRUSTED_DEVICES = 10

// Challenge tokens prove "password was correct, 2FA outstanding". They are
// signed with a DIFFERENT secret from session tokens so they can never be
// accepted by any route's session middleware.
const challengeSecret = () => `${process.env.JWT_SECRET}:2fa-challenge`
const signChallenge = (userId) => jwt.sign({ uid: String(userId), purpose: '2fa' }, challengeSecret(), { expiresIn: '30m' })
const readChallenge = (token) => {
  try {
    const payload = jwt.verify(token, challengeSecret())
    return payload.purpose === '2fa' ? payload.uid : null
  } catch { return null }
}

const maskEmail = (email) => {
  const [name = '', domain = ''] = (email || '').split('@')
  return `${name.slice(0, 1)}***@${domain}`
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const cleanDeviceId = (v) => (typeof v === 'string' && /^[A-Za-z0-9_-]{16,128}$/.test(v) ? v : '')

const hashDevice = (deviceId) => crypto.createHash('sha256').update(deviceId).digest('hex')
const isTrustedDevice = (user, deviceId) => {
  if (!deviceId) return false
  const hash = hashDevice(deviceId)
  const now = new Date()
  return (user.trustedDevices || []).some(d => d.hash === hash && d.expiresAt > now)
}
// (Re)registers a device as trusted for 30 days from now. Caller saves.
const trustDevice = (user, deviceId, req) => {
  if (!deviceId) return
  const hash = hashDevice(deviceId)
  const now = new Date()
  const kept = (user.trustedDevices || []).filter(d => d.hash !== hash && d.expiresAt > now)
  kept.push({ hash, label: String(req.headers['user-agent'] || '').slice(0, 120), lastUsedAt: now, expiresAt: new Date(now.getTime() + TRUST_DEVICE_MS) })
  user.trustedDevices = kept.slice(-MAX_TRUSTED_DEVICES)
}

// 'google' / 'email' for accounts verified at sign-up (the email kind is
// stored as 'email' too), 'email' also for legacy accounts that switched on
// the old email-code toggle, '' for no 2FA.
const effectiveMethod = (user) => user.twoFactorMethod || (user.twoFactorEnabled ? 'email' : '')

const challengeHint = (user) => maskEmail(user.email)

const storeCode = async (user) => {
  const code = String(crypto.randomInt(100000, 1000000))
  user.twoFactorCode = code
  user.twoFactorCodeExpires = new Date(Date.now() + CODE_TTL_MS)
  await user.save()
  return code
}

const checkStoredCode = (user, code) =>
  !!user.twoFactorCode && !(user.twoFactorCodeExpires && user.twoFactorCodeExpires < new Date()) && safeEqual(user.twoFactorCode, code)

const sendEmailCode = async (user) => sendOtp(user, await storeCode(user))

const sendError = (res, e) => {
  console.error('[auth]', e)
  res.status(500).json({ error: 'Something went wrong. Please try again.' })
}

// Verifies a Google ID token and returns its payload, or null. Requires a
// verified email so a Google account can't claim an address it doesn't own.
const readGoogle = async (credential) => {
  const googleClient = getGoogleClient()
  if (!googleClient || !credential) return null
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID })
    const payload = ticket.getPayload()
    return payload?.email && payload.email_verified ? payload : null
  } catch { return null }
}

const publicUser = (user) => ({
  id: user._id, username: user.username, email: user.email,
  phone: user.phone || '', isPremium: user.isPremium,
  role: user.role || 'player',
  twoFactorEnabled: user.twoFactorEnabled || false,
  twoFactorMethod: effectiveMethod(user),
  // true when 2FA came from a verified sign-up (Google or email code) and so
  // can't be switched off, as opposed to the legacy opt-in toggle.
  twoFactorVerified: !!user.twoFactorMethod,
})

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ error: 'No token' })
    const { id } = jwt.verify(token, process.env.JWT_SECRET)
    req.userId = id
    next()
  } catch { res.status(401).json({ error: 'Invalid token' }) }
}

// In-memory cap on sign-up code emails per IP (each one reaches a stranger's
// inbox, so it must not be usable for spamming). Single-instance only.
const signupEmails = new Map()
const SIGNUP_EMAILS_PER_HOUR = 10
const SEND_COOLDOWN_MS = 30 * 1000
const allowSignupEmail = (ip) => {
  const now = Date.now()
  const recent = (signupEmails.get(ip) || []).filter(t => now - t < HOUR_MS)
  const allowed = recent.length < SIGNUP_EMAILS_PER_HOUR
  if (allowed) recent.push(now)
  signupEmails.set(ip, recent)
  return allowed
}
setInterval(() => {
  const now = Date.now()
  for (const [ip, times] of [...signupEmails]) if (!times.some(t => now - t < HOUR_MS)) signupEmails.delete(ip)
}, HOUR_MS).unref()

const randomCode = () => String(crypto.randomInt(100000, 1000000))
const hashCode = (code) => crypto.createHash('sha256').update(code).digest('hex')
const SIGNUP_ID_RE = /^[a-f0-9]{24}$/
const SIGNUP_EMAIL = { subject: 'Confirm your 5e Utility email', intro: 'Your confirmation code is' }
const TOO_MANY_CODES = 'Too many codes requested. Please try again later.'
const WAIT_FOR_CODE = 'Please wait a few seconds before requesting another code.'

// Sign-up has three paths:
//  - Google: the account is verified instantly by a Google ID token.
//  - Email code: the address is confirmed with an emailed code (/register/confirm)
//    before the account exists. Needs SMTP in production.
//  - Plain email + password, only when neither of the above is configured, so
//    a fresh deploy keeps working.
// Google and email-code accounts get automatic 2FA on new devices.
router.post('/register', async (req, res) => {
  try {
    const username = asString(req.body.username)?.trim()
    const password = asString(req.body.password)
    const role     = req.body.role === 'dm' ? 'dm' : 'player'
    const deviceId = cleanDeviceId(req.body.deviceId)
    const credential = asString(req.body.credential)
    const googleOn = !!getGoogleClient()
    const emailOn = emailVerificationOn()

    if (!username || !password) return res.status(400).json({ error: 'All fields required' })
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' })

    if (googleOn && credential) {
      const google = await readGoogle(credential)
      if (!google) return res.status(400).json({ error: 'Google could not verify that account. Please try again.' })
      const email = google.email.toLowerCase()
      if (await User.exists({ $or: [{ email }, { username }, { googleId: google.sub }] }))
        return res.status(400).json({ error: 'Email or username already taken' })
      const user = await User.create({
        username, email, password: await bcrypt.hash(password, 12), role,
        googleId: google.sub, avatar: google.picture || '', twoFactorMethod: 'google', twoFactorEnabled: true,
      })
      trustDevice(user, deviceId, req)
      await user.save()
      return res.json({ token: sign(user._id), user: publicUser(user) })
    }

    if (googleOn && !emailOn) return res.status(400).json({ error: 'Verify your Gmail account with Google to sign up.' })

    const email = asString(req.body.email)?.trim().toLowerCase()
    if (!email) return res.status(400).json({ error: 'All fields required' })
    if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Invalid email address' })
    const emailProblem = await emailDomainProblem(email)
    if (emailProblem) return res.status(400).json({ error: emailProblem })
    if (await User.exists({ $or: [{ email }, { username }] })) return res.status(400).json({ error: 'Email or username already taken' })

    const hashed = await bcrypt.hash(password, 12)

    if (emailOn) {
      const existing = await PendingSignup.findOne({ email })
      if (existing && Date.now() - existing.lastSentAt < SEND_COOLDOWN_MS) return res.status(429).json({ error: WAIT_FOR_CODE })
      if (!allowSignupEmail(req.ip)) return res.status(429).json({ error: TOO_MANY_CODES })
      const code = randomCode()
      const now = Date.now()
      const pending = await PendingSignup.findOneAndUpdate({ email }, {
        username, password: hashed, role, codeHash: hashCode(code), codeExpiresAt: new Date(now + CODE_TTL_MS),
        attempts: 0, lastSentAt: new Date(now), expiresAt: new Date(now + HOUR_MS),
      }, { upsert: true, new: true, setDefaultsOnInsert: true })
      try { await sendCodeEmail(email, code, SIGNUP_EMAIL) } catch (e) { await pending.deleteOne(); throw e }
      return res.json({ requires2FA: true, confirming: true, signupId: String(pending._id), method: 'email', hint: maskEmail(email) })
    }

    const user = await User.create({ username, email, password: hashed, role, phone: asString(req.body.phone) || '' })
    res.json({ token: sign(user._id), user: publicUser(user) })
  } catch (e) {
    if (e?.code === 11000) return res.status(400).json({ error: 'Email or username already taken' })
    sendError(res, e)
  }
})

// Finish an email sign-up: the right code creates the account (with
// automatic 2FA from then on) and signs the user in.
router.post('/register/confirm', async (req, res) => {
  try {
    const signupId = asString(req.body.signupId)
    const code = asString(req.body.code)?.trim()
    const deviceId = cleanDeviceId(req.body.deviceId)
    const expired = () => res.status(401).json({ error: 'Your sign-up expired. Please start again.' })

    if (!signupId || !SIGNUP_ID_RE.test(signupId)) return expired()
    const found = await PendingSignup.findById(signupId)
    if (!found || found.expiresAt < new Date()) return expired()
    if (!code) return res.status(401).json({ error: 'Invalid or expired code' })

    // Reserve a guess atomically so parallel requests can't exceed the limit.
    const pending = await PendingSignup.findOneAndUpdate(
      { _id: signupId, attempts: { $lt: MAX_OTP_ATTEMPTS } }, { $inc: { attempts: 1 } }, { new: true })
    if (!pending) return res.status(429).json({ error: 'Too many incorrect codes. Request a new code.' })
    if (pending.codeExpiresAt < new Date() || !safeEqual(pending.codeHash, hashCode(code)))
      return res.status(401).json({ error: 'Invalid or expired code' })

    if (await User.exists({ $or: [{ email: pending.email }, { username: pending.username }] })) {
      await pending.deleteOne()
      return res.status(400).json({ error: 'Email or username already taken' })
    }
    const user = await User.create({
      username: pending.username, email: pending.email, password: pending.password, role: pending.role,
      twoFactorMethod: 'email', twoFactorEnabled: true,
    })
    if (req.body.rememberDevice !== false) { trustDevice(user, deviceId, req); await user.save() }
    await pending.deleteOne()
    res.json({ token: sign(user._id), user: publicUser(user) })
  } catch (e) {
    if (e?.code === 11000) return res.status(400).json({ error: 'Email or username already taken' })
    sendError(res, e)
  }
})

router.post('/register/resend', async (req, res) => {
  try {
    const signupId = asString(req.body.signupId)
    if (!signupId || !SIGNUP_ID_RE.test(signupId)) return res.status(401).json({ error: 'Your sign-up expired. Please start again.' })
    const pending = await PendingSignup.findById(signupId)
    if (!pending || pending.expiresAt < new Date()) return res.status(401).json({ error: 'Your sign-up expired. Please start again.' })
    if (Date.now() - pending.lastSentAt < SEND_COOLDOWN_MS) return res.status(429).json({ error: WAIT_FOR_CODE })
    if (!allowSignupEmail(req.ip)) return res.status(429).json({ error: TOO_MANY_CODES })
    const code = randomCode()
    pending.codeHash = hashCode(code)
    pending.codeExpiresAt = new Date(Date.now() + CODE_TTL_MS)
    pending.attempts = 0
    pending.lastSentAt = new Date()
    await pending.save()
    await sendCodeEmail(pending.email, code, SIGNUP_EMAIL)
    res.json({ ok: true, hint: maskEmail(pending.email) })
  } catch (e) { sendError(res, e) }
})

// Sends the 2FA challenge for this login: legacy email-code accounts get a
// code emailed automatically; Google accounts just confirm with Google.
const startChallenge = async (res, user) => {
  const method = effectiveMethod(user)
  otpAttempts.delete(String(user._id))
  if (method === 'email') await sendEmailCode(user)
  res.json({ requires2FA: true, challengeToken: signChallenge(user._id), method, hint: challengeHint(user) })
}

router.post('/login', async (req, res) => {
  try {
    const email = asString(req.body.email)?.trim().toLowerCase()
    const password = asString(req.body.password)
    const deviceId = cleanDeviceId(req.body.deviceId)
    if (!email || !password) return res.status(401).json({ error: 'Invalid credentials' })
    const user = await User.findOne({ email })
    if (!user || !user.password || !await bcrypt.compare(password, user.password))
      return res.status(401).json({ error: 'Invalid credentials' })

    if (effectiveMethod(user) && !isTrustedDevice(user, deviceId)) return await startChallenge(res, user)

    if (deviceId && isTrustedDevice(user, deviceId)) { trustDevice(user, deviceId, req); await user.save() }
    res.json({ token: sign(user._id), user: publicUser(user) })
  } catch (e) { sendError(res, e) }
})

// Complete a new-device challenge.
// Body: { challengeToken, code | credential, deviceId, rememberDevice }
router.post('/2fa/verify', async (req, res) => {
  try {
    const uid = readChallenge(asString(req.body.challengeToken))
    if (!uid) return res.status(401).json({ error: 'Your sign-in expired. Please sign in again.' })
    const code = asString(req.body.code)?.trim()
    const deviceId = cleanDeviceId(req.body.deviceId)
    const invalid = () => res.status(401).json({ error: 'Invalid or expired code' })

    const user = await User.findById(uid)
    const method = user && effectiveMethod(user)
    if (!method) return invalid()

    if (method === 'google') {
      const google = await readGoogle(asString(req.body.credential))
      if (!google || !user.googleId || google.sub !== user.googleId)
        return res.status(401).json({ error: 'That Google account does not match this account.' })
    } else {
      if (!code) return invalid()
      if ((otpAttempts.get(uid) || 0) >= MAX_OTP_ATTEMPTS)
        return res.status(429).json({ error: 'Too many incorrect codes. Request a new code.' })
      const valid = checkStoredCode(user, code)
      if (!valid) {
        const fails = (otpAttempts.get(uid) || 0) + 1
        otpAttempts.set(uid, fails)
        if (fails >= MAX_OTP_ATTEMPTS && user.twoFactorCode) {
          user.twoFactorCode = ''
          user.twoFactorCodeExpires = undefined
          await user.save()
        }
        return invalid()
      }
      otpAttempts.delete(uid)
    }

    user.twoFactorCode = ''
    user.twoFactorCodeExpires = undefined
    if (req.body.rememberDevice !== false) trustDevice(user, deviceId, req)
    await user.save()
    res.json({ token: sign(user._id), user: publicUser(user) })
  } catch (e) { sendError(res, e) }
})

// Send a fresh emailed code for the current challenge (legacy email-code
// accounts only; Google accounts have no code to resend).
router.post('/2fa/resend', async (req, res) => {
  try {
    const uid = readChallenge(asString(req.body.challengeToken))
    if (!uid) return res.status(401).json({ error: 'Your sign-in expired. Please sign in again.' })
    const user = await User.findById(uid)
    if (!user || effectiveMethod(user) !== 'email') return res.status(400).json({ error: 'This account does not use an emailed code.' })
    await sendEmailCode(user)
    otpAttempts.delete(uid)
    res.json({ ok: true, hint: challengeHint(user) })
  } catch (e) { sendError(res, e) }
})

// Authenticated: verify a Google account for this user (Settings) — for
// accounts created before Google verification existed, or to switch to a
// different Google account. It becomes the account's 2FA channel.
router.post('/2fa/setup', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'User not found' })

    const google = await readGoogle(asString(req.body.credential))
    if (!google) return res.status(400).json({ error: 'Google could not verify that account. Please try again.' })
    if (await User.exists({ googleId: google.sub, _id: { $ne: user._id } }))
      return res.status(400).json({ error: 'That Google account is already linked to another account.' })
    user.googleId = google.sub
    user.twoFactorMethod = 'google'
    user.twoFactorEnabled = true
    trustDevice(user, cleanDeviceId(req.body.deviceId), req)
    await user.save()
    res.json(publicUser(user))
  } catch (e) { sendError(res, e) }
})

// Switch the legacy email-code 2FA on/off. Accounts verified at sign-up (Google
// or email code) have 2FA built in and can't turn it off.
router.post('/2fa/toggle', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'User not found' })
    if (user.twoFactorMethod) return res.status(400).json({ error: 'Two-factor is built into your verified sign-up and can’t be turned off.' })
    user.twoFactorEnabled = !!req.body.enable
    await user.save()
    res.json(publicUser(user))
  } catch (e) { sendError(res, e) }
})

// Google Sign-In — verifies the ID token from Google Identity Services on
// the client, then finds/creates a matching local user.
router.post('/google', async (req, res) => {
  try {
    if (!getGoogleClient()) return res.status(500).json({ error: 'Google sign-in is not configured on this server' })
    const credential = asString(req.body.credential)
    if (!credential) return res.status(400).json({ error: 'Missing credential' })

    const payload = await readGoogle(credential)
    if (!payload) return res.status(401).json({ error: 'Google sign-in failed' })

    let user = await User.findOne({ $or: [{ googleId: payload.sub }, { email: payload.email.toLowerCase() }] })
    if (!user) {
      const base = (payload.email.split('@')[0] || 'adventurer').replace(/[^a-zA-Z0-9]/g, '')
      let username = base
      let n = 0
      while (await User.findOne({ username })) { n += 1; username = `${base}${n}` }
      user = await User.create({
        username, email: payload.email.toLowerCase(), googleId: payload.sub, avatar: payload.picture || '',
        twoFactorMethod: 'google', twoFactorEnabled: true,
      })
    } else if (!user.googleId) {
      user.googleId = payload.sub
      await user.save()
    }

    // Google already provides strong account security, so we skip the
    // extra 2FA step for this login path.
    res.json({ token: sign(user._id), user: publicUser(user) })
  } catch (e) { res.status(401).json({ error: 'Google sign-in failed' }) }
})

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
    if (!user) return res.status(401).json({ error: 'Invalid token' })
    res.json(publicUser(user))
  } catch (e) { res.status(401).json({ error: 'Invalid token' }) }
})

// Request a password reset link. Always responds with a generic success
// message (even if the email doesn't exist) to avoid leaking which emails
// are registered.
router.post('/forgot-password', async (req, res) => {
  try {
    const email = asString(req.body.email)?.trim().toLowerCase()
    if (!email) return res.status(400).json({ error: 'Email required' })
    const user = await User.findOne({ email })
    if (user) {
      const token = crypto.randomBytes(32).toString('hex')
      user.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex')
      user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
      await user.save()

      const origin = process.env.CLIENT_URL || req.headers.origin || ''
      const resetUrl = `${origin}/reset-password?token=${token}&id=${user._id}`
      const transport = getMailer()
      if (!transport) {
        console.log(`[Password Reset] Link for ${user.email}: ${resetUrl}`)
      } else {
        await transport.sendMail({
          from: process.env.SMTP_FROM || '5e Utility <no-reply@5eutility.com>',
          to: user.email,
          subject: 'Reset your 5e Utility password',
          text: `We received a request to reset your password. Click the link below to choose a new one (expires in 1 hour):\n\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.`,
        })
      }
    }
    res.json({ ok: true, message: 'If that email is registered, a reset link has been sent.' })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// Complete the reset using the token emailed to the user.
router.post('/reset-password', async (req, res) => {
  try {
    const id = asString(req.body.id)
    const token = asString(req.body.token)
    const password = asString(req.body.password)
    if (!id || !token || !password) return res.status(400).json({ error: 'Missing required fields' })
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' })

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')
    const user = await User.findOne({
      _id: id,
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    })
    if (!user) return res.status(400).json({ error: 'Reset link is invalid or has expired' })

    user.password = await bcrypt.hash(password, 12)
    user.resetPasswordToken = ''
    user.resetPasswordExpires = undefined
    user.trustedDevices = [] // a password reset invalidates remembered devices
    await user.save()
    res.json({ token: sign(user._id), user: publicUser(user) })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// Public, unauthenticated: tells the sign-up screen which verification options
// are configured. The Google client ID is public by design, so serving it here
// means the frontend needs no separate env var for it.
export const authConfig = (_req, res) => {
  res.json({
    google: !!getGoogleClient(),
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    email: emailVerificationOn(),
  })
}

export default router
