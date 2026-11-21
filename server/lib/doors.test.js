import test from 'node:test'
import assert from 'node:assert/strict'
import { locksFromContent, pruneLocks, isLocked, withLock, canKnock, dimsOf, groundOf, KNOCK_COOLDOWN_MS } from './doors.js'

const content = (over = {}) => JSON.stringify({
  ground: [['wall', 'door', 'wall'], ['floor', 'door', 'floor']],
  objects: [[null, null, null], [null, null, null]],
  doorLocks: [[false, true, true], [true, false, false]],
  ...over,
})

test('only doors can be locked, and only where the map says so', () => {
  assert.deepEqual(locksFromContent(content()), [[false, true, false], [false, false, false]])
})

test('a map with no lock information, or broken content, has no locks', () => {
  assert.deepEqual(locksFromContent(content({ doorLocks: undefined })), [])
  assert.deepEqual(locksFromContent(content({ doorLocks: 'x' })), [])
  for (const bad of ['', 'nope', '[]', '{}', null, undefined, JSON.stringify([['door']])]) assert.deepEqual(locksFromContent(bad), [])
})

test('size and ground come from the saved map, old array maps included', () => {
  assert.deepEqual(dimsOf(content()), { rows: 2, cols: 3 })
  assert.deepEqual(dimsOf(JSON.stringify([['floor', 'floor']])), { rows: 1, cols: 2 })
  assert.equal(dimsOf('bad'), null)
  assert.equal(groundOf('bad'), null)
})

test('editing the map keeps a lock only on a door that is still there', () => {
  const locks = [[false, true, false], [false, true, false]]
  assert.deepEqual(pruneLocks(locks, content()), [[false, true, false], [false, true, false]])
  const moved = JSON.stringify({ ground: [['wall', 'floor', 'wall'], ['floor', 'door', 'floor']] })
  assert.deepEqual(pruneLocks(locks, moved), [[false, false, false], [false, true, false]])
  assert.deepEqual(pruneLocks(null, content()), [])
  assert.deepEqual(pruneLocks(locks, 'bad'), [])
})

test('locking and unlocking give a new grid and leave the old one alone', () => {
  const locks = [[false, true]]
  assert.equal(isLocked(locks, 0, 1), true)
  assert.equal(isLocked(locks, 0, 0), false)
  assert.equal(isLocked(locks, 5, 5), false)
  assert.equal(isLocked(null, 0, 0), false)
  const unlocked = withLock(locks, 0, 1, false)
  assert.equal(isLocked(unlocked, 0, 1), false)
  assert.equal(isLocked(locks, 0, 1), true, 'original untouched')
  assert.equal(isLocked(withLock(undefined, 2, 3, true), 2, 3), true)
})

test('a player can only knock on the same door every few seconds', () => {
  const last = new Map()
  assert.equal(canKnock(last, 'p:1:2:u', 1000), true)
  assert.equal(canKnock(last, 'p:1:2:u', 1000 + KNOCK_COOLDOWN_MS - 1), false)
  assert.equal(canKnock(last, 'p:1:3:u', 1500), true, 'another door')
  assert.equal(canKnock(last, 'p:1:2:v', 1500), true, 'another player')
  assert.equal(canKnock(last, 'p:1:2:u', 1000 + KNOCK_COOLDOWN_MS), true)
})
