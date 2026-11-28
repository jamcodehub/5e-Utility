import test from 'node:test'
import assert from 'node:assert/strict'
import { DM_DIM, classIdFor, CLASS_IDS, viewerLevels, buildMapMessage, buildStateMessage, readViewerMessage, viewerUrl, VIEWER_MAP, VIEWER_STATE } from './viewer3d.js'

test('a class is found in whatever the player typed, otherwise nothing', () => {
  assert.equal(classIdFor('Wizard'), 'wizard')
  assert.equal(classIdFor('wizard (Evocation) 3'), 'wizard')
  assert.equal(classIdFor('Eldritch Knight Fighter'), 'fighter')
  assert.equal(classIdFor('Paladin/Warlock'), 'paladin')
  assert.equal(classIdFor('Artificer'), '')
  assert.equal(classIdFor(''), '')
  assert.equal(classIdFor(null), '')
  assert.equal(classIdFor('Monkey'), '', 'a word that only contains a class name is not that class')
  assert.equal(CLASS_IDS.length, 12)
})

test('the game address gets the viewer switch and keeps everything else', () => {
  assert.equal(viewerUrl('https://maptilecreator.netlify.app/index.html'), 'https://maptilecreator.netlify.app/index.html?mode=viewer')
  assert.match(viewerUrl('/godot/map-generator/index.html'), /\/godot\/map-generator\/index\.html\?mode=viewer$/)
})

const rows = 2
const cols = 3
const visibility = {
  visible: [[true, true, false], [true, true, true]],
  torchlit: [[true, false, false], [true, false, true]],
  darkvision: [[false, true, false], [false, true, false]],
  lightStrength: [[1, 0, 0], [0.5, 0, 0]],
}

test('without fog every square is fully lit', () => {
  assert.deepEqual(viewerLevels({ darkMode: false, isDm: false, visibility, rows, cols }), [1, 1, 1, 1, 1, 1])
})

test('with fog: black out of sight, dim with darkvision, fading torchlight for players', () => {
  const player = viewerLevels({ darkMode: true, isDm: false, visibility, rows, cols })
  assert.deepEqual(player, [1, 0.35, 0, 0.73, 0.35, 1])
  assert.equal(player.length, rows * cols)
})

test('the DM sees the same black as players by default, and the dark dimly once they reveal the map', () => {
  const dm = viewerLevels({ darkMode: true, isDm: true, visibility, rows, cols })
  assert.equal(dm[2], 0, 'pitch black for the DM too, so a streamed screen gives nothing away')
  const peek = viewerLevels({ darkMode: true, isDm: true, visibility, rows, cols, dmReveal: true })
  assert.deepEqual(peek, [1, 0.35, DM_DIM, 1, 0.35, 1])
  const players = viewerLevels({ darkMode: true, isDm: false, visibility, rows, cols, dmReveal: true })
  assert.equal(players[2], 0, 'revealing is DM-only: players still get black')
  assert.ok(DM_DIM > 0 && DM_DIM < 0.5)
})

test('outdoors the DM is black too until they reveal the map, players always see black', () => {
  const vis = { visible: [[true, false]], torchlit: [[true, false]], darkvision: [[false, false]], lightStrength: [[1, 0]], lightFade: [[1, 0]] }
  assert.deepEqual(viewerLevels({ darkMode: true, isDm: true, visibility: vis, rows: 1, cols: 2, outdoor: true }), [1, 0])
  assert.deepEqual(viewerLevels({ darkMode: true, isDm: true, visibility: vis, rows: 1, cols: 2, outdoor: true, dmReveal: true }), [1, DM_DIM])
  assert.deepEqual(viewerLevels({ darkMode: true, isDm: false, visibility: vis, rows: 1, cols: 2, outdoor: true, dmReveal: true }), [1, 0])
})

test('the map message carries which side each torch sits on', () => {
  const base = { ground: [['wall']], objects: [['torch']], doorStates: [[false]], doorLocks: [[false]], theme: 'medieval' }
  assert.equal(buildMapMessage(base).map.objectRotations, null)
  assert.deepEqual(buildMapMessage({ ...base, objectRotations: [[2]] }).map.objectRotations, [[2]])
})

test('missing visibility data never throws', () => {
  assert.deepEqual(viewerLevels({ darkMode: true, isDm: false, visibility: null, rows: 1, cols: 2 }), [0, 0])
})

test('the map message has plain data only', () => {
  const m = buildMapMessage({ ground: [['floor']], objects: [[undefined]], doorStates: [[1]], doorLocks: [[0]], heights: [[3]], theme: undefined })
  assert.equal(m.type, VIEWER_MAP)
  assert.deepEqual(m.map, { ground: [['floor']], objects: [[null]], doorStates: [[true]], doorLocks: [[false]], objectRotations: null, heights: [[3]], theme: 'medieval' })
  assert.deepEqual(buildMapMessage({ ground: [['door']] }).map.doorLocks, [], 'no locks sent when there are none')
  assert.doesNotThrow(() => JSON.stringify(m))
})

