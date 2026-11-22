// A map sent from the Godot map generator (the game embedded on the Map generator page). The page that receives it never
// trusts it: this checks the shape, the size and every tile name before anything is saved as a battle map.
import { TILES, OBJECT_TILES } from '../data/levelTiles.js'

// What the game posts to the page: window.parent.postMessage({ type: MESSAGE_TYPE, map: { title, theme, content, doorStates } }, '*')
export const MESSAGE_TYPE = '5eutility-map-generated'

// The battle map's own themes (see client/src/data/levelThemes.js). Anything else falls back to medieval.
export const GENERATED_THEMES = ['medieval', 'cartoon', 'scifi', 'gothic']

const GROUND = new Set([...TILES.map(t => t.id), 'empty'])
const OBJECTS = new Set(OBJECT_TILES.map(t => t.id))
const MAX_CONTENT_CHARS = 400000
// The same limits the battle map uses when it reads a saved map (LevelBuilder dimsOf).
const MIN_SIDE = 6
const MAX_ROWS = 60
const MAX_COLS = 80

const bad = (error) => ({ error })

// Ground heights, if the map has them: a grid the size of the map of whole levels 0 to 15.
const validHeights = (heights, rows, cols) => Array.isArray(heights) && heights.length === rows
  && heights.every(row => Array.isArray(row) && row.length === cols && row.every(n => Number.isInteger(n) && n >= 0 && n <= 15))

// Returns { title, theme, content, width, height } for a good map, or { error } saying what was wrong.
export function readGeneratedMap(payload) {
  if (!payload || typeof payload !== 'object') return bad('The generator sent something unexpected.')
  if (typeof payload.content !== 'string' || payload.content.length === 0 || payload.content.length > MAX_CONTENT_CHARS) return bad('The map from the generator is missing or too large.')
  let content
  try { content = JSON.parse(payload.content) } catch { return bad('The map from the generator could not be read.') }
  const ground = content?.ground
  const objects = content?.objects
  if (!Array.isArray(ground) || ground.length < MIN_SIDE || ground.length > MAX_ROWS) return bad('The map has an unexpected size.')
  const width = Array.isArray(ground[0]) ? ground[0].length : 0
  if (width < MIN_SIDE || width > MAX_COLS) return bad('The map has an unexpected size.')
  if (!Array.isArray(objects) || objects.length !== ground.length) return bad('The map is missing its objects layer.')
  for (let y = 0; y < ground.length; y++) {
    if (!Array.isArray(ground[y]) || ground[y].length !== width || !Array.isArray(objects[y]) || objects[y].length !== width) return bad('The map rows are uneven.')
    for (let x = 0; x < width; x++) {
      if (!GROUND.has(ground[y][x])) return bad('The map uses a tile this version does not know.')
      const o = objects[y][x]
      if (o !== null && !OBJECTS.has(o)) return bad('The map uses an object this version does not know.')
    }
  }
  if (content.heights !== undefined && !validHeights(content.heights, ground.length, width)) return bad('The map heights are not valid.')
  const title = typeof payload.title === 'string' ? payload.title.replace(/\s+/g, ' ').trim().slice(0, 80) : ''
  return {
    title: title || 'Generated map',
    theme: GENERATED_THEMES.includes(payload.theme) ? payload.theme : 'medieval',
    content: payload.content,
    width,
    height: ground.length,
  }
}
