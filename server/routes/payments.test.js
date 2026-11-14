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
  let graceActive = false
  const mails = []
  stub(User, 'findOneAndUpdate', async (q, u) => {
    updates.push(['one', q, u])
    if (u.graceEndsAt instanceof Date) {
      if (graceActive) return null // grace already running: startGrace is a no-op
      return { email: 'a@b.c', graceEndsAt: u.graceEndsAt }
    }
  })
  process.env.SMTP_HOST = 'smtp.test'
  const mailer = await import('../lib/mailer.js')
  stub(mailer.getTransport(), 'sendMail', async m => { mails.push(m) })

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
  assert.deepEqual(updates.at(-1), ['byId', userId, { isPremium: true, stripeSubId: 'sub_1', graceEndsAt: null, graceReminderSent: false }])

  const deleted = await webhook({ type: 'customer.subscription.deleted', data: { object: { id: 'sub_1' } } })
  assert.equal(deleted.status, 200)
  assert.deepEqual(updates.at(-1), ['one', { stripeSubId: 'sub_1' }, { isPremium: false, stripeSubId: '', graceEndsAt: null, graceReminderSent: false }])

  const ignored = await webhook({ type: 'charge.succeeded', data: { object: {} } })
  assert.equal(ignored.status, 200)
  assert.equal(updates.length, 2)

  // Failed payment: premium stays on, a 5-day grace period starts, user is emailed once.
  const before = updates.length
  const failed = await webhook({ type: 'invoice.payment_failed', data: { object: { subscription: 'sub_1' } } })
  assert.equal(failed.status, 200)
  assert.equal(updates.length, before + 1)
  const [kind, query, change] = updates.at(-1)
  assert.equal(kind, 'one')
  assert.equal(query.stripeSubId, 'sub_1')
  assert.equal(change.isPremium, true)
  const days = (change.graceEndsAt.getTime() - Date.now()) / 86400000
  assert.ok(days > 4.99 && days <= 5, `grace is 5 days, got ${days}`)
  assert.equal(mails.length, 1)
  assert.equal(mails[0].to, 'a@b.c')
  assert.match(mails[0].subject, /payment failed/)

  // Repeat failure inside the grace period: no second grace period, no second email.
  graceActive = true
  await webhook({ type: 'invoice.payment_failed', data: { object: { subscription: 'sub_1' } } })
  assert.equal(mails.length, 1)

  // Payment later succeeds: grace cleared.
  await webhook({ type: 'invoice.paid', data: { object: { subscription: 'sub_1' } } })
  assert.deepEqual(updates.at(-1), ['one', { stripeSubId: 'sub_1' }, { graceEndsAt: null, graceReminderSent: false, isPremium: true }])

  // Subscription status changes.
  await webhook({ type: 'customer.subscription.updated', data: { object: { id: 'sub_1', status: 'active' } } })
  assert.deepEqual(updates.at(-1)[2], { graceEndsAt: null, graceReminderSent: false, isPremium: true })
  await webhook({ type: 'customer.subscription.updated', data: { object: { id: 'sub_1', status: 'unpaid' } } })
  assert.deepEqual(updates.at(-1)[2], { isPremium: false, graceEndsAt: null, graceReminderSent: false })
})
