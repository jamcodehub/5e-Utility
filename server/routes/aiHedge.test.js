import test from 'node:test'
import assert from 'node:assert/strict'

process.env.GEMINI_API_KEY = 'test-key'
process.env.AI_HEDGE_MS = '150'
process.env.AI_TEXT_TOTAL_MS = '1500'
const { callGeminiForTests: callGemini } = await import('./ai.js')

const reply = (text) => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }), { status: 200 })
const realFetch = globalThis.fetch
const withFetch = async (fn, body) => { globalThis.fetch = fn; try { return await body() } finally { globalThis.fetch = realFetch } }
const stall = (signal) => new Promise((_, reject) => signal.addEventListener('abort', () => reject(signal.reason ?? Object.assign(new Error('aborted'), { name: 'AbortError' }))))

test('a stalled first model costs only the hedge delay: the second model answers and the first is cancelled', async () => {
  const seen = []; let firstAborted = false
  await withFetch(async (url, opts) => {
    const model = String(url).match(/models\/([^:]+):/)[1]; seen.push(model)
    if (model === 'slow-model') { try { await stall(opts.signal) } catch (e) { firstAborted = true; throw e } }
    return reply(`from ${model}`)
  }, async () => {
    const started = Date.now()
    const data = await callGemini(['slow-model', 'fast-model', 'third-model'], {}, { textOnly: true })
    assert.equal(data.candidates[0].content.parts[0].text, 'from fast-model')
    assert.ok(Date.now() - started < 1000, 'did not wait for the stalled model')
    await new Promise(r => setTimeout(r, 50))
    assert.ok(firstAborted, 'the stalled request was cancelled')
    assert.deepEqual(seen, ['slow-model', 'fast-model'], 'the third model is never asked')
  })
})

test('a model that fails outright brings in the next one at once', async () => {
  const seen = []
  await withFetch(async (url) => {
    const model = String(url).match(/models\/([^:]+):/)[1]; seen.push(model)
    return model === 'gone' ? new Response(JSON.stringify({ error: { message: 'retired' } }), { status: 404 }) : reply('ok')
  }, async () => {
    const started = Date.now()
    const data = await callGemini(['gone', 'works'], {}, { textOnly: true })
    assert.equal(data.candidates[0].content.parts[0].text, 'ok')
    assert.ok(Date.now() - started < 100, 'no hedge delay when the first fails fast')
  })
})

test('when every model fails the error lists each real reason', async () => {
  await withFetch(async (url, opts) => {
    const model = String(url).match(/models\/([^:]+):/)[1]
    if (model === 'stuck') { await stall(opts.signal) }
    return new Response(JSON.stringify({ error: { message: 'quota gone' } }), { status: 429 })
  }, async () => {
    await assert.rejects(() => callGemini(['stuck', 'limited'], {}, { textOnly: true }), (e) => {
      assert.match(e.message, /stuck: no answer within/)
      assert.match(e.message, /limited: HTTP 429 quota gone/)
      return true
    })
  })
})
