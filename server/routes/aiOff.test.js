import test from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'

delete process.env.AI_ENABLED
const { default: router } = await import('./ai.js')

test('the AI routes answer 503 until AI_ENABLED=true (coming soon)', async (t) => {
  const app = express(); app.use(express.json()); app.use('/ai', router)
  const server = await new Promise(resolve => { const l = app.listen(0, '127.0.0.1', () => resolve(l)) })
  t.after(() => server.close())
  for (const path of ['/worldbuild', '/storyboard-image']) {
    const r = await fetch(`http://127.0.0.1:${server.address().port}/ai${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
    assert.equal(r.status, 503)
    assert.match((await r.json()).error, /coming soon/)
  }
})
