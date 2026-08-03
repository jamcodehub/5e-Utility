import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { Campaign, Character, User } from '../models/index.js'

const router = Router()

export const auth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    req.userId = jwt.verify(token, process.env.JWT_SECRET).id
    next()
  } catch { res.status(401).json({ error: 'Unauthorized' }) }
}

const genCode = () => Math.random().toString(36).slice(2, 8).toUpperCase()

router.get('/', auth, async (req, res) => {
  let campaigns = await Campaign.find({
    $or: [{ owner: req.userId }, { members: req.userId }]
  }).sort({ updatedAt: -1 })

  // Give every user a personal solo space (Journal/Lore) even without joining a DM's campaign.
  if (!campaigns.length) {
    const personal = await Campaign.create({
      owner: req.userId, name: 'My Journal', isPersonal: true,
    })
    campaigns = [personal]
  }
  res.json(campaigns)
})

// Only DMs can create campaigns.
router.post('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
    if (user?.role !== 'dm') return res.status(403).json({ error: 'Only Dungeon Masters can create campaigns.' })

    let joinCode
    do { joinCode = genCode() } while (await Campaign.findOne({ joinCode }))

    const campaign = await Campaign.create({ ...req.body, owner: req.userId, joinCode })
    res.json(campaign)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// Players (or anyone) join a campaign using the DM's share code.
router.post('/join', auth, async (req, res) => {
  try {
    const { code } = req.body
    if (!code) return res.status(400).json({ error: 'Join code required' })
    const campaign = await Campaign.findOne({ joinCode: code.trim().toUpperCase() })
    if (!campaign) return res.status(404).json({ error: 'Invalid join code' })

    const user = await User.findById(req.userId)
    if (user.role === 'player' && !user.isPremium) {
      const already = await Campaign.countDocuments({ members: req.userId })
      const owned = String(campaign.owner) === String(req.userId)
      if (!owned && already >= 1) {
        return res.status(403).json({ error: 'Free players can join 1 campaign. Upgrade to Premium for unlimited campaigns.' })
      }
    }

    if (String(campaign.owner) !== String(req.userId) && !campaign.members.some(m => String(m) === String(req.userId))) {
      campaign.members.push(req.userId)
      await campaign.save()
    }
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

// Roleplay assistant session gate — free first session, premium for more
router.post('/:id/roleplay-session', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
    let char = await Character.findOne({ campaign: req.params.id, owner: req.userId })
    if (!char) return res.status(404).json({ error: 'Create a character first before using the Roleplay Assistant.' })
    if (!user.isPremium && (char.roleplaySessionCount || 0) >= 1) {
      return res.status(403).json({ error: 'Your first session plan is free. Upgrade to Premium for unlimited roleplay sessions.' })
    }
    char.roleplaySessionCount = (char.roleplaySessionCount || 0) + 1
    await char.save()
    res.json({ ok: true, sessionCount: char.roleplaySessionCount })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// Character within a campaign
router.get('/:id/character', auth, async (req, res) => {
  const char = await Character.findOne({ campaign: req.params.id, owner: req.userId })
  res.json(char)
})

router.put('/:id/character', auth, async (req, res) => {
  try {
    const existing = await Character.findOne({ campaign: req.params.id, owner: req.userId })
    if (!existing) {
      const user = await User.findById(req.userId)
      if (!user.isPremium) {
        const count = await Character.countDocuments({ owner: req.userId })
        const limit = user.role === 'dm' ? 20 : 1
        if (count >= limit) {
          return res.status(403).json({ error: `Free ${user.role === 'dm' ? 'DMs are limited to 20 characters' : 'players are limited to 1 character sheet'}. Upgrade for unlimited characters.` })
        }
      }
    }
    const char = await Character.findOneAndUpdate(
      { campaign: req.params.id, owner: req.userId },
      { ...req.body, campaign: req.params.id, owner: req.userId },
      { upsert: true, new: true }
    )
    res.json(char)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

export default router
