// True 3D polyhedra for the dice page. Each die is a set of flat faces; every face is a CSS-transformed square whose
// clip-path cuts out the face's polygon. buildDie() returns, per face, everything the page needs:
//   c: centre, n: outward normal, u/v: in-plane axes (v points "down" the face so numbers read upright),
//   S: edge of the square element, clip: polygon() for the face, num: the number printed on it.
// Pure maths, no DOM, so it can be unit-tested in Node.

export const PHI = (1 + Math.sqrt(5)) / 2

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k]
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
export const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const len = (a) => Math.hypot(a[0], a[1], a[2])
export const norm = (a) => mul(a, 1 / len(a))
const mean = (pts) => mul(pts.reduce(add, [0, 0, 0]), 1 / pts.length)

const signs = [-1, 1]
const cube = signs.flatMap(x => signs.flatMap(y => signs.map(z => [x, y, z])))
const axes = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]
const icosaVerts = signs.flatMap(a => signs.flatMap(b => [[0, a, b * PHI], [a, b * PHI, 0], [b * PHI, 0, a]]))
// The dodecahedron is the icosahedron's dual: its vertices are the centres of the icosahedron's 20 triangular faces
// (edge length of this icosahedron is 2). Building it that way keeps the two shapes' orientations in step.
const dodecaVerts = (() => {
  const out = []
  for (let i = 0; i < icosaVerts.length; i++) for (let j = i + 1; j < icosaVerts.length; j++) for (let k = j + 1; k < icosaVerts.length; k++) {
    const a = icosaVerts[i], b = icosaVerts[j], c = icosaVerts[k]
    if ([[a, b], [b, c], [a, c]].every(([p, q]) => Math.abs(len(sub(p, q)) - 2) < 1e-6)) out.push(mean([a, b, c]))
  }
  return out
})()

// The vertices lying on the plane with the given outward normal, in cyclic order around it.
function faceFromNormal(verts, normal) {
  const n = norm(normal)
  const best = Math.max(...verts.map(p => dot(p, n)))
  const idx = verts.map((p, i) => [p, i]).filter(([p]) => Math.abs(dot(p, n) - best) < 1e-6).map(([, i]) => i)
  const c = mean(idx.map(i => verts[i]))
  const a = norm(sub(verts[idx[0]], c)), b = cross(n, a)
  return idx.sort((i, j) => Math.atan2(dot(sub(verts[i], c), b), dot(sub(verts[i], c), a)) - Math.atan2(dot(sub(verts[j], c), b), dot(sub(verts[j], c), a)))
}

// Pentagonal trapezohedron (d10): two poles and a zig-zag ring of ten vertices. The ring height that makes the
// kite faces exactly flat is z0 = h (1 - cos 36deg) / (1 + cos 36deg).
function d10Shape() {
  const h = 1, r = 0.9, c36 = Math.cos(Math.PI / 5), z0 = h * (1 - c36) / (1 + c36)
  const T = [0, 0, h], B = [0, 0, -h]
  const ring = Array.from({ length: 10 }, (_, k) => [r * Math.cos(k * Math.PI / 5), r * Math.sin(k * Math.PI / 5), k % 2 === 0 ? z0 : -z0])
  const verts = [T, B, ...ring] // 0 = top pole, 1 = bottom pole, 2.. = ring
  const R = (k) => 2 + ((k % 10) + 10) % 10
  const faces = []
  for (let i = 0; i < 5; i++) faces.push([0, R(2 * i), R(2 * i + 1), R(2 * i + 2)])   // top kites, pole first
  for (let i = 0; i < 5; i++) faces.push([1, R(2 * i + 1), R(2 * i + 2), R(2 * i + 3)]) // bottom kites
  return { verts, faces }
}

