import { Router } from 'express'
import { Journal } from '../models/index.js'
import { auth } from './campaigns.js'

const router = Router()

router.get('/:campaignId', auth, async (req, res) => {
  const entries = await Journal.find({ campaign: req.params.campaignId })
    .populate('author', 'username').sort({ day: 1 })
  res.json(entries)
})

router.post('/:campaignId', auth, async (req, res) => {
  try {
    const entry = await Journal.create({
      ...req.body, campaign: req.params.campaignId, author: req.userId
    })
    res.json(entry)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.put('/:id', auth, async (req, res) => {
  const entry = await Journal.findOneAndUpdate(
    { _id: req.params.id, author: req.userId },
    req.body, { new: true }
  )
  res.json(entry)
})

router.delete('/:id', auth, async (req, res) => {
  await Journal.findOneAndDelete({ _id: req.params.id, author: req.userId })
  res.json({ ok: true })
})

export default router
