import { Router } from 'express'
import mongoose from 'mongoose'
import { Campaign, DMBoard, DMBoardFolder, User } from '../models/index.js'
import { hasPremium, hasPremiumAs } from '../lib/premium.js'
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
  (item.rot === undefined || isNumber(item.rot)) && (item.fs === undefined || isNumber(item.fs)) &&
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

const FREE_BOARD_LIMIT = 1
const cleanName = (value, fallback) => (isString(value) && value.trim() ? value.trim().slice(0, 80) : fallback)
const validId = id => mongoose.isValidObjectId(id)

router.use('/:campaignId', auth, async (req, res, next) => {
  try {
    if (!validId(req.params.campaignId)) return res.status(400).json({ error: 'Invalid campaign' })
    // Access follows ownership of a real campaign plus having the DM identity, not the
    // currently active mode, so the final save still lands after switching to player.
    const [user, campaign] = await Promise.all([
      User.findById(req.userId).select('role roles isPremium premiumRole playerPremiumGrant dmPremiumGrant'),
      Campaign.findOne({ _id: req.params.campaignId, owner: req.userId, isPersonal: { $ne: true } }).select('_id'),
    ])
    const isDM = user?.role === 'dm' || (user?.roles || []).includes('dm')
    if (!isDM || !campaign) return res.status(403).json({ error: 'Only the campaign DM can access this board.' })
    req.isPremium = hasPremiumAs(user, 'dm')
    next()
  } catch (error) {
    console.error('Failed to authorize DM board:', error)
    res.status(500).json({ error: 'Failed to authorize board access' })
  }
})

const fail = (res, error, message) => {
  console.error(message, error)
  res.status(500).json({ error: message })
}

// List boards and folders. A campaign with no boards yet gets its first one.
router.get('/:campaignId', async (req, res) => {
  try {
    const campaign = req.params.campaignId
    if (!await DMBoard.exists({ campaign })) await DMBoard.create({ campaign, name: 'Main board', board: emptyBoard(), version: 0 })
    const [boards, folders] = await Promise.all([
      DMBoard.find({ campaign }).select('name folder updatedAt').sort({ createdAt: 1 }),
      DMBoardFolder.find({ campaign }).select('name').sort({ createdAt: 1 }),
    ])
    res.json({ boards, folders, premium: req.isPremium, limit: req.isPremium ? null : FREE_BOARD_LIMIT })
  } catch (error) { fail(res, error, 'Failed to load boards') }
})

router.post('/:campaignId/boards', async (req, res) => {
  try {
    const campaign = req.params.campaignId
    if (!req.isPremium && await DMBoard.countDocuments({ campaign }) >= FREE_BOARD_LIMIT) {
      return res.status(403).json({ error: 'Free DMs can have one board. Upgrade to Premium for unlimited boards.' })
    }
    let folder = null
    if (req.body?.folder) {
      if (!validId(req.body.folder) || !await DMBoardFolder.exists({ _id: req.body.folder, campaign })) return res.status(400).json({ error: 'Folder not found' })
      folder = req.body.folder
    }
    const created = await DMBoard.create({ campaign, name: cleanName(req.body?.name, 'Untitled board'), folder, board: emptyBoard(), version: 0 })
    res.json({ _id: created._id, name: created.name, folder: created.folder })
  } catch (error) { fail(res, error, 'Failed to create board') }
})

router.get('/:campaignId/boards/:boardId', async (req, res) => {
  try {
    if (!validId(req.params.boardId)) return res.status(400).json({ error: 'Invalid board' })
    const saved = await DMBoard.findOne({ _id: req.params.boardId, campaign: req.params.campaignId })
    if (!saved) return res.status(404).json({ error: 'Board not found' })
    res.json({ board: saved.board, version: saved.version, name: saved.name })
  } catch (error) { fail(res, error, 'Failed to load board') }
})

