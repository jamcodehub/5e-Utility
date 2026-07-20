import { Router } from 'express'
import { StoryCard } from '../models/index.js'
import { auth } from './campaigns.js'
import { User } from '../models/index.js'

const router = Router()

router.get('/:campaignId', auth, async (req, res) => {
  res.json(await StoryCard.find({ campaign: req.params.campaignId }).sort({ createdAt: 1 }))
})

router.post('/:campaignId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
    if (!user.isPremium) {
      const count = await StoryCard.countDocuments({ campaign: req.params.campaignId })
      if (count >= 5) return res.status(403).json({ error: 'Free accounts are limited to 5 storyboard scenes. Upgrade to Premium for unlimited scenes.' })
    }
    res.json(await StoryCard.create({ ...req.body, campaign: req.params.campaignId }))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.delete('/:id', auth, async (req, res) => {
  await StoryCard.findByIdAndDelete(req.params.id)
  res.json({ ok: true })
})

export default router
