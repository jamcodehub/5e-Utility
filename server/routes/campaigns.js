import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { Campaign, Character, User, CampaignGuide } from '../models/index.js'

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

// ─── Shared membership helper ─────────────────────────────────────────────
// Used by all campaign-scoped routes to gate data access.
export const isMember = async (campaignId, userId) => {
  const c = await Campaign.findById(campaignId).select('owner members')
  if (!c) return false
  const uid = String(userId)
  return String(c.owner) === uid || c.members.some(m => String(m) === uid)
}

// Players join via code — DM approval required before they see any data.
router.post('/join', auth, async (req, res) => {
  try {
    const { code } = req.body
    if (!code) return res.status(400).json({ error: 'Join code required' })
    const campaign = await Campaign.findOne({ joinCode: code.trim().toUpperCase() })
    if (!campaign) return res.status(404).json({ error: 'Invalid join code' })

    const uid = String(req.userId)
    // Already a member
    if (String(campaign.owner) === uid || campaign.members.some(m => String(m) === uid))
      return res.json({ pending: false, campaign })
    // Already pending
    if (campaign.pendingMembers.some(m => String(m) === uid))
      return res.json({ pending: true })

    const user = await User.findById(req.userId)
    if (user.role === 'player' && !user.isPremium) {
      const already = await Campaign.countDocuments({ members: req.userId })
      if (already >= 1) return res.status(403).json({ error: 'Free players can join 1 campaign. Upgrade to Premium for unlimited campaigns.' })
    }

    campaign.pendingMembers.push(req.userId)
    await campaign.save()
    res.json({ pending: true })
  } catch { res.status(500).json({ error: 'Failed to submit join request' }) }
})

// DM: list pending join requests for a campaign
router.get('/:id/pending', auth, async (req, res) => {
  try {
    const campaign = await Campaign.findOne({ _id: req.params.id, owner: req.userId })
      .populate('pendingMembers', 'username email')
    if (!campaign) return res.status(403).json({ error: 'Not authorised' })
    res.json(campaign.pendingMembers)
  } catch { res.status(500).json({ error: 'Failed to load requests' }) }
})

// DM: approve a pending member
router.post('/:id/approve/:userId', auth, async (req, res) => {
  try {
    const campaign = await Campaign.findOne({ _id: req.params.id, owner: req.userId })
    if (!campaign) return res.status(403).json({ error: 'Not authorised' })
    campaign.pendingMembers = campaign.pendingMembers.filter(m => String(m) !== req.params.userId)
    if (!campaign.members.some(m => String(m) === req.params.userId))
      campaign.members.push(req.params.userId)
    await campaign.save()
    res.json({ ok: true })
  } catch { res.status(500).json({ error: 'Failed to approve' }) }
})

// DM: reject / remove a pending member
router.delete('/:id/pending/:userId', auth, async (req, res) => {
  try {
    const campaign = await Campaign.findOne({ _id: req.params.id, owner: req.userId })
    if (!campaign) return res.status(403).json({ error: 'Not authorised' })
    campaign.pendingMembers = campaign.pendingMembers.filter(m => String(m) !== req.params.userId)
    await campaign.save()
    res.json({ ok: true })
  } catch { res.status(500).json({ error: 'Failed to reject' }) }
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

// DM: get all members' characters for Campaign Guide reference
router.get('/:id/members/characters', auth, async (req, res) => {
  try {
    const campaign = await Campaign.findOne({ _id: req.params.id, owner: req.userId })
      .populate('members', 'username')
    if (!campaign) return res.status(403).json({ error: 'DM only' })
    const chars = await Character.find({
      campaign: req.params.id,
      owner: { $in: campaign.members.map(m => m._id) },
    })
    const result = campaign.members.map(m => ({
      userId: m._id,
      username: m.username,
      character: chars.find(c => String(c.owner) === String(m._id)) || null,
    }))
    res.json(result)
  } catch { res.status(500).json({ error: 'Failed to load members' }) }
})

// Player: persist depth fields without overwriting other character data
router.patch('/:id/character/depth', auth, async (req, res) => {
  try {
    const { background, personality, goals, lore } = req.body
    const char = await Character.findOneAndUpdate(
      { campaign: req.params.id, owner: req.userId },
      { $set: { background, personality, goals, lore } },
      { new: true }
    )
    if (!char) return res.status(404).json({ error: 'Character not found' })
    res.json(char)
  } catch { res.status(500).json({ error: 'Failed to save depth' }) }
})

// ─── Campaign Guide (DM writes, all members can read) ───────────────────────
router.get('/:id/guide', auth, async (req, res) => {
  try {
    if (!await isMember(req.params.id, req.userId)) return res.status(403).json({ error: 'Not authorised' })
    const guide = await CampaignGuide.findOne({ campaign: req.params.id }) || {}
    res.json(guide)
  } catch { res.status(500).json({ error: 'Failed to load guide' }) }
})

router.put('/:id/guide', auth, async (req, res) => {
  try {
    const campaign = await Campaign.findOne({ _id: req.params.id, owner: req.userId })
    if (!campaign) return res.status(403).json({ error: 'Only the DM can edit the campaign guide' })
    const guide = await CampaignGuide.findOneAndUpdate(
      { campaign: req.params.id },
      { ...req.body, campaign: req.params.id },
      { upsert: true, new: true }
    )
    res.json(guide)
  } catch { res.status(500).json({ error: 'Failed to save guide' }) }
})

export default router
