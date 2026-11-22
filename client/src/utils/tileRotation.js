// Turning tiles on the 2D battle map in quarter turns (0, 1, 2, 3 = 0, 90, 180, 270 degrees clockwise).
//  - Natural floor tiles (grass, dirt, stone...) turn at random, the same way for everyone, so a big field does not look like one
//    picture repeated. A square's turn is worked out from its position, so nothing needs saving for it.
//  - A map can also carry turns the author chose: `rotations` for the ground and `objectRotations` for the upper layer, grids
//    with a number 0..3 where the author turned a tile and null where it is automatic.

// Tiles whose picture has no direction, so turning it at random only adds variety. (Planks have a grain, walls have an edge.)
export const AUTO_ROTATE = new Set(['floor', 'grass', 'rocky-dirt', 'mossy-cobblestone', 'sand', 'snow'])

// What you can choose when placing tiles: null = automatic (random for natural floors, as drawn for everything else).
export const ROTATION_CHOICES = [null, 1, 2, 3, 0]

export function rotationLabel(choice) {
  return choice === null || choice === undefined ? 'Auto' : `${choice * 90}°`
}

// The next choice in the cycle Auto, 90°, 180°, 270°, 0°, Auto...
export function nextRotation(choice) {
  const at = ROTATION_CHOICES.indexOf(choice === undefined ? null : choice)
  return ROTATION_CHOICES[(at + 1) % ROTATION_CHOICES.length]
}

// A stable quarter turn from a square's position (a small integer hash, so neighbours differ).
export function autoRotation(row, col) {
  let h = Math.imul(row + 1, 374761393) ^ Math.imul(col + 1, 668265263)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) % 4
}

// How many quarter turns to draw a square with: the author's choice if there is one, else automatic.
export function rotationOf(tileId, stored, row, col) {
  if (Number.isInteger(stored) && stored >= 0 && stored <= 3) return stored
  return AUTO_ROTATE.has(tileId) ? autoRotation(row, col) : 0
}

// A saved grid of turns tidied to the map's size (null where automatic).
export function readRotations(value, rows, cols) {
  return Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, (_, c) => {
    const n = value?.[r]?.[c]
    return Number.isInteger(n) && n >= 0 && n <= 3 ? n : null
  }))
}

// The grid to save, or undefined when every square is automatic (so maps that never use it stay small).
export function compactRotations(grid) {
  return Array.isArray(grid) && grid.some(row => row.some(n => n !== null && n !== undefined)) ? grid : undefined
}

// A new grid with one square set (null = automatic).
export function withRotation(grid, row, col, choice) {
  return grid.map((cells, r) => (r === row ? cells.map((n, c) => (c === col ? (choice ?? null) : n)) : cells))
}

// Torches: which side of its square a torch sits on, chosen by clicking where it goes and dragging towards that side.
// Stored in `objectRotations`: 0 = right (east), 1 = down (south), 2 = left (west), 3 = up (north); null = automatic.
export const TORCH_ID = 'torch'

// The side a drag points to, from how far the pointer moved: null until it has moved a few pixels, then whichever way it went most.
export function dragSide(dx, dy, minimum = 10) {
  if (Math.hypot(dx, dy) < minimum) return null
  if (Math.abs(dx) >= Math.abs(dy)) return dx > 0 ? 0 : 2
  return dy > 0 ? 1 : 3
}

// How many quarter turns to draw an object with: torches are never turned (their number is a side, not a turn).
export function objectTurnOf(objectId, stored, row, col) {
  return objectId === TORCH_ID ? 0 : rotationOf(objectId, stored, row, col)
}
