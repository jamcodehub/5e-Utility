import test from 'node:test'
import assert from 'node:assert/strict'
process.env.JWT_SECRET ||= 'test-secret'
const { AiUsage } = await import('../models/index.js')
const { reserve, refund } = await import('./ai.js')

// A tiny in-memory stand-in for the AiUsage collection, behaving like MongoDB: the filter must match, an upsert inserts when
// nothing matches, and inserting a second document for the same user and month is a duplicate-key error (code 11000).
const fakeDb = () => {
  const docs = new Map()
  return {
    docs,
    findOneAndUpdate: async (q, u, opts = {}) => {
      const key = `${q.user}|${q.month}`, kind = Object.keys(u.$inc)[0], max = q[kind].$lt, doc = docs.get(key)
      if (doc && doc[kind] < max) { doc[kind] += 1; return { ...doc } }
      if (doc || !opts.upsert) return null
      const fresh = { guide: 0, images: 0, [kind]: 1 }; docs.set(key, fresh); return { ...fresh }
    },
    updateOne: async (q, u) => { const doc = docs.get(`${q.user}|${q.month}`), kind = Object.keys(u.$inc)[0]; if (doc && doc[kind] > 0) doc[kind] -= 1; return {} },
  }
}
const withDb = (t) => {
  const db = fakeDb(), real = { f: AiUsage.findOneAndUpdate, u: AiUsage.updateOne }
  // Real MongoDB reports the duplicate key when an upsert finds the document exists but the filter did not match.
  AiUsage.findOneAndUpdate = async (q, u, o) => {
    if (o?.upsert && db.docs.has(`${q.user}|${q.month}`) && !(db.docs.get(`${q.user}|${q.month}`)[Object.keys(u.$inc)[0]] < q[Object.keys(u.$inc)[0]].$lt)) throw Object.assign(new Error('dup'), { code: 11000 })
    return db.findOneAndUpdate(q, u, o)
  }
  AiUsage.updateOne = db.updateOne
  t.after(() => { AiUsage.findOneAndUpdate = real.f; AiUsage.updateOne = real.u })
  return db
}

test('the monthly allowance lets exactly the limit through, then says no', async t => {
  withDb(t)
  const r = []
  for (let i = 0; i < 4; i++) r.push(await reserve('u1', 'images', 3, '2026-11'))
  assert.deepEqual(r.map(x => x.ok), [true, true, true, false])
  assert.deepEqual(r.map(x => x.used), [1, 2, 3, 3])
})

test('a new month, and a different subscriber, each start with a full allowance', async t => {
  withDb(t)
  for (let i = 0; i < 2; i++) await reserve('u1', 'guide', 2, '2026-11')
  assert.equal((await reserve('u1', 'guide', 2, '2026-11')).ok, false)
  assert.equal((await reserve('u1', 'guide', 2, '2026-12')).ok, true)
  assert.equal((await reserve('u2', 'guide', 2, '2026-11')).ok, true)
})

test('a failed answer gives the unit back, and guide and pictures are counted separately', async t => {
  withDb(t)
  await reserve('u1', 'images', 1, '2026-11')
  assert.equal((await reserve('u1', 'images', 1, '2026-11')).ok, false)
  await refund('u1', 'images', '2026-11')
  assert.equal((await reserve('u1', 'images', 1, '2026-11')).ok, true, 'refunded unit can be used again')
  assert.equal((await reserve('u1', 'guide', 1, '2026-11')).ok, true, 'pictures do not use up guide messages')
})

test('two first requests at once both get in when the allowance is not used up', async t => {
  const db = withDb(t)
  const real = AiUsage.findOneAndUpdate
  let first = true
  // Simulate the race: the first upsert loses to a concurrent insert and sees the duplicate-key error.
  AiUsage.findOneAndUpdate = async (q, u, o) => {
    if (first && o?.upsert) { first = false; db.docs.set(`${q.user}|${q.month}`, { guide: 0, images: 1 }); throw Object.assign(new Error('dup'), { code: 11000 }) }
    return real(q, u, o)
  }
  const r = await reserve('u1', 'images', 5, '2026-11')
  assert.equal(r.ok, true); assert.equal(r.used, 2)
})
