import test from 'node:test'
import assert from 'node:assert/strict'
import { sameSnapshot, pushSnapshot, endStroke, undo, redo, emptyHistory, HISTORY_LIMIT } from './editHistory.js'

const snap = (cell, extra = {}) => ({ grid: [[cell]], objectGrid: [[null]], stairLinks: [[null]], doorStates: [[false]], rotations: [[null]], objectRotations: [[null]], ...extra })

test('maps are the same when their contents match, even if they are different arrays', () => {
  assert.ok(sameSnapshot(snap('wall'), snap('wall')))
  assert.ok(!sameSnapshot(snap('wall'), snap('floor')))
  assert.ok(!sameSnapshot(snap('wall'), snap('wall', { rotations: [[2]] })), 'a turn counts as a change')
  assert.ok(!sameSnapshot(null, snap('wall')))
})

test('a stroke that changed something is recorded; one that changed nothing is not', () => {
  const h = endStroke(emptyHistory(), snap('floor'), snap('wall'))
  assert.equal(h.undo.length, 1)
  assert.equal(endStroke(h, snap('wall'), snap('wall')), h, 'same tile painted again: nothing recorded')
  assert.equal(endStroke(h, null, snap('wall')), h)
})

test('undo takes back the last stroke, redo puts it back', () => {
  let h = endStroke(emptyHistory(), snap('floor'), snap('wall'))
  h = endStroke(h, snap('wall'), snap('door'))
  const first = undo(h, snap('door'))
  assert.equal(first.restore.grid[0][0], 'wall')
  const second = undo(first.history, first.restore)
  assert.equal(second.restore.grid[0][0], 'floor')
  assert.equal(undo(second.history, second.restore), null, 'nothing left to undo')
  const back = redo(second.history, second.restore)
  assert.equal(back.restore.grid[0][0], 'wall')
  const again = redo(back.history, back.restore)
  assert.equal(again.restore.grid[0][0], 'door')
  assert.equal(redo(again.history, again.restore), null, 'nothing left to redo')
})

test('painting after an undo forgets what could be redone', () => {
  let h = endStroke(emptyHistory(), snap('floor'), snap('wall'))
  const u = undo(h, snap('wall'))
  assert.equal(u.history.redo.length, 1)
  const painted = endStroke(u.history, snap('floor'), snap('grass'))
  assert.equal(painted.redo.length, 0)
  assert.equal(painted.undo.length, 1)
})

test('history is limited, dropping the oldest', () => {
  let stack = []
  for (let i = 0; i < HISTORY_LIMIT + 10; i++) stack = pushSnapshot(stack, snap(`t${i}`))
  assert.equal(stack.length, HISTORY_LIMIT)
  assert.equal(stack[0].grid[0][0], 't10')
  assert.equal(stack.at(-1).grid[0][0], `t${HISTORY_LIMIT + 9}`)
  const small = [snap('a')]
  pushSnapshot(small, snap('b'))
  assert.equal(small.length, 1, 'the original stack is not changed')
})
