import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { OAuth2Client } from 'google-auth-library'
import nodemailer from 'nodemailer'
import { User } from '../models/index.js'

const router = Router()

const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' })

const googleClient = process.env.GOOGLE_CLIENT_ID ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID) : null

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

const sendOtp = async (user, code) => {
  const transport = getMailer()
  if (!transport) {
    // Dev fallback — no SMTP configured, just log it so the flow is testable.
    console.log(`[2FA] Verification code for ${user.email}: ${code}`)
    return
  }
  await transport.sendMail({
    from: process.env.SMTP_FROM || 'Lore & Ledger <no-reply@loreledger.app>',
    to: user.email,
    subject: 'Your Lore & Ledger verification code',
    text: `Your verification code is ${code}. It expires in 10 minutes.`,
  })
}

const publicUser = (user) => ({
  id: user._id, username: user.username, email: user.email,
  phone: user.phone || '', isPremium: user.isPremium,
  role: user.role || 'player',
  twoFactorEnabled: user.twoFactorEnabled || false,
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

router.post('/register', async (req, res) => {
  try {
    const { username, email, password, phone, role } = req.body
    if (!username || !email || !password) return res.status(400).json({ error: 'All fields required' })
    const exists = await User.findOne({ $or: [{ email }, { username }] })
    if (exists) return res.status(400).json({ error: 'Email or username already taken' })
    const hashed = await bcrypt.hash(password, 12)
    const user = await User.create({ username, email, password: hashed, phone: phone || '', role: role === 'dm' ? 'dm' : 'player' })
    res.json({ token: sign(user._id), user: publicUser(user) })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email })
    if (!user || !user.password || !await bcrypt.compare(password, user.password))
      return res.status(401).json({ error: 'Invalid credentials' })

    if (user.twoFactorEnabled) {
      const code = String(Math.floor(100000 + Math.random() * 900000))
      user.twoFactorCode = code
      user.twoFactorCodeExpires = new Date(Date.now() + 10 * 60 * 1000)
      await user.save()
      await sendOtp(user, code)
      return res.json({ requires2FA: true, userId: user._id })
    }

    res.json({ token: sign(user._id), user: publicUser(user) })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// Verify the emailed OTP code and complete login.
router.post('/2fa/verify', async (req, res) => {
  try {
    const { userId, code } = req.body
    const user = await User.findById(userId)
    if (!user || !user.twoFactorCode || user.twoFactorCode !== code)
      return res.status(401).json({ error: 'Invalid or expired code' })
    if (user.twoFactorCodeExpires && user.twoFactorCodeExpires < new Date())
      return res.status(401).json({ error: 'Code expired, please log in again' })

    user.twoFactorCode = ''
    user.twoFactorCodeExpires = undefined
    await user.save()
    res.json({ token: sign(user._id), user: publicUser(user) })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// Enable/disable 2FA for the authenticated user. Currently delivered via
// email since no SMS provider (e.g. Twilio) is configured yet.
router.post('/2fa/toggle', authMiddleware, async (req, res) => {
  try {
    const { enable, phone } = req.body
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'User not found' })
    if (phone !== undefined) user.phone = phone
    user.twoFactorEnabled = !!enable
    await user.save()
    res.json(publicUser(user))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// Google Sign-In — verifies the ID token from Google Identity Services on
// the client, then finds/creates a matching local user.
router.post('/google', async (req, res) => {
  try {
    if (!googleClient) return res.status(500).json({ error: 'Google sign-in is not configured on this server' })
    const { credential } = req.body
    if (!credential) return res.status(400).json({ error: 'Missing credential' })

    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID })
    const payload = ticket.getPayload()
    if (!payload?.email) return res.status(400).json({ error: 'Google account has no email' })

    let user = await User.findOne({ $or: [{ googleId: payload.sub }, { email: payload.email }] })
    if (!user) {
      const base = (payload.email.split('@')[0] || 'adventurer').replace(/[^a-zA-Z0-9]/g, '')
      let username = base
      let n = 0
      while (await User.findOne({ username })) { n += 1; username = `${base}${n}` }
      user = await User.create({ username, email: payload.email, googleId: payload.sub, avatar: payload.picture || '' })
    } else if (!user.googleId) {
      user.googleId = payload.sub
      await user.save()
    }

    // Google already provides strong account security, so we skip the
    // extra email-OTP step for this login path.
    res.json({ token: sign(user._id), user: publicUser(user) })
  } catch (e) { res.status(401).json({ error: 'Google sign-in failed' }) }
})

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password -twoFactorCode')
    res.json(user)
  } catch (e) { res.status(401).json({ error: 'Invalid token' }) }
})

export default router
