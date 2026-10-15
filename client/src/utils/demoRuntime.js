import { TILES, OBJECT_TILES } from '../data/levelTiles'

export const isPublicDemoPath = (pathname = window.location.pathname) => {
  if (window.localStorage.getItem('ll_token')) return false
  return pathname === '/' || pathname.startsWith('/demo/')
}

const DEMO_CAMPAIGN_ID = 'demo-campaign'
const GRID_WIDTH = 32
const GRID_HEIGHT = 22

const makeGrid = value => Array.from({ length: GRID_HEIGHT }, () => Array(GRID_WIDTH).fill(value))

function makeSampleMap() {
  const ground = makeGrid('empty')
  const objects = makeGrid(null)
  const stairLinks = makeGrid(null)
  const doorStates = makeGrid(false)

  for (let row = 3; row <= 17; row++) {
    for (let col = 5; col <= 25; col++) ground[row][col] = 'floor'
  }
  for (let col = 5; col <= 25; col++) {
    ground[3][col] = 'wall'
    ground[17][col] = 'wall'
  }
  for (let row = 3; row <= 17; row++) {
    ground[row][5] = 'wall'
    ground[row][25] = 'wall'
  }
  ground[10][5] = 'door'
  doorStates[10][5] = true
  for (let row = 4; row <= 10; row++) ground[row][15] = 'wood-wall'
  ground[7][15] = 'door'
  doorStates[7][15] = true
  ground[8][8] = 'water'
  ground[8][9] = 'water'
  ground[9][8] = 'water'
  ground[9][9] = 'water'
  ground[7][20] = 'stairs'
  ground[13][20] = 'stairs-down'
  ground[10][10] = 'grass'
  ground[10][11] = 'grass'

  objects[5][8] = 'bookshelf'
  objects[5][21] = 'bookshelf'
  objects[7][11] = 'table'
  objects[8][11] = 'chair'
  objects[12][18] = 'treasure'
  objects[14][8] = 'torch'
  objects[14][22] = 'brazier'
  objects[4][3] = 'tree'
  objects[18][27] = 'tree'
  objects[19][10] = 'rock-medium'

  return JSON.stringify({ ground, objects, stairLinks, doorStates })
}

const demoSceneCards = [
  {
    _id: 'demo-scene-1',
    title: 'The Road to Eldermere',
    description: 'The road to Eldermere had been abandoned for nearly a century, but the ruins along its path still carried signs of life. With reports of strange lights beyond the old forest, the party set out before sunrise, following a trail that disappeared beneath ancient stone arches. Their rogue took point, searching for traps and watching the shadows between the trees, while the elven ranger kept a careful eye on the distant ruins. The warrior carried the heavier burden of protecting the group, and their young mage studied every strange carving they passed. By nightfall, the ruined city stood before them. Whatever had awakened beneath Eldermere, the adventurers were beginning to suspect that they were not the first to go looking for it..',
    imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1792052037/epic_fantasy_cinematic_scene_a_realistic_high_de.png',
    createdAt: '2026-10-15T00:00:00.000Z',
  },
  {
    _id: 'demo-scene-2',
    title: 'Beneath the Ruins',
    description: 'The entrance beneath the ruins led to a temple untouched for generations. Water ran across the ancient stone floor as the party descended into the darkness. Symbols carved into the walls began to glow as the mage approached, revealing a hidden passage deeper beneath the temple. While the rogue worked carefully at an ancient mechanism, the ranger watched the corridors for movement. Their dwarf companion stood ready with axe and lantern, certain that something was waiting beyond the shadows. Then the runes awakened. A blue light spread across the chamber, and somewhere in the darkness below, something enormous stirred..',
    imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1792052046/Rogues_Beneath_the_Ancient_Runes.png',
    createdAt: '2026-10-15T00:00:00.000Z',
  },
  {
    _id: 'demo-scene-3',
    title: 'The Map at the Crossroads',
    description: 'With the temple behind them, the party returned to the nearest tavern to piece together what they had discovered. Spread across the table was a battered map covered in notes, sketches, and symbols copied from the temple walls. One mark pointed north toward the mountains. Another indicated a forgotten fortress hidden somewhere beyond the old forest. The group argued over their next move while their exhausted rogue quietly examined a small relic taken from the ruins. It had not been there when they entered. The relic was warm. And it had begun pointing toward the mountains.',
    imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1792052520/Epic_Fantasy_Adventure_Triptych.png',
    createdAt: '2026-10-15T00:00:00.000Z',
  },
]

