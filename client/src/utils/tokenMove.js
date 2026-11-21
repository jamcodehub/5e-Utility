// Moving a token one square with the keyboard (WASD or the arrow keys) on the battle map. The rules match what the map
// generator treats as walkable: not through walls or closed doors, not onto water unless there is a bridge, not onto a
// tree, table, barrel and so on, and not onto another token.

const STEPS = {
  w: [-1, 0], arrowup: [-1, 0],
  s: [1, 0], arrowdown: [1, 0],
  a: [0, -1], arrowleft: [0, -1],
  d: [0, 1], arrowright: [0, 1],
}

// Objects that fill their square. Everything else (torches, chairs, bones, flowers, runes...) can be walked over.
export const BLOCKING_OBJECTS = new Set([
  'campfire', 'brazier', 'cauldron', 'blue-crystal', 'tree', 'bush', 'thorny-brambles', 'rock-small', 'rock-medium', 'rock-large',
  'table', 'treasure', 'well', 'open-chest', 'locked-chest', 'tent', 'bookshelf', 'bed', 'barrel', 'fallen-log', 'pillar',
  'wooden-crate', 'gravestone',
])

// The row and column change for a key, or null when it is not a movement key.
export function keyToStep(key) {
  const step = STEPS[String(key || '').toLowerCase()]
  return step ? { dr: step[0], dc: step[1] } : null
}

// Can a token stand on this square? `doorStates[row][col]` is true for an open door.
export function canStand(ground, objects, doorStates, row, col) {
  const tile = ground?.[row]?.[col]
  if (!tile || tile === 'empty' || tile === 'wall' || tile === 'wood-wall') return false
  const object = objects?.[row]?.[col] || null
  if (tile === 'water') return object === 'bridge'
  if (tile === 'door' && !doorStates?.[row]?.[col]) return false
  if (object && BLOCKING_OBJECTS.has(object)) return false
  return true
}

// The token list after moving token `id` one square, or the same list when the step is not allowed.
export function stepToken(tokens, id, step, ground, objects, doorStates) {
  if (!step) return tokens
  const token = tokens.find(t => t.id === id)
  if (!token || !Number.isInteger(token.row) || !Number.isInteger(token.col)) return tokens
  const row = token.row + step.dr
  const col = token.col + step.dc
  if (!canStand(ground, objects, doorStates, row, col)) return tokens
  if (tokens.some(t => t.id !== id && t.row === row && t.col === col)) return tokens
  return tokens.map(t => t.id === id ? { ...t, row, col } : t)
}

// Typing in a box must never move a token.
export function isTypingTarget(target) {
  if (!target || typeof target !== 'object') return false
  const tag = String(target.tagName || '').toLowerCase()
  return tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable === true
}

// Is the token walking into a closed door? Returns { row, col } of the door, or null. (A door someone else stands in, or one the
// token could not reach anyway, does not count.)
export function bumpedDoor(tokens, id, step, ground, doorStates) {
  if (!step) return null
  const token = tokens.find(t => t.id === id)
  if (!token || !Number.isInteger(token.row) || !Number.isInteger(token.col)) return null
  const row = token.row + step.dr
  const col = token.col + step.dc
  if (ground?.[row]?.[col] !== 'door' || doorStates?.[row]?.[col]) return null
  return tokens.some(t => t.id !== id && t.row === row && t.col === col) ? null : { row, col }
}
