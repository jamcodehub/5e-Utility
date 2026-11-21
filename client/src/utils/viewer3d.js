// The live 3D view of a battle map is the Godot game loaded in a frame with ?mode=viewer. This page sends it the map, the tokens
// and how lit each square is; it sends back clicks and key presses. Everything that decides who may do what (who is signed in,
// whose token moves, the fog) stays here on the website, so the 3D view always lines up with the 2D board.
//
// Messages to the game: VIEWER_MAP, VIEWER_STATE. Messages from the game: VIEWER_READY, VIEWER_CLICK, VIEWER_KEY.
import { keyToStep } from './tokenMove.js'
import { NIGHT_LEVEL } from './outdoor.js'

export const VIEWER_MAP = '5eutility-viewer-map'
export const VIEWER_STATE = '5eutility-viewer-state'
export const VIEWER_READY = '5eutility-viewer-ready'
export const VIEWER_CLICK = '5eutility-viewer-click'
export const VIEWER_KEY = '5eutility-viewer-key'

// The classes the game has a miniature for (see scripts/tokens.gd in the Godot project).
export const CLASS_IDS = ['barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk', 'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard']
const KINDS = ['player', 'enemy', 'boss', 'npc']

// "Wizard (Evocation)", "Eldritch Knight Fighter", "wizard 3" -> 'wizard' / 'fighter'; anything else -> '' (a plain figure).
export function classIdFor(text) {
  const words = String(text || '').toLowerCase().match(/[a-z]+/g) || []
  return CLASS_IDS.find(id => words.includes(id)) || ''
}

// Where the game lives, and its address in viewer mode.
export function viewerUrl(gameUrl) {
  const url = new URL(gameUrl, typeof window !== 'undefined' ? window.location.href : 'http://localhost/')
  url.searchParams.set('mode', 'viewer')
  return url.toString()
}

// How lit each square is, 0 (pitch black) to 1, row by row, matching what the 2D board shows: full light without fog; with fog,
// black where the player cannot see, dim where only darkvision reaches, and fading with distance from a torch for players.
// Outdoors it is night instead: where no light reaches is dim moonlight (NIGHT_LEVEL), not black, and a torch's light fades smoothly
// out into it (`visibility.lightFade`, 1 at the torch down to 0 at the edge of its reach).
export function viewerLevels({ darkMode, isDm, visibility, rows, cols, outdoor = false }) {
  const levels = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!darkMode) { levels.push(1); continue }
      if (outdoor) {
        const fade = Math.max(0, Math.min(1, visibility?.lightFade?.[r]?.[c] || 0))
        const smooth = fade * fade * (3 - 2 * fade) // eases in and out, so there is no visible ring
        let level = NIGHT_LEVEL + (1 - NIGHT_LEVEL) * smooth
        if (visibility?.darkvision?.[r]?.[c]) level = Math.max(level, 0.35)
        levels.push(Math.round(level * 100) / 100)
        continue
      }
      if (!visibility?.visible?.[r]?.[c]) { levels.push(0); continue }
      if (visibility.darkvision?.[r]?.[c]) { levels.push(0.35); continue }
      const strength = visibility.lightStrength?.[r]?.[c] || 0
      levels.push(!isDm && visibility.torchlit?.[r]?.[c] && strength ? Math.round((0.45 + strength * 0.55) * 100) / 100 : 1)
    }
  }
  return levels
}

export function buildMapMessage({ ground, objects, doorStates, doorLocks, heights, theme }) {
  return {
    type: VIEWER_MAP,
    map: {
      ground,
      objects: (objects || []).map(row => (row || []).map(id => id || null)),
      doorStates: (doorStates || []).map(row => (row || []).map(Boolean)),
      doorLocks: (doorLocks || []).map(row => (row || []).map(Boolean)),
      heights: heights || null, // ground height per square (mountains, dunes...), or null for flat ground
      theme: theme || 'medieval',
    },
  }
}

// `classOf(token)` gives a token's class when the token itself does not carry one (older saved maps).
export function buildStateMessage({ tokens, levels, darkMode, focusId, classOf, night = false }) {
  return {
    type: VIEWER_STATE,
    tokens: (tokens || [])
      .filter(t => t && typeof t.id === 'string' && Number.isInteger(t.row) && Number.isInteger(t.col))
      .map(t => ({
        id: t.id,
        name: String(t.name || '').slice(0, 40),
        kind: KINDS.includes(t.type) ? t.type : 'player',
        classId: t.classId || (classOf ? classOf(t) : '') || '',
        row: t.row,
        col: t.col,
      })),
    dark: Boolean(darkMode),
    night: Boolean(darkMode && night), // an open-air map with the lighting on: moonlit instead of pitch black
    levels,
    focusId: focusId || '',
  }
}

// A message from the game, checked. Returns { type: 'ready' } | { type: 'click', row, col, tokenId } | { type: 'key', key } or null.
export function readViewerMessage(data, rows, cols) {
  if (!data || typeof data !== 'object' || typeof data.type !== 'string') return null
  if (data.type === VIEWER_READY) return { type: 'ready' }
  if (data.type === VIEWER_CLICK) {
    const { row, col } = data
    if (!Number.isInteger(row) || !Number.isInteger(col) || row < 0 || col < 0 || row >= rows || col >= cols) return null
    return { type: 'click', row, col, tokenId: typeof data.tokenId === 'string' ? data.tokenId.slice(0, 80) : '' }
  }
  if (data.type === VIEWER_KEY) return keyToStep(data.key) ? { type: 'key', key: String(data.key) } : null
  return null
}
