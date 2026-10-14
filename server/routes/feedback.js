import { Router } from 'express'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'

const router = Router()

const FeedbackSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  message: { type: String, required: true },
  type:    { type: String, enum: ['bug', 'feature', 'general'], default: 'general' },
}, { timestamps: true })

const Feedback = mongoose.model('Feedback', FeedbackSchema)

router.post('/', async (req, res) => {
  try {
    let userId
    const authHeader = req.headers.authorization
    if (authHeader?.startsWith('Bearer ')) {
      try {
        userId = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET).id
      } catch {
        userId = undefined
      }
    }

    // Validate/whitelist fields explicitly instead of spreading the whole
    // body into create() — previously any extra fields sent by a client
    // were passed straight to Mongoose (mass-assignment), and `message`
    // had no length cap, letting a single request store an arbitrarily
    // large document.
    const message = typeof req.body.message === 'string' ? req.body.message.trim().slice(0, 4000) : ''
    const type = ['bug', 'feature', 'general'].includes(req.body.type) ? req.body.type : 'general'
    if (!message) return res.status(400).json({ error: 'Message is required' })

    const fb = await Feedback.create({ message, type, user: userId })
    res.json(fb)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

export default router