router.put('/:campaignId/boards/:boardId', async (req, res) => {
  const { board, version } = req.body || {}
  if (!validId(req.params.boardId)) return res.status(400).json({ error: 'Invalid board' })
  if (!Number.isSafeInteger(version) || version < 0 || !validBoard(board)) return res.status(400).json({ error: 'Invalid board data' })
  try {
    const saved = await DMBoard.findOneAndUpdate(
      { _id: req.params.boardId, campaign: req.params.campaignId, version },
      { $set: { board, version: version + 1 } },
      { returnDocument: 'after', runValidators: true },
    )
    if (!saved) {
      const exists = await DMBoard.exists({ _id: req.params.boardId, campaign: req.params.campaignId })
      return exists
        ? res.status(409).json({ error: 'This board was changed elsewhere. Your edits have not been saved.' })
        : res.status(404).json({ error: 'This board no longer exists. Your edits have not been saved.' })
    }
    res.json({ version: saved.version })
  } catch (error) { fail(res, error, 'Failed to save board') }
})

// Rename and/or move to a folder (folder: null moves it to the top level).
router.patch('/:campaignId/boards/:boardId', async (req, res) => {
  try {
    const campaign = req.params.campaignId
    if (!validId(req.params.boardId)) return res.status(400).json({ error: 'Invalid board' })
    const update = {}
    if (isString(req.body?.name)) update.name = cleanName(req.body.name, 'Untitled board')
    if (req.body && 'folder' in req.body) {
      if (req.body.folder !== null && (!validId(req.body.folder) || !await DMBoardFolder.exists({ _id: req.body.folder, campaign }))) return res.status(400).json({ error: 'Folder not found' })
      update.folder = req.body.folder
    }
    const saved = await DMBoard.findOneAndUpdate({ _id: req.params.boardId, campaign }, { $set: update }, { returnDocument: 'after' }).select('name folder')
    if (!saved) return res.status(404).json({ error: 'Board not found' })
    res.json({ _id: saved._id, name: saved.name, folder: saved.folder })
  } catch (error) { fail(res, error, 'Failed to update board') }
})

router.delete('/:campaignId/boards/:boardId', async (req, res) => {
  try {
    const campaign = req.params.campaignId
    if (!validId(req.params.boardId)) return res.status(400).json({ error: 'Invalid board' })
    if (await DMBoard.countDocuments({ campaign }) <= 1) return res.status(400).json({ error: 'A campaign needs at least one board.' })
    const removed = await DMBoard.findOneAndDelete({ _id: req.params.boardId, campaign })
    if (!removed) return res.status(404).json({ error: 'Board not found' })
    res.json({ ok: true })
  } catch (error) { fail(res, error, 'Failed to delete board') }
})

router.post('/:campaignId/folders', async (req, res) => {
  try {
    if (!req.isPremium) return res.status(403).json({ error: 'Folders are a Premium feature.' })
    const folder = await DMBoardFolder.create({ campaign: req.params.campaignId, name: cleanName(req.body?.name, 'New folder') })
    res.json({ _id: folder._id, name: folder.name })
  } catch (error) { fail(res, error, 'Failed to create folder') }
})

router.patch('/:campaignId/folders/:folderId', async (req, res) => {
  try {
    if (!validId(req.params.folderId)) return res.status(400).json({ error: 'Invalid folder' })
    const folder = await DMBoardFolder.findOneAndUpdate({ _id: req.params.folderId, campaign: req.params.campaignId }, { $set: { name: cleanName(req.body?.name, 'New folder') } }, { returnDocument: 'after' })
    if (!folder) return res.status(404).json({ error: 'Folder not found' })
    res.json({ _id: folder._id, name: folder.name })
  } catch (error) { fail(res, error, 'Failed to rename folder') }
})

// Deleting a folder never deletes boards; they move back to the top level.
router.delete('/:campaignId/folders/:folderId', async (req, res) => {
  try {
    const campaign = req.params.campaignId
    if (!validId(req.params.folderId)) return res.status(400).json({ error: 'Invalid folder' })
    const removed = await DMBoardFolder.findOneAndDelete({ _id: req.params.folderId, campaign })
    if (!removed) return res.status(404).json({ error: 'Folder not found' })
    await DMBoard.updateMany({ campaign, folder: removed._id }, { $set: { folder: null } })
    res.json({ ok: true })
  } catch (error) { fail(res, error, 'Failed to delete folder') }
})

export default router
