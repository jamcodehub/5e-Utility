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
  { id: 'scifi', label: 'Sci Fi', available: true },
  // Gothic and Pixel are 3D looks from the map generator for now: the flat board still uses the Medieval tile art for them.
  { id: 'gothic', label: 'Gothic (3D look)', available: true },
  { id: 'pixel', label: 'Pixel (3D look)', available: true },
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
  'floor':              { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1793015358/stone_floor.png' },
  'wall':               { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1793015371/mossy_stone_wall.png' },
  'wood-wall':          { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1793015365/timber_wall.png' },
  'door':               { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1793015367/stone_door.png' },
  'water':              { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1793015363/water.png' },
  'grass':              { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1793015360/grass.png' },
  'trap':               { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1793015370/spike_trap.png' },
  'stairs':             { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1793015361/stairs_up.png' },
  'stairs-down':        { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1793015372/stairs_down.png' },
  'sand':               { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1793015368/sand.png' },
  'rocky-dirt':         { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1793015355/rocky_dirt.png' },
  'lava':               { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1793015354/lava.png' },
  'snow':               { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1793015359/snow.png' },
  'mossy-cobblestone':  { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1793015366/mossy_cobblestone.png' },
  'wood-planks':        { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1793015357/wood_planks.png' },
  'chest':              { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1793015364/treasure_chest_tile.png' },

  // Upper layer objects
  'torch':            { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1793015385/torch.png' },
  'campfire':         { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1793015381/campfire.png' },
  'brazier':          { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1793015379/hanging_lantern.png' },
  'magic-rune':       { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1793015340/blue_crystal_pedestal.png' },
  'cauldron':         { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1793015350/glowing_alchemy_cauldron.png'},
  'blue-crystal':     { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1793015388/purple_crystal_cluster.png' },
  'tree':             { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1793015382/deciduous_tree.png' },
  'bush':             { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1793015393/flowering_bush.png' },
  'yellow-flowers':   { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1793015389/blue_flowers.png' },
  'thorny-brambles':  { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1793015397/red_mushrooms.png' },
  'rock-small':       { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1793015396/small_rock.png' },
  'rock-medium':      { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1793015391/medium_rock_cluster.png'},
  'rock-large':       { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1793015401/large_rock_cluster.png' },
  'table':            { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1793015341/wooden_table.png' },
  //'chair':            { imageUrl: ph('cartoon', 'chair') },
  'bridge':           { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1793015337/stone_bridge_with_stream.png' },
  'treasure':         { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1793015344/treasure_pile.png' },
  'well':             { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1793015352/stone_well.png'},
  'signpost':         { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1793015342/signpost.png' },
  'evergreen-tree':   { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1793015387/evergreen_tree.png' },
  'locked-chest':     { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1793015343/locked_chest.png' },
  'tent':             { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1793015349/canvas_tent.png' },
  'bookshelf':        { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1793015348/spellbook_stack.png' },
  'bed':              { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1793015346/bed.png' },
  'barrel':           { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1793015400/barrel.png' },
  'bones':            { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1793015398/bones_and_skull.png' },
  'mushrooms':        { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1793015397/red_mushrooms.png' },
  'fallen-log':       { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1793015380/fallen_log.png'},
  //'pillar':           { imageUrl: ph('cartoon', 'pillar') },
  'wooden-crate':     { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1793015394/wooden_crate.png' },
  //'gravestone':       { imageUrl: ph('cartoon', 'gravestone') },
}

// ── Coming soon (same shape as above; fill in when the packs are ready) ──
const SCIFI_ART = {
  'floor':              { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1794568718/c3_ground_01.png' },
  'wall':               { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1794568727/c3_ground_19.png' },
  'wood-wall':          { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1794568718/c3_ground_15.png' },
  'door':               { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1794568718/c3_ground_15.png' },
  'water':              { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1794568726/c1_ground_06.png' },
  'grass':              { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1793015360/grass.png' },
  'trap':               { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1794568714/c3_ground_06.png' },
  'stairs':             { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1793015361/stairs_up.png' },
  'stairs-down':        { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1793015372/stairs_down.png' },
  'sand':               { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1793015368/sand.png' },
  'rocky-dirt':         { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1794568715/c3_ground_11.png' },
  'lava':               { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1793015354/lava.png' },
  'snow':               { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1794568721/c1_ground_10.png' },
  'mossy-cobblestone':  { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1794568729/c1_ground_17.png' },
  'wood-planks':        { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1793015357/wood_planks.png' },
  'chest':              { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1794568717/c1_ground_22.png' },

  // Upper layer objects
  'torch':            { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1794568760/c1_object_012.png' },
  'campfire':         { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1794568752/c1_object_022.png' },
  'brazier':          { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1794568772/c3_object_007.png' },
  'magic-rune':       { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1794568771/c1_object_048.png' },
  'cauldron':         { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1794568751/c1_object_032.png'},
  'blue-crystal':     { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1794568762/c1_object_002.png' },
  'tree':             { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1794568755/c1_object_008.png' },
  'bush':             { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1794568741/c3_object_026.png' },
  'yellow-flowers':   { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1794568746/c3_object_025.png' },
  'thorny-brambles':  { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1794568758/c1_object_005.png' },
  'rock-small':       { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1794568743/c3_object_024.png' },
  'rock-medium':      { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1794568739/c3_object_027.png' },
  'rock-large':       { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1794568739/c3_object_023.png' },
  'table':            { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1794568768/c1_object_058.png' },
  //'chair':            { imageUrl: ph('cartoon', 'chair') },
  'bridge':           { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1794568745/c1_object_043.png' },
  'treasure':         { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1794568739/c3_object_033.png' },
  'well':             { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1794568733/c3_object_009.png'},
  'signpost':         { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1794568753/c1_object_037.png' },
  'evergreen-tree':   { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1794568761/c1_object_003.png' },
  'locked-chest':     { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1794568763/c1_object_014.png' },
  'tent':             { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1794568762/c1_object_017.png' },
  'bookshelf':        { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1794568769/c3_object_016.png' },
  'bed':              { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1794568771/c1_object_049.png' },
  'barrel':           { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1794568773/c3_object_005.png' },
  'bones':            { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1794568757/c1_object_039.png' },
  'mushrooms':        { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1794568747/c3_object_019.png' },
  'fallen-log':       { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1794568733/c3_object_021.png'},
  //'pillar':           { imageUrl: ph('cartoon', 'pillar') },
  'wooden-crate':     { imageUrl: 'https://res.cloudinary.com/crcbzpw6/image/upload/v1794568736/c3_object_020.png' },
  //'gravestone':       { imageUrl: ph('cartoon', 'gravestone') },
}
const WESTERN_ART = {

}

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
