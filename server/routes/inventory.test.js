import test from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import jwt from 'jsonwebtoken'
import { Campaign, Inventory } from '../models/index.js'
import router from './inventory.js'

test('inventory routes require auth, membership, and ignore client-set ownership fields', async t => {
  const patched = []
  const stub = (target, name, fn) => { patched.push([target, name, target[name]]); target[name] = fn }
  const secret = process.env.JWT_SECRET
  process.env.JWT_SECRET = 'test-secret'
  const member = '507f1f77bcf86cd799439011', outsider = '507f1f77bcf86cd799439012'
  const campaign = '507f1f77bcf86cd799439014'
  let lastUpdate = null
  stub(Campaign, 'findById', () => ({ select: async () => ({ owner: member, members: [] }) }))
  stub(Inventory, 'findOne', async () => null)
  stub(Inventory, 'create', async doc => ({ _id: 'inv1', ...doc }))
  stub(Inventory, 'findOneAndUpdate', async (query, update) => { lastUpdate = { query, update }; return { _id: 'inv1', ...update.$set } })

  const app = express()
  app.use(express.json())
  app.use('/inventory', router)
  const server = await new Promise(resolve => { const l = app.listen(0, '127.0.0.1', () => resolve(l)) })
  t.after(() => {
    server.close()
    patched.reverse().forEach(([target, name, original]) => { target[name] = original })
    if (secret === undefined) delete process.env.JWT_SECRET
    else process.env.JWT_SECRET = secret
  })
  const request = (id, method, body) => fetch(`http://127.0.0.1:${server.address().port}/inventory/${campaign}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(id ? { Authorization: `Bearer ${jwt.sign({ id }, 'test-secret')}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  assert.equal((await request(null, 'GET')).status, 401)

  // Non-member: campaign owner is `member`, `outsider` is neither owner nor in members.
  assert.equal((await request(outsider, 'GET')).status, 403)
  assert.equal((await request(outsider, 'PUT', { items: [] })).status, 403)

  // Member GET auto-creates an empty inventory.
  const got = await request(member, 'GET')
  assert.equal(got.status, 200)
  const gotBody = await got.json()
  assert.deepEqual(gotBody.items, [])
  assert.equal(gotBody.currency.gp, 0)

  // PUT never lets the client reassign campaign/owner/_id.
  const put = await request(member, 'PUT', { campaign: 'evil', owner: 'evil', _id: 'evil', currency: { gp: 5 } })
  assert.equal(put.status, 200)
  assert.deepEqual(lastUpdate.query, { campaign, owner: member })
  assert.equal('campaign' in lastUpdate.update.$set, false)
  assert.equal('owner' in lastUpdate.update.$set, false)
  assert.equal('_id' in lastUpdate.update.$set, false)
  assert.deepEqual(lastUpdate.update.$set.currency, { gp: 5 })
})
