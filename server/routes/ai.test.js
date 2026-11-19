import test from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import jwt from 'jsonwebtoken'
import { Campaign, CampaignGuide, Character, User } from '../models/index.js'
import router from './ai.js'

test('AI routes are DM-only, keep the coach prompt, and only fetch Cloudinary avatars', async t => {
  const patched = []
  const stub = (target, name, fn) => { patched.push([target, name, target[name]]); target[name] = fn }
  const env = { secret: process.env.JWT_SECRET, key: process.env.GEMINI_API_KEY }
  process.env.JWT_SECRET = 'test-secret'; process.env.GEMINI_API_KEY = 'test-key'
  const dm = '507f1f77bcf86cd799439011', player = '507f1f77bcf86cd799439012', freeDm = '507f1f77bcf86cd799439013', campaignId = '507f1f77bcf86cd799439014'
  stub(User, 'findById', id => ({ select: async () => ({ role: id === player ? 'player' : 'dm', roles: [], isPremium: id === dm }) }))
  stub(Campaign, 'findOne', query => ({ select: async () => ((query.owner === dm || query.owner === freeDm) ? { _id: campaignId, name: 'Realm', setting: 'Salt marsh' } : null) }))
  stub(CampaignGuide, 'findOne', () => ({ select: async () => ({ story: 'A drowned empire' }) }))
  stub(Character, 'find', () => ({ select: () => ({ limit: async () => [
    { name: 'Mira', avatarUrl: 'https://res.cloudinary.com/x/mira.png' },
    { name: 'Evil', avatarUrl: 'https://internal.example/secret.png' },
  ] }) }))

  const geminiCalls = [], fetched = []
  const realFetch = globalThis.fetch
  stub(globalThis, 'fetch', async (url, opts) => {
    const u = String(url)
    if (u.startsWith('http://127.0.0.1')) return realFetch(url, opts)
    if (u.includes('generativelanguage') && !opts.body) {
      return new Response(JSON.stringify({ models: [
        { name: 'models/gemini-2.0-flash', supportedGenerationMethods: ['generateContent'] },
        { name: 'models/gemini-3.8-flash', supportedGenerationMethods: ['generateContent'] },
        { name: 'models/gemini-3.8-flash-image', supportedGenerationMethods: ['generateContent'] },
        { name: 'models/gemini-embedding', supportedGenerationMethods: ['embedContent'] },
      ] }), { status: 200 })
    }
    if (u.includes('generativelanguage')) {
      const body = JSON.parse(opts.body); geminiCalls.push({ u, body })
      const isImage = u.includes('image')
      return new Response(JSON.stringify({ candidates: [{ content: { parts: [isImage ? { inlineData: { mimeType: 'image/png', data: 'AAAA' } } : { text: 'So far: a drowned empire. Who drowned it?' }] } }] }), { status: 200 })
    }
    fetched.push(u)
    return new Response(Buffer.from('png'), { status: 200, headers: { 'content-type': 'image/png' } })
  })

  const app = express(); app.use(express.json()); app.use('/ai', router)
  const server = await new Promise(resolve => { const l = app.listen(0, '127.0.0.1', () => resolve(l)) })
  t.after(() => {
    server.close()
    patched.reverse().forEach(([target, name, original]) => { target[name] = original })
    if (env.secret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = env.secret
    if (env.key === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = env.key
  })
  const post = async (id, path, body) => {
    const r = await fetch(`http://127.0.0.1:${server.address().port}/ai${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt.sign({ id }, 'test-secret')}` }, body: JSON.stringify(body) })
    return { status: r.status, body: await r.json() }
  }

  assert.equal((await post(player, '/worldbuild', { campaignId, messages: [{ role: 'user', text: 'hi' }] })).status, 403)
  assert.equal((await post(dm, '/worldbuild', { campaignId, messages: [{ role: 'assistant', text: 'hi' }] })).status, 400)
  const chat = await post(dm, '/worldbuild', { campaignId, messages: [{ role: 'user', text: 'Write my whole campaign' }] })
  assert.equal(chat.status, 200)
  assert.match(chat.body.reply, /^So far:/)
  assert.match(geminiCalls[0].u, /models\/gemini-2\.5-flash:generateContent/, 'the fast stable text model is tried first')
  const system = geminiCalls[0].body.systemInstruction.parts[0].text
  assert.match(system, /NEVER write campaign content/)
  assert.match(system, /A drowned empire/)

  assert.equal((await post(freeDm, '/storyboard-image', { campaignId, prompt: 'A marsh' })).status, 403, 'images are a Premium feature')
  const img = await post(dm, '/storyboard-image', { campaignId, prompt: 'The party enters the marsh' })
  assert.equal(img.status, 200)
  assert.match(geminiCalls[1].u, /gemini-3\.8-flash-image:/)
  assert.equal(img.body.usedAvatars, 1)
  assert.deepEqual(fetched, ['https://res.cloudinary.com/x/mira.png'], 'non-Cloudinary avatar URLs are never fetched')
  assert.match(img.body.images[0], /^data:image\/png;base64,/)
  assert.equal((await post(dm, '/storyboard-image', { campaignId, prompt: '  ' })).status, 400)
})
