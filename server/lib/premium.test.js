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

test('plan flags say Player Premium and DM Premium plainly', async () => {
  const { planFlags } = await import('./premium.js')
  assert.deepEqual(planFlags({ isPremium: true, premiumRole: 'player' }), { isPlayerPremium: true, isDmPremium: false })
  assert.deepEqual(planFlags({ isPremium: true, premiumRole: '' }), { isPlayerPremium: true, isDmPremium: false }, 'an older account with no plan written is Player')
  assert.deepEqual(planFlags({ isPremium: true, premiumRole: 'dm' }), { isPlayerPremium: true, isDmPremium: true }, 'DM Premium includes Player Premium')
  assert.deepEqual(planFlags({ isPremium: false, premiumRole: 'dm' }), { isPlayerPremium: false, isDmPremium: false }, 'no subscription, no plan')
  assert.deepEqual(planFlags(null), { isPlayerPremium: false, isDmPremium: false })
})

test('older paying accounts are stamped Player Premium, nobody else is touched', async () => {
  const { stampLegacyPlans } = await import('./premium.js')
  let seen
  const User = { updateMany: async (filter, update) => { seen = { filter, update }; return { modifiedCount: 3 } } }
  assert.equal(await stampLegacyPlans(User), 3)
  assert.deepEqual(seen.filter, { isPremium: true, premiumRole: { $in: ['', null] } }, 'only paying accounts with no plan written')
  assert.deepEqual(seen.update, { premiumRole: 'player' })
  assert.equal(await stampLegacyPlans({ updateMany: async () => ({}) }), 0)
})

test('by-hand grants: DM grant covers both sides, Player grant only the player side, and neither needs Stripe', () => {
  const dmGrant = { dmPremiumGrant: true, isPremium: false, role: 'player' }
  assert.equal(hasPremiumAs(dmGrant, 'dm'), true)
  assert.equal(hasPremiumAs(dmGrant, 'player'), true)
  assert.equal(hasPremium({ ...dmGrant, role: 'dm' }), true)
  const playerGrant = { playerPremiumGrant: true }
  assert.equal(hasPremiumAs(playerGrant, 'player'), true)
  assert.equal(hasPremiumAs(playerGrant, 'dm'), false)
  assert.equal(hasPremiumAs({ playerPremiumGrant: false, dmPremiumGrant: false }, 'dm'), false)
})
