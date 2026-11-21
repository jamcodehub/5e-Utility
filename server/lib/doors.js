// Locked doors on the battle map. A door is open, closed (unlocked: anyone who walks into it opens it) or locked (only the DM
// can unlock it; a player who tries it sends the DM a request). Locks are a grid of booleans, row by row like the map.
//
// A map is designed with its locks in its saved content ({ ground, objects, stairLinks, doorLocks }, which the map generator
// writes); the board then keeps its own copy in LevelPlan.doorLocks, because unlocking a door is something that happens in play.

export const KNOCK_COOLDOWN_MS = 8000

const parse = (content) => {
  try { return JSON.parse(content) } catch { return null }
}

export function groundOf(content) {
  const map = parse(content)
  const ground = Array.isArray(map) ? map : map?.ground
  return Array.isArray(ground) ? ground : null
}

// The size of the map, or null.
export function dimsOf(content) {
  const ground = groundOf(content)
  return ground && Array.isArray(ground[0]) ? { rows: ground.length, cols: ground[0].length } : null
}

// The locks a map was designed with. Anything that is not a door is never locked.
export function locksFromContent(content) {
  const map = parse(content)
  const ground = Array.isArray(map) ? map : map?.ground
  const designed = Array.isArray(map) ? null : map?.doorLocks
  if (!Array.isArray(ground) || !Array.isArray(designed)) return []
  return ground.map((row, r) => (Array.isArray(row) ? row.map((tile, c) => tile === 'door' && designed[r]?.[c] === true) : []))
}

// After the map is edited: keep a lock only where there is still a door.
export function pruneLocks(locks, content) {
  const ground = groundOf(content)
  if (!ground || !Array.isArray(locks)) return []
  return ground.map((row, r) => (Array.isArray(row) ? row.map((tile, c) => tile === 'door' && locks[r]?.[c] === true) : []))
}

export const isLocked = (locks, row, col) => Array.isArray(locks) && locks[row]?.[col] === true

// A copy of the locks with one door locked or unlocked.
export function withLock(locks, row, col, locked) {
  const next = (Array.isArray(locks) ? locks : []).map(cells => (Array.isArray(cells) ? cells.slice() : []))
  while (next.length <= row) next.push([])
  next[row][col] = Boolean(locked)
  return next
}

// Players can knock on the same locked door only so often. `last` is a Map of "planId:row:col:userId" to the time of the last
// knock; returns true (and records it) when this knock is allowed.
export function canKnock(last, key, now, cooldown = KNOCK_COOLDOWN_MS) {
  const before = last.get(key)
  if (before !== undefined && now - before < cooldown) return false
  last.set(key, now)
  if (last.size > 2000) for (const [k, t] of last) if (now - t >= cooldown) last.delete(k)
  return true
}
