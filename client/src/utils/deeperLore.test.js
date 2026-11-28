import test from 'node:test'
import assert from 'node:assert/strict'
import { deeperItems, DEEPER_STEPS } from './deeperLore.js'

test('an empty backstory is asked for first, and a written one is quoted back', () => {
  const blank = deeperItems({ name: 'Nebsy' }, {}, 1)
  assert.match(blank[0].title, /empty/i)
  const written = deeperItems({ name: 'Nebsy', lore: 'Raised in a library by a one-eyed archivist.' }, {}, 1)
  assert.match(written[0].desc, /one-eyed archivist/)
})

test('every session asks for something new, and the list starts over on a harder angle', () => {
  const titles = Array.from({ length: DEEPER_STEPS }, (_, i) => deeperItems({ name: 'A' }, {}, i + 1)[1].title)
  assert.equal(new Set(titles).size, DEEPER_STEPS)
  const again = deeperItems({ name: 'A' }, {}, DEEPER_STEPS + 1)[1]
  assert.match(again.title, /second look/)
  assert.match(again.desc, /did this once already|done this once already/)
})

test('uses the DM guide that is current right now', () => {
  const guide = { quests: [{ title: 'Relight the lamp', status: 'not-started' }, { title: 'Find Mara', status: 'active' }], npcs: [{ name: 'Oriel' }] }
  assert.match(deeperItems({ name: 'A', goals: 'Find my sister' }, guide, 2)[2].desc, /Find Mara/)
  assert.match(deeperItems({ name: 'A' }, { npcs: [{ name: 'Oriel' }] }, 2)[2].desc, /Oriel/)
  assert.match(deeperItems({ name: 'A' }, {}, 2)[2].desc, /Tell your DM/)
})

test('session numbers that are missing or odd still give a valid first step', () => {
  for (const s of [undefined, 0, -3, 'x', NaN]) assert.equal(deeperItems({ name: 'A' }, {}, s).length, 3)
})
