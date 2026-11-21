import test from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import jwt from 'jsonwebtoken'
import { Campaign, BattleState, User } from '../models/index.js'
import router, { cleanState } from './battle.js'

const goblin = { id: 'srd-goblin-1', name: 'Goblin 1', type: 'enemy', source: 'srd', hp: 7, maxHp: 7, ac: 15, init: 12, initBonus: 2,
  attacks: [{ name: 'Scimitar', bonus: 4, dmg: '1d6+2', type: 'slashing' }], sheet: { line: 'Small humanoid · CR 1/4', speed: '30 ft.', abil: [8, 14, 10, 10, 8, 8] } }

test('cleanState keeps known fields, drops junk and rejects invalid battles', () => {
  const ok = cleanState({ combatants: [{ ...goblin, evil: '<script>', $set: 1 }], turnId: goblin.id, round: 3, log: ['a', 5, 'b'] })
  assert.deepEqual(ok.combatants[0], { ...goblin, avatar: null, attacks: goblin.attacks })
  assert.equal(ok.turnId, goblin.id); assert.equal(ok.round, 3); assert.deepEqual(ok.log, ['a', 'b'])
  assert.equal(cleanState({ combatants: [goblin], turnId: 'ghost', round: 0 }).turnId, null)
  assert.equal(cleanState({ combatants: [goblin], round: -4 }).round, 1)
  for (const bad of [null, 'x', {}, { combatants: 'no' }, { combatants: [{ ...goblin, type: 'dragon' }] }, { combatants: [{ ...goblin, source: 'x' }] },
    { combatants: [{ ...goblin, name: '' }] }, { combatants: [goblin, goblin] }, { combatants: Array.from({ length: 61 }, (_, i) => ({ ...goblin, id: `g${i}` })) }])
    assert.equal(cleanState(bad), null, JSON.stringify(bad)?.slice(0, 60))
  assert.equal(cleanState({ combatants: [{ ...goblin, avatar: 'javascript:alert(1)' }] }).combatants[0].avatar, null)
  assert.deepEqual(cleanState({ combatants: [{ ...goblin, attacks: [{ name: 'x' }, { name: 'ok', dmg: '1d4' }] }] }).combatants[0].attacks, [{ name: 'ok', bonus: 0, dmg: '1d4' }])
})

test('the battle is private to the campaign DM and round-trips', async t => {
  const patched = []
  const stub = (target, name, fn) => { patched.push([target, name, target[name]]); target[name] = fn }
  const secret = process.env.JWT_SECRET
  process.env.JWT_SECRET = 'test-secret'
  const owner = '507f1f77bcf86cd799439011', player = '507f1f77bcf86cd799439012', otherDM = '507f1f77bcf86cd799439013'
  const campaign = '507f1f77bcf86cd799439014'
  let stored = null
  stub(User, 'findById', id => ({ select: async () => ({ role: id === player ? 'player' : 'dm', roles: [] }) }))
  stub(Campaign, 'findOne', query => ({ select: async () => (query._id === campaign && query.owner === owner ? { _id: campaign } : null) }))
  stub(BattleState, 'findOne', () => ({ select: async () => (stored ? { state: stored } : null) }))
  stub(BattleState, 'findOneAndUpdate', async (_q, update) => { stored = update.$set.state })

  const app = express()
  app.use(express.json())
  app.use('/battle', router)
  const server = await new Promise(resolve => { const l = app.listen(0, '127.0.0.1', () => resolve(l)) })
  t.after(() => {
    server.close()
    patched.reverse().forEach(([target, name, original]) => { target[name] = original })
    if (secret === undefined) delete process.env.JWT_SECRET
    else process.env.JWT_SECRET = secret
  })
  const request = async (id, method, body) => {
    const r = await fetch(`http://127.0.0.1:${server.address().port}/battle/${campaign}`, {
      method, headers: { Authorization: `Bearer ${jwt.sign({ id }, process.env.JWT_SECRET)}`, 'Content-Type': 'application/json' }, body: body && JSON.stringify(body),
    })
    return { status: r.status, body: await r.json() }
  }

  for (const id of [player, otherDM]) {
    assert.equal((await request(id, 'GET')).status, 403)
    assert.equal((await request(id, 'PUT', { state: { combatants: [] } })).status, 403)
  }
  assert.deepEqual((await request(owner, 'GET')).body, { state: null })
  assert.equal((await request(owner, 'PUT', { state: { combatants: 'nope' } })).status, 400)
  assert.equal(stored, null, 'an invalid battle is never stored')
  assert.equal((await request(owner, 'PUT', { state: { combatants: [goblin], turnId: goblin.id, round: 2, log: ['Round 2'] } })).status, 200)
  const back = (await request(owner, 'GET')).body.state
  assert.equal(back.round, 2); assert.equal(back.turnId, goblin.id); assert.equal(back.combatants[0].init, 12); assert.deepEqual(back.log, ['Round 2'])
})
