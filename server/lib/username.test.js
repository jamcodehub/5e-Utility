import test from 'node:test'
import assert from 'node:assert/strict'
import { checkUsername } from './username.js'

test('accepts normal names and tidies the spacing', () => {
  assert.equal(checkUsername('  Avery   Stone ').name, 'Avery Stone')
  assert.equal(checkUsername("Dun_Kar-el.99").name, 'Dun_Kar-el.99')
  assert.equal(checkUsername('Zoë').name, 'Zoë')
})

test('refuses names that are too short, too long, empty or oddly shaped', () => {
  for (const bad of ['', '  ', 'ab', 'x'.repeat(25), '-leading', '<script>', 'a@b.com', 'emoji😀name', null, undefined, 42, {}]) {
    assert.ok(checkUsername(bad).error, `should refuse ${JSON.stringify(bad)}`)
  }
})
