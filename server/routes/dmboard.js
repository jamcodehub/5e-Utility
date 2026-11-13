import { Router } from 'express'
import mongoose from 'mongoose'
import { Campaign, DMBoard, User } from '../models/index.js'
import { auth } from './campaigns.js'

const router = Router()
const emptyBoard = () => ({ items: [], links: [], strokes: [], arrows: [] })
const ITEM_TYPES = ['npc', 'location', 'encounter', 'loot', 'note', 'text', 'image', 'shape']
const SHAPE_KINDS = ['rect', 'ellipse', 'diamond', 'triangle', 'star']
const isString = value => typeof value === 'string'
const isNumber = value => typeof value === 'number' && Number.isFinite(value)
const validItem = item =>
  item && isString(item.id) && ITEM_TYPES.includes(item.type) &&
  isNumber(item.x) && isNumber(item.y) && isNumber(item.w) && item.w > 0 && isNumber(item.h) && item.h > 0 &&
  (item.title === undefined || isString(item.title)) && (item.text === undefined || isString(item.text)) &&
  (item.type !== 'shape' || SHAPE_KINDS.includes(item.shape)) &&
  (item.type !== 'image' || (isString(item.src) && /^data:image\/(?:jpeg|png|webp);base64,/.test(item.src)))
const validBoard = board => {
  if (!board || !Array.isArray(board.items) || !Array.isArray(board.links) || !Array.isArray(board.strokes)) return false
  if (board.arrows !== undefined && !Array.isArray(board.arrows)) return false
  return board.items.every(validItem) &&
    board.links.every(link => link && isString(link.id) && isString(link.from) && isString(link.to)) &&
    (board.arrows || []).every(arrow => arrow && isString(arrow.id) && [arrow.x1, arrow.y1, arrow.x2, arrow.y2].every(isNumber)) &&
    board.strokes.every(stroke => stroke && isString(stroke.id) && isString(stroke.c) && Array.isArray(stroke.pts) &&
      stroke.pts.length > 0 && stroke.pts.every(point => Array.isArray(point) && point.length === 2 && point.every(isNumber)))
}

router.use('/:campaignId', auth, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.campaignId)) return res.status(400).json({ error: 'Invalid campaign' })
    const [user, campaign] = await Promise.all([
      User.findById(req.userId).select('role'),
      Campaign.findOne({ _id: req.params.campaignId, owner: req.userId }).select('_id'),
    ])
    if (user?.role !== 'dm' || !campaign) return res.status(403).json({ error: 'Only the campaign DM can access this board.' })
    next()
  } catch (error) {
    console.error('Failed to authorize DM board:', error)
    res.status(500).json({ error: 'Failed to authorize board access' })
  }
})

router.get('/:campaignId', async (req, res) => {
  try {
    const saved = await DMBoard.findOne({ campaign: req.params.campaignId })
    res.json(saved ? { board: saved.board, version: saved.version } : { board: emptyBoard(), version: 0 })
  } catch (error) {
    console.error('Failed to load DM board:', error)
    res.status(500).json({ error: 'Failed to load board' })
  }
})

router.put('/:campaignId', async (req, res) => {
  const { board, version } = req.body || {}
  if (!Number.isSafeInteger(version) || version < 0 || !validBoard(board)) {
    return res.status(400).json({ error: 'Invalid board data' })
  }
  try {
    const saved = await DMBoard.findOneAndUpdate(
      { campaign: req.params.campaignId, version },
      { $set: { board, version: version + 1 }, $setOnInsert: { campaign: req.params.campaignId } },
      { returnDocument: 'after', upsert: version === 0, runValidators: true },
    )
    if (!saved) return res.status(409).json({ error: 'This board was changed elsewhere. Your edits have not been saved.' })
    res.json({ version: saved.version })
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ error: 'This board was changed elsewhere. Your edits have not been saved.' })
    console.error('Failed to save DM board:', error)
    res.status(500).json({ error: 'Failed to save board' })
  }
})

export default router
