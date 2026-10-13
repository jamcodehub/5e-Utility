import { Router } from 'express'
import { Journal } from '../models/index.js'
import { auth, isMember } from './campaigns.js'
import { User } from '../models/index.js'

const router = Router()

router.get('/:campaignId', auth, async (req, res) => {
  if (!await isMember(req.params.campaignId, req.userId)) return res.status(403).json({ error: 'Not a campaign member' })
  // Journal entries are personal per-author (each player's own Journal,
  // the DM's own Session Planner) — never shared across users. Previously
  // this had no author filter at all, so every player's "Day" entries and
  // the DM's "Session" entries all bled together into one combined list
  // for anyone viewing any campaign member's page. `kind` further separates
  // day-entries (Journal.jsx) from session-entries (SessionPlanner.jsx) so
  // legacy entries missing one field never show up in the wrong page.
  const filter = { campaign: req.params.campaignId, author: req.userId }
  if (req.query.kind === 'day') filter.day = { $exists: true, $ne: null }
  else if (req.query.kind === 'session') filter.session = { $exists: true, $ne: null }
  const entries = await Journal.find(filter)
    .populate('author', 'username').sort({ day: -1, session: -1, createdAt: -1 })
  res.json(entries)
})

router.post('/:campaignId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
    if (!user.isPremium) {
      const count = await Journal.countDocuments({ campaign: req.params.campaignId, author: req.userId })
      if (count >= 15) return res.status(403).json({ error: 'Free accounts are limited to 15 journal/session planner entries. Upgrade to Premium for unlimited entries.' })
    }
    // Support both players (day field) and DMs (session field)
    const body = { ...req.body, campaign: req.params.campaignId, author: req.userId }
    if (!body.day && !body.session) body.day = 1
    const entry = await Journal.create(body)
    res.json(entry)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.put('/:id', auth, async (req, res) => {
  // Whitelist fields explicitly — passing the raw body straight into
  // findOneAndUpdate would let a client smuggle in `author` or `campaign`
  // and reassign the entry to someone else's account or another campaign.
  const updates = {}
  if (typeof req.body.title === 'string') updates.title = req.body.title
  if (typeof req.body.content === 'string') updates.content = req.body.content
  if (req.body.day !== undefined) updates.day = req.body.day
  if (req.body.session !== undefined) updates.session = req.body.session
  const entry = await Journal.findOneAndUpdate({ _id: req.params.id, author: req.userId }, updates, { new: true })
  res.json(entry)
})

router.delete('/:id', auth, async (req, res) => {
  await Journal.findOneAndDelete({ _id: req.params.id, author: req.userId })
  res.json({ ok: true })
})

export default router
