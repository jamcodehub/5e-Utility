import test from 'node:test'
import assert from 'node:assert/strict'
import { cleanHomebrewGuide } from './homebrewGuide.js'

test('nothing useful in, nothing out', () => {
  assert.equal(cleanHomebrewGuide(null), null)
  assert.equal(cleanHomebrewGuide({ story: '   ', npcs: [{ name: '' }], quests: 'x' }), null)
})

test('answers are trimmed, limited and shaped like the Campaign Guide', () => {
  const g = cleanHomebrewGuide({
    story: `  ${'a'.repeat(7000)} `, currentArc: 'Start at the docks', worldNotes: 'Tone: grim',
    npcs: [{ name: 'Mara', description: 'Harbour master' }, { name: '', description: '' }],
    quests: [{ title: 'Find the lamp', description: 'It went out' }],
  })
  assert.equal(g.story.length, 6000)
  assert.equal(g.npcs.length, 1)
  assert.deepEqual(g.npcs[0], { id: 'npc-1', name: 'Mara', description: 'Harbour master', characterRelation: '' })
  assert.equal(g.quests[0].status, 'not-started')
  assert.equal(g.quests[0].kind, 'main')
  assert.equal(g.quests[0].order, 1)
})

test('non-string values are ignored, not stored', () => {
  const g = cleanHomebrewGuide({ story: { $gt: '' }, currentArc: 5, worldNotes: 'ok' })
  assert.equal(g.story, '')
  assert.equal(g.currentArc, '')
  assert.equal(g.worldNotes, 'ok')
})
