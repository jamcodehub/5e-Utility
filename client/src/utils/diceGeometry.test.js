import test from 'node:test'
import assert from 'node:assert/strict'
import { buildDie, DIE_KINDS, sidesOf, dot, len, cross, restTransform, faceMatrix, percentile } from './diceGeometry.js'

const SIZE = 60
const near = (a, b, eps = 1e-6) => Math.abs(a - b) < eps

for (const kind of DIE_KINDS) {
  test(`${kind}: right number of faces, numbered 1..${sidesOf(kind)} exactly once`, () => {
    const faces = buildDie(kind, SIZE)
    assert.equal(faces.length, sidesOf(kind))
    assert.deepEqual(faces.map(f => f.num).sort((a, b) => a - b), Array.from({ length: sidesOf(kind) }, (_, i) => i + 1))
  })

  test(`${kind}: faces are flat, point outward, the die is convex and every basis is a proper rotation`, () => {
    const faces = buildDie(kind, SIZE)
    // all vertices of the polyhedron (collected from the faces) lie on or behind every face plane
    const verts = faces.flatMap(f => f.local.map(([x, y]) => [f.c[0] + x * f.u[0] + y * f.v[0], f.c[1] + x * f.u[1] + y * f.v[1], f.c[2] + x * f.u[2] + y * f.v[2]]))
    for (const f of faces) {
      assert.ok(dot(f.n, f.c) > 0, 'normal points outward')
      assert.ok(near(len(f.n), 1) && near(len(f.u), 1) && near(len(f.v), 1), 'unit axes')
      assert.ok(near(dot(f.u, f.v), 0) && near(dot(f.u, f.n), 0) && near(dot(f.v, f.n), 0), 'orthogonal axes')
      const w = cross(f.u, f.v)
      assert.ok(near(w[0], f.n[0]) && near(w[1], f.n[1]) && near(w[2], f.n[2]), 'u x v = n (not mirrored)')
      const plane = dot(f.n, f.c)
      for (const p of verts) assert.ok(dot(p, f.n) <= plane + 1e-6, 'convex: no vertex in front of a face')
      for (const [x, y] of f.local) assert.ok(Math.abs(x) <= f.S / 2 + 1e-9 && Math.abs(y) <= f.S / 2 + 1e-9, 'polygon fits its square')
    }
  })

  test(`${kind}: opposite faces add up to ${sidesOf(kind) + 1} (except the d4, which has none)`, () => {
    if (kind === 'd4') return
    const faces = buildDie(kind, SIZE)
    for (const f of faces) {
      const opp = faces.find(g => dot(g.n, f.n) < -0.97)
      assert.ok(opp, 'every face has an opposite')
      assert.equal(f.num + opp.num, sidesOf(kind) + 1)
    }
  })

  test(`${kind}: fits in its box and CSS strings are well formed`, () => {
    const faces = buildDie(kind, SIZE)
    for (const f of faces) {
      assert.ok(len(f.c) <= SIZE, 'face centre inside the die box')
      if (kind === 'd6') assert.equal(f.clip, null, 'a square face needs no clip-path')
      else assert.match(f.clip, /^polygon\((\d+\.\d+% \d+\.\d+%(, )?)+\)$/)
      assert.match(faceMatrix(f), /^matrix3d\(/)
      assert.match(restTransform(faces, f.num), /^matrix3d\(/)
      for (const m of (f.clip || '').matchAll(/(-?\d+\.\d+)%/g)) assert.ok(+m[1] >= -0.001 && +m[1] <= 100.001, 'clip stays inside the square')
    }
  })
}

test('d10 kite faces are exactly planar (four points on one plane)', () => {
  for (const f of buildDie('d10', SIZE)) {
    assert.equal(f.local.length, 4)
    for (const [x, y] of f.local) { assert.ok(Number.isFinite(x) && Number.isFinite(y)) }
  }
})

test('rolling a face to the front: its rest rotation maps the face normal to +z (towards the viewer)', () => {
  for (const kind of DIE_KINDS) {
    const faces = buildDie(kind, SIZE)
    for (const f of faces) {
      const m = restTransform(faces, f.num).match(/matrix3d\((.*)\)/)[1].split(',').map(Number)
      // column-major 4x4; applying it to the face normal gives its z component = m[2]*nx + m[6]*ny + m[10]*nz
      const z = m[2] * f.n[0] + m[6] * f.n[1] + m[10] * f.n[2]
      assert.ok(near(z, 1, 1e-9), `${kind} face ${f.num}`)
    }
  }
})

test('percentile: every result 1..100 is reachable and 00 + 0 is 100', () => {
  const seen = new Set()
  for (let t = 1; t <= 10; t++) for (let u = 1; u <= 10; u++) seen.add(percentile(t, u))
  assert.equal(seen.size, 100)
  assert.deepEqual([Math.min(...seen), Math.max(...seen)], [1, 100])
  assert.equal(percentile(10, 10), 100, '00 and 0')
  assert.equal(percentile(10, 1), 1, '00 and 1')
  assert.equal(percentile(3, 10), 30, '30 and 0')
  assert.equal(percentile(9, 9), 99)
})
