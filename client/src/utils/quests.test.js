import test from 'node:test'
import assert from 'node:assert/strict'
import { orderQuests, questPointer } from './quests.js'

const q = (id, kind, order, status = 'not-started') => ({ id, title: id, kind, order, status })

test('main story comes first in its order, then side quests', () => {
  const list = [q('s1', 'side', 1), q('m2', 'main', 2), q('m1', 'main', 1), q('s2', 'side', 2)]
  const out = orderQuests(list)
  assert.equal(out.grouped, true)
  assert.deepEqual(out.main.map(x => x.id), ['m1', 'm2'])
  assert.deepEqual(out.side.map(x => x.id), ['s1', 's2'])
})

test('old quests with no kind keep their order and are not grouped', () => {
  const list = [{ id: 'a', title: 'a', status: 'active' }, { id: 'b', title: 'b', status: 'completed' }]
  const out = orderQuests(list)
  assert.equal(out.grouped, false)
  assert.deepEqual(out.side.map(x => x.id), ['a', 'b'])
  assert.deepEqual(orderQuests(undefined), { grouped: false, main: [], side: [] })
})

test('the pointer says Start here, then Current, then Up next', () => {
  const fresh = [q('m1', 'main', 1), q('m2', 'main', 2), q('s1', 'side', 1)]
  assert.deepEqual(questPointer(fresh), { id: 'm1', text: 'Start here' })
  const going = [q('m1', 'main', 1, 'active'), q('m2', 'main', 2), q('s1', 'side', 1)]
  assert.deepEqual(questPointer(going), { id: 'm1', text: 'Current' })
  const next = [q('m1', 'main', 1, 'completed'), q('m2', 'main', 2), q('s1', 'side', 1)]
  assert.deepEqual(questPointer(next), { id: 'm2', text: 'Up next' })
  const done = [q('m1', 'main', 1, 'completed'), q('m2', 'main', 2, 'failed')]
  assert.equal(questPointer(done), null)
})
