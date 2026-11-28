// Checks the AI features against Google the same way the site does, and says plainly what works.
//   GEMINI_API_KEY=your-key node scripts/aiCheck.js          (add  images  to also try a picture; it uses a little quota)
// The key is read from the environment only and is never printed.
process.env.JWT_SECRET ||= 'check'
const { textModels, imageModels, discoverModels, callGeminiForTests: call } = await import('../routes/ai.js')
const key = (process.env.GEMINI_API_KEY || '').trim()
if (!key) { console.error('Set GEMINI_API_KEY first.'); process.exit(1) }
const base = process.env.GEMINI_API_BASE || 'https://generativelanguage.googleapis.com/v1beta/models'
const ok = (m) => console.log(`  OK   ${m}`), bad = (m) => console.log(`  FAIL ${m}`)

console.log('1. Models this key can see')
const all = await discoverModels(key)
all.length ? ok(`${all.length} models listed`) : bad('no models listed (key invalid, wrong project, or Google unreachable)')
const tm = await textModels(key), im = await imageModels(key)
console.log(`   text order : ${tm.join(', ')}`)
console.log(`   image order: ${im.join(', ')}`)

console.log('2. One request to each text model (so a busy or retired model is obvious)')
for (const m of tm.slice(0, 4)) {
  const t = Date.now()
  try {
    const r = await fetch(`${base}/${m}:generateContent`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({ contents: [{ parts: [{ text: 'Reply with the single word: ready' }] }], generationConfig: { maxOutputTokens: 400, ...(/gemini-3/.test(m) ? { thinkingConfig: { thinkingLevel: 'low' } } : {}) } }), signal: AbortSignal.timeout(20000) })
    const d = await r.json().catch(() => ({}))
    const text = (d.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('').trim()
    r.ok && text ? ok(`${m}: "${text.slice(0, 30)}" in ${Date.now() - t}ms`) : bad(`${m}: HTTP ${r.status} ${d.error?.message || d.candidates?.[0]?.finishReason || 'no text'}`)
  } catch (e) { bad(`${m}: ${e.name} ${e.message}`) }
}

console.log('3. The way the guide really asks (first model to answer wins)')
try {
  const d = await call(textModels, { contents: [{ role: 'user', parts: [{ text: 'My world is a drowned empire.' }] }], systemInstruction: { parts: [{ text: 'Ask one short question about the world.' }] }, generationConfig: { maxOutputTokens: 400 } }, { textOnly: true })
  ok(`reply: "${(d.candidates?.[0]?.content?.parts?.[0]?.text || '').trim().slice(0, 80)}"`)
} catch (e) { bad(e.message) }

if (process.argv.includes('images')) {
  console.log('4. One scene picture')
  try {
    const d = await call(imageModels, { contents: [{ parts: [{ text: 'A small painterly lighthouse at dusk, no text' }] }], generationConfig: { responseModalities: ['IMAGE', 'TEXT'] } })
    const part = (d.candidates?.[0]?.content?.parts || []).find(p => p.inlineData?.data)
    part ? ok(`picture returned (${Math.round(part.inlineData.data.length * 0.75 / 1024)} KB)`) : bad('no picture in the answer')
  } catch (e) { bad(e.message) }
} else console.log('4. Pictures skipped (add the word "images" to try one)')
process.exit(0)
