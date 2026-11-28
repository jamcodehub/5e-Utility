import test from 'node:test'
import assert from 'node:assert/strict'
process.env.JWT_SECRET ||= 'test-secret'
const { makeGlobalCap } = await import('./ai.js')

const run = (cap) => { const out = { status: 0 }; const res = { status(c) { out.status = c; return this }, json() { return this } }; let passed = false; cap({}, res, () => { passed = true }); return { passed, status: out.status } }

test('the daily cap lets the first N calls through, then refuses until the next day', () => {
  let day = '2026-11-28'
  const cap = makeGlobalCap('test', 3, () => day)
  assert.deepEqual([run(cap).passed, run(cap).passed, run(cap).passed], [true, true, true])
  const blocked = run(cap)
  assert.equal(blocked.passed, false); assert.equal(blocked.status, 429)
  assert.equal(run(cap).status, 429)
  day = '2026-11-29'
  assert.equal(run(cap).passed, true, 'a new UTC day starts the count again')
})
