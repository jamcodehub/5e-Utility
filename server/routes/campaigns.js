import { Router } from 'express'
import crypto from 'crypto'
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
// ─── Character helpers ─────────────────────────────────────────────
// Players may now have multiple character docs per campaign (2 free /
// unlimited premium), distinguished by `isPrimary`. Back-compat single-
// character consumers (Roleplay Assistant, the DM's members/characters
// roster, the singular /:id/character routes) always resolve to whichever
// one is marked primary.
const fieldScore = (doc) => {
  const obj = doc.toObject ? doc.toObject() : doc
  let score = 0
  for (const key of ['name', 'race', 'class', 'notes', 'background', 'personality', 'goals', 'lore', 'avatarUrl', 'dndBeyondUrl']) {
    if (obj[key] && String(obj[key]).trim()) score += String(obj[key]).length
  }
  if ((obj.proficiencies || []).length) score += obj.proficiencies.length
  return score
}

// Finds the primary character for a campaign+owner, promoting the most
// content-rich existing character to primary if none is currently marked
// (covers legacy accounts from before `isPrimary` existed). Never deletes
// anything — unlike the old dedupeCharacter, additional characters are a
// deliberate feature now, not an error condition to clean up.
const ensurePrimary = async (campaignId, ownerId) => {
  let primary = await Character.findOne({ campaign: campaignId, owner: ownerId, isPrimary: true })
  if (primary) return primary
  const candidates = await Character.find({ campaign: campaignId, owner: ownerId })
  if (!candidates.length) return null
  const winner = candidates.reduce((best, d) => fieldScore(d) > fieldScore(best) ? d : best, candidates[0])
  winner.isPrimary = true
  await winner.save()
  return winner
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

// Member (not owner) leaves a campaign — requires typing the exact,
// case-sensitive campaign name as a confirmation safeguard against
// accidental taps, enforced here as well as in the UI.
router.post('/:id/leave', auth, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' })
    if (String(campaign.owner) === String(req.userId)) {
      return res.status(400).json({ error: 'Campaign owners cannot leave — delete the campaign instead.' })
    }
    if (req.body?.confirmName !== campaign.name) {
      return res.status(400).json({ error: 'Campaign name did not match.' })
    }
    campaign.members = campaign.members.filter(m => String(m) !== String(req.userId))
    await campaign.save()
    res.json({ ok: true })
  } catch { res.status(500).json({ error: 'Failed to leave campaign' }) }
})

// Owner deletes a campaign — Premium-only, and requires typing the exact,
// case-sensitive campaign name as a confirmation safeguard.
router.delete('/:id', auth, async (req, res) => {
  const campaign = await Campaign.findOne({ _id: req.params.id, owner: req.userId })
  if (!campaign) return res.status(404).json({ error: 'Campaign not found' })
  const user = await User.findById(req.userId)
  if (!user.isPremium) {
    return res.status(403).json({ error: 'Deleting a campaign is a Premium feature. Upgrade to Premium to delete campaigns.' })
  }
  if (req.body?.confirmName !== campaign.name) {
    return res.status(400).json({ error: 'Campaign name did not match.' })
  }
  await campaign.deleteOne()
  res.json({ ok: true })
})

