import { Router } from 'express'
import { Journal } from '../models/index.js'
import { auth, isMember } from './campaigns.js'
import { User } from '../models/index.js'

const router = Router()

router.get('/:campaignId', auth, async (req, res) => {
  if (!await isMember(req.params.campaignId, req.userId)) return res.status(403).json({ error: 'Not a campaign member' })
  const entries = await Journal.find({ campaign: req.params.campaignId })
    .populate('author', 'username').sort({ day: 1, session: 1, createdAt: 1 })
  res.json(entries)
})

router.post('/:campaignId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
    if (!user.isPremium) {
      const count = await Journal.countDocuments({ campaign: req.params.campaignId, author: req.userId })
      if (count >= 5) return res.status(403).json({ error: 'Free accounts are limited to 5 journal entries. Upgrade to Premium for unlimited entries.' })
    }
    // Support both players (day field) and DMs (session field)
    const body = { ...req.body, campaign: req.params.campaignId, author: req.userId }
    if (!body.day && !body.session) body.day = 1
    const entry = await Journal.create(body)
    res.json(entry)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.put('/:id', auth, async (req, res) => {
  const entry = await Journal.findOneAndUpdate({ _id: req.params.id, author: req.userId }, req.body, { new: true })
  res.json(entry)
})

router.delete('/:id', auth, async (req, res) => {
  await Journal.findOneAndDelete({ _id: req.params.id, author: req.userId })
  res.json({ ok: true })
})

export default router
