import express from 'express'
import { v2 as cloudinary } from 'cloudinary'
import { rateLimit } from 'express-rate-limit'
import { auth } from './campaigns.js'

const router = express.Router()

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// POST /api/upload/sign
// Returns a short-lived signed upload params object.
// The client uploads directly to Cloudinary using these — the secret never
// leaves the server.
// Per-user cap on signatures so a bot-made account can't mint unlimited uploads.
const signLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, max: 40, standardHeaders: true, legacyHeaders: false,
  keyGenerator: (req) => `u:${req.userId}`,
  message: { error: 'Too many uploads, please try again later.' },
})
const ALLOWED_FORMATS = 'jpg,jpeg,png,webp,gif'

router.post('/sign', auth, signLimiter, (req, res) => {
  try {
    if (!process.env.CLOUDINARY_API_SECRET || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_CLOUD_NAME) {
      return res.status(500).json({ error: 'Cloudinary env vars not configured on server' })
    }
    // Folder and formats are fixed server-side; the client can't choose them.
    const folder = `lore-ledger/${req.userId}`
    const timestamp = Math.round(Date.now() / 1000)
    const params = { timestamp, folder, allowed_formats: ALLOWED_FORMATS }
    const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET)
    res.json({
      signature,
      timestamp,
      folder,
      allowed_formats: ALLOWED_FORMATS,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key:    process.env.CLOUDINARY_API_KEY,
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to sign upload request' })
  }
})

export default router
