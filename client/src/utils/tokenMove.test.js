import test from 'node:test'
import assert from 'node:assert/strict'
import { keyToStep, canStand, stepToken, isTypingTarget, bumpedDoor } from './tokenMove.js'

const ground = [
  ['wall', 'wall', 'wall', 'wall', 'wall'],
  ['wall', 'floor', 'floor', 'door', 'floor'],
  ['wall', 'floor', 'water', 'floor', 'empty'],
  ['wall', 'wall', 'wall', 'wall', 'wall'],
]
const none = ground.map(r => r.map(() => null))
const closed = ground.map(r => r.map(() => false))

test('WASD and the arrow keys are steps, anything else is not', () => {
  assert.deepEqual(keyToStep('w'), { dr: -1, dc: 0 })
  assert.deepEqual(keyToStep('W'), { dr: -1, dc: 0 })
  assert.deepEqual(keyToStep('ArrowDown'), { dr: 1, dc: 0 })
  assert.deepEqual(keyToStep('a'), { dr: 0, dc: -1 })
  assert.deepEqual(keyToStep('ArrowRight'), { dr: 0, dc: 1 })
  for (const k of ['q', ' ', 'Enter', 'Tab', '', null, undefined]) assert.equal(keyToStep(k), null)
})

test('walls, the void, water and closed doors stop a token; floor and open doors do not', () => {
  assert.equal(canStand(ground, none, closed, 1, 1), true)
  assert.equal(canStand(ground, none, closed, 0, 1), false, 'wall')
  assert.equal(canStand(ground, none, closed, 2, 4), false, 'empty')
  assert.equal(canStand(ground, none, closed, 2, 2), false, 'water')
  assert.equal(canStand(ground, none, closed, 1, 3), false, 'closed door')
  const open = closed.map(r => r.slice()); open[1][3] = true
  assert.equal(canStand(ground, none, open, 1, 3), true, 'open door')
  assert.equal(canStand(ground, none, closed, -1, 0), false, 'off the top')
  assert.equal(canStand(ground, none, closed, 1, 9), false, 'off the side')
})

test('a bridge makes water walkable, big objects block, small ones do not', () => {
  const withObjects = none.map(r => r.slice())
  withObjects[2][2] = 'bridge'
  assert.equal(canStand(ground, withObjects, closed, 2, 2), true)
  withObjects[1][2] = 'table'
  assert.equal(canStand(ground, withObjects, closed, 1, 2), false)
  withObjects[1][2] = 'torch'
  assert.equal(canStand(ground, withObjects, closed, 1, 2), true)
  withObjects[1][2] = 'chair'
  assert.equal(canStand(ground, withObjects, closed, 1, 2), true)
})

test('stepping moves only that token, and only when the step is allowed', () => {
  const tokens = [{ id: 'a', row: 1, col: 1 }, { id: 'b', row: 1, col: 2 }]
  assert.equal(stepToken(tokens, 'a', keyToStep('d'), ground, none, closed), tokens, 'another token is in the way')
  assert.equal(stepToken(tokens, 'a', keyToStep('w'), ground, none, closed), tokens, 'wall')
  assert.equal(stepToken(tokens, 'a', keyToStep('x'), ground, none, closed), tokens, 'not a movement key')
  assert.equal(stepToken(tokens, 'zzz', keyToStep('d'), ground, none, closed), tokens, 'unknown token')
  const moved = stepToken(tokens, 'b', keyToStep('a'), ground, none, closed)
  assert.equal(moved, tokens, 'a is on that square')
  const down = stepToken([{ id: 'a', row: 1, col: 1, hp: 7 }], 'a', keyToStep('s'), ground, none, closed)
  assert.equal(down[0].row, 2, 'floor below')
  const downAgain = stepToken(down, 'a', keyToStep('s'), ground, none, closed)
  assert.equal(downAgain, down, 'wall below that')
  const right = stepToken([{ id: 'a', row: 1, col: 1, hp: 7 }, { id: 'c', row: 2, col: 1 }], 'a', keyToStep('d'), ground, none, closed)
  assert.deepEqual(right[0], { id: 'a', row: 1, col: 2, hp: 7 }, 'moves and keeps its other fields')
  assert.deepEqual(right[1], { id: 'c', row: 2, col: 1 })
  assert.equal(stepToken([{ id: 'a' }], 'a', keyToStep('d'), ground, none, closed).length, 1, 'a token without a square is left alone')
})

test('typing in a box is never a move', () => {
  assert.equal(isTypingTarget({ tagName: 'INPUT' }), true)
  assert.equal(isTypingTarget({ tagName: 'TEXTAREA' }), true)
  assert.equal(isTypingTarget({ tagName: 'SELECT' }), true)
  assert.equal(isTypingTarget({ tagName: 'DIV', isContentEditable: true }), true)
  assert.equal(isTypingTarget({ tagName: 'DIV' }), false)
  assert.equal(isTypingTarget(null), false)
})

test('walking into a closed door is noticed, so it can be opened or its lock tried', () => {
  const tokens = [{ id: 'a', row: 1, col: 2 }]
  assert.deepEqual(bumpedDoor(tokens, 'a', keyToStep('d'), ground, closed), { row: 1, col: 3 })
  const open = closed.map(r => r.slice()); open[1][3] = true
  assert.equal(bumpedDoor(tokens, 'a', keyToStep('d'), ground, open), null, 'an open door is just walked through')
  assert.equal(bumpedDoor(tokens, 'a', keyToStep('a'), ground, closed), null, 'floor, not a door')
  assert.equal(bumpedDoor(tokens, 'a', keyToStep('x'), ground, closed), null, 'not a movement key')
  assert.equal(bumpedDoor(tokens, 'zzz', keyToStep('d'), ground, closed), null, 'unknown token')
  assert.equal(bumpedDoor([{ id: 'a', row: 1, col: 2 }, { id: 'b', row: 1, col: 3 }], 'a', keyToStep('d'), ground, closed), null, 'someone is standing in the doorway')
})
