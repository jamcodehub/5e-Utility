// What a player (anyone who is not the map's owner) may change on the shared battle board: only where their own character's
// token stands. They cannot add, remove or edit other tokens, move other people's tokens, or change hit points, light or
// darkvision. The owner (the DM) is not limited.

export const playerTokenId = (userId) => `char-${userId}`

// The size of the saved map, or null when it cannot be read.
export function mapDims(content) {
  try {
    const ground = JSON.parse(content)?.ground
    if (Array.isArray(ground) && Array.isArray(ground[0])) return { rows: ground.length, cols: ground[0].length }
  } catch { /* an old or empty map: no size check */ }
  return null
}

// The token list after a player's update: the stored list, with only their own token's square changed (and only to a square on
// the map). `existing` is what is stored, `incoming` what the player sent.
export function applyPlayerTokenUpdate(existing, incoming, userId, dims = null) {
  const mine = playerTokenId(userId)
  const sent = Array.isArray(incoming) ? incoming.find(t => t && t.id === mine) : null
  return (Array.isArray(existing) ? existing : []).map(prev => {
    if (!prev || prev.id !== mine || !sent) return prev
    const { row, col } = sent
    if (!Number.isInteger(row) || !Number.isInteger(col) || row < 0 || col < 0) return prev
    if (dims && (row >= dims.rows || col >= dims.cols)) return prev
    return { ...prev, row, col }
  })
}

// True when the player's update was applied exactly as sent, so nothing needs correcting on their screen.
export function sameTokens(a, b) {
  return JSON.stringify(a) === JSON.stringify(b)
}