const demoJournalEntries = [
  { _id: 'demo-day-3', day: 3, title: 'The bridge at dusk', content: 'We found fresh tracks on the old bridge. Too many for a patrol, too few for an army.' },
  { _id: 'demo-day-2', day: 2, title: 'A stranger at the inn', content: 'The innkeeper recognized our crest, though none of us had shown it. I do not trust the man in the green cloak.' },
  { _id: 'demo-day-1', day: 1, title: 'A promise kept', content: 'We brought the missing courier home. The village bells rang until sunset.' },
]

const demoMembers = [
  {
    userId: 'demo-player',
    username: 'Avery',
    character: {
      _id: 'demo-character',
      name: 'Avery Thornfield',
      race: 'Half-Elf',
      class: 'Ranger',
      level: 4,
      profBonus: 2,
      background: 'A scout following signs of a growing blight along the old road.',
      personality: 'Observant, patient, and slow to trust.',
      goals: 'Find the missing courier and learn why the road is changing.',
      lore: '',
      avatarUrl: null,
      ac: 15,
      hp: { current: 22, max: 28 },
    },
  },
]

const demoLore = [
  { _id: 'demo-goblin', title: 'Roadside Goblin', tag: 'enemy', hp: 9, maxHp: 12 },
  { _id: 'demo-ash-guard', title: 'Ashen Guard', tag: 'boss', hp: 27, maxHp: 35 },
  { _id: 'demo-innkeeper', title: 'Mara Venn', tag: 'npc', hp: 11, maxHp: 11 },
]

const DEMO_TOKENS = [
  { id: 'char-demo-player', name: 'Avery Thornfield', row: 10, col: 10, color: '#6366f1', hp: 22, maxHp: 28, type: 'player' },
  { id: 'lore-demo-goblin', loreId: 'demo-goblin', name: 'Roadside Goblin', row: 9, col: 20, color: '#ef4444', hp: 9, maxHp: 12, type: 'enemy' },
]

let sceneCards = demoSceneCards.map(card => ({ ...card }))
let journalEntries = demoJournalEntries.map(entry => ({ ...entry }))
let loreEntries = demoLore.map(entry => ({ ...entry }))
let levelPlans = [{
  _id: 'demo-map-1',
  title: 'The Old King’s Road',
  content: makeSampleMap(),
  tokens: DEMO_TOKENS.map(token => ({ ...token })),
  darkMode: false,
  doorStates: makeGrid(false),
  createdAt: '2026-10-15T00:00:00.000Z',
}]
let roleplaySessionCount = 0

function copy(value) {
  return JSON.parse(JSON.stringify(value))
}

function notFound(path, method) {
  const error = new Error(`No demo preview is configured for ${method} ${path}`)
  error.status = 404
  return Promise.reject(error)
}