// Roleplay assistant session gate — free first session, premium for more
router.post('/:id/roleplay-session', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
    let char = await ensurePrimary(req.params.id, req.userId)
    if (!char) return res.status(404).json({ error: 'Create a character first before using the Roleplay Assistant.' })
    if (!user.isPremium && (char.roleplaySessionCount || 0) >= 1) {
      return res.status(403).json({ error: 'Your first session plan is free. Upgrade to Premium for unlimited roleplay sessions.' })
    }
    char.roleplaySessionCount = (char.roleplaySessionCount || 0) + 1
    await char.save()
    res.json({ ok: true, sessionCount: char.roleplaySessionCount })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// Character within a campaign — resolves to the player's PRIMARY character
// for back-compat with consumers that only understand a single sheet
// (Roleplay Assistant, DM's members roster, D&D Beyond link, etc).
router.get('/:id/character', auth, async (req, res) => {
  const char = await ensurePrimary(req.params.id, req.userId)
  res.json(char)
})

router.put('/:id/character', auth, async (req, res) => {
  try {
    delete req.body.shareToken
    let primary = await ensurePrimary(req.params.id, req.userId)
    if (primary) {
      Object.assign(primary, req.body)
      await primary.save()
      return res.json(primary)
    }
    // No characters at all yet for this campaign — creating the first one
    // is always within the free 2-per-campaign limit.
    const char = await Character.create({ ...req.body, campaign: req.params.id, owner: req.userId, isPrimary: true })
    res.json(char)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── Multi-character routes (2 free / unlimited premium per campaign) ──
router.get('/:id/characters', auth, async (req, res) => {
  try {
    const chars = await Character.find({ campaign: req.params.id, owner: req.userId }).sort({ createdAt: 1 })
    res.json(chars)
  } catch { res.status(500).json({ error: 'Failed to load characters' }) }
})

router.post('/:id/characters', auth, async (req, res) => {
  try {
    delete req.body.shareToken
    const user = await User.findById(req.userId)
    const count = await Character.countDocuments({ campaign: req.params.id, owner: req.userId })
    if (!user.isPremium && count >= 2) {
      return res.status(403).json({ error: 'Free accounts are limited to 2 characters per campaign. Upgrade to Premium for unlimited characters.' })
    }
    const char = await Character.create({ ...req.body, campaign: req.params.id, owner: req.userId, isPrimary: count === 0 })
    res.json(char)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.put('/:id/characters/:charId', auth, async (req, res) => {
  try {
    // Normally only the character's owner may edit it, but the campaign DM
    // is also allowed to update HP during combat (HP Tracker).
    const campaign = await Campaign.findById(req.params.id)
    const isDm = campaign && String(campaign.owner) === String(req.userId)
    const filter = isDm
      ? { _id: req.params.charId, campaign: req.params.id }
      : { _id: req.params.charId, campaign: req.params.id, owner: req.userId }
    // The DM may only touch HP (combat tracker); full edits remain owner-only.
    delete req.body.shareToken
    const body = isDm ? { hp: req.body.hp } : req.body
    const char = await Character.findOneAndUpdate(filter, body, { new: true })
    if (!char) return res.status(404).json({ error: 'Character not found' })
    res.json(char)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// Turn the read-only share link for a character on or off (owner only).
router.post('/:id/characters/:charId/share', auth, async (req, res) => {
  try {
    const char = await Character.findOne({ _id: req.params.charId, campaign: req.params.id, owner: req.userId })
    if (!char) return res.status(404).json({ error: 'Character not found' })
    if (req.body.enabled) char.shareToken = char.shareToken || crypto.randomBytes(16).toString('hex')
    else char.shareToken = undefined
    await char.save()
    res.json({ shareToken: char.shareToken || null })
  } catch { res.status(500).json({ error: 'Could not update sharing' }) }
})

router.delete('/:id/characters/:charId', auth, async (req, res) => {
  try {
    const char = await Character.findOneAndDelete({ _id: req.params.charId, campaign: req.params.id, owner: req.userId })
    if (char?.isPrimary) {
      // Promote another remaining character (if any) so there's always a
      // primary for back-compat consumers.
      const next = await Character.findOne({ campaign: req.params.id, owner: req.userId })
      if (next) { next.isPrimary = true; await next.save() }
    }
    res.json({ ok: true })
  } catch { res.status(500).json({ error: 'Failed to delete character' }) }
})

// Get all members' characters — used by Campaign Guide/HP Tracker (DM-only
// pages, gated client-side) and the collaborative Level Builder board, which
// any campaign member (DM or player) needs so party tokens are available.
router.get('/:id/members/characters', auth, async (req, res) => {
  try {
    if (!await isMember(req.params.id, req.userId)) return res.status(403).json({ error: 'Not a campaign member' })
    const campaign = await Campaign.findById(req.params.id).populate('members', 'username')
    if (!campaign) return res.status(404).json({ error: 'Not found' })
    const chars = await Character.find({
      campaign: req.params.id,
      owner: { $in: campaign.members.map(m => m._id) },
    })
    const result = campaign.members.map(m => {
      const owned = chars.filter(c => String(c.owner) === String(m._id))
      const character = owned.find(c => c.isPrimary) || owned[0] || null
      return { userId: m._id, username: m.username, character }
    })
    res.json(result)
  } catch { res.status(500).json({ error: 'Failed to load members' }) }
})

// Player: persist depth fields without overwriting other character data
// (targets the primary character).
router.patch('/:id/character/depth', auth, async (req, res) => {
  try {
    const { background, personality, goals, lore } = req.body
    const primary = await ensurePrimary(req.params.id, req.userId)
    if (!primary) return res.status(404).json({ error: 'Character not found' })
    primary.background = background
    primary.personality = personality
    primary.goals = goals
    primary.lore = lore
    await primary.save()
    res.json(primary)
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
