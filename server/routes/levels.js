import { Router } from 'express'
import { LevelPlan, Campaign, User } from '../models/index.js'
import { hasPremium, hasPremiumAs } from '../lib/premium.js'
import { FREE_MAPS_PER_CAMPAIGN } from '../lib/limits.js'
import { auth, isMember } from './campaigns.js'
import { locksFromContent, pruneLocks, hasDesignedLocks } from '../lib/doors.js'

const router = Router()

// Keep in sync with src/data/levelThemes.js (only themes that are live)
export const ALLOWED_THEMES = ['medieval', 'cartoon', 'scifi', 'gothic']

router.get('/:campaignId', auth, async (req, res) => {
  if (!await isMember(req.params.campaignId, req.userId)) return res.status(403).json({ error: 'Not a campaign member' })
  res.json(await LevelPlan.find({ campaign: req.params.campaignId }).sort({ createdAt: 1 }))
})

router.post('/:campaignId', auth, async (req, res) => {
  try {
    if (!await isMember(req.params.campaignId, req.userId)) return res.status(403).json({ error: 'Not a campaign member' })
    const campaign = await Campaign.findById(req.params.campaignId)
    const owner = campaign ? await User.findById(campaign.owner) : null
    if (!hasPremiumAs(owner, 'dm')) {
      const count = await LevelPlan.countDocuments({ campaign: req.params.campaignId })
      if (count >= FREE_MAPS_PER_CAMPAIGN) return res.status(403).json({ error: `Free campaigns are limited to ${FREE_MAPS_PER_CAMPAIGN} battle maps. Upgrade to the Ultimate DM Toolkit for unlimited maps.` })
    }
    const plan = await LevelPlan.create({
      title: req.body.title, content: req.body.content, tokens: req.body.tokens, stairLinks: req.body.stairLinks,
      theme: ALLOWED_THEMES.includes(req.body.theme) ? req.body.theme : 'medieval',
      doorLocks: locksFromContent(req.body.content), // locked doors the map was designed with (the map generator makes some)
      campaign: req.params.campaignId, owner: req.userId,
    })
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
  if (ALLOWED_THEMES.includes(req.body.theme)) updates.theme = req.body.theme
  if (typeof req.body.darkMode === 'boolean') updates.darkMode = req.body.darkMode
  if (Array.isArray(req.body.doorStates)) updates.doorStates = req.body.doorStates
  if (typeof req.body.content === 'string') {
    // The map was edited. If the editor sent its own lock layout (Locked Door tiles), that is the layout; otherwise a lock only
    // stays where there is still a door.
    if (hasDesignedLocks(req.body.content)) updates.doorLocks = locksFromContent(req.body.content)
    else {
      const before = await LevelPlan.findOne({ _id: req.params.id, owner: req.userId }).select('doorLocks')
      if (before) updates.doorLocks = pruneLocks(before.doorLocks, req.body.content)
    }
  }
  const plan = await LevelPlan.findOneAndUpdate({ _id: req.params.id, owner: req.userId }, updates, { returnDocument: 'after' })
  res.json(plan)
})

router.delete('/:id', auth, async (req, res) => {
  await LevelPlan.findOneAndDelete({ _id: req.params.id, owner: req.userId })
  res.json({ ok: true })
})

export default router
