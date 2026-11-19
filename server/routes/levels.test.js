import test from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import jwt from 'jsonwebtoken'
import { Campaign, LevelPlan, User } from '../models/index.js'
import router, { ALLOWED_THEMES } from './levels.js'

test('a LevelPlan keeps its theme (the schema used to drop it)', () => {
  assert.equal(new LevelPlan({ campaign: '507f1f77bcf86cd799439014', owner: '507f1f77bcf86cd799439011', title: 'x', theme: 'scifi' }).theme, 'scifi')
  assert.equal(new LevelPlan({ campaign: '507f1f77bcf86cd799439014', owner: '507f1f77bcf86cd799439011', title: 'x' }).theme, 'medieval', 'defaults to medieval')
})

test('Sci Fi is an allowed theme, a bad one is not', () => { assert.ok(ALLOWED_THEMES.includes('scifi')); assert.ok(!ALLOWED_THEMES.includes('western')) })

test('create and update store the chosen theme and ignore unknown ones', async t => {
  const patched = []
  const stub = (target, name, fn) => { patched.push([target, name, target[name]]); target[name] = fn }
  const secret = process.env.JWT_SECRET
  process.env.JWT_SECRET = 'test-secret'
  const owner = '507f1f77bcf86cd799439011', campaign = '507f1f77bcf86cd799439014'
  let created = null, updated = null
  // used both directly (`await Campaign.findById(id)`) and chained (`.select(...)` in the membership check)
  stub(Campaign, 'findById', () => ({ owner, members: [], select: async () => ({ owner, members: [] }), then: resolve => resolve({ owner }) }))
  stub(User, 'findById', async () => ({ isPremium: true }))
  stub(LevelPlan, 'create', async doc => { created = doc; return doc })
  stub(LevelPlan, 'findOneAndUpdate', async (_q, update) => { updated = update; return update })
  const app = express()
  app.use(express.json())
  app.use('/levels', router)
  const server = await new Promise(resolve => { const l = app.listen(0, '127.0.0.1', () => resolve(l)) })
  t.after(() => {
    server.close()
    patched.reverse().forEach(([target, name, original]) => { target[name] = original })
    if (secret === undefined) delete process.env.JWT_SECRET
    else process.env.JWT_SECRET = secret
  })
  const req = (method, path, body) => fetch(`http://127.0.0.1:${server.address().port}/levels${path}`, {
    method, headers: { Authorization: `Bearer ${jwt.sign({ id: owner }, process.env.JWT_SECRET)}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  })
  // isMember checks the campaign; make it pass by stubbing the membership lookup through Campaign.findOne/findById above
  const post = await req('POST', `/${campaign}`, { title: 'Map', content: '{}', theme: 'scifi' })
  assert.equal(post.status, 200); assert.equal(created.theme, 'scifi')
  await req('POST', `/${campaign}`, { title: 'Map', content: '{}', theme: 'western' }); assert.equal(created.theme, 'medieval', 'unknown theme falls back')
  await req('PUT', '/507f1f77bcf86cd799439099', { theme: 'scifi' }); assert.equal(updated.theme, 'scifi')
  updated = null; await req('PUT', '/507f1f77bcf86cd799439099', { theme: 'hacked' }); assert.equal(updated.theme, undefined, 'unknown theme is not stored')
})
