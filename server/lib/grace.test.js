import test from 'node:test'
import assert from 'node:assert/strict'

const { User } = await import('../models/index.js')
process.env.SMTP_HOST = 'smtp.test'
const mailer = await import('./mailer.js')
const { runGraceSweep, GRACE_MS } = await import('./grace.js')

test('grace sweep: reminds once inside the last day, expires premium after 5 days', async t => {
  const now = Date.now()
  const mails = []
  const calls = []
  const orig = { find: User.find, updateOne: User.updateOne, updateMany: User.updateMany, send: mailer.getTransport().sendMail }
  t.after(() => { User.find = orig.find; User.updateOne = orig.updateOne; User.updateMany = orig.updateMany; mailer.getTransport().sendMail = orig.send })
  User.find = async q => { calls.push(['find', q]); return [{ _id: 'u1', email: 'a@b.c', graceEndsAt: new Date(now + 3600e3) }] }
  User.updateOne = async (q, u) => { calls.push(['updateOne', q, u]) }
  User.updateMany = async (q, u) => { calls.push(['updateMany', q, u]) }
  mailer.getTransport().sendMail = async m => { mails.push(m) }

  await runGraceSweep(now)
  assert.equal(GRACE_MS, 5 * 86400e3)
  assert.equal(mails.length, 1)
  assert.match(mails[0].subject, /ends soon/)
  assert.deepEqual(calls[1], ['updateOne', { _id: 'u1' }, { graceReminderSent: true }])
  assert.equal(calls[0][1].graceReminderSent.$ne, true)
  const [, q, u] = calls[2]
  assert.equal(q.graceEndsAt.$lte.getTime(), now)
  assert.deepEqual(u, { isPremium: false, graceEndsAt: null, graceReminderSent: false })
})
