// Ground height on a battle map (mountains, dunes, temple platforms). A map's saved content can carry `heights`: a grid of whole
// levels 0..15, one per square. The flat board shades it like a relief map, and the 3D view raises the ground.
export const MAX_HEIGHT = 15

// The heights as a clean grid of whole levels the size of the map, or null when the map has none.
export function readHeights(value, rows, cols) {
  if (!Array.isArray(value)) return null
  let any = false
  const grid = Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, (_, c) => {
    const n = value[r]?.[c]
    const level = Number.isInteger(n) ? Math.max(0, Math.min(MAX_HEIGHT, n)) : 0
    if (level > 0) any = true
    return level
  }))
  return any ? grid : null
}

// How much lighter (positive) or darker (negative) a square looks: higher ground is lighter, the slope facing the light (up and
// to the left) is lit and the far side is shaded.
export function heightShadeAlpha(heights, r, c) {
  const here = heights?.[r]?.[c] ?? 0
  const nw = heights?.[r - 1]?.[c - 1] ?? here
  return Math.max(-0.3, Math.min(0.4, (here - nw) * 0.07 + here * 0.012))
}

// CSS for one square: a light or dark wash plus a dark edge on each side that drops to much lower ground (thicker when steeper).
export function heightShade(heights, r, c) {
  if (!heights) return null
  const here = heights[r]?.[c] ?? 0
  const alpha = heightShadeAlpha(heights, r, c)
  const background = alpha > 0 ? `rgba(255,255,255,${alpha.toFixed(3)})` : `rgba(0,0,0,${(-alpha).toFixed(3)})`
  const edges = []
  for (const [dr, dc, x, y] of [[0, 1, -1, 0], [0, -1, 1, 0], [1, 0, 0, -1], [-1, 0, 0, 1]]) {
    const neighbour = heights[r + dr]?.[c + dc]
    if (neighbour === undefined) continue
    const drop = here - neighbour
    if (drop >= 2) edges.push(`inset ${x * Math.min(4, 1 + drop * 0.6)}px ${y * Math.min(4, 1 + drop * 0.6)}px 0 rgba(0,0,0,${Math.min(0.75, 0.25 + drop * 0.12).toFixed(2)})`)
  }
  return { background, boxShadow: edges.length ? edges.join(', ') : undefined }
}
