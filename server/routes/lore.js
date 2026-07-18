import { Router } from 'express'
import { Lore } from '../models/index.js'
import { auth } from './campaigns.js'

const router = Router()

router.get('/:campaignId', auth, async (req, res) => {
  res.json(await Lore.find({ campaign: req.params.campaignId }).sort({ createdAt: -1 }))
})

router.post('/:campaignId', auth, async (req, res) => {
  try {
    res.json(await Lore.create({ ...req.body, campaign: req.params.campaignId }))
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.put('/:id', auth, async (req, res) => {
  res.json(await Lore.findByIdAndUpdate(req.params.id, req.body, { new: true }))
})

router.delete('/:id', auth, async (req, res) => {
  await Lore.findByIdAndDelete(req.params.id)
  res.json({ ok: true })
})

export default router
