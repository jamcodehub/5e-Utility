import test from 'node:test'
import assert from 'node:assert/strict'
import { applyPlayerTokenUpdate, mapDims, playerTokenId, sameTokens } from './tokenRules.js'

const stored = [
  { id: 'char-p1', name: 'Aria', type: 'player', row: 1, col: 1, hp: 8, maxHp: 10 },
  { id: 'char-p2', name: 'Bo', type: 'player', row: 2, col: 2, hp: 9, maxHp: 9 },
  { id: 'lore-g', name: 'Goblin', type: 'enemy', row: 3, col: 3, hp: 7, maxHp: 7 },
]
const dims = { rows: 10, cols: 12 }

test('the token id is the player id with char- in front', () => assert.equal(playerTokenId('abc'), 'char-abc'))

test('a player can move their own token', () => {
  const sent = stored.map(t => (t.id === 'char-p1' ? { ...t, row: 4, col: 5 } : t))
  const next = applyPlayerTokenUpdate(stored, sent, 'p1', dims)
  assert.deepEqual(next[0], { ...stored[0], row: 4, col: 5 })
  assert.deepEqual(next.slice(1), stored.slice(1))
  assert.ok(sameTokens(next, sent))
})

test('they cannot move anyone else, or change anything but their own square', () => {
  const sent = [
    { ...stored[0], row: 4, col: 5, hp: 999, maxHp: 999, darkvision: true, lightSource: true, name: 'Hacked' },
    { ...stored[1], row: 8, col: 8 },
    { ...stored[2], row: 0, col: 0, hp: 0 },
  ]
  const next = applyPlayerTokenUpdate(stored, sent, 'p1', dims)
  assert.deepEqual(next[0], { ...stored[0], row: 4, col: 5 }, 'only the square changes')
  assert.deepEqual(next[1], stored[1], "another player's token stays")
  assert.deepEqual(next[2], stored[2], 'the goblin stays')
  assert.equal(sameTokens(next, sent), false, 'the player is told to correct their screen')
})

test('they cannot add or remove tokens', () => {
  const added = [...stored, { id: 'char-p1b', row: 1, col: 1 }]
  assert.equal(applyPlayerTokenUpdate(stored, added, 'p1', dims).length, 3)
  const removed = stored.filter(t => t.id !== 'lore-g')
  assert.deepEqual(applyPlayerTokenUpdate(stored, removed, 'p1', dims), stored)
})

test('squares off the map or that are not whole numbers are refused', () => {
  for (const [row, col] of [[-1, 0], [0, -1], [10, 0], [0, 12], [1.5, 1], ['2', 2], [null, 1], [NaN, 1], [Infinity, 1]]) {
    const sent = stored.map(t => (t.id === 'char-p1' ? { ...t, row, col } : t))
    assert.deepEqual(applyPlayerTokenUpdate(stored, sent, 'p1', dims), stored, `refused ${row},${col}`)
  }
  const edge = stored.map(t => (t.id === 'char-p1' ? { ...t, row: 9, col: 11 } : t))
  assert.equal(applyPlayerTokenUpdate(stored, edge, 'p1', dims)[0].row, 9, 'the last square is fine')
})

test('a player with no token on the board changes nothing, and bad input is safe', () => {
  assert.deepEqual(applyPlayerTokenUpdate(stored, stored, 'nobody', dims), stored)
  assert.deepEqual(applyPlayerTokenUpdate(stored, null, 'p1', dims), stored)
  assert.deepEqual(applyPlayerTokenUpdate(stored, [null, 5, 'x'], 'p1', dims), stored)
  assert.deepEqual(applyPlayerTokenUpdate(null, stored, 'p1', dims), [])
  assert.deepEqual(applyPlayerTokenUpdate(undefined, stored, 'p1'), [])
})

test('without a readable map size, only whole non-negative squares are checked', () => {
  const sent = stored.map(t => (t.id === 'char-p1' ? { ...t, row: 50, col: 60 } : t))
  assert.equal(applyPlayerTokenUpdate(stored, sent, 'p1', null)[0].row, 50)
})

test('map size is read from the saved map', () => {
  assert.deepEqual(mapDims(JSON.stringify({ ground: [['floor', 'floor', 'floor'], ['wall', 'wall', 'wall']] })), { rows: 2, cols: 3 })
  for (const bad of ['', 'not json', '[]', '{}', '{"ground":[]}', null, undefined]) assert.equal(mapDims(bad), null)
})
