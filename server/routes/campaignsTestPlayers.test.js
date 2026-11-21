import test from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import jwt from 'jsonwebtoken'
import { Campaign, Character, User } from '../models/index.js'
import router from './campaigns.js'

test('a DM adds test players: a placeholder account that cannot sign in, plus a ready-made character; capped at four', async t => {
  const patched = []
  const stub = (target, name, fn) => { patched.push([target, name, target[name]]); target[name] = fn }
  const secret = process.env.JWT_SECRET
  process.env.JWT_SECRET = 'test-secret'
  const dm = '507f1f77bcf86cd799439011', stranger = '507f1f77bcf86cd799439019', id = '507f1f77bcf86cd799439014'
  const doc = { _id: id, owner: dm, members: [], saved: 0, async save() { this.saved += 1 } }
  const users = [], chars = []
  stub(Campaign, 'findOne', async q => (String(q.owner) === dm && String(q._id) === id ? doc : null))
  stub(User, 'countDocuments', async () => users.length)
  stub(User, 'create', async d => { const u = { _id: `507f1f77bcf86cd7994399a${users.length}`, ...d }; users.push(u); return u })
  stub(Character, 'create', async d => { chars.push(d); return d })
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
  const add = (as, body) => fetch(`http://127.0.0.1:${server.address().port}/campaigns/${id}/test-players`, {
    method: 'POST', headers: { Authorization: `Bearer ${jwt.sign({ id: as }, process.env.JWT_SECRET)}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  }).then(async r => ({ status: r.status, body: await r.json() }))

  assert.equal((await add(stranger, { classId: 'wizard' })).status, 403, 'only the DM')
  const first = await add(dm, { name: 'Pip', classId: 'wizard', level: 3 })
  assert.equal(first.status, 200); assert.equal(first.body.isTest, true)
  const u = users[0]
  assert.equal(u.password, undefined, 'no password, so it can never sign in')
  assert.ok(u.email.endsWith('@placeholder.invalid'))
  assert.equal(String(u.placeholderOf), dm); assert.equal(String(u.placeholderCampaign), id); assert.equal(u.role, 'player')
  assert.equal(chars[0].name, 'Pip'); assert.equal(chars[0].class, 'Wizard'); assert.equal(chars[0].level, 3)
  assert.equal(String(chars[0].owner), u._id); assert.equal(chars[0].isPrimary, true); assert.equal(String(chars[0].campaign), id)
  assert.deepEqual(doc.members, [u._id], 'they are a member of the campaign'); assert.equal(doc.saved, 1)

  for (let i = 0; i < 3; i++) assert.equal((await add(dm, {})).status, 200)
  const fifth = await add(dm, {})
  assert.equal(fifth.status, 400); assert.match(fifth.body.error, /up to 4/)
  assert.equal(users.length, 4)
})
