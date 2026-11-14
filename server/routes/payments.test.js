import test from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import jwt from 'jsonwebtoken'

// payments.js constructs the Stripe client at import time.
process.env.STRIPE_SECRET_KEY ||= 'sk_test_dummy'
const { User } = await import('../models/index.js')
const { default: router } = await import('./payments.js')
const { default: Stripe } = await import('stripe')

test('payments: auth, portal guard, and webhook signature + premium updates', async t => {
  const patched = []
  const stub = (target, name, fn) => { patched.push([target, name, target[name]]); target[name] = fn }
  const saved = { jwt: process.env.JWT_SECRET, wh: process.env.STRIPE_WEBHOOK_SECRET }
  process.env.JWT_SECRET = 'test-secret'
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test'
  const userId = '507f1f77bcf86cd799439011'
  const updates = []
  stub(User, 'findById', async () => ({ email: 'a@b.c', username: 'u', stripeCustomerId: '' }))
  stub(User, 'findByIdAndUpdate', async (id, u) => { updates.push(['byId', id, u]) })
  stub(User, 'findOneAndUpdate', async (q, u) => { updates.push(['one', q, u]) })

  const app = express()
  app.use('/api/payments/webhook', express.raw({ type: 'application/json', verify: (req, res, buf) => { req.rawBody = buf } }))
  app.use(express.json())
  app.use('/api/payments', router)
  const server = await new Promise(resolve => { const l = app.listen(0, '127.0.0.1', () => resolve(l)) })
  t.after(() => {
    server.close()
    patched.reverse().forEach(([target, name, original]) => { target[name] = original })
    if (saved.jwt === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = saved.jwt
    if (saved.wh === undefined) delete process.env.STRIPE_WEBHOOK_SECRET; else process.env.STRIPE_WEBHOOK_SECRET = saved.wh
  })
  const base = `http://127.0.0.1:${server.address().port}/api/payments`
  const bearer = () => ({ Authorization: `Bearer ${jwt.sign({ id: userId }, 'test-secret')}` })
  const webhook = (event, signed = true) => {
    const payload = JSON.stringify(event)
    const header = signed
      ? new Stripe('sk_test_dummy').webhooks.generateTestHeaderString({ payload, secret: 'whsec_test' })
      : 'bad'
    return fetch(`${base}/webhook`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'stripe-signature': header }, body: payload })
  }

  assert.equal((await fetch(`${base}/checkout`, { method: 'POST' })).status, 401)
  assert.equal((await fetch(`${base}/portal`, { method: 'POST' })).status, 401)
  assert.equal((await fetch(`${base}/portal`, { method: 'POST', headers: bearer() })).status, 400)

  assert.equal((await webhook({ type: 'checkout.session.completed' }, false)).status, 400)
  assert.equal(updates.length, 0)

  const completed = await webhook({ type: 'checkout.session.completed', data: { object: { metadata: { userId }, subscription: 'sub_1' } } })
  assert.equal(completed.status, 200)
  assert.deepEqual(updates.at(-1), ['byId', userId, { isPremium: true, stripeSubId: 'sub_1' }])

  const deleted = await webhook({ type: 'customer.subscription.deleted', data: { object: { id: 'sub_1' } } })
  assert.equal(deleted.status, 200)
  assert.deepEqual(updates.at(-1), ['one', { stripeSubId: 'sub_1' }, { isPremium: false, stripeSubId: '' }])

  const ignored = await webhook({ type: 'invoice.paid', data: { object: {} } })
  assert.equal(ignored.status, 200)
  assert.equal(updates.length, 2)
})
