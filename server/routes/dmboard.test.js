import test from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import jwt from 'jsonwebtoken'
import { Campaign, DMBoard, DMBoardFolder, User } from '../models/index.js'
import router from './dmboard.js'

test('DM boards are private, limited for free DMs, validated and conflict-checked', async t => {
  const patched = []
  const stub = (target, name, fn) => { patched.push([target, name, target[name]]); target[name] = fn }
  const secret = process.env.JWT_SECRET
  process.env.JWT_SECRET = 'test-secret'
  const owner = '507f1f77bcf86cd799439011', player = '507f1f77bcf86cd799439012', otherDM = '507f1f77bcf86cd799439013', premiumDM = '507f1f77bcf86cd799439015', playerPremiumDM = '507f1f77bcf86cd799439016'
  const campaign = '507f1f77bcf86cd799439014'
  let boardCount = 1
  let currentVersion = 0
  stub(User, 'findById', id => ({ select: async () => ({ role: id === player ? 'player' : 'dm', roles: [], isPremium: id === premiumDM || id === playerPremiumDM, premiumRole: id === premiumDM ? 'dm' : id === playerPremiumDM ? 'player' : '' }) }))
  stub(Campaign, 'findOne', query => ({ select: async () => (query._id === campaign && (query.owner === owner || query.owner === premiumDM || query.owner === playerPremiumDM) ? { _id: campaign } : null) }))
  stub(DMBoard, 'countDocuments', async () => boardCount)
  stub(DMBoard, 'create', async doc => { boardCount += 1; return { _id: '507f1f77bcf86cd799439099', ...doc } })
  stub(DMBoard, 'findOneAndUpdate', async (query, update) => {
    if (query.version !== currentVersion) return null
    currentVersion = update.$set.version
    return { version: currentVersion }
  })
  stub(DMBoard, 'exists', async () => true)
  stub(DMBoardFolder, 'create', async doc => ({ _id: '507f1f77bcf86cd799439098', ...doc }))

  const app = express()
  app.use(express.json())
  app.use('/dmboard', router)
  const server = await new Promise(resolve => { const l = app.listen(0, '127.0.0.1', () => resolve(l)) })
  t.after(() => {
    server.close()
    patched.reverse().forEach(([target, name, original]) => { target[name] = original })
    if (secret === undefined) delete process.env.JWT_SECRET
    else process.env.JWT_SECRET = secret
  })
  const request = async (id, method, path, body) => {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/dmboard/${campaign}${path}`, {
      method,
      headers: { Authorization: `Bearer ${jwt.sign({ id }, process.env.JWT_SECRET)}`, 'Content-Type': 'application/json' },
      body: body && JSON.stringify(body),
    })
    return { status: response.status, body: await response.json() }
  }
  const empty = { items: [], links: [], strokes: [], arrows: [] }
  const boardPath = '/boards/507f1f77bcf86cd799439016'

  for (const id of [player, otherDM]) {
    assert.equal((await request(id, 'POST', '/boards', { name: 'x' })).status, 403)
    assert.equal((await request(id, 'PUT', boardPath, { board: empty, version: 0 })).status, 403)
  }
  assert.equal((await request(owner, 'POST', '/boards', { name: 'Second' })).status, 403, 'free DM is limited to one board')
  assert.equal((await request(owner, 'POST', '/folders', { name: 'Acts' })).status, 403, 'folders need Premium')
  assert.equal((await request(playerPremiumDM, 'POST', '/boards', { name: 'Second' })).status, 403, 'Player premium does not unlock DM tools')
  assert.equal((await request(premiumDM, 'POST', '/boards', { name: 'Second' })).status, 200)
  assert.equal((await request(premiumDM, 'POST', '/folders', { name: 'Acts' })).status, 200)

  const bad = { ...empty, items: [{ id: 's', type: 'shape', shape: 'blob', x: 1, y: 2, w: 9, h: 9 }] }
  assert.equal((await request(owner, 'PUT', boardPath, { board: bad, version: 0 })).status, 400)
  const board = { ...empty, items: [{ id: 'n', type: 'note', x: 1, y: 2, w: 220, h: 130, rot: 15, text: 'Secret' }] }
  assert.deepEqual((await request(owner, 'PUT', boardPath, { board, version: 0 })).body, { version: 1 })
  assert.equal((await request(owner, 'PUT', boardPath, { board, version: 0 })).status, 409)
})
