import { Router } from 'express'
import { auth, isMember } from './campaigns.js'
import { MusicSession, MusicTrack } from '../models/index.js'

const router = Router()

// GET all sessions for a campaign
router.get('/:campaignId', auth, async (req, res) => {
  try {
    if (!await isMember(req.params.campaignId, req.userId))
      return res.status(403).json({ error: 'Not a campaign member' })
    const sessions = await MusicSession.find({ campaign: req.params.campaignId })
      .populate('cues.track', 'name url duration')
      .sort({ createdAt: 1 })
    res.json(sessions)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// POST create a session
router.post('/:campaignId', auth, async (req, res) => {
  try {
    if (!await isMember(req.params.campaignId, req.userId))
      return res.status(403).json({ error: 'Not a campaign member' })
    const session = await MusicSession.create({
      campaign: req.params.campaignId,
      createdBy: req.userId,
      name: req.body.name || 'New Session',
      cues: [],
    })
    res.json({ ...session.toObject(), cues: [] })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// PUT rename a session
router.put('/:id', auth, async (req, res) => {
  try {
    const session = await MusicSession.findById(req.params.id)
    if (!session) return res.status(404).json({ error: 'Not found' })
    if (!await isMember(session.campaign, req.userId))
      return res.status(403).json({ error: 'Not authorised' })
    session.name = req.body.name || session.name
    await session.save()
    res.json(session)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// DELETE a session
router.delete('/:id', auth, async (req, res) => {
  try {
    const session = await MusicSession.findById(req.params.id)
    if (!session) return res.status(404).json({ error: 'Not found' })
    if (!await isMember(session.campaign, req.userId))
      return res.status(403).json({ error: 'Not authorised' })
    await MusicSession.findByIdAndDelete(req.params.id)
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// POST add a cue to a session
router.post('/:id/cues', auth, async (req, res) => {
  try {
    const session = await MusicSession.findById(req.params.id)
    if (!session) return res.status(404).json({ error: 'Not found' })
    if (!await isMember(session.campaign, req.userId))
      return res.status(403).json({ error: 'Not authorised' })
    const { trackId, label } = req.body
    if (!trackId || !label) return res.status(400).json({ error: 'trackId and label required' })
    // Verify track exists and belongs to the same campaign
    const track = await MusicTrack.findOne({ _id: trackId, campaign: session.campaign })
    if (!track) return res.status(404).json({ error: 'Track not found in this campaign' })
    session.cues.push({ track: trackId, label })
    await session.save()
    const populated = await session.populate('cues.track', 'name url duration')
    res.json(populated)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// DELETE a cue from a session
router.delete('/:id/cues/:cueId', auth, async (req, res) => {
  try {
    const session = await MusicSession.findById(req.params.id)
    if (!session) return res.status(404).json({ error: 'Not found' })
    if (!await isMember(session.campaign, req.userId))
      return res.status(403).json({ error: 'Not authorised' })
    session.cues = session.cues.filter(c => c._id.toString() !== req.params.cueId)
    await session.save()
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// PUT reorder cues
router.put('/:id/cues-reorder', auth, async (req, res) => {
  try {
    const session = await MusicSession.findById(req.params.id)
    if (!session) return res.status(404).json({ error: 'Not found' })
    if (!await isMember(session.campaign, req.userId))
      return res.status(403).json({ error: 'Not authorised' })
    const { order } = req.body // array of cue _id strings in new order
    const cueMap = new Map(session.cues.map(c => [c._id.toString(), c]))
    session.cues = order.map(id => cueMap.get(id)).filter(Boolean)
    await session.save()
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

export default router
