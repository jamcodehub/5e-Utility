import { Router } from 'express'
import { Journal } from '../models/index.js'
import { auth, isMember } from './campaigns.js'
import { User } from '../models/index.js'

const router = Router()

router.get('/:campaignId', auth, async (req, res) => {
  if (!await isMember(req.params.campaignId, req.userId)) return res.status(403).json({ error: 'Not a campaign member' })
  const entryType = req.query.type === 'session' ? 'session' : 'journal'
  const entries = await Journal.find({ campaign: req.params.campaignId, entryType })
    .populate('author', 'username').sort({ day: 1 })
  res.json(entries)
})

router.post('/:campaignId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
    const entryType = req.body.entryType === 'session' ? 'session' : 'journal'
    if (!user.isPremium) {
      const count = await Journal.countDocuments({ campaign: req.params.campaignId, author: req.userId, entryType })
      if (count >= 5) return res.status(403).json({ error: 'Free accounts are limited to 5 entries. Upgrade to Premium for unlimited entries.' })
    }
    const entry = await Journal.create({ ...req.body, entryType, campaign: req.params.campaignId, author: req.userId })
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
