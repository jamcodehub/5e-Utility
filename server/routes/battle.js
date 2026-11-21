import { Router } from 'express'
import mongoose from 'mongoose'
import { Campaign, BattleState, User } from '../models/index.js'
import { auth } from './campaigns.js'

// The DM's running battle, saved per campaign so initiative, turn order, round and HP survive a reload.
// Everything is rebuilt field by field from the request, so only known, size-limited data is ever stored.
const router = Router()

const MAX_COMBATANTS = 60
const MAX_LOG = 60
const str = (v, n) => (typeof v === 'string' ? v.slice(0, n) : undefined)
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined)
const clean = (obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined))
const TYPES = ['player', 'npc', 'enemy', 'boss']
const SOURCES = ['party', 'lore', 'custom', 'srd']

const cleanAttack = (a) => {
  const name = str(a?.name, 80), dmg = str(a?.dmg, 80)
  if (!name || !dmg) return null
  return clean({ name, bonus: num(a.bonus) ?? 0, dmg, type: str(a.type, 80) })
}

const cleanCombatant = (c) => {
  const id = str(c?.id, 80), name = str(c?.name, 80)
  if (!id || !name || !TYPES.includes(c.type) || !SOURCES.includes(c.source)) return null
  const sheet = c.sheet && typeof c.sheet === 'object' ? clean({
    line: str(c.sheet.line, 200),
    speed: typeof c.sheet.speed === 'number' ? num(c.sheet.speed) : str(c.sheet.speed, 120),
    abil: Array.isArray(c.sheet.abil) && c.sheet.abil.length === 6 && c.sheet.abil.every(n => num(n) !== undefined) ? c.sheet.abil : undefined,
    multi: str(c.sheet.multi, 1200),
  }) : undefined
  return clean({
    id, name, type: c.type, source: c.source,
    avatar: typeof c.avatar === 'string' && /^https:\/\//.test(c.avatar) ? c.avatar.slice(0, 500) : null,
    hp: num(c.hp), maxHp: num(c.maxHp), ac: num(c.ac) ?? null, init: num(c.init) ?? null, initBonus: num(c.initBonus) ?? 0,
    loreId: str(c.loreId, 40), userId: str(c.userId, 40), charId: str(c.charId, 40),
    attacks: (Array.isArray(c.attacks) ? c.attacks : []).slice(0, 20).map(cleanAttack).filter(Boolean),
    sheet,
  })
}

// Returns the cleaned state, or null if it isn't a battle state at all.
export function cleanState(state) {
  if (!state || typeof state !== 'object' || !Array.isArray(state.combatants) || state.combatants.length > MAX_COMBATANTS) return null
  const combatants = state.combatants.map(cleanCombatant)
  if (combatants.some(c => !c) || new Set(combatants.map(c => c.id)).size !== combatants.length) return null
  const turnId = typeof state.turnId === 'string' && combatants.some(c => c.id === state.turnId) ? state.turnId : null
  return {
    combatants, turnId,
    round: Number.isInteger(state.round) && state.round >= 1 && state.round <= 9999 ? state.round : 1,
    log: (Array.isArray(state.log) ? state.log : []).filter(l => typeof l === 'string').slice(-MAX_LOG).map(l => l.slice(0, 400)),
  }
}

router.use('/:campaignId', auth, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.campaignId)) return res.status(400).json({ error: 'Invalid campaign' })
    // DM identity plus ownership of a real campaign (not the active mode), like the DM board, so a final save still lands.
    const [user, campaign] = await Promise.all([
      User.findById(req.userId).select('role roles'),
      Campaign.findOne({ _id: req.params.campaignId, owner: req.userId, isPersonal: { $ne: true } }).select('_id'),
    ])
    const isDM = user?.role === 'dm' || (user?.roles || []).includes('dm')
    if (!isDM || !campaign) return res.status(403).json({ error: 'Only the campaign DM can use the battle tracker.' })
    next()
  } catch (e) {
    console.error('Failed to authorise battle tracker:', e)
    res.status(500).json({ error: 'Something went wrong.' })
  }
})

router.get('/:campaignId', async (req, res) => {
  try {
    const doc = await BattleState.findOne({ campaign: req.params.campaignId }).select('state')
    res.json({ state: doc?.state ?? null })
  } catch (e) {
    console.error('Failed to load battle state:', e)
    res.status(500).json({ error: 'Could not load the battle.' })
  }
})

router.put('/:campaignId', async (req, res) => {
  try {
    const state = cleanState(req.body?.state)
    if (!state) return res.status(400).json({ error: 'That is not a valid battle.' })
    await BattleState.findOneAndUpdate({ campaign: req.params.campaignId }, { $set: { state } }, { upsert: true })
    res.json({ ok: true })
  } catch (e) {
    console.error('Failed to save battle state:', e)
    res.status(500).json({ error: 'Could not save the battle.' })
  }
})

export default router
