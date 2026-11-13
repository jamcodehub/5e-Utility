import test from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import jwt from 'jsonwebtoken'
import { Campaign, DMBoard, User } from '../models/index.js'
import router from './dmboard.js'

test('DM boards are private, validated, persistent, and reject stale saves', async t => {
  const originals = {
    user: User.findById, campaign: Campaign.findOne,
    load: DMBoard.findOne, save: DMBoard.findOneAndUpdate,
    secret: process.env.JWT_SECRET,
  }
  process.env.JWT_SECRET = 'test-secret'
  const owner = '507f1f77bcf86cd799439011'
  const player = '507f1f77bcf86cd799439012'
  const otherDM = '507f1f77bcf86cd799439013'
  const campaign = '507f1f77bcf86cd799439014'
  const documents = new Map()
  User.findById = id => ({ select: async () => ({ role: id === player ? 'player' : 'dm' }) })
  Campaign.findOne = query => ({ select: async () => query._id === campaign && query.owner === owner ? { _id: campaign } : null })
  DMBoard.findOne = async query => documents.get(query.campaign) || null
  DMBoard.findOneAndUpdate = async (query, update, options) => {
    const current = documents.get(query.campaign)
    if (current && current.version !== query.version) {
      if (options.upsert) throw Object.assign(new Error('duplicate key'), { code: 11000 })
      return null
    }
    if (!current && !options.upsert) return null
    const saved = { ...update.$set }
    documents.set(query.campaign, saved)
    return saved
  }
  const app = express()
  app.use(express.json())
  app.use('/dmboard', router)
  const server = await new Promise(resolve => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener))
  })
  t.after(() => {
    server.close()
    User.findById = originals.user
    Campaign.findOne = originals.campaign
    DMBoard.findOne = originals.load
    DMBoard.findOneAndUpdate = originals.save
    if (originals.secret === undefined) delete process.env.JWT_SECRET
    else process.env.JWT_SECRET = originals.secret
  })
  const request = async (id, method = 'GET', body) => {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/dmboard/${campaign}`, {
      method,
      headers: { Authorization: `Bearer ${jwt.sign({ id }, process.env.JWT_SECRET)}`, 'Content-Type': 'application/json' },
      body: body && JSON.stringify(body),
    })
    return { status: response.status, body: await response.json() }
  }
  const empty = { items: [], links: [], strokes: [], arrows: [] }
  assert.deepEqual((await request(owner)).body, { board: empty, version: 0 })
  for (const id of [player, otherDM]) {
    assert.equal((await request(id)).status, 403)
    assert.equal((await request(id, 'PUT', { board: empty, version: 0 })).status, 403)
  }
  assert.equal((await request(owner, 'PUT', { board: { ...empty, strokes: [{ id: 's', c: '#000', pts: [] }] }, version: 0 })).status, 400)
  const badShape = { ...empty, items: [{ id: 's', type: 'shape', shape: 'blob', x: 1, y: 2, w: 9, h: 9 }] }
  assert.equal((await request(owner, 'PUT', { board: badShape, version: 0 })).status, 400)
  const badArrow = { ...empty, arrows: [{ id: 'a', x1: 0, y1: 0, x2: 'far', y2: 1 }] }
  assert.equal((await request(owner, 'PUT', { board: badArrow, version: 0 })).status, 400)
  const board = {
    ...empty,
    items: [{ id: 'n', type: 'note', x: 1, y: 2, w: 220, h: 130, text: 'Secret' }, { id: 's', type: 'shape', shape: 'star', x: 5, y: 5, w: 90, h: 90 }],
    arrows: [{ id: 'a', x1: 0, y1: 0, x2: 50, y2: 50 }],
  }
  assert.deepEqual((await request(owner, 'PUT', { board, version: 0 })).body, { version: 1 })
  assert.deepEqual((await request(owner)).body, { board, version: 1 })
  assert.equal((await request(owner, 'PUT', { board: empty, version: 0 })).status, 409)
  assert.equal((await request(owner, 'PUT', { board: empty, version: 2 })).status, 409)
  assert.deepEqual((await request(owner)).body, { board, version: 1 })
  assert.deepEqual((await request(owner, 'PUT', { board: empty, version: 1 })).body, { version: 2 })
})
