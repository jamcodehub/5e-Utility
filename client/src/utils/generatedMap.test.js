import test from 'node:test'
import assert from 'node:assert/strict'
import { readGeneratedMap, MESSAGE_TYPE } from './generatedMap.js'

const grid = (w, h, v) => Array.from({ length: h }, () => Array.from({ length: w }, () => v))
const make = (over = {}) => {
  const ground = grid(20, 14, 'floor')
  ground[0][0] = 'wall'
  const objects = grid(20, 14, null)
  objects[2][3] = 'torch'
  return { title: 'Dungeon 42', theme: 'scifi', content: JSON.stringify({ ground, objects, stairLinks: grid(20, 14, null) }), doorStates: grid(20, 14, false), ...over }
}

test('the message name the game and the page agree on', () => { assert.equal(MESSAGE_TYPE, '5eutility-map-generated') })

test('a good map is accepted, with its size', () => {
  const r = readGeneratedMap(make())
  assert.equal(r.error, undefined)
  assert.equal(r.title, 'Dungeon 42'); assert.equal(r.theme, 'scifi'); assert.equal(r.width, 20); assert.equal(r.height, 14)
  assert.equal(typeof r.content, 'string')
})

test('title and theme are tidied or defaulted', () => {
  assert.equal(readGeneratedMap(make({ title: '  A   big   dungeon ' })).title, 'A big dungeon')
  assert.equal(readGeneratedMap(make({ title: '' })).title, 'Generated map')
  assert.equal(readGeneratedMap(make({ title: 'x'.repeat(200) })).title.length, 80)
  assert.equal(readGeneratedMap(make({ theme: 'western' })).theme, 'medieval')
  assert.equal(readGeneratedMap(make({ theme: undefined })).theme, 'medieval')
})

test('anything odd is refused', () => {
  for (const p of [null, undefined, 'map', 42, {}, { content: 5 }, { content: '' }, { content: 'not json' }, { content: '[]' }, { content: '{}' }]) {
    assert.ok(readGeneratedMap(p).error, `should refuse ${JSON.stringify(p)}`)
  }
  const tooBig = make({ content: JSON.stringify({ ground: grid(81, 14, 'floor'), objects: grid(81, 14, null) }) })
  assert.ok(readGeneratedMap(tooBig).error, 'too wide')
  assert.ok(readGeneratedMap(make({ content: JSON.stringify({ ground: grid(20, 61, 'floor'), objects: grid(20, 61, null) }) })).error, 'too tall')
  assert.ok(readGeneratedMap(make({ content: JSON.stringify({ ground: grid(4, 14, 'floor'), objects: grid(4, 14, null) }) })).error, 'too narrow')
  assert.ok(readGeneratedMap(make({ content: 'x'.repeat(500000) })).error, 'huge')
})

test('unknown tiles, uneven rows and a missing objects layer are refused', () => {
  const g = grid(20, 14, 'floor'); g[3][3] = 'lava-of-doom'
  assert.match(readGeneratedMap(make({ content: JSON.stringify({ ground: g, objects: grid(20, 14, null) }) })).error, /tile/)
  const o = grid(20, 14, null); o[1][1] = 'dragon'
  assert.match(readGeneratedMap(make({ content: JSON.stringify({ ground: grid(20, 14, 'floor'), objects: o }) })).error, /object/)
  const uneven = grid(20, 14, 'floor'); uneven[5] = uneven[5].slice(0, 10)
  assert.match(readGeneratedMap(make({ content: JSON.stringify({ ground: uneven, objects: grid(20, 14, null) }) })).error, /uneven/)
  assert.match(readGeneratedMap(make({ content: JSON.stringify({ ground: grid(20, 14, 'floor') }) })).error, /objects/)
  assert.match(readGeneratedMap(make({ content: JSON.stringify({ ground: grid(20, 14, 'floor'), objects: grid(20, 10, null) }) })).error, /objects/)
})

test('ground heights are checked when a map has them', () => {
  const withHeights = (heights) => make({ content: JSON.stringify({ ground: grid(20, 14, 'floor'), objects: grid(20, 14, null), heights }) })
  assert.equal(readGeneratedMap(withHeights(grid(20, 14, 3))).error, undefined)
  for (const bad of [grid(20, 13, 3), grid(19, 14, 3), grid(20, 14, 16), grid(20, 14, -1), grid(20, 14, 1.5), grid(20, 14, '3'), 'tall', {}]) {
    assert.match(readGeneratedMap(withHeights(bad)).error, /heights/, `should refuse ${JSON.stringify(bad).slice(0, 30)}`)
  }
})

test('every tile the Godot generator can make is one the battle map knows', () => {
  const ground = ['floor', 'wall', 'wood-wall', 'door', 'water', 'grass', 'trap', 'stairs', 'stairs-down', 'sand', 'rocky-dirt', 'lava', 'snow', 'mossy-cobblestone', 'wood-planks', 'chest', 'empty']
  const objects = ['torch', 'campfire', 'brazier', 'magic-rune', 'cauldron', 'blue-crystal', 'tree', 'bush', 'yellow-flowers', 'thorny-brambles', 'rock-small', 'rock-medium', 'rock-large', 'table', 'chair', 'bridge', 'treasure', 'well', 'signpost', 'open-chest', 'locked-chest', 'tent', 'bookshelf', 'bed', 'barrel', 'bones', 'mushrooms', 'fallen-log', 'pillar', 'wooden-crate', 'gravestone']
  const g = grid(20, 14, 'floor'); ground.forEach((id, i) => { g[0][i] = id })
  const ob = grid(20, 14, null); objects.forEach((id, i) => { ob[1 + Math.floor(i / 20)][i % 20] = id })
  assert.equal(readGeneratedMap(make({ content: JSON.stringify({ ground: g, objects: ob }) })).error, undefined)
})
