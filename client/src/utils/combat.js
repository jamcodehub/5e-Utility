// Battle tracker rules: initiative, attacks, healing and turn order. Pure functions (plus the dice engine),
// so they can be tested without the UI.
import { rollD20, rollDice, signed } from './dice.js'

export const abilityMod = (score) => Math.floor(((score ?? 10) - 10) / 2)

// d20 + initiative bonus for every combatant. Returns { [id]: { roll, total } }.
export function rollInitiative(combatants) {
  return Object.fromEntries(combatants.map(c => {
    const r = rollD20({ mod: c.initBonus || 0 })
    return [c.id, { roll: r.chosen, total: r.total }]
  }))
}

const TYPE_ORDER = { player: 0, npc: 1, enemy: 2, boss: 3 }

// Highest initiative first; ties go to the higher bonus, then players before monsters, then name.
// Combatants with no initiative yet keep the old grouping (players, npcs, enemies, bosses) after the rolled ones.
export function sortByInitiative(list) {
  return [...list].sort((a, b) => {
    const ai = a.init, bi = b.init
    if ((ai == null) !== (bi == null)) return ai == null ? 1 : -1
    if (ai != null && ai !== bi) return bi - ai
    if (ai != null && (a.initBonus || 0) !== (b.initBonus || 0)) return (b.initBonus || 0) - (a.initBonus || 0)
    const t = (TYPE_ORDER[a.type] ?? 4) - (TYPE_ORDER[b.type] ?? 4)
    return t || String(a.name).localeCompare(String(b.name))
  })
}

// The next combatant who isn't down. After the last one the round counter goes up.
export function nextTurn(order, turnId, round) {
  const alive = order.filter(c => !c.maxHp || c.hp > 0)
  if (!alive.length) return { turnId: null, round }
  const idx = alive.findIndex(c => c.id === turnId)
  if (idx === -1) return { turnId: alive[0].id, round }
  if (idx === alive.length - 1) return { turnId: alive[0].id, round: round + 1 }
  return { turnId: alive[idx + 1].id, round }
}

// One attack: d20 + bonus against the target's AC. Natural 20 always hits and doubles the damage dice,
// a natural 1 always misses. `attack` is { name, bonus, dmg, type }.
export function resolveAttack({ attack, target, mode = 'normal' }) {
  const d20 = rollD20({ mod: attack.bonus || 0, mode })
  const ac = target.ac
  const hasAc = Number.isFinite(ac)
  const crit = d20.nat20
  const hit = crit || (!d20.nat1 && (!hasAc || d20.total >= ac))
  const dmgRoll = hit ? rollDice(attack.dmg, { crit }) : null
  if (hit && !dmgRoll) throw new Error(`Bad damage expression: ${attack.dmg}`)
  const damage = dmgRoll ? Math.max(0, dmgRoll.total) : 0
  return { d20, ac: hasAc ? ac : null, hit, crit, miss: !hit, nat1: d20.nat1, damage, dmgRoll }
}

export const applyDamage = (c, amount) => ({ ...c, hp: Math.max(0, (c.hp ?? c.maxHp ?? 0) - amount) })
export const applyHeal = (c, amount) => ({ ...c, hp: Math.min(c.maxHp ?? 999, (c.hp ?? 0) + amount) })

// "8", "2d4+2" → { total, text }. Returns null for anything else.
export function parseAmount(input) {
  const s = String(input ?? '').trim()
  if (!s || s.startsWith('-')) return null
  if (/^\d+$/.test(s)) return { total: parseInt(s, 10), text: s }
  const r = rollDice(s)
  return r ? { total: Math.max(0, r.total), text: `${s} = ${Math.max(0, r.total)}` } : null
}

export function describeAttack(attacker, target, attack, r) {
  const roll = `d20 ${r.d20.values.length > 1 ? `(${r.d20.values.join(', ')}) ` : ''}${r.d20.chosen}${attack.bonus ? ' ' + signed(attack.bonus) : ''} = ${r.d20.total}${r.ac != null ? ` vs AC ${r.ac}` : ''}`
  if (r.crit) return `${attacker.name} critically hits ${target.name} with ${attack.name} (${roll}) for ${r.damage}${attack.type ? ' ' + attack.type : ''} damage!`
  if (r.nat1) return `${attacker.name} fumbles an attack on ${target.name} with ${attack.name} (natural 1).`
  if (r.hit) return `${attacker.name} hits ${target.name} with ${attack.name} (${roll}) for ${r.damage}${attack.type ? ' ' + attack.type : ''} damage.`
  return `${attacker.name} misses ${target.name} with ${attack.name} (${roll}).`
}

// Rebuilds the fight after a reload. `fresh` is the party as just loaded from their character sheets (so sheet
// changes and HP are current); `saved` is the stored combatants. Party members keep only their saved initiative,
// anyone no longer in the party is dropped, new party members are added, and monsters/lore/custom come back as saved.
export function mergeSaved(fresh, saved) {
  const freshById = Object.fromEntries(fresh.map(c => [c.id, c]))
  const kept = []
  for (const s of saved || []) {
    if (s.source === 'party') {
      if (freshById[s.id]) kept.push({ ...freshById[s.id], init: s.init ?? null })
    } else kept.push(s)
  }
  const have = new Set(kept.map(c => c.id))
  return [...kept, ...fresh.filter(c => !have.has(c.id))]
}
