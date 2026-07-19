import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { Campaign, Character } from '../models/index.js'

const router = Router()

export const auth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    req.userId = jwt.verify(token, process.env.JWT_SECRET).id
    next()
  } catch { res.status(401).json({ error: 'Unauthorized' }) }
}

router.get('/', auth, async (req, res) => {
  const campaigns = await Campaign.find({
    $or: [{ owner: req.userId }, { members: req.userId }]
  }).sort({ updatedAt: -1 })
  res.json(campaigns)
})

router.post('/', auth, async (req, res) => {
  try {
    const campaign = await Campaign.create({ ...req.body, owner: req.userId })
    res.json(campaign)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.put('/:id', auth, async (req, res) => {
  const campaign = await Campaign.findOneAndUpdate(
    { _id: req.params.id, owner: req.userId },
    req.body, { new: true }
  )
  res.json(campaign)
})

router.delete('/:id', auth, async (req, res) => {
  await Campaign.findOneAndDelete({ _id: req.params.id, owner: req.userId })
  res.json({ ok: true })
})

// Character within a campaign
router.get('/:id/character', auth, async (req, res) => {
  const char = await Character.findOne({ campaign: req.params.id, owner: req.userId })
  res.json(char)
})

router.put('/:id/character', auth, async (req, res) => {
  const char = await Character.findOneAndUpdate(
    { campaign: req.params.id, owner: req.userId },
    { ...req.body, campaign: req.params.id, owner: req.userId },
    { upsert: true, new: true }
  )
  res.json(char)
})

export default router
