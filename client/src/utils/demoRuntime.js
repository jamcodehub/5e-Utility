import { TILES, OBJECT_TILES } from '../data/levelTiles'

export const isPublicDemoPath = (pathname = window.location.pathname) => {
  if (window.localStorage.getItem('ll_token')) return false
  return pathname === '/' || pathname.startsWith('/demo/')
}

const DEMO_CAMPAIGN_ID = 'demo-campaign'
const GRID_WIDTH = 32
const GRID_HEIGHT = 22

const makeGrid = value => Array.from({ length: GRID_HEIGHT }, () => Array(GRID_WIDTH).fill(value))

// A ruined chapel: a pillared hall with a dais, a flooded corner, a treasure room, a bedroom and a camp outside.
function makeSampleMap() {
  const ground = makeGrid('grass')
  const objects = makeGrid(null)
  const stairLinks = makeGrid(null)
  const doorStates = makeGrid(false)
  const fill = (r1, r2, c1, c2, tile) => { for (let r = r1; r <= r2; r++) for (let c = c1; c <= c2; c++) ground[r][c] = tile }
  const put = (list, name) => list.forEach(([r, c]) => { objects[r][c] = name })

  // the path up to the front door
  fill(18, 21, 11, 13, 'rocky-dirt')
  // the building: stone floor, a mossy entrance hall, wood-plank rooms and the dais
  fill(3, 17, 6, 25, 'floor')
  fill(14, 16, 7, 17, 'mossy-cobblestone')
  fill(4, 6, 9, 15, 'wood-planks')
  fill(11, 16, 19, 24, 'wood-planks')
  fill(13, 15, 7, 10, 'water')
  // walls and doors
  fill(3, 3, 6, 25, 'wall'); fill(17, 17, 6, 25, 'wall'); fill(3, 17, 6, 6, 'wall'); fill(3, 17, 25, 25, 'wall')
  fill(3, 17, 18, 18, 'wall'); fill(10, 10, 18, 25, 'wall')
  ground[17][12] = 'door'; ground[10][18] = 'door'; ground[10][22] = 'door'
  doorStates[17][12] = true; doorStates[10][18] = true; doorStates[10][22] = true

  // main hall
  put([[8, 9], [8, 15], [11, 9], [11, 15], [14, 15]], 'pillar')
  put([[5, 12]], 'table'); put([[6, 11], [6, 13]], 'chair')
  put([[4, 9], [4, 15]], 'brazier')
  put([[4, 7], [16, 7], [4, 17], [16, 17]], 'torch')
  put([[12, 7], [16, 13]], 'bones')
  // treasure room
  put([[6, 22]], 'treasure'); put([[5, 20]], 'open-chest'); put([[8, 23]], 'locked-chest')
  put([[4, 19]], 'torch'); put([[6, 20]], 'magic-rune')
  // bedroom and study
  put([[11, 20], [11, 23]], 'bookshelf'); put([[13, 24]], 'bed'); put([[15, 20], [15, 21]], 'barrel')
  put([[14, 22]], 'table'); put([[14, 21]], 'chair'); put([[16, 24]], 'cauldron')
  // outside
  put([[1, 3], [2, 9], [1, 15], [2, 20], [1, 28], [5, 2], [9, 1], [14, 2], [19, 3], [19, 29], [8, 29], [13, 28], [20, 22], [21, 8], [20, 17]], 'tree')
  put([[4, 4], [18, 8], [18, 16], [11, 27], [3, 27], [16, 4]], 'bush')
  put([[19, 10], [19, 14], [2, 12], [12, 3]], 'yellow-flowers')
  put([[7, 28]], 'rock-small'); put([[17, 2]], 'rock-medium')
  put([[19, 6]], 'well'); put([[18, 10]], 'signpost')
  put([[19, 26]], 'tent'); put([[19, 24]], 'campfire'); put([[20, 27]], 'barrel'); put([[20, 15]], 'fallen-log')

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
  { _id: 'demo-day-3', day: 3, title: 'The bridge at dusk', content: 'We found fresh tracks on the old bridge. Too many for a patrol, too few for an army.\n\nMara Venn read the prints like a letter: eleven riders, shod in the new Ashen pattern, heading west before the rain. One horse was lame and dragged its left foot, so they cannot be far ahead.\n\nThe bridge itself is wrong. The stones are warm, and a faint grey ash drifts from the arches although nothing is burning. Avery found a courier’s seal pressed into the mortar and left it where it was. We camp beneath the north tower tonight.\n\nThings to ask the innkeeper: who pays the Ashen riders, and why does the village bell ring a half-beat late?' },
  { _id: 'demo-day-2', day: 2, title: 'A stranger at the inn', content: 'The innkeeper recognized our crest, though none of us had shown it. I do not trust the man in the green cloak.' },
  { _id: 'demo-day-1', day: 1, title: 'A promise kept', content: 'We brought the missing courier home. The village bells rang until sunset.' },
]

let demoBattleState = null

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
  { id: 'char-demo-player', name: 'Avery Thornfield', row: 9, col: 12, color: 'var(--green)', hp: 22, maxHp: 28, type: 'player', lightSource: true },
  { id: 'lore-demo-goblin', loreId: 'demo-goblin', name: 'Roadside Goblin', row: 7, col: 14, color: 'var(--red)', hp: 9, maxHp: 12, type: 'enemy' },
]

let sceneCards = demoSceneCards.map(card => ({ ...card }))
let journalEntries = demoJournalEntries.map(entry => ({ ...entry }))
let loreEntries = demoLore.map(entry => ({ ...entry }))
let levelPlans = [{
  _id: 'demo-map-1',
  title: 'The Old King’s Road',
  content: makeSampleMap(),
  tokens: DEMO_TOKENS.map(token => ({ ...token })),
  darkMode: true,
  theme: 'medieval',
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
    const plan = { _id: `demo-map-${Date.now()}`, theme: 'medieval', ...body, tokens: [], darkMode: false }
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

  // The battle tracker keeps its fight in memory for the demo (nothing is saved to a server).
  if (segments[0] === 'battle' && segments.length === 2) {
    if (method === 'GET') return Promise.resolve({ state: copy(demoBattleState) })
    if (method === 'PUT') { demoBattleState = copy(body.state ?? null); return Promise.resolve({ ok: true }) }
  }

  return notFound(path, method)
}

export function resetDemoApi() {
  demoBattleState = null
  sceneCards = demoSceneCards.map(card => ({ ...card }))
  journalEntries = demoJournalEntries.map(entry => ({ ...entry }))
  loreEntries = demoLore.map(entry => ({ ...entry }))
  levelPlans = [{
    _id: 'demo-map-1',
    title: 'The Old King’s Road',
    content: makeSampleMap(),
    tokens: DEMO_TOKENS.map(token => ({ ...token })),
    darkMode: true,
    theme: 'medieval',
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
