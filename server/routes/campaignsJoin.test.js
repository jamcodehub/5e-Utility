import test from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import jwt from 'jsonwebtoken'
import { Campaign, User } from '../models/index.js'
import router from './campaigns.js'

test('a DM using their own campaign code is recorded as a member, so it stays in the player list', async t => {
  const patched = []
  const stub = (target, name, fn) => { patched.push([target, name, target[name]]); target[name] = fn }
  const secret = process.env.JWT_SECRET
  process.env.JWT_SECRET = 'test-secret'
  const owner = '507f1f77bcf86cd799439011', other = '507f1f77bcf86cd799439012'
  const doc = { _id: '507f1f77bcf86cd799439014', owner, members: [], pendingMembers: [], saved: 0, async save() { this.saved += 1 } }
  stub(Campaign, 'findOne', async () => doc)
  stub(User, 'findById', async () => ({ role: 'player', isPremium: false }))
  stub(Campaign, 'countDocuments', async () => 0)
  const app = express()
  app.use(express.json())
  app.use('/campaigns', router)
  const server = await new Promise(resolve => { const l = app.listen(0, '127.0.0.1', () => resolve(l)) })
  t.after(() => {
    server.close()
    patched.reverse().forEach(([target, name, original]) => { target[name] = original })
    if (secret === undefined) delete process.env.JWT_SECRET
    else process.env.JWT_SECRET = secret
  })
  const join = (id) => fetch(`http://127.0.0.1:${server.address().port}/campaigns/join`, {
    method: 'POST', headers: { Authorization: `Bearer ${jwt.sign({ id }, process.env.JWT_SECRET)}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ code: 'abc123' }),
  }).then(async r => ({ status: r.status, body: await r.json() }))

  const mine = await join(owner)
  assert.equal(mine.status, 200); assert.equal(mine.body.pending, false)
  assert.deepEqual(doc.members.map(String), [owner], 'the owner is now a member')
  assert.equal(doc.saved, 1)
  await join(owner)
  assert.equal(doc.members.length, 1, 'joining twice does not add them twice'); assert.equal(doc.saved, 1)

  // someone else still needs approval, and is not added to the members
  const theirs = await join(other)
  assert.equal(theirs.body.pending, true)
  assert.deepEqual(doc.members.map(String), [owner]); assert.deepEqual(doc.pendingMembers.map(String), [other])
})
