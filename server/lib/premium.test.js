import test from 'node:test'
import assert from 'node:assert/strict'
import { hasPremium, hasPremiumAs, premiumRoleOf, priceFor, planForPrice } from './premium.js'

test('Player premium covers the player side only', () => {
  const player = { isPremium: true, premiumRole: 'player', role: 'player' }
  assert.equal(hasPremium(player), true)
  assert.equal(hasPremium({ ...player, role: 'dm' }), false, 'switching to DM drops player premium')
  assert.equal(hasPremiumAs(player, 'dm'), false)
  assert.equal(hasPremiumAs(player, 'player'), true)
})

test('DM premium includes Player premium, in either role', () => {
  const dm = { isPremium: true, premiumRole: 'dm', role: 'dm' }
  assert.equal(hasPremium(dm), true)
  assert.equal(hasPremium({ ...dm, role: 'player' }), true, 'a DM subscriber is premium as a player too')
  assert.equal(hasPremiumAs(dm, 'dm'), true)
  assert.equal(hasPremiumAs(dm, 'player'), true)
})

test('accounts made premium before the field existed count as Player premium; free accounts never do', () => {
  assert.equal(premiumRoleOf({ isPremium: true }), 'player')
  assert.equal(hasPremium({ isPremium: true, role: 'player' }), true)
  assert.equal(hasPremium({ isPremium: true, role: 'dm' }), false)
  for (const free of [{ isPremium: false, premiumRole: 'dm', role: 'dm' }, {}, null, undefined]) {
    assert.equal(hasPremium(free), false); assert.equal(hasPremiumAs(free, 'player'), false)
  }
})

test('prices: one per plan, the old single price is only a fallback, and prices map back to plans', () => {
  const env = { STRIPE_PRICE_ID_PLAYER: 'price_p', STRIPE_PRICE_ID_DM: 'price_d', STRIPE_PRICE_ID: 'price_old' }
  assert.equal(priceFor('player', env), 'price_p'); assert.equal(priceFor('dm', env), 'price_d')
  assert.equal(priceFor('dm', { STRIPE_PRICE_ID: 'price_old' }), 'price_old')
  assert.equal(planForPrice('price_d', env), 'dm'); assert.equal(planForPrice('price_p', env), 'player')
  assert.equal(planForPrice('price_old', env), null); assert.equal(planForPrice('', env), null); assert.equal(planForPrice(undefined, env), null)
})
