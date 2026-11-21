import test from 'node:test'
import assert from 'node:assert/strict'
import { hasPremium, hasPremiumAs, premiumRoleOf } from './premium.js'

test('premium only counts for the role it was bought for', () => {
  const player = { isPremium: true, premiumRole: 'player', role: 'player' }
  assert.equal(hasPremium(player), true)
  assert.equal(hasPremium({ ...player, role: 'dm' }), false, 'switching to DM drops player premium')
  const dm = { isPremium: true, premiumRole: 'dm', role: 'dm' }
  assert.equal(hasPremium(dm), true)
  assert.equal(hasPremium({ ...dm, role: 'player' }), false, 'and the other way round')
  assert.equal(hasPremiumAs(dm, 'dm'), true)
  assert.equal(hasPremiumAs(dm, 'player'), false)
})

test('accounts made premium before the field existed count as Player premium; free accounts never do', () => {
  assert.equal(premiumRoleOf({ isPremium: true }), 'player')
  assert.equal(hasPremium({ isPremium: true, role: 'player' }), true)
  assert.equal(hasPremium({ isPremium: true, role: 'dm' }), false)
  for (const free of [{ isPremium: false, premiumRole: 'dm', role: 'dm' }, {}, null, undefined]) assert.equal(hasPremium(free), false)
})
