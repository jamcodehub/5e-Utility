import test from 'node:test'
import assert from 'node:assert/strict'
import { AUTO_ROTATE, autoRotation, rotationOf, nextRotation, rotationLabel, readRotations, compactRotations, withRotation } from './tileRotation.js'

test('the automatic turn is always 0 to 3 and the same for the same square', () => {
  for (let r = 0; r < 40; r++) for (let c = 0; c < 40; c++) {
    const a = autoRotation(r, c)
    assert.ok([0, 1, 2, 3].includes(a))
    assert.equal(a, autoRotation(r, c))
  }
})

test('neighbouring squares get a good mix of turns, not one repeated', () => {
  const counts = [0, 0, 0, 0]
  let sameAsRight = 0
  for (let r = 0; r < 30; r++) for (let c = 0; c < 30; c++) { counts[autoRotation(r, c)]++; if (autoRotation(r, c) === autoRotation(r, c + 1)) sameAsRight++ }
  for (const n of counts) assert.ok(n > 150 && n < 300, `each turn is used about a quarter of the time: ${counts}`)
  assert.ok(sameAsRight < 300, `a square matches its right neighbour about a quarter of the time (${sameAsRight}/900)`)
})

test('natural floors turn at random, everything else stays as drawn, unless the author chose', () => {
  for (const id of ['grass', 'rocky-dirt', 'floor', 'mossy-cobblestone', 'sand', 'snow']) {
    assert.ok(AUTO_ROTATE.has(id))
    assert.equal(rotationOf(id, null, 3, 4), autoRotation(3, 4))
    assert.equal(rotationOf(id, undefined, 3, 4), autoRotation(3, 4))
  }
  for (const id of ['wall', 'wood-wall', 'door', 'wood-planks', 'water', 'stairs', 'trap', 'torch', 'table']) assert.equal(rotationOf(id, null, 3, 4), 0, id)
  assert.equal(rotationOf('wall', 2, 3, 4), 2, 'an author turn on a wall')
  assert.equal(rotationOf('grass', 0, 3, 4), 0, 'the author can keep a floor tile unturned')
  assert.equal(rotationOf('wall', 7, 3, 4), 0, 'a bad value is ignored')
  assert.equal(rotationOf('wall', '2', 3, 4), 0)
})

test('the rotate button cycles Auto, 90, 180, 270, 0 and back', () => {
  let choice = null
  const seen = []
  for (let i = 0; i < 6; i++) { seen.push(rotationLabel(choice)); choice = nextRotation(choice) }
  assert.deepEqual(seen, ['Auto', '90°', '180°', '270°', '0°', 'Auto'])
  assert.equal(nextRotation(undefined), 1)
})

test('saved turns are tidied, and a map with none saves nothing', () => {
  assert.deepEqual(readRotations([[1, 9], [null, 'x']], 2, 3), [[1, null, null], [null, null, null]])
  assert.deepEqual(readRotations(undefined, 1, 2), [[null, null]])
  assert.equal(compactRotations([[null, null], [null, null]]), undefined)
  assert.equal(compactRotations(undefined), undefined)
  const used = [[null, 2]]
  assert.equal(compactRotations(used), used)
})

test('setting one square leaves the original grid alone', () => {
  const grid = [[null, null], [null, null]]
  const next = withRotation(grid, 1, 0, 3)
  assert.deepEqual(next, [[null, null], [3, null]])
  assert.deepEqual(grid, [[null, null], [null, null]])
  assert.equal(next[0], grid[0], 'untouched rows are shared')
  assert.deepEqual(withRotation(next, 1, 0, null), [[null, null], [null, null]])
})
