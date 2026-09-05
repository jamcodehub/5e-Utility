// ─────────────────────────────────────────────────────────────────────────────
// ADD THESE TWO ROUTES TO YOUR campaigns.js FILE
// They handle /api/campaigns/:campaignId/character
// Place them at the bottom of the file, before "export default router"
// ─────────────────────────────────────────────────────────────────────────────

import { Character } from '../models/index.js' // add this import at the top of campaigns.js

// GET /api/campaigns/:campaignId/character
// Returns the calling user's character for this campaign (or null if not set up yet)
router.get('/:campaignId/character', auth, async (req, res) => {
  try {
    if (!await isMember(req.params.campaignId, req.userId))
      return res.status(403).json({ error: 'Not a campaign member' })

    const char = await Character.findOne({
      campaign: req.params.campaignId,
      owner: req.userId,
    })
    res.json(char || null)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// PUT /api/campaigns/:campaignId/character
// Creates or updates the calling user's character (upsert)
router.put('/:campaignId/character', auth, async (req, res) => {
  try {
    if (!await isMember(req.params.campaignId, req.userId))
      return res.status(403).json({ error: 'Not a campaign member' })

    const char = await Character.findOneAndUpdate(
      { campaign: req.params.campaignId, owner: req.userId },
      { ...req.body, campaign: req.params.campaignId, owner: req.userId },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    )
    res.json(char)
  } catch (e) { res.status(500).json({ error: e.message }) }
})