// radius = circumradius as a fraction of the die box; up = how each face is turned so its number reads upright
const SHAPES = {
  d4:  { sides: 4,  radius: 0.86, up: 'vertex', build: () => { const verts = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]]; return { verts, faces: verts.map(v => faceFromNormal(verts, mul(v, -1))) } } },
  d6:  { sides: 6,  radius: 0.78, up: 'edge',   build: () => ({ verts: cube, faces: axes.map(a => faceFromNormal(cube, a)) }) },
  d8:  { sides: 8,  radius: 0.9,  up: 'vertex', build: () => { const verts = axes; return { verts, faces: cube.map(n => faceFromNormal(verts, n)) } } },
  d10: { sides: 10, radius: 0.95, up: 'vertex', build: d10Shape },
  d12: { sides: 12, radius: 0.88, up: 'vertex', build: () => ({ verts: dodecaVerts, faces: icosaVerts.map(n => faceFromNormal(dodecaVerts, n)) }) },
  d20: { sides: 20, radius: 0.95, up: 'vertex', build: () => ({ verts: icosaVerts, faces: dodecaVerts.map(n => faceFromNormal(icosaVerts, n)) }) },
}
export const DIE_KINDS = Object.keys(SHAPES)
export const sidesOf = (kind) => SHAPES[kind].sides

// `size` is the box the die lives in (px). Returns the faces, numbered so opposite faces add up to sides + 1
// (a d4 has no opposite faces, so it is just numbered 1 to 4).
export function buildDie(kind, size) {
  const spec = SHAPES[kind]
  const { verts: raw, faces: idx } = spec.build()
  const R = Math.max(...raw.map(len))
  const verts = raw.map(p => mul(p, (spec.radius * size) / R))
  const faces = idx.map(ids => {
    const pts = ids.map(i => verts[i])
    const c = mean(pts)
    // true face normal from the face's own edges, turned to point away from the die's centre
    let n = norm(cross(sub(pts[1], pts[0]), sub(pts[2], pts[0])))
    if (dot(n, c) < 0) n = mul(n, -1)
    const upDir = spec.up === 'edge' ? sub(mul(add(pts[0], pts[1]), 0.5), c) : sub(pts[0], c)
    const v = mul(norm(upDir), -1)          // down the face
    const u = cross(v, n)
    const local = pts.map(p => [dot(sub(p, c), u), dot(sub(p, c), v)])
    const half = Math.max(...local.flat().map(Math.abs))
    const S = half * 2
    // A face that is already a full square (the d6) needs no clip-path, and some browsers fail to paint such a clipped face
    const isSquare = local.length === 4 && local.every(([x, y]) => Math.abs(Math.abs(x) - half) < 1e-6 && Math.abs(Math.abs(y) - half) < 1e-6)
    const clip = isSquare ? null : `polygon(${local.map(([x, y]) => `${(50 + (x / S) * 100).toFixed(3)}% ${(50 + (y / S) * 100).toFixed(3)}%`).join(', ')})`
    return { c, n, u, v, S, clip, num: 0, local }
  })
  let next = 1
  faces.forEach((f, i) => {
    if (f.num) return
    f.num = next++
    if (kind === 'd4') return
    const j = faces.findIndex((g, x) => x !== i && !g.num && dot(g.n, f.n) < -0.97)
    if (j >= 0) faces[j].num = spec.sides + 1 - f.num
  })
  return faces
}

// CSS matrix placing a face on the die, and the rotation that brings a numbered face to the front, upright.
export const faceMatrix = (f) => `matrix3d(${[...f.u, 0, ...f.v, 0, ...f.n, 0, ...f.c, 1].join(',')})`
export const restTransform = (faces, num) => {
  const f = faces.find(x => x.num === num)
  return `matrix3d(${[f.u[0], f.v[0], f.n[0], 0, f.u[1], f.v[1], f.n[1], 0, f.u[2], f.v[2], f.n[2], 0, 0, 0, 0, 1].join(',')})`
}
export const randomSpin = () => {
  const a = norm([Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5])
  return `rotate3d(${a.join(',')},${Math.floor(Math.random() * 360)}deg)`
}
export { dot, len }

// d% is two d10s. Faces are numbered 1..10 and print as 1..9, 0 (units die) or 10..90, 00 (tens die); face 10 means 0.
// 00 + 0 counts as 100.
export const percentile = (tensFace, unitsFace) => ((tensFace % 10) * 10 + (unitsFace % 10)) || 100
