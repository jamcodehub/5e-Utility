import test from 'node:test'
import assert from 'node:assert/strict'
import { sortByInitiative, nextTurn, resolveAttack, applyDamage, applyHeal, parseAmount, rollInitiative, abilityMod, mergeSaved } from './combat.js'

const mk = (id, extra = {}) => ({ id, name: id, type: 'enemy', hp: 10, maxHp: 10, ...extra })

test('abilityMod', () => { assert.equal(abilityMod(8), -1); assert.equal(abilityMod(10), 0); assert.equal(abilityMod(15), 2); assert.equal(abilityMod(20), 5) })

test('rollInitiative gives each combatant d20 + bonus', () => {
  const list = [mk('a', { initBonus: 3 }), mk('b'), mk('c', { initBonus: -1 })]
  for (let i = 0; i < 200; i++) {
    const r = rollInitiative(list)
    assert.deepEqual(Object.keys(r), ['a', 'b', 'c'])
    assert.ok(r.a.roll >= 1 && r.a.roll <= 20 && r.a.total === r.a.roll + 3)
    assert.equal(r.b.total, r.b.roll); assert.equal(r.c.total, r.c.roll - 1)
  }
})

test('sortByInitiative: high first, ties by bonus then type, unrolled last', () => {
  const list = [mk('x', { init: 12 }), mk('norolled'), mk('y', { init: 18 }), mk('z', { init: 12, initBonus: 2 }), mk('p', { init: 12, type: 'player' })]
  assert.deepEqual(sortByInitiative(list).map(c => c.id), ['y', 'z', 'p', 'x', 'norolled'])
})

test('nextTurn advances, skips the downed and wraps with a new round', () => {
  const order = [mk('a'), mk('b', { hp: 0 }), mk('c')]
  assert.deepEqual(nextTurn(order, 'a', 1), { turnId: 'c', round: 1 })
  assert.deepEqual(nextTurn(order, 'c', 1), { turnId: 'a', round: 2 })
  assert.deepEqual(nextTurn(order, null, 3), { turnId: 'a', round: 3 })
  assert.deepEqual(nextTurn([mk('d', { hp: 0 })], 'd', 1), { turnId: null, round: 1 })
})

test('resolveAttack: hits when total >= AC, natural 20 crits, natural 1 misses', () => {
  const attack = { name: 'Sword', bonus: 5, dmg: '1d8+3', type: 'slashing' }
  let hits = 0, misses = 0, crits = 0, fumbles = 0
  for (let i = 0; i < 4000; i++) {
    const r = resolveAttack({ attack, target: { ac: 15 } })
    const n = r.d20.chosen
    if (n === 20) { assert.ok(r.hit && r.crit); crits++ } else if (n === 1) { assert.ok(r.miss && r.nat1 && r.damage === 0); fumbles++ }
    else assert.equal(r.hit, n + 5 >= 15, `roll ${n}`)
    if (r.hit) { hits++; assert.ok(r.damage >= (r.crit ? 2 + 3 : 1 + 3) && r.damage <= (r.crit ? 16 + 3 : 8 + 3)) } else { misses++; assert.equal(r.damage, 0) }
  }
  assert.ok(hits > 0 && misses > 0 && crits > 0 && fumbles > 0)
})

test('resolveAttack: advantage takes the higher d20; no AC always hits (unless nat 1)', () => {
  for (let i = 0; i < 300; i++) {
    const r = resolveAttack({ attack: { name: 'x', bonus: 0, dmg: '1d4' }, target: {}, mode: 'adv' })
    assert.equal(r.d20.values.length, 2); assert.equal(r.d20.chosen, Math.max(...r.d20.values))
    assert.equal(r.hit, !r.nat1)
  }
})

test('damage and healing clamp to 0 and max HP', () => {
  assert.equal(applyDamage(mk('a'), 4).hp, 6); assert.equal(applyDamage(mk('a'), 99).hp, 0)
  assert.equal(applyHeal(mk('a', { hp: 3 }), 4).hp, 7); assert.equal(applyHeal(mk('a', { hp: 3 }), 99).hp, 10)
})

test('parseAmount reads numbers and dice, rejects junk', () => {
  assert.equal(parseAmount('8').total, 8)
  for (let i = 0; i < 100; i++) { const t = parseAmount('2d4+2').total; assert.ok(t >= 4 && t <= 10) }
  assert.equal(parseAmount(''), null); assert.equal(parseAmount('abc'), null); assert.equal(parseAmount('-3'), null)
})

test('mergeSaved: party stays current, monsters come back as saved, leavers drop, newcomers join', () => {
  const freshParty = [mk('p1', { source: 'party', type: 'player', hp: 20, ac: 16, init: null }), mk('p3', { source: 'party', type: 'player', hp: 9, init: null })]
  const saved = [
    mk('p1', { source: 'party', type: 'player', hp: 3, ac: 10, init: 14 }),
    mk('p2', { source: 'party', type: 'player', hp: 5, init: 8 }),
    mk('srd-g', { source: 'srd', hp: 2, init: 11 }),
  ]
  const out = mergeSaved(freshParty, saved)
  assert.deepEqual(out.map(c => c.id), ['p1', 'srd-g', 'p3'])
  assert.equal(out[0].hp, 20); assert.equal(out[0].ac, 16); assert.equal(out[0].init, 14) // sheet data fresh, initiative kept
  assert.equal(out[1].hp, 2); assert.equal(out[1].init, 11)                                 // monster exactly as saved
  assert.equal(out[2].init, null)
  assert.deepEqual(mergeSaved(freshParty, null).map(c => c.id), ['p1', 'p3'])
})
