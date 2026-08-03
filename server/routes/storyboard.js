import { Router } from 'express'
import { StoryCard, Campaign } from '../models/index.js'
import { auth, isMember } from './campaigns.js'
import { User } from '../models/index.js'

const router = Router()

router.get('/:campaignId', auth, async (req, res) => {
  if (!await isMember(req.params.campaignId, req.userId)) return res.status(403).json({ error: 'Not a campaign member' })
  res.json(await StoryCard.find({ campaign: req.params.campaignId }).sort({ createdAt: 1 }))
})

router.post('/:campaignId', auth, async (req, res) => {
  try {
    if (!await isMember(req.params.campaignId, req.userId)) return res.status(403).json({ error: 'Not a campaign member' })
    const campaign = await Campaign.findById(req.params.campaignId)
    const owner = campaign ? await User.findById(campaign.owner) : null
    if (!owner?.isPremium) {
      const count = await StoryCard.countDocuments({ campaign: req.params.campaignId })
      if (count >= 10) return res.status(403).json({ error: 'Free campaigns are limited to 10 storyboard scenes. The DM can upgrade to the Ultimate toolkit for unlimited scenes.' })
    }
    res.json(await StoryCard.create({ ...req.body, campaign: req.params.campaignId }))
  } catch { res.status(500).json({ error: 'Failed to create scene' }) }
})

router.put('/:id', auth, async (req, res) => {
  try {
    const card = await StoryCard.findById(req.params.id)
    if (!card) return res.status(404).json({ error: 'Not found' })
    if (!await isMember(card.campaign, req.userId)) return res.status(403).json({ error: 'Not authorised' })
    res.json(await StoryCard.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true }))
  } catch { res.status(500).json({ error: 'Failed to update' }) }
})

router.delete('/:id', auth, async (req, res) => {
  try {
    const card = await StoryCard.findById(req.params.id)
    if (!card) return res.status(404).json({ error: 'Not found' })
    if (!await isMember(card.campaign, req.userId)) return res.status(403).json({ error: 'Not authorised' })
    await StoryCard.findByIdAndDelete(req.params.id)
    res.json({ ok: true })
  } catch { res.status(500).json({ error: 'Failed to delete' }) }
})

export default router

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

router.put('/:id', auth, async (req, res) => {
  try {
    const card = await StoryCard.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true })
    res.json(card)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.delete('/:id', auth, async (req, res) => {
  await StoryCard.findByIdAndDelete(req.params.id)
  res.json({ ok: true })
})

export default router
