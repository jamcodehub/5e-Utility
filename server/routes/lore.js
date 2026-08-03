import { Router } from 'express'
import { Lore } from '../models/index.js'
import { auth, isMember } from './campaigns.js'

const router = Router()

router.get('/:campaignId', auth, async (req, res) => {
  if (!await isMember(req.params.campaignId, req.userId)) return res.status(403).json({ error: 'Not a campaign member' })
  res.json(await Lore.find({ campaign: req.params.campaignId }).sort({ createdAt: -1 }))
})

router.post('/:campaignId', auth, async (req, res) => {
  try {
    if (!await isMember(req.params.campaignId, req.userId)) return res.status(403).json({ error: 'Not a campaign member' })
    res.json(await Lore.create({ ...req.body, campaign: req.params.campaignId }))
  } catch { res.status(500).json({ error: 'Failed to create lore entry' }) }
})

router.put('/:id', auth, async (req, res) => {
  try {
    const entry = await Lore.findById(req.params.id)
    if (!entry) return res.status(404).json({ error: 'Not found' })
    if (!await isMember(entry.campaign, req.userId)) return res.status(403).json({ error: 'Not authorised' })
    res.json(await Lore.findByIdAndUpdate(req.params.id, req.body, { new: true }))
  } catch { res.status(500).json({ error: 'Failed to update' }) }
})

router.delete('/:id', auth, async (req, res) => {
  try {
    const entry = await Lore.findById(req.params.id)
    if (!entry) return res.status(404).json({ error: 'Not found' })
    if (!await isMember(entry.campaign, req.userId)) return res.status(403).json({ error: 'Not authorised' })
    await Lore.findByIdAndDelete(req.params.id)
    res.json({ ok: true })
  } catch { res.status(500).json({ error: 'Failed to delete' }) }
})

export default router
