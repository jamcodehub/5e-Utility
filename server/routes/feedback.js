import { Router } from 'express'
import mongoose from 'mongoose'
import { auth } from './campaigns.js'

const router = Router()

const FeedbackSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  message: { type: String, required: true },
  type:    { type: String, enum: ['bug', 'feature', 'general'], default: 'general' },
}, { timestamps: true })

const Feedback = mongoose.model('Feedback', FeedbackSchema)

router.post('/', auth, async (req, res) => {
  try {
    const fb = await Feedback.create({ ...req.body, user: req.userId })
    res.json(fb)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

export default router
