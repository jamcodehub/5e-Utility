import { Router } from 'express'
import { StoryCard } from '../models/index.js'
import { auth } from './campaigns.js'

const router = Router()

router.get('/:campaignId', auth, async (req, res) => {
  res.json(await StoryCard.find({ campaign: req.params.campaignId }).sort({ createdAt: -1 }))
})

router.post('/:campaignId', auth, async (req, res) => {
  try {
    // imageUrl is built client-side via Pollinations — store the final URL here
    res.json(await StoryCard.create({ ...req.body, campaign: req.params.campaignId }))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.delete('/:id', auth, async (req, res) => {
  await StoryCard.findByIdAndDelete(req.params.id)
  res.json({ ok: true })
})

export default router
