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

    const fb = await Feedback.create({ ...req.body, user: userId })
    res.json(fb)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

export default router
