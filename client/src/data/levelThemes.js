// src/data/levelThemes.js
//
// Tile themes for the Battle Map editor.
//
// Every theme shares the SAME tile ids as the base (Medieval) set in
// ./levelTiles — only the artwork changes. That means:
//   • saved maps never break when a theme changes (grids store ids, not art)
//   • game logic (walls blocking sight, torch light radius, doors, stairs)
//     keeps working, because those fields come from the base tile
//
// To add artwork: replace a PLACEHOLDER url below with the real Cloudinary url.
// Any tile whose url still contains "PLACEHOLDER" quietly falls back to the
// Medieval art, so the editor works while you fill these in.

import { TILES as MEDIEVAL_TILES, OBJECT_TILES as MEDIEVAL_OBJECT_TILES } from './levelTiles'

const CLOUDINARY = 'https://res.cloudinary.com/crcbzpw6/image/upload'
const PLACEHOLDER = 'PLACEHOLDER'
const ph = (theme, name) => `${CLOUDINARY}/${PLACEHOLDER}/${theme}-${name}.png`
const isReal = url => typeof url === 'string' && url.length > 0 && !url.includes(PLACEHOLDER)

export const DEFAULT_THEME = 'medieval'

// Order here = order in the dropdown.
export const THEMES = [
  { id: 'medieval', label: 'Medieval', available: true },
  { id: 'cartoon', label: 'Stylized Cartoon', available: true },
  { id: 'scifi', label: 'Sci Fi (Coming Soon)', available: false },
  { id: 'western', label: 'Western (Coming Soon)', available: false },
]

// ── Stylized Cartoon art ─────────────────────────────────────────────────
// Key = tile id (same ids as the Medieval set).
//   imageUrl  full-colour art. Ground tiles fill the whole cell, objects are
//             drawn "contain" inside the cell.
//   iconUrl   (optional) single-colour mask icon tinted with iconColor
//   color     (optional) background colour behind the art / used in thumbnails
// There is one entry per art-bearing tile id in levelTiles.js ('empty' and
// 'object-erase' are erasers and have no art).
const CARTOON_ART = {
  // Ground tiles
  'floor':              { imageUrl: ph('cartoon', 'floor') },
  'wall':               { imageUrl: ph('cartoon', 'wall') },
  'wood-wall':          { imageUrl: ph('cartoon', 'wood-wall') },
  'door':               { imageUrl: ph('cartoon', 'door') },
  'water':              { imageUrl: ph('cartoon', 'water') },
  'grass':              { imageUrl: ph('cartoon', 'grass') },
  'trap':               { imageUrl: ph('cartoon', 'trap') },
  'stairs':             { imageUrl: ph('cartoon', 'stairs') },
  'stairs-down':        { imageUrl: ph('cartoon', 'stairs-down') },
  'sand':               { imageUrl: ph('cartoon', 'sand') },
  'rocky-dirt':         { imageUrl: ph('cartoon', 'rocky-dirt') },
  'lava':               { imageUrl: ph('cartoon', 'lava') },
  'snow':               { imageUrl: ph('cartoon', 'snow') },
  'mossy-cobblestone':  { imageUrl: ph('cartoon', 'mossy-cobblestone') },
  'wood-planks':        { imageUrl: ph('cartoon', 'wood-planks') },
  'chest':              { imageUrl: ph('cartoon', 'chest') },

  // Upper layer objects
  'torch':            { imageUrl: ph('cartoon', 'torch') },
  'campfire':         { imageUrl: ph('cartoon', 'campfire') },
  'brazier':          { imageUrl: ph('cartoon', 'brazier') },
  'magic-rune':       { imageUrl: ph('cartoon', 'magic-rune') },
  'cauldron':         { imageUrl: ph('cartoon', 'cauldron') },
  'blue-crystal':     { imageUrl: ph('cartoon', 'blue-crystal') },
  'tree':             { imageUrl: ph('cartoon', 'tree') },
  'bush':             { imageUrl: ph('cartoon', 'bush') },
  'yellow-flowers':   { imageUrl: ph('cartoon', 'yellow-flowers') },
  'thorny-brambles':  { imageUrl: ph('cartoon', 'thorny-brambles') },
  'rock-small':       { imageUrl: ph('cartoon', 'rock-small') },
  'rock-medium':      { imageUrl: ph('cartoon', 'rock-medium') },
  'rock-large':       { imageUrl: ph('cartoon', 'rock-large') },
  'table':            { imageUrl: ph('cartoon', 'table') },
  'chair':            { imageUrl: ph('cartoon', 'chair') },
  'bridge':           { imageUrl: ph('cartoon', 'bridge') },
  'treasure':         { imageUrl: ph('cartoon', 'treasure') },
  'well':             { imageUrl: ph('cartoon', 'well') },
  'signpost':         { imageUrl: ph('cartoon', 'signpost') },
  'open-chest':       { imageUrl: ph('cartoon', 'open-chest') },
  'locked-chest':     { imageUrl: ph('cartoon', 'locked-chest') },
  'tent':             { imageUrl: ph('cartoon', 'tent') },
  'bookshelf':        { imageUrl: ph('cartoon', 'bookshelf') },
  'bed':              { imageUrl: ph('cartoon', 'bed') },
  'barrel':           { imageUrl: ph('cartoon', 'barrel') },
  'bones':            { imageUrl: ph('cartoon', 'bones') },
  'mushrooms':        { imageUrl: ph('cartoon', 'mushrooms') },
  'fallen-log':       { imageUrl: ph('cartoon', 'fallen-log') },
  'pillar':           { imageUrl: ph('cartoon', 'pillar') },
  'wooden-crate':     { imageUrl: ph('cartoon', 'wooden-crate') },
  'gravestone':       { imageUrl: ph('cartoon', 'gravestone') },
}

// ── Coming soon (same shape as above; fill in when the packs are ready) ──
const SCIFI_ART = {}
const WESTERN_ART = {}

const ART_BY_THEME = {
  cartoon: CARTOON_ART,
  scifi: SCIFI_ART,
  western: WESTERN_ART,
}

function applyArt(tile, art) {
  const override = art?.[tile.id]
  if (!override) return tile
  const hasImage = isReal(override.imageUrl)
  const hasIcon = isReal(override.iconUrl)
  if (!hasImage && !hasIcon && !override.color) return tile // still placeholders
  const next = { ...tile }
  if (hasImage) {
    next.imageUrl = override.imageUrl
    if (!hasIcon) delete next.iconUrl // new full-colour art replaces the old mask icon
  }
  if (hasIcon) {
    next.iconUrl = override.iconUrl
    if (!hasImage) delete next.imageUrl
    if (override.iconColor) next.iconColor = override.iconColor
  }
  if (override.color) next.color = override.color
  return next
}

const cache = new Map()

export function resolveThemeId(id) {
  return THEMES.some(theme => theme.id === id && theme.available) ? id : DEFAULT_THEME
}

// Returns { TILES, OBJECT_TILES } for a theme. Results are cached so the
// arrays keep a stable identity between renders.
export function getThemeTiles(themeId) {
  const id = resolveThemeId(themeId)
  if (!cache.has(id)) {
    const art = ART_BY_THEME[id]
    cache.set(id, id === DEFAULT_THEME
      ? { TILES: MEDIEVAL_TILES, OBJECT_TILES: MEDIEVAL_OBJECT_TILES }
      : {
          TILES: MEDIEVAL_TILES.map(tile => applyArt(tile, art)),
          OBJECT_TILES: MEDIEVAL_OBJECT_TILES.map(tile => applyArt(tile, art)),
        })
  }
  return cache.get(id)
}
