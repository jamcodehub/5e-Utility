// Dice engine. Uses the browser's cryptographic RNG with rejection sampling,
// so every face is exactly equally likely (no modulo bias, no Math.random).

const RANGE = 0x100000000

// Uniform integer in [0, n)
export function randomInt(n) {
  if (!Number.isInteger(n) || n <= 1) return 0
  const buf = new Uint32Array(1)
  const limit = RANGE - (RANGE % n)
  do { crypto.getRandomValues(buf) } while (buf[0] >= limit)
  return buf[0] % n
}

export const rollDie = (sides) => randomInt(sides) + 1

const FULL = /^([+-]?(\d*d\d+|\d+))+$/
const TERM = /([+-]?)(\d*)(d?)(\d+)/g

// "2d6 + 3", "1d8+1d4-1", "d20" → [{ sign, count, sides }] (sides 0 = flat modifier)
export function parseDice(expr) {
  const clean = String(expr || '').replace(/\s+/g, '').toLowerCase()
  if (!clean || !FULL.test(clean)) return null
  const terms = []
  for (const m of clean.matchAll(TERM)) {
    const sign = m[1] === '-' ? -1 : 1
    if (m[3] === 'd') {
      const count = m[2] === '' ? 1 : parseInt(m[2], 10)
      const sides = parseInt(m[4], 10)
      if (count < 1 || count > 100 || sides < 2 || sides > 1000) return null
      terms.push({ sign, count, sides })
    } else {
      terms.push({ sign, count: 0, sides: 0, flat: parseInt(m[2] + m[4], 10) })
    }
  }
  return terms.length ? terms : null
}

// Rolls an expression. `crit` doubles the number of dice (not the flat bonus), per the 5e critical hit rule.
export function rollDice(expr, { crit = false } = {}) {
  const terms = parseDice(expr)
  if (!terms) return null
  let total = 0
  const dice = []
  let flat = 0
  for (const t of terms) {
    if (t.sides) {
      const n = crit ? t.count * 2 : t.count
      const values = Array.from({ length: n }, () => rollDie(t.sides))
      total += t.sign * values.reduce((a, b) => a + b, 0)
      dice.push({ sides: t.sides, values, sign: t.sign })
    } else {
      flat += t.sign * t.flat
      total += t.sign * t.flat
    }
  }
  return { total, dice, flat, crit, expr: String(expr).trim() }
}

// d20 test with optional advantage / disadvantage
export function rollD20({ mod = 0, mode = 'normal' } = {}) {
  const values = Array.from({ length: mode === 'normal' ? 1 : 2 }, () => rollDie(20))
  const chosen = mode === 'adv' ? Math.max(...values) : mode === 'dis' ? Math.min(...values) : values[0]
  return { values, chosen, mod, total: chosen + mod, mode, nat20: chosen === 20, nat1: chosen === 1 }
}

export const signed = (n) => (n >= 0 ? `+${n}` : `${n}`)

// Pull the first dice expression out of free text ("deals 8d6 fire damage" → "8d6")
export const findDice = (text) => String(text || '').match(/\b\d+d\d+(?:\s*[+-]\s*\d+)?/i)?.[0]?.replace(/\s+/g, '') || null
export const findAllDice = (text, max = 3) => [...new Set((String(text || '').match(/\b\d+d\d+(?:\s*[+-]\s*\d+)?/gi) || []).map(s => s.replace(/\s+/g, '')))].slice(0, max)
