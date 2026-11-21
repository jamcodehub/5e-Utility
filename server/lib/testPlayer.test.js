import test from 'node:test'
import assert from 'node:assert/strict'
import { buildTestCharacter, TEST_CLASSES, MAX_TEST_PLAYERS } from './testPlayer.js'

test('four classes are on offer', () => {
  assert.deepEqual(TEST_CLASSES.map(c => c.id), ['fighter', 'rogue', 'wizard', 'cleric'])
  assert.equal(MAX_TEST_PLAYERS, 4)
})

test('HP follows the hit die, the Constitution modifier and the level', () => {
  const f1 = buildTestCharacter({ classId: 'fighter', level: 1 })
  assert.equal(f1.hp.max, 10 + 2, 'd10 + CON 15 (+2)')
  const f5 = buildTestCharacter({ classId: 'fighter', level: 5 })
  assert.equal(f5.hp.max, 12 + 4 * (6 + 2), 'level 1 full die, then average (6) + CON each level')
  assert.equal(buildTestCharacter({ classId: 'wizard', level: 1 }).hp.max, 6 + 2)
  assert.deepEqual(f5.hp, { current: f5.hp.max, max: f5.hp.max })
})

test('proficiency bonus, AC and proficiencies', () => {
  assert.equal(buildTestCharacter({ classId: 'rogue', level: 1 }).profBonus, 2)
  assert.equal(buildTestCharacter({ classId: 'rogue', level: 5 }).profBonus, 3)
  assert.equal(buildTestCharacter({ classId: 'rogue', level: 17 }).profBonus, 6)
  assert.equal(buildTestCharacter({ classId: 'cleric' }).ac, 18)
  const p = buildTestCharacter({ classId: 'cleric' }).proficiencies
  assert.ok(p.includes('Medicine') && p.includes('saving-throw-wis') && p.includes('saving-throw-cha'))
})

test('names are tidied and defaulted, and bad input falls back to a level 1 fighter', () => {
  assert.equal(buildTestCharacter({ name: '  Pip   the  Test ', classId: 'wizard' }).name, 'Pip the Test')
  assert.equal(buildTestCharacter({ classId: 'wizard' }).name, 'Test Wizard')
  assert.equal(buildTestCharacter({ name: 'x'.repeat(80) }).name.length, 40)
  const odd = buildTestCharacter({ classId: 'barbarian', level: 'lots' })
  assert.equal(odd.class, 'Fighter'); assert.equal(odd.level, 1)
  assert.equal(buildTestCharacter({ level: 99 }).level, 20); assert.equal(buildTestCharacter({ level: -3 }).level, 1)
  assert.equal(buildTestCharacter().level, 1)
})
