import { Router } from 'express'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { Campaign, Character, User, CampaignGuide, DMBoard, DMBoardFolder } from '../models/index.js'
import { hasPremium, hasPremiumAs } from '../lib/premium.js'
import { buildTestCharacter, MAX_TEST_PLAYERS } from '../lib/testPlayer.js'
import { notifyUser } from '../lib/notify.js'
import { FREE_CAMPAIGNS } from '../lib/limits.js'
import { findTemplate, templateSummaries, seedCampaign } from '../lib/campaignTemplates.js'
import { cleanHomebrewGuide } from '../lib/homebrewGuide.js'

const router = Router()

export const auth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    req.userId = jwt.verify(token, process.env.JWT_SECRET).id
    next()
  } catch { res.status(401).json({ error: 'Unauthorized' }) }
}

const genCode = () => Array.from({ length: 6 }, () => '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'[crypto.randomInt(36)]).join('')

// Only these campaign fields are client-editable; membership, join code and
// the personal flag are server-managed.
const pickCampaignFields = (body = {}) => {
  const out = {}
  for (const k of ['name', 'description', 'setting', 'coverImage']) if (typeof body[k] === 'string') out[k] = body[k]
  return out
}

// Fields the client must never set on a character.
const stripServerFields = (body = {}) => {
  const { _id, __v, owner, campaign, isPrimary, shareToken, roleplaySessionCount, createdAt, updatedAt, ...safe } = body
  return safe
}

