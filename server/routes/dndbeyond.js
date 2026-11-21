import { Router } from 'express'
import { auth } from './campaigns.js'
import { parseCharacterId, characterServiceUrl, mapCharacter } from '../lib/dndbeyond.js'

const router = Router()
const MAX_BYTES = 4 * 1024 * 1024

// Reads a PUBLIC D&D Beyond character and returns our sheet fields for the player to review. Nothing is saved here.
// Only the numeric id is taken from what the player pasted; the request always goes to D&D Beyond's own fixed address.
router.post('/preview', auth, async (req, res) => {
  const id = parseCharacterId(req.body?.url)
  if (!id) return res.status(400).json({ error: 'Paste the link to your D&D Beyond character (it looks like dndbeyond.com/characters/12345678).' })
  try {
    const r = await fetch(characterServiceUrl(id), {
      headers: { Accept: 'application/json', 'User-Agent': '5e-Utility character import' },
      signal: AbortSignal.timeout(12000),
    })
    if (r.status === 403 || r.status === 404) return res.status(404).json({ error: 'D&D Beyond would not share that character. Open it on D&D Beyond, set it to Public (Character Settings, Privacy), and try again.' })
    if (!r.ok) return res.status(502).json({ error: 'D&D Beyond did not answer. Please try again in a minute.' })
    const text = await r.text()
    if (text.length > MAX_BYTES) return res.status(502).json({ error: 'That character is too large to import.' })
    const body = JSON.parse(text)
    if (!body?.success || !body.data) return res.status(502).json({ error: 'D&D Beyond sent something unexpected, so the import did not work.' })
    res.json(mapCharacter(body.data))
  } catch (e) {
    const timedOut = e?.name === 'TimeoutError' || e?.name === 'AbortError'
    res.status(502).json({ error: timedOut ? 'D&D Beyond took too long to answer. Please try again.' : 'Could not read that character from D&D Beyond.' })
  }
})

export default router
