import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { Inventory } from '../models/index.js'
import { isMember } from './campaigns.js'

const router = Router()

const auth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    req.userId = jwt.verify(token, process.env.JWT_SECRET).id
    next()
  } catch { res.status(401).json({ error: 'Unauthorized' }) }
}

// GET /api/inventory/:campaignId — fetch or auto-create inventory doc
router.get('/:campaignId', auth, async (req, res) => {
  try {
    if (!await isMember(req.params.campaignId, req.userId)) return res.status(403).json({ error: 'Not a campaign member' })
    let inv = await Inventory.findOne({ campaign: req.params.campaignId, owner: req.userId })
    if (!inv) {
      inv = await Inventory.create({
        campaign: req.params.campaignId,
        owner: req.userId,
        currency: { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 },
        items: [],
      })
    }
    res.json(inv)
  } catch (e) { console.error('[inventory]', e); res.status(500).json({ error: 'Internal server error' }) }
})

// PUT /api/inventory/:campaignId — upsert (currency + items)
router.put('/:campaignId', auth, async (req, res) => {
  try {
    if (!await isMember(req.params.campaignId, req.userId)) return res.status(403).json({ error: 'Not a campaign member' })
    // Exclude `campaign`/`owner`/`_id` — these come from the URL/token, not
    // the client body, otherwise a client could reassign their inventory
    // doc to a different campaign or account via $set.
    const { campaign, owner, _id, ...safeUpdates } = req.body
    const inv = await Inventory.findOneAndUpdate(
      { campaign: req.params.campaignId, owner: req.userId },
      { $set: safeUpdates },
      { returnDocument: 'after', upsert: true, runValidators: true }
    )
    res.json(inv)
  } catch (e) { console.error('[inventory]', e); res.status(500).json({ error: 'Internal server error' }) }
})

export default router
