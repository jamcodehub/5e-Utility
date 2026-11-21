import test from 'node:test'
import assert from 'node:assert/strict'
import { parseCharacterId, mapCharacter } from './dndbeyond.js'

test('finds the character number in links, share links and bare numbers, and nothing else', () => {
  for (const ok of ['https://www.dndbeyond.com/characters/123456789', 'dndbeyond.com/characters/123456789/', 'https://www.dndbeyond.com/profile/someone/characters/123456789',
    'https://ddb.ac/characters/123456789/AbCdEf', ' 123456789 ']) assert.equal(parseCharacterId(ok), '123456789', ok)
  for (const bad of ['', null, 42, 'abc', '1234', 'https://evil.example.com/characters/123456789', 'https://dndbeyond.com.evil.com/characters/123456789',
    'https://169.254.169.254/characters/123456789', 'https://www.dndbeyond.com/monsters/123456789']) assert.equal(parseCharacterId(bad), null, String(bad))
})

// A made-up character in D&D Beyond's shape: level 5 Fighter 3 / Cleric 2, plate armour and a shield, +2 Strength from the race.
const sample = {
  id: 987654321, name: '  Brannoc ', race: { fullName: 'Hill Dwarf' },
  classes: [{ level: 3, definition: { name: 'Fighter' } }, { level: 2, definition: { name: 'Cleric' } }],
  stats: [{ value: 15 }, { value: 10 }, { value: 14 }, { value: 8 }, { value: 12 }, { value: 9 }], bonusStats: [{ value: null }, {}, {}, {}, {}, {}], overrideStats: [{}, {}, {}, {}, {}, {}],
  baseHitPoints: 30, bonusHitPoints: null, overrideHitPoints: null, removedHitPoints: 7,
  modifiers: {
    race: [{ type: 'bonus', subType: 'strength-score', value: 2 }, { type: 'bonus', subType: 'hit-points-per-level', value: 1 }, { type: 'proficiency', subType: 'battleaxes', friendlySubtypeName: 'Battleaxes' }],
    class: [{ type: 'proficiency', subType: 'athletics' }, { type: 'proficiency', subType: 'sleight-of-hand' }, { type: 'proficiency', subType: 'strength-saving-throws' }, { type: 'bonus', subType: 'armor-class', value: 1, restriction: 'while wearing armor' }],
    background: [], feat: [], item: [{ type: 'bonus', subType: 'strength-score', value: 4 }],
  },
  inventory: [
    { equipped: true, definition: { filterType: 'Armor', armorTypeId: 3, armorClass: 18 } },
    { equipped: true, definition: { filterType: 'Armor', armorTypeId: 4, armorClass: 2 } },
    { equipped: false, definition: { filterType: 'Armor', armorTypeId: 1, armorClass: 11 } },
  ],
  currencies: { cp: 1, sp: 2, ep: 0, gp: 340, pp: 0 }, traits: { personalityTraits: 'Gruff.', ideals: '', bonds: 'My clan.', flaws: null }, notes: { backstory: 'Born under the mountain.' },
}

test('maps a character onto our sheet', () => {
  const { fields, warnings } = mapCharacter(sample)
  assert.equal(fields.name, 'Brannoc')
  assert.equal(fields.race, 'Hill Dwarf')
  assert.equal(fields.class, 'Fighter / Cleric')
  assert.equal(fields.level, 5)
  assert.equal(fields.profBonus, 3)
  assert.equal(fields.stats.str, 17, 'base 15 + racial 2, magic item bonuses are not counted')
  assert.equal(fields.stats.con, 14)
  assert.equal(fields.hp.max, 30 + 2 * 5 + 1 * 5, 'base + CON modifier x level + per-level bonus')
  assert.equal(fields.hp.current, fields.hp.max - 7)
  assert.equal(fields.ac, 18 + 2, 'heavy armour ignores DEX, shield adds 2, restricted class bonus is skipped')
  assert.deepEqual(fields.proficiencies.sort(), ['Athletics', 'Battleaxes', 'Sleight Of Hand', 'saving-throw-str'].sort())
  assert.equal(fields.personality, 'Personality: Gruff.\nBonds: My clan.')
  assert.equal(fields.lore, 'Born under the mountain.')
  assert.equal(fields.currency.gp, 340)
  assert.equal(fields.dndBeyondUrl, 'https://www.dndbeyond.com/characters/987654321')
  assert.ok(warnings.some(w => /Armour class is an estimate/.test(w)))
})

test('uses overrides, copes with missing data and never goes below 1 hp', () => {
  const o = mapCharacter({ ...sample, overrideStats: [{ value: 20 }, {}, {}, {}, {}, {}], overrideHitPoints: 55, removedHitPoints: 99 }).fields
  assert.equal(o.stats.str, 20); assert.equal(o.hp.max, 55); assert.equal(o.hp.current, 0)
  const empty = mapCharacter({}).fields
  assert.equal(empty.level, 1); assert.equal(empty.ac, 10); assert.equal(empty.hp.max, 1); assert.equal(empty.stats.dex, 10); assert.equal(empty.name, '')
})
