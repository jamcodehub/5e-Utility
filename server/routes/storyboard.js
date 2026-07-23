import { Router } from 'express'
import { StoryCard, Campaign } from '../models/index.js'
import { auth } from './campaigns.js'
import { User } from '../models/index.js'

const router = Router()

router.get('/:campaignId', auth, async (req, res) => {
  res.json(await StoryCard.find({ campaign: req.params.campaignId }).sort({ createdAt: 1 }))
})

router.post('/:campaignId', auth, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.campaignId)
    const owner = campaign ? await User.findById(campaign.owner) : null
    if (!owner?.isPremium) {
      const count = await StoryCard.countDocuments({ campaign: req.params.campaignId })
      if (count >= 10) return res.status(403).json({ error: 'Free campaigns are limited to 10 storyboard scenes. The DM can upgrade to the Ultimate toolkit for unlimited scenes.' })
    }
    res.json(await StoryCard.create({ ...req.body, campaign: req.params.campaignId }))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.delete('/:id', auth, async (req, res) => {
  await StoryCard.findByIdAndDelete(req.params.id)
  res.json({ ok: true })
})

export default router