export function demoApi(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase()
  const url = new URL(path, window.location.origin)
  const segments = url.pathname.split('/').filter(Boolean)
  const body = options.body || {}

  if (segments[0] === 'storyboard') {
    if (segments.length === 2 && method === 'GET') return Promise.resolve(copy(sceneCards))
    if (segments.length === 2 && method === 'POST') {
      const card = { _id: `demo-scene-${Date.now()}`, ...body, createdAt: new Date().toISOString() }
      sceneCards = [...sceneCards, card]
      return Promise.resolve(copy(card))
    }
    const cardIndex = sceneCards.findIndex(card => card._id === segments[1])
    if (cardIndex >= 0 && method === 'PUT') {
      sceneCards[cardIndex] = { ...sceneCards[cardIndex], ...body }
      return Promise.resolve(copy(sceneCards[cardIndex]))
    }
    if (cardIndex >= 0 && method === 'DELETE') {
      sceneCards = sceneCards.filter(card => card._id !== segments[1])
      return Promise.resolve({ ok: true })
    }
  }

  if (segments[0] === 'journal') {
    if (segments.length === 2 && method === 'GET' && segments[1] === DEMO_CAMPAIGN_ID) return Promise.resolve(copy(journalEntries))
    if (segments.length === 2 && method === 'POST' && segments[1] === DEMO_CAMPAIGN_ID) {
      const entry = { _id: `demo-day-${Date.now()}`, ...body }
      journalEntries = [entry, ...journalEntries]
      return Promise.resolve(copy(entry))
    }
    const entryIndex = journalEntries.findIndex(entry => entry._id === segments[1])
    if (entryIndex >= 0 && method === 'PUT') {
      journalEntries[entryIndex] = { ...journalEntries[entryIndex], ...body }
      return Promise.resolve(copy(journalEntries[entryIndex]))
    }
  }

  if (segments[0] === 'levels' && segments.length === 2 && segments[1] === DEMO_CAMPAIGN_ID && method === 'GET') {
    return Promise.resolve(copy(levelPlans))
  }
  if (segments[0] === 'levels' && segments.length === 2 && method === 'PUT') {
    const planIndex = levelPlans.findIndex(plan => plan._id === segments[1])
    if (planIndex < 0) return notFound(path, method)
    levelPlans[planIndex] = { ...levelPlans[planIndex], ...body }
    return Promise.resolve(copy(levelPlans[planIndex]))
  }
  if (segments[0] === 'levels' && segments.length === 2 && method === 'POST' && segments[1] === DEMO_CAMPAIGN_ID) {
    const plan = { _id: `demo-map-${Date.now()}`, ...body, tokens: [], darkMode: false }
    levelPlans = [...levelPlans, plan]
    return Promise.resolve(copy(plan))
  }
  if (segments[0] === 'levels' && segments.length === 2 && method === 'DELETE') {
    levelPlans = levelPlans.filter(plan => plan._id !== segments[1])
    return Promise.resolve({ ok: true })
  }

  if (segments[0] === 'campaigns' && segments[1] === DEMO_CAMPAIGN_ID) {
    if (segments[2] === 'members' && segments[3] === 'characters' && method === 'GET') return Promise.resolve(copy(demoMembers))
    if (segments[2] === 'character' && segments.length === 3 && method === 'GET') return Promise.resolve(copy(demoMembers[0].character))
    if (segments[2] === 'guide' && method === 'GET') {
      return Promise.resolve({
        lastSession: 'The party found the courier’s signet beneath the old bridge.',
        nextSession: 'Discover who has been watching the road to Emberfall.',
      })
    }
    if (segments[2] === 'roleplay-session' && method === 'POST') {
      roleplaySessionCount += 1
      return Promise.resolve({ sessionCount: roleplaySessionCount })
    }
    if (segments[2] === 'character' && segments[3] === 'depth' && method === 'PATCH') return Promise.resolve({ ok: true })
    if (segments[2] === 'characters' && segments.length === 4 && method === 'PUT') return Promise.resolve({ ok: true })
  }

  if (segments[0] === 'lore' && segments.length === 2 && segments[1] === DEMO_CAMPAIGN_ID && method === 'GET') {
    return Promise.resolve(copy(loreEntries))
  }
  if (segments[0] === 'lore' && segments.length === 3 && segments[2] === 'hp' && method === 'PATCH') {
    loreEntries = loreEntries.map(entry => entry._id === segments[1] ? { ...entry, hp: body.hp } : entry)
    return Promise.resolve({ ok: true })
  }

  return notFound(path, method)
}

export function resetDemoApi() {
  sceneCards = demoSceneCards.map(card => ({ ...card }))
  journalEntries = demoJournalEntries.map(entry => ({ ...entry }))
  loreEntries = demoLore.map(entry => ({ ...entry }))
  levelPlans = [{
    _id: 'demo-map-1',
    title: 'The Old King’s Road',
    content: makeSampleMap(),
    tokens: DEMO_TOKENS.map(token => ({ ...token })),
    darkMode: false,
    doorStates: makeGrid(false),
    createdAt: '2026-10-15T00:00:00.000Z',
  }]
  roleplaySessionCount = 0
}

export function updateDemoLevelState(planId, updates) {
  const planIndex = levelPlans.findIndex(plan => plan._id === planId)
  if (planIndex < 0) return false
  levelPlans[planIndex] = { ...levelPlans[planIndex], ...updates }
  return true
}

export function findDemoLevel(planId) {
  const plan = levelPlans.find(item => item._id === planId)
  return plan ? copy(plan) : null
}

export { TILES, OBJECT_TILES }
