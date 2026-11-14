import { Router } from 'express'
import { Character } from '../models/index.js'

const router = Router()

// Public, read-only character sheet for a share link. Only whitelisted fields
// leave the server; notes, lore, goals and ownership details stay private.
router.get('/character/:token', async (req, res) => {
  try {
    if (!/^[a-f0-9]{32}$/.test(req.params.token)) return res.status(404).json({ error: 'Not found' })
    const c = await Character.findOne({ shareToken: req.params.token }).lean()
    if (!c) return res.status(404).json({ error: 'This sheet is no longer shared' })
    const { name, race, class: cls, level, stats, hp, ac, profBonus, proficiencies, background, personality, avatarUrl, srd, spells, combat, currency, companions } = c
    res.json({ name, race, class: cls, level, stats, hp, ac, profBonus, proficiencies, background, personality, avatarUrl, srd, spells, combat, currency, companions })
  } catch { res.status(500).json({ error: 'Failed to load sheet' }) }
})

export default router
