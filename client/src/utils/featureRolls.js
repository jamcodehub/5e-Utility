import { abilityMod } from './rules5e'

// Auto-calculated numbers for SRD class features. Everything derives from the
// character's level, ability scores and proficiency bonus, so it updates on level-up.

const tier = (level, steps) => steps.reduce((v, [min, val]) => (level >= min ? val : v), steps[0][1])
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`

// Level-gated variants of one feature: only the highest unlocked one is shown.
const FAMILIES = [
  /^bardic-inspiration-d\d+$/, /^song-of-rest-d\d+$/, /^action-surge-/, /^indomitable-\d/,
  /^extra-attack-\d/, /^brutal-critical-/, /^destroy-undead-/, /^channel-divinity-\d-rest$/,
  /^wild-shape-/, /^unarmored-movement-/, /^favored-enemy-/, /^natural-explorer-/,
]

export function collapseFamilies(features) {
  const lastIndex = new Map()
  features.forEach((f, i) => {
    const fam = FAMILIES.findIndex(r => r.test(f.id))
    if (fam >= 0) lastIndex.set(fam, i)
  })
  return features.filter((f, i) => {
    const fam = FAMILIES.findIndex(r => r.test(f.id))
    return fam < 0 || lastIndex.get(fam) === i
  })
}

// Returns { rolls: [{label, expr}], info: [string] } for a feature, or null.
export function featureMechanics(id, { level, stats, prof, classId }) {
  const m = (a) => abilityMod((stats || {})[a])
  const dc = (a) => 8 + prof + m(a)
  const rolls = []
  const info = []
  let bardDie
  switch (true) {
    case id === 'rage': {
      const uses = level >= 20 ? 'Unlimited' : tier(level, [[1, 2], [3, 3], [6, 4], [12, 5], [17, 6]])
      info.push(`Uses per long rest: ${uses}`, `Rage damage: +${tier(level, [[1, 2], [9, 3], [16, 4]])}`)
      break
    }
    case id === 'second-wind':
      rolls.push({ label: 'Heal', expr: `1d10+${level}` })
      info.push('1 use per short or long rest')
      break
    case id.startsWith('action-surge-'):
      info.push(`Uses per rest: ${level >= 17 ? 2 : 1}`)
      break
    case id.startsWith('indomitable-'):
      info.push(`Uses per long rest: ${tier(level, [[9, 1], [13, 2], [17, 3]])}`)
      break
    case /extra-attack/.test(id):
      info.push(`Attacks per Attack action: ${classId === 'fighter' ? tier(level, [[5, 2], [11, 3], [20, 4]]) : 2}`)
      break
    case id.startsWith('brutal-critical-'):
      info.push(`Extra weapon dice on a critical hit: ${tier(level, [[9, 1], [13, 2], [17, 3]])}`)
      break
    case (bardDie = id.match(/^bardic-inspiration-d(\d+)$/)?.[1]) != null:
      rolls.push({ label: 'Inspiration die', expr: `1d${bardDie}` })
      info.push(`Uses: ${Math.max(1, m('cha'))} (Charisma modifier), recharges on ${level >= 5 ? 'short or long rest' : 'long rest'}`)
      break
    case id.startsWith('song-of-rest-d'):
      rolls.push({ label: 'Extra healing', expr: `1d${id.split('-d')[1]}` })
      break
    case id === 'divine-sense':
      info.push(`Uses per long rest: ${1 + Math.max(0, m('cha'))}`)
      break
    case id === 'lay-on-hands':
      info.push(`Healing pool: ${level * 5} HP per long rest`)
      break
    case id === 'divine-smite':
      for (const slot of [1, 2, 3, 4]) rolls.push({ label: `Smite (level ${slot} slot)`, expr: `${slot + 1}d8` })
      info.push('Add 1d8 against undead or fiends')
      break
    case id === 'improved-divine-smite':
      rolls.push({ label: 'Radiant bonus', expr: '1d8' })
      break
    case id === 'channel-divinity-turn-undead' || id === 'channel-divinity-turn-the-unholy':
      info.push(`Save DC ${dc('wis')}`)
      break
    case id.startsWith('channel-divinity-') && /-rest$/.test(id):
      info.push(`Uses per short or long rest: ${tier(level, [[2, 1], [6, 2], [18, 3]])}`)
      break
    case id === 'channel-divinity-preserve-life':
      info.push(`Healing pool: ${level * 5} HP, split among creatures (no more than half their max HP)`)
      break
    case id === 'sneak-attack':
      rolls.push({ label: 'Sneak Attack', expr: `${Math.ceil(level / 2)}d6` })
      break
    case id === 'martial-arts': {
      const die = tier(level, [[1, 4], [5, 6], [11, 8], [17, 10]])
      rolls.push({ label: 'Martial Arts damage', expr: `1d${die}${m('dex') ? (m('dex') > 0 ? '+' : '') + m('dex') : ''}` })
      break
    }
    case id === 'ki':
      info.push(`Ki points: ${level}`, `Ki save DC ${dc('wis')}`)
      break
    case id === 'stunning-strike' || id === 'open-hand-technique':
      info.push(`Save DC ${dc('wis')}`)
      break
    case id === 'flurry-of-blows' || id === 'step-of-the-wind':
      info.push('Costs 1 ki point')
      break
    case id.startsWith('unarmored-movement-'):
      info.push(`Speed bonus: +${tier(level, [[2, 10], [6, 15], [10, 20], [14, 25], [18, 30]])} ft`)
      break
    case id === 'wholeness-of-body':
      info.push(`Heal up to ${level * 3} HP (once per long rest)`)
      break
    case id === 'font-of-magic':
      info.push(`Sorcery points: ${level}`)
      break
    case id === 'arcane-recovery' || id === 'natural-recovery':
      info.push(`Recover spell slots totalling up to level ${Math.ceil(level / 2)} (none of 6th level or higher)`)
      break
    case id === 'monk-unarmored-defense':
      info.push(`Unarmored AC: ${10 + m('dex') + m('wis')}`)
      break
    case id === 'barbarian-unarmored-defense':
      info.push(`Unarmored AC: ${10 + m('dex') + m('con')}`)
      break
    case id === 'cutting-words':
      rolls.push({ label: 'Subtract', expr: `1d${tier(level, [[1, 6], [5, 8], [10, 10], [15, 12]])}` })
      info.push(`Uses: ${Math.max(1, m('cha'))}`)
      break
    case id === 'wild-shape-cr-1-4-or-below-no-flying-or-swim-speed' || id.startsWith('wild-shape-'):
      info.push('2 uses per short or long rest')
      break
    case id === 'divine-intervention':
      info.push(`Success chance: ${level}% (roll d100, succeed on ${level} or lower)`)
      rolls.push({ label: 'd100', expr: '1d100' })
      break
    default:
      return null
  }
  if (!rolls.length && !info.length) return null
  return { rolls, info }
}

// Limited-use features: { max, recharge: 'short' | 'long' } (SRD 5.1 resting rules).
export function featureUses(id, { level, stats, classId }) {
  const m = (a) => abilityMod((stats || {})[a])
  if (id === 'rage') return level >= 20 ? null : { max: tier(level, [[1, 2], [3, 3], [6, 4], [12, 5], [17, 6]]), recharge: 'long' }
  if (id === 'second-wind') return { max: 1, recharge: 'short' }
  if (id.startsWith('action-surge-')) return { max: level >= 17 ? 2 : 1, recharge: 'short' }
  if (id.startsWith('indomitable-')) return { max: tier(level, [[9, 1], [13, 2], [17, 3]]), recharge: 'long' }
  if (/^bardic-inspiration-d/.test(id)) return { max: Math.max(1, m('cha')), recharge: level >= 5 ? 'short' : 'long' }
  if (id === 'cutting-words') return { max: Math.max(1, m('cha')), recharge: 'long' }
  if (id === 'divine-sense') return { max: 1 + Math.max(0, m('cha')), recharge: 'long' }
  if (/^channel-divinity-\d-rest$/.test(id)) return { max: tier(level, [[2, 1], [6, 2], [18, 3]]), recharge: 'short' }
  if (id === 'channel-divinity') return { max: 1, recharge: 'short' }
  if (id === 'ki') return { max: level, recharge: 'short' }
  if (id === 'font-of-magic') return { max: level, recharge: 'long' }
  if (id === 'arcane-recovery' || id === 'natural-recovery' || id === 'wholeness-of-body' || id === 'divine-intervention') return { max: 1, recharge: 'long' }
  if (id.startsWith('wild-shape-')) return { max: 2, recharge: 'short' }
  if (id === 'lay-on-hands') return null
  return null
}
