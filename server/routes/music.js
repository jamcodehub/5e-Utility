import { Router } from 'express'
import { auth, isMember } from './campaigns.js'
import { MusicTrack } from '../models/index.js'
import { User } from '../models/index.js'
import { hasPremium, hasPremiumAs } from '../lib/premium.js'

const FREE_TRACK_LIMIT = 5

const router = Router()

// GET all tracks for a campaign
router.get('/:campaignId', auth, async (req, res) => {
  try {
    if (!await isMember(req.params.campaignId, req.userId))
      return res.status(403).json({ error: 'Not a campaign member' })
    const tracks = await MusicTrack.find({ campaign: req.params.campaignId }).sort({ createdAt: 1 })
    res.json(tracks)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// POST add a track (metadata only — audio already uploaded to Cloudinary by client)
router.post('/:campaignId', auth, async (req, res) => {
  try {
    if (!await isMember(req.params.campaignId, req.userId))
      return res.status(403).json({ error: 'Not a campaign member' })
    // Free tier paywall — max 5 tracks per campaign
    const user = await User.findById(req.userId)
    if (!hasPremium(user)) {
      const count = await MusicTrack.countDocuments({ campaign: req.params.campaignId })
      if (count >= FREE_TRACK_LIMIT)
        return res.status(403).json({ error: `Free accounts are limited to ${FREE_TRACK_LIMIT} tracks. Upgrade to Premium for unlimited uploads.` })
    }
    const { name, url, publicId, duration } = req.body
    if (!url) return res.status(400).json({ error: 'url is required' })
    const track = await MusicTrack.create({
      campaign: req.params.campaignId,
      addedBy: req.userId,
      name: name || 'Untitled',
      url,
      publicId: publicId || '',
      duration: duration || 0,
    })
    res.json(track)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// PUT rename a track
router.put('/:id', auth, async (req, res) => {
  try {
    const track = await MusicTrack.findById(req.params.id)
    if (!track) return res.status(404).json({ error: 'Not found' })
    if (!await isMember(track.campaign, req.userId))
      return res.status(403).json({ error: 'Not authorised' })
    track.name = req.body.name || track.name
    await track.save()
    res.json(track)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// DELETE a track
router.delete('/:id', auth, async (req, res) => {
  try {
    const track = await MusicTrack.findById(req.params.id)
    if (!track) return res.status(404).json({ error: 'Not found' })
    if (!await isMember(track.campaign, req.userId))
      return res.status(403).json({ error: 'Not authorised' })
    await MusicTrack.findByIdAndDelete(req.params.id)
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

export default router
