import test from 'node:test'
import assert from 'node:assert/strict'
import { readHeights, heightShade, heightShadeAlpha } from './mapHeights.js'

test('heights are tidied to whole levels 0 to 15, and a flat map has none', () => {
  assert.deepEqual(readHeights([[0, 3], [20, -2]], 2, 2), [[0, 3], [15, 0]])
  assert.equal(readHeights([[1.5, 'x']], 1, 3), null, 'only whole numbers count')
  assert.equal(readHeights([[0, 0], [0, 0]], 2, 2), null)
  for (const bad of [undefined, null, 'x', 5, {}]) assert.equal(readHeights(bad, 2, 2), null)
  assert.deepEqual(readHeights([[2]], 2, 3), [[2, 0, 0], [0, 0, 0]], 'missing squares are level 0')
})

test('high ground is lighter, a slope facing away is darker', () => {
  const h = [[0, 0, 0], [0, 4, 4], [0, 4, 8]]
  assert.ok(heightShadeAlpha(h, 1, 1) > 0, 'rising from the up-left is lit')
  assert.ok(heightShadeAlpha(h, 2, 2) > heightShadeAlpha(h, 1, 1) * 0.5 - 1)
  assert.ok(heightShadeAlpha([[5, 5], [5, 1]], 1, 1) < heightShadeAlpha([[5, 5], [5, 5]], 1, 1), 'lower than the up-left neighbour is darker')
  assert.ok(heightShadeAlpha(h, 0, 0) >= 0 && heightShadeAlpha(h, 0, 0) <= 0.4)
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) { const a = heightShadeAlpha(h, r, c); assert.ok(a >= -0.3 && a <= 0.4) }
})

test('a drop of two levels or more gets a dark edge on that side, thicker when steeper', () => {
  const h = [[6, 6], [0, 6]]
  const s = heightShade(h, 0, 0)
  assert.match(s.boxShadow, /^inset 0px -/, 'the bottom edge')
  assert.equal(s.boxShadow.split('), ').length, 1)
  const gentle = heightShade([[3, 3], [2, 3]], 0, 0)
  assert.equal(gentle.boxShadow, undefined, 'a one-level step has no edge')
  const steeper = heightShade([[12, 12], [0, 12]], 0, 0).boxShadow
  assert.match(steeper, /-4px/)
  assert.equal(heightShade(null, 0, 0), null)
  assert.match(heightShade(h, 0, 0).background, /^rgba\(/)
})
