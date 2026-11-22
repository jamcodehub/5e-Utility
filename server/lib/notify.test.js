import test from 'node:test'
import assert from 'node:assert/strict'
import { setNotifier, notifyUser, userRoom } from './notify.js'

test('a message for one user goes only to that user\'s private room', () => {
  const sent = []
  setNotifier({ to: (room) => ({ emit: (event, payload) => sent.push({ room, event, payload }) }) })
  notifyUser('abc', 'campaign:approved', { campaignId: 'c1' })
  assert.deepEqual(sent, [{ room: userRoom('abc'), event: 'campaign:approved', payload: { campaignId: 'c1' } }])
  assert.equal(userRoom('abc'), 'user:abc')
})

test('with no socket server running, notifying does nothing and does not throw', () => {
  setNotifier(null)
  assert.doesNotThrow(() => notifyUser('abc', 'campaign:approved', {}))
})
