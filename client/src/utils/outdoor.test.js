import test from 'node:test'
import assert from 'node:assert/strict'
import { guessOutdoor, isOutdoorMap } from './outdoor.js'

const rows = (...tiles) => tiles.map(t => t.split(' '))

test('grass, sand, snow and water ground is outdoors; floors and cave dirt are not', () => {
  assert.equal(guessOutdoor(rows('grass grass grass', 'grass sand water')), true)
  assert.equal(guessOutdoor(rows('floor floor floor', 'floor floor wood-planks')), false)
  assert.equal(guessOutdoor(rows('rocky-dirt rocky-dirt rocky-dirt', 'rocky-dirt water rocky-dirt')), false, 'a cave with a pool is still a cave')
  assert.equal(guessOutdoor(rows('floor floor floor floor', 'grass grass grass floor')), true, 'about a third open air is enough')
  assert.equal(guessOutdoor(rows('floor floor floor floor floor floor floor floor', 'grass floor floor floor floor floor floor floor')), false, 'a patch of grass in a dungeon is not')
})

test('walls and empty squares are not counted, and an empty map is not outdoors', () => {
  assert.equal(guessOutdoor(rows('wall wall wall', 'wall grass wall')), true)
  assert.equal(guessOutdoor(rows('empty empty', 'empty wall')), false)
  for (const bad of [null, undefined, [], [[]], [[null, undefined]]]) assert.equal(guessOutdoor(bad), false)
})

test('a map that says what it is wins over the guess', () => {
  const field = rows('grass grass', 'grass grass')
  assert.equal(isOutdoorMap(undefined, field), true)
  assert.equal(isOutdoorMap(null, field), true)
  assert.equal(isOutdoorMap(false, field), false, 'the author said indoors')
  assert.equal(isOutdoorMap(true, rows('floor floor')), true, 'the author said outdoors')
  assert.equal(isOutdoorMap('yes', rows('floor floor')), false, 'only true or false count')
})
