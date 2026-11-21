import test from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import jwt from 'jsonwebtoken'
import { Campaign, Character, User } from '../models/index.js'
import router from './campaigns.js'

test('a DM removes a player only by typing their character name (username if none), and keeps their characters', async t => {
  const patched = []
  const stub = (target, name, fn) => { patched.push([target, name, target[name]]); target[name] = fn }
  const secret = process.env.JWT_SECRET
  process.env.JWT_SECRET = 'test-secret'
  const dm = '507f1f77bcf86cd799439011', p1 = '507f1f77bcf86cd799439012', p2 = '507f1f77bcf86cd799439013', stranger = '507f1f77bcf86cd799439019'
  const id = '507f1f77bcf86cd799439014'
  const doc = { _id: id, owner: dm, members: [p1, p2, dm], saved: 0, async save() { this.saved += 1 } }
  const chars = { [p1]: [{ name: 'Brannoc', isPrimary: true }], [p2]: [], [dm]: [{ name: 'Test Hero', isPrimary: false }] }
  const deleted = []
  stub(Campaign, 'findOne', async q => (String(q.owner) === dm && String(q._id) === id ? doc : null))
  stub(Character, 'find', async q => chars[String(q.owner)] || [])
  stub(Character, 'deleteMany', async q => { deleted.push(q) })
  stub(User, 'findById', userId => ({ select: async () => ({ username: userId === p2 ? 'Quietplayer' : 'x' }) }))
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
  const remove = (as, target, confirmName) => fetch(`http://127.0.0.1:${server.address().port}/campaigns/${id}/members/${target}`, {
    method: 'DELETE', headers: { Authorization: `Bearer ${jwt.sign({ id: as }, process.env.JWT_SECRET)}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ confirmName }),
  }).then(async r => ({ status: r.status, body: await r.json() }))

  assert.equal((await remove(stranger, p1, 'Brannoc')).status, 403, 'only the DM can remove players')
  assert.equal((await remove(p1, p1, 'Brannoc')).status, 403, 'a player cannot remove themselves this way (they use Leave)')
  assert.equal((await remove(dm, p1, 'brannoc')).status, 400, 'the name is case-sensitive')
  assert.equal((await remove(dm, p1, '')).status, 400)
  assert.equal((await remove(dm, p1, 'Quietplayer')).status, 400, 'the username does not work when they have a character')
  assert.equal(doc.members.length, 3); assert.equal(doc.saved, 0)

  assert.equal((await remove(dm, p1, 'Brannoc')).status, 200)
  assert.deepEqual(doc.members.map(String), [p2, dm])
  assert.equal((await remove(dm, p1, 'Brannoc')).status, 404, 'already gone')
  assert.equal((await remove(dm, p2, 'Quietplayer')).status, 200, 'no character: the username is the name to type')
  assert.equal((await remove(dm, dm, 'Test Hero')).status, 200, 'the DM can remove their own placeholder player')
  assert.deepEqual(doc.members.map(String), [])
  assert.equal(String(doc.owner), dm, 'ownership is untouched')
  assert.deepEqual(deleted, [], 'characters are never deleted')
})
