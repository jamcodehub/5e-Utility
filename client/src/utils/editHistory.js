// Undo and redo for the map editor. A "stroke" is one click, or one click-and-drag, and undoing takes back the whole stroke.
// A snapshot is the map as it was: { grid, objectGrid, stairLinks, doorStates, rotations, objectRotations }.

export const HISTORY_LIMIT = 50

const PARTS = ['grid', 'objectGrid', 'stairLinks', 'doorStates', 'rotations', 'objectRotations', 'designLocks']

// The same map? (Grids are compared by their contents, since painting always makes new arrays.)
export function sameSnapshot(a, b) {
  if (a === b) return true
  if (!a || !b) return false
  return PARTS.every(key => a[key] === b[key] || JSON.stringify(a[key]) === JSON.stringify(b[key]))
}

// A stack with one more snapshot on top, the oldest dropped past the limit. The original stack is not changed.
export function pushSnapshot(stack, snapshot, limit = HISTORY_LIMIT) {
  const next = [...stack, snapshot]
  return next.length > limit ? next.slice(next.length - limit) : next
}

// End of a stroke: `before` is the map when the stroke started, `after` is the map now. Returns the new history; a stroke that
// changed nothing (clicking a square that already had that tile) is not recorded, and a real change clears the redo stack.
export function endStroke(history, before, after) {
  if (!before || sameSnapshot(before, after)) return history
  return { undo: pushSnapshot(history.undo, before), redo: [] }
}

// Take back the last stroke: the map goes back to the last snapshot, and where it was goes on the redo stack.
export function undo(history, current) {
  if (!history.undo.length) return null
  const restore = history.undo[history.undo.length - 1]
  return { restore, history: { undo: history.undo.slice(0, -1), redo: pushSnapshot(history.redo, current) } }
}

// Put back what undo took away.
export function redo(history, current) {
  if (!history.redo.length) return null
  const restore = history.redo[history.redo.length - 1]
  return { restore, history: { undo: pushSnapshot(history.undo, current), redo: history.redo.slice(0, -1) } }
}

export const emptyHistory = () => ({ undo: [], redo: [] })