test('the state message keeps good tokens with a kind and class, and drops broken ones', () => {
  const tokens = [
    { id: 'char-1', name: 'Aria', type: 'player', classId: 'wizard', row: 1, col: 2, hp: 9, avatar: 'x' },
    { id: 'char-2', name: 'Bo', type: 'player', row: 0, col: 0 },
    { id: 'lore-3', name: 'G'.repeat(100), type: 'enemy', row: 2, col: 2 },
    { id: 'odd', name: 'Odd', type: 'dragon', row: 1, col: 1 },
    { id: 'unplaced', name: 'U', type: 'npc' },
    { name: 'no id', row: 1, col: 1 },
    null,
  ]
  const s = buildStateMessage({ tokens, levels: [1, 0], darkMode: 1, focusId: 'char-1', classOf: t => (t.id === 'char-2' ? 'rogue' : '') })
  assert.equal(s.type, VIEWER_STATE)
  assert.deepEqual(s.tokens.map(t => t.id), ['char-1', 'char-2', 'lore-3', 'odd'])
  assert.deepEqual(s.tokens[0], { id: 'char-1', name: 'Aria', kind: 'player', classId: 'wizard', row: 1, col: 2 })
  assert.equal(s.tokens[1].classId, 'rogue', 'class looked up for older tokens')
  assert.equal(s.tokens[2].kind, 'enemy')
  assert.equal(s.tokens[2].name.length, 40)
  assert.equal(s.tokens[3].kind, 'player', 'an unknown kind is a player')
  assert.equal(s.dark, true)
  assert.equal(s.focusId, 'char-1')
  assert.equal(buildStateMessage({ tokens: null, levels: [], darkMode: false }).tokens.length, 0)
})

test('messages from the game are checked', () => {
  assert.deepEqual(readViewerMessage({ type: '5eutility-viewer-ready' }, 5, 5), { type: 'ready' })
  assert.deepEqual(readViewerMessage({ type: '5eutility-viewer-click', row: 1, col: 2, tokenId: 'char-1' }, 5, 5), { type: 'click', row: 1, col: 2, tokenId: 'char-1' })
  assert.deepEqual(readViewerMessage({ type: '5eutility-viewer-click', row: 4, col: 0 }, 5, 5), { type: 'click', row: 4, col: 0, tokenId: '' })
  assert.deepEqual(readViewerMessage({ type: '5eutility-viewer-key', key: 'ArrowUp' }, 5, 5), { type: 'key', key: 'ArrowUp' })
  for (const bad of [null, undefined, 'x', 5, {}, { type: 'other' },
    { type: '5eutility-viewer-click', row: 5, col: 0 }, { type: '5eutility-viewer-click', row: -1, col: 0 },
    { type: '5eutility-viewer-click', row: 1.5, col: 0 }, { type: '5eutility-viewer-click', row: '1', col: 0 },
    { type: '5eutility-viewer-key', key: 'q' }, { type: '5eutility-viewer-key' }, { type: '5eutility-viewer-key', key: { a: 1 } }]) {
    assert.equal(readViewerMessage(bad, 5, 5), null, `should refuse ${JSON.stringify(bad)}`)
  }
  assert.equal(readViewerMessage({ type: '5eutility-viewer-click', row: 0, col: 0, tokenId: 5 }, 5, 5).tokenId, '')
})

test('outdoors with fog, torch light fades smoothly out to pitch black', () => {
  const vis = {
    visible: [[true, true, true, false]],
    torchlit: [[true, true, true, false]],
    darkvision: [[false, false, false, false]],
    lightStrength: [[1, 0.8, 0.45, 0]],
    lightFade: [[1, 0.6, 0.2, 0]],
  }
  const outdoors = viewerLevels({ darkMode: true, isDm: false, visibility: vis, rows: 1, cols: 4, outdoor: true })
  assert.equal(outdoors[0], 1, 'at the torch: full light')
  assert.equal(outdoors[3], 0, 'far from any light: pitch black, not moonlit')
  assert.ok(outdoors[0] > outdoors[1] && outdoors[1] > outdoors[2] && outdoors[2] > outdoors[3], 'it fades steadily')
  assert.ok(outdoors.every(n => n >= 0 && n <= 1))
  const indoor = viewerLevels({ darkMode: true, isDm: false, visibility: vis, rows: 1, cols: 4, outdoor: false })
  assert.equal(indoor[3], 0, 'the same map indoors is pitch black out of reach')
  assert.deepEqual(viewerLevels({ darkMode: false, isDm: false, visibility: vis, rows: 1, cols: 4, outdoor: true }), [1, 1, 1, 1], 'no fog, no darkness')
})

test('darkvision outdoors never makes a square darker than it would be', () => {
  const vis = { visible: [[true]], torchlit: [[false]], darkvision: [[true]], lightStrength: [[0]], lightFade: [[0]] }
  assert.equal(viewerLevels({ darkMode: true, isDm: false, visibility: vis, rows: 1, cols: 1, outdoor: true })[0], 0.35)
})
