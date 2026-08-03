import express from 'express'
import { v2 as cloudinary } from 'cloudinary'
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
router.post('/sign', auth, (req, res) => {
  try {
    const { folder = 'lore-ledger' } = req.body
    const timestamp = Math.round(Date.now() / 1000)
    const params = { timestamp, folder }
    const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET)
    res.json({
      signature,
      timestamp,
      folder,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key:    process.env.CLOUDINARY_API_KEY,
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to sign upload request' })
  }
})

export default router