router.get('/', auth, async (req, res) => {
  // Accounts can switch between DM and player, so each identity only sees its
  // own campaigns: the ones it runs as a DM, or the ones it joined as a player.
  const user = await User.findById(req.userId).select('role')
  const mine = user?.role === 'dm'
    ? [{ owner: req.userId }]
    : [{ members: req.userId }, { owner: req.userId, isPersonal: true }]
  let campaigns = await Campaign.find({ $or: mine }).sort({ updatedAt: -1 })

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
// The ready-made campaigns a DM can start from (what the New Campaign dialog lists). `locked` ones need DM Premium.
router.get('/templates', auth, async (req, res) => {
  const user = await User.findById(req.userId)
  res.json(templateSummaries(hasPremiumAs(user, 'dm')))
})

router.post('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
    if (user?.role !== 'dm') return res.status(403).json({ error: 'Only Dungeon Masters can create campaigns.' })
    const template = req.body?.templateId ? findTemplate(String(req.body.templateId)) : null
    if (req.body?.templateId && !template) return res.status(400).json({ error: 'That ready-made campaign does not exist.' })
    if (template?.premium && !hasPremiumAs(user, 'dm')) return res.status(403).json({ error: 'This ready-made campaign is part of DM Premium.' })
    if (!hasPremiumAs(user, 'dm') && await Campaign.countDocuments({ owner: req.userId, isPersonal: { $ne: true } }) >= FREE_CAMPAIGNS)
      return res.status(403).json({ error: `Free DMs can run ${FREE_CAMPAIGNS} campaigns. Upgrade to DM Premium for unlimited campaigns.` })

    let joinCode
    do { joinCode = genCode() } while (await Campaign.findOne({ joinCode }))

    const fields = pickCampaignFields(req.body)
    if (template) { fields.description = fields.description || template.pitch; fields.setting = fields.setting || template.title }
    if (!fields.name?.trim() && template) fields.name = template.title
    const campaign = await Campaign.create({ ...fields, owner: req.userId, joinCode })
    if (template) await seedCampaign(campaign, template, req.userId)
    else {
      // Homebrew started with the step-by-step questions: the answers fill in the Campaign Guide.
      const guide = cleanHomebrewGuide(req.body?.guide)
      if (guide) await CampaignGuide.create({ campaign: campaign._id, ...guide })
    }
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
    // The DM using their own campaign's code (to play it, or to try the player view): no approval is needed, but they must be
    // recorded as a member. The player list only shows campaigns you are a member of, so without this the campaign
    // looked joined and then disappeared the next time the role was switched.
    if (String(campaign.owner) === uid) {
      if (!campaign.members.some(m => String(m) === uid)) { campaign.members.push(req.userId); await campaign.save() }
      return res.json({ pending: false, campaign })
    }
    // Already a member
    if (campaign.members.some(m => String(m) === uid))
      return res.json({ pending: false, campaign })
    // Already pending
    if (campaign.pendingMembers.some(m => String(m) === uid))
      return res.json({ pending: true, campaignId: campaign._id })

    const user = await User.findById(req.userId)
    if (user.role === 'player' && !hasPremiumAs(user, 'player')) {
      const already = await Campaign.countDocuments({ members: req.userId })
      if (already >= FREE_CAMPAIGNS) return res.status(403).json({ error: `Free players can join ${FREE_CAMPAIGNS} campaigns. Upgrade to Premium for unlimited campaigns.` })
    }

    campaign.pendingMembers.push(req.userId)
    await campaign.save()
    res.json({ pending: true, campaignId: campaign._id })
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
    notifyUser(req.params.userId, 'campaign:approved', { campaignId: campaign._id })   // the player's open page selects it at once
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

// DM removes a player from the campaign. To guard against a stray tap the DM must type the player's character name exactly
// (their username if they have no character yet), enforced here as well as in the UI. Only their access ends: their
// characters are kept, so they are all still there if the player is let back in. The DM can also remove themselves from the
// player list (a placeholder test player), which never touches their ownership of the campaign.
const memberLabel = async (campaignId, userId) => {
  const chars = await Character.find({ campaign: campaignId, owner: userId })
  const character = chars.find(c => c.isPrimary) || chars[0]
  if (character?.name?.trim()) return character.name
  const user = await User.findById(userId).select('username')
  return user?.username || ''
}

// DM adds a "test player": a placeholder player (an account that cannot sign in) with a ready-made character, so the DM can
// try the campaign, use them as a token on the battle map, in the battle tracker and so on. Removing them deletes them.
router.post('/:id/test-players', auth, async (req, res) => {
  try {
    const campaign = await Campaign.findOne({ _id: req.params.id, owner: req.userId, isPersonal: { $ne: true } })
    if (!campaign) return res.status(403).json({ error: 'Only the DM of a campaign can add test players.' })
    if (await User.countDocuments({ placeholderCampaign: campaign._id }) >= MAX_TEST_PLAYERS)
      return res.status(400).json({ error: `A campaign can have up to ${MAX_TEST_PLAYERS} test players. Remove one first.` })
    const sheet = buildTestCharacter({ name: req.body?.name, classId: req.body?.classId, level: req.body?.level })
    const tag = crypto.randomBytes(3).toString('hex')
    const user = await User.create({
      username: `Test player ${tag}`, email: `test-player-${tag}-${crypto.randomBytes(4).toString('hex')}@placeholder.invalid`,
      role: 'player', roles: ['player'], placeholderOf: req.userId, placeholderCampaign: campaign._id,
    })
    const character = await Character.create({ ...sheet, campaign: campaign._id, owner: user._id, isPrimary: true })
    campaign.members.push(user._id)
    await campaign.save()
    res.json({ userId: user._id, username: user.username, character, isTest: true })
  } catch { res.status(500).json({ error: 'Failed to add the test player' }) }
})

router.delete('/:id/members/:userId', auth, async (req, res) => {
  try {
    const campaign = await Campaign.findOne({ _id: req.params.id, owner: req.userId })
    if (!campaign) return res.status(403).json({ error: 'Only the DM can remove players.' })
    const uid = String(req.params.userId)
    if (!campaign.members.some(m => String(m) === uid)) return res.status(404).json({ error: 'That player is not in this campaign.' })
    const expected = await memberLabel(campaign._id, uid)
    if (!expected || req.body?.confirmName !== expected) return res.status(400).json({ error: 'Name did not match.' })
    campaign.members = campaign.members.filter(m => String(m) !== uid)
    await campaign.save()
    // A test player has no one behind it, so it is deleted together with its character instead of being left behind.
    if (await User.findOneAndDelete({ _id: uid, placeholderOf: req.userId })) await Character.deleteMany({ campaign: campaign._id, owner: uid })
    res.json({ ok: true })
  } catch { res.status(500).json({ error: 'Failed to remove the player' }) }
})

router.put('/:id', auth, async (req, res) => {
  try {
    const campaign = await Campaign.findOneAndUpdate(
      { _id: req.params.id, owner: req.userId },
      pickCampaignFields(req.body), { returnDocument: 'after' }
    )
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' })
    res.json(campaign)
  } catch { res.status(500).json({ error: 'Failed to update campaign' }) }
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
  if (!hasPremiumAs(user, 'dm')) {
    return res.status(403).json({ error: 'Deleting a campaign is a Premium feature. Upgrade to Premium to delete campaigns.' })
  }
  if (req.body?.confirmName !== campaign.name) {
    return res.status(400).json({ error: 'Campaign name did not match.' })
  }
  await campaign.deleteOne()
  const testPlayers = await User.find({ placeholderCampaign: campaign._id }).select('_id')
  if (testPlayers.length) {
    await Character.deleteMany({ campaign: campaign._id, owner: { $in: testPlayers.map(u => u._id) } })
    await User.deleteMany({ _id: { $in: testPlayers.map(u => u._id) } })
  }
  await DMBoard.deleteMany({ campaign: campaign._id })
  await DMBoardFolder.deleteMany({ campaign: campaign._id })
  res.json({ ok: true })
})

// Roleplay assistant session gate — free first session, premium for more
router.post('/:id/roleplay-session', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
    let char = await ensurePrimary(req.params.id, req.userId)
    if (!char) return res.status(404).json({ error: 'Create a character first before using the Roleplay Assistant.' })
    if (!hasPremiumAs(user, 'player') && (char.roleplaySessionCount || 0) >= 1) {
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
    if (!await isMember(req.params.id, req.userId)) return res.status(403).json({ error: 'Not a campaign member' })
    const body = stripServerFields(req.body)
    let primary = await ensurePrimary(req.params.id, req.userId)
    if (primary) {
      Object.assign(primary, body)
      await primary.save()
      return res.json(primary)
    }
    // No characters at all yet for this campaign — creating the first one
    // is always within the free 2-per-campaign limit.
    const char = await Character.create({ ...body, campaign: req.params.id, owner: req.userId, isPrimary: true })
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
    if (!await isMember(req.params.id, req.userId)) return res.status(403).json({ error: 'Not a campaign member' })
    const user = await User.findById(req.userId)
    const count = await Character.countDocuments({ campaign: req.params.id, owner: req.userId })
    if (!hasPremiumAs(user, 'player') && count >= 2) {
      return res.status(403).json({ error: 'Free accounts are limited to 2 characters per campaign. Upgrade to Premium for unlimited characters.' })
    }
    const char = await Character.create({ ...stripServerFields(req.body), campaign: req.params.id, owner: req.userId, isPrimary: count === 0 })
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
    const body = isDm ? { hp: req.body.hp } : stripServerFields(req.body)
    const char = await Character.findOneAndUpdate(filter, body, { returnDocument: 'after' })
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

// Requires the exact, case-sensitive character name as a confirmation
// safeguard (unnamed sheets are shown as "Unnamed Hero" in the UI).
router.delete('/:id/characters/:charId', auth, async (req, res) => {
  try {
    const existing = await Character.findOne({ _id: req.params.charId, campaign: req.params.id, owner: req.userId })
    if (!existing) return res.status(404).json({ error: 'Character not found' })
    if (req.body?.confirmName !== (existing.name || 'Unnamed Hero')) {
      return res.status(400).json({ error: 'Character name did not match.' })
    }
    const char = await Character.findOneAndDelete({ _id: existing._id })
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
    const campaign = await Campaign.findById(req.params.id).populate('members', 'username avatar placeholderOf')
    if (!campaign) return res.status(404).json({ error: 'Not found' })
    const chars = await Character.find({
      campaign: req.params.id,
      owner: { $in: campaign.members.map(m => m._id) },
    })
    const result = campaign.members.map(m => {
      const owned = chars.filter(c => String(c.owner) === String(m._id))
      const character = owned.find(c => c.isPrimary) || owned[0] || null
      return { userId: m._id, username: m.username, avatar: m.avatar || '', character, isTest: !!m.placeholderOf }
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
      { upsert: true, returnDocument: 'after' }
    )
    res.json(guide)
  } catch { res.status(500).json({ error: 'Failed to save guide' }) }
})

export default router
