import { Router } from 'express'
import { LevelPlan, Campaign, User } from '../models/index.js'
import { auth, isMember } from './campaigns.js'

const router = Router()

router.get('/:campaignId', auth, async (req, res) => {
  if (!await isMember(req.params.campaignId, req.userId)) return res.status(403).json({ error: 'Not a campaign member' })
  res.json(await LevelPlan.find({ campaign: req.params.campaignId }).sort({ createdAt: 1 }))
})

router.post('/:campaignId', auth, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.campaignId)
    const owner = campaign ? await User.findById(campaign.owner) : null
    if (!owner?.isPremium) {
      const count = await LevelPlan.countDocuments({ campaign: req.params.campaignId })
      if (count >= 5) return res.status(403).json({ error: 'Free campaigns are limited to 5 level plans. Upgrade to the Ultimate DM Toolkit for unlimited plans.' })
    }
    const plan = await LevelPlan.create({ ...req.body, campaign: req.params.campaignId, owner: req.userId })
    res.json(plan)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.put('/:id', auth, async (req, res) => {
  // Whitelist fields explicitly — previously the raw body was passed
  // straight into findOneAndUpdate, which would let a client smuggle in
  // `owner`/`campaign` and move the map into another campaign they don't
  // have access to.
  const updates = {}
  if (typeof req.body.title === 'string') updates.title = req.body.title
  if (typeof req.body.content === 'string') updates.content = req.body.content
  if (req.body.tokens !== undefined) updates.tokens = req.body.tokens
  const plan = await LevelPlan.findOneAndUpdate({ _id: req.params.id, owner: req.userId }, updates, { new: true })
  res.json(plan)
})

router.delete('/:id', auth, async (req, res) => {
  await LevelPlan.findOneAndDelete({ _id: req.params.id, owner: req.userId })
  res.json({ ok: true })
})

export default router
