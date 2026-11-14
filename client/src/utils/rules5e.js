// Pure 5e rules helpers (SRD 5.1). No React, no I/O — easy to test.

import { findDice } from './dice'

export const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha']
export const ABILITY_NAMES = { str: 'Strength', dex: 'Dexterity', con: 'Constitution', int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma' }

export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8]
export const POINT_BUY_BUDGET = 27
const POINT_COST = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 }

export const abilityMod = (score) => Math.floor(((Number(score) || 10) - 10) / 2)
export const fmtMod = (n) => (n >= 0 ? `+${n}` : `${n}`)

export const proficiencyBonus = (level) => 2 + Math.floor((Math.max(1, Math.min(20, level || 1)) - 1) / 4)

export const pointBuyCost = (stats) =>
  ABILITIES.reduce((sum, a) => sum + (POINT_COST[stats[a]] ?? Infinity), 0)

export const canRaise = (stats, ability) =>
  stats[ability] < 15 && pointBuyCost({ ...stats, [ability]: stats[ability] + 1 }) <= POINT_BUY_BUDGET

export const canLower = (stats, ability) => stats[ability] > 8

// Level 1 hit points: max hit die + CON. Later levels: fixed average or a roll, + CON (min 1 per level).
export const hpAtFirstLevel = (hitDie, conMod) => Math.max(1, hitDie + conMod)
export const averageHpGain = (hitDie) => Math.floor(hitDie / 2) + 1
export const hpGain = (hitDie, conMod, roll) => Math.max(1, (roll ?? averageHpGain(hitDie)) + conMod)

export const levelRow = (cls, level) => cls?.levels?.find(l => l.level === level)

// Spell slots by slot level for a class at a level, e.g. { 1: 4, 2: 3 }. Empty when none.
export function spellSlots(cls, level) {
  const sc = levelRow(cls, level)?.spellcasting
  if (!sc) return {}
  const slots = {}
  for (let i = 1; i <= 9; i++) {
    const n = sc[`spell_slots_level_${i}`]
    if (n > 0) slots[i] = n
  }
  return slots
}

export const cantripsKnown = (cls, level) => levelRow(cls, level)?.spellcasting?.cantrips_known || 0
export const spellsKnownFixed = (cls, level) => levelRow(cls, level)?.spellcasting?.spells_known || 0
export const maxSpellLevel = (cls, level) => Math.max(0, ...Object.keys(spellSlots(cls, level)).map(Number))

// How a class manages spells:
//  'prepare-all' – prepares from its whole class list (cleric, druid, paladin)
//  'spellbook'   – learns spells into a book, prepares a subset (wizard)
//  'known'       – knows a fixed number of spells (bard, sorcerer, warlock, ranger)
export const spellMode = (classId) =>
  ['cleric', 'druid', 'paladin'].includes(classId) ? 'prepare-all'
    : classId === 'wizard' ? 'spellbook'
      : ['bard', 'sorcerer', 'warlock', 'ranger'].includes(classId) ? 'known' : null

// Wizards start with six spellbook spells and add two per level
export const spellbookLimit = (level) => 6 + 2 * (Math.max(1, level) - 1)

// Classes that prepare spells from a list each day vs. learn a fixed set
const PREPARED = { cleric: 'full', druid: 'full', wizard: 'full', paladin: 'half' }
export const isPreparedCaster = (classId) => classId in PREPARED
export const isCaster = (cls) => !!cls?.spellcasting

export function preparedLimit(classId, level, castingMod) {
  const kind = PREPARED[classId]
  if (!kind) return 0
  const base = kind === 'half' ? Math.floor(level / 2) : level
  return Math.max(1, castingMod + base)
}

// How many leveled spells a character can have chosen/known at this level
export function spellChoiceLimit(cls, level, castingMod) {
  if (!cls?.spellcasting) return 0
  if (isPreparedCaster(cls.id)) return preparedLimit(cls.id, level, castingMod)
  return spellsKnownFixed(cls, level)
}

export const spellSaveDc = (prof, castingMod) => 8 + prof + castingMod
export const spellAttackBonus = (prof, castingMod) => prof + castingMod

// Level at which the class picks its subclass (first level in the SRD subclass table)
export const subclassLevel = (cls) => {
  const levels = cls?.subclasses?.flatMap(s => s.levels.map(l => l.level)) || []
  return levels.length ? Math.min(...levels) : null
}

// The SRD stores a cumulative count of ASIs, so a level grants one only when the count rises
export const gainsAbilityScoreImprovement = (cls, level) =>
  (levelRow(cls, level)?.asi || 0) > (levelRow(cls, level - 1)?.asi || 0)

// Armor class from equipped armor. Unarmored Defense for barbarian/monk applies only with no armor.
export function armorClass({ stats, armor, shield, classId }) {
  const dex = abilityMod(stats.dex)
  let ac
  if (armor) {
    const base = armor.ac.base
    ac = armor.ac.dexBonus ? base + (armor.ac.maxDex != null ? Math.min(dex, armor.ac.maxDex) : dex) : base
  } else if (classId === 'barbarian') ac = 10 + dex + abilityMod(stats.con)
  else if (classId === 'monk') ac = 10 + dex + abilityMod(stats.wis)
  else ac = 10 + dex
  return ac + (shield ? 2 : 0)
}

export const skillModifier = ({ stats, skill, proficient, expertise, prof }) =>
  abilityMod(stats[skill.ability]) + (proficient ? prof : 0) + (expertise ? prof : 0)

// Cumulative class features for a class/subclass through a level (feature ids, de-duplicated)
export function featuresThrough(cls, subclassId, level) {
  const ids = []
  for (const row of cls?.levels || []) if (row.level <= level) ids.push(...(row.features || []))
  const sub = cls?.subclasses?.find(s => s.id === subclassId)
  for (const row of sub?.levels || []) if (row.level <= level) ids.push(...(row.features || []))
  return [...new Set(ids)]
}

// Entry of a level-keyed table at the highest key <= n ({ "1": "1d10", "5": "2d10" })
const atOrBelow = (table, n) => {
  let best = null
  for (const k of Object.keys(table || {}).map(Number).sort((a, b) => a - b)) if (k <= n) best = k
  return best == null ? null : table[best]
}

// What to roll for a spell: { attackMod, saveText, damage:{expr,type}, heal, subtitle } or null when there is nothing to roll
export function spellRollSpec(spell, { slotLevel, charLevel, castMod, attackBonus, dc }) {
  const d = spell.damage
  let damage = null
  const expr = d?.atSlot ? atOrBelow(d.atSlot, slotLevel) : d?.atLevel ? atOrBelow(d.atLevel, charLevel) : null
  if (expr) damage = { expr, type: d.type }
  const healExpr = spell.heal ? atOrBelow(spell.heal, slotLevel) : null
  const heal = healExpr ? healExpr.replace(/\s*\+\s*MOD/i, castMod >= 0 ? `+${castMod}` : `${castMod}`) : null
  // Spells without structured data: fall back to the first dice expression in the description
  if (!damage && !heal) {
    const found = findDice((spell.desc || []).join(' '))
    if (found) damage = { expr: found, type: '' }
  }
  const attackMod = spell.attackType ? attackBonus : undefined
  const saveText = spell.save ? `DC ${dc} ${ABILITY_NAMES[spell.save.ability] || spell.save.ability} save${spell.save.success === 'half' ? ' (half damage on success)' : ''}` : undefined
  if (!damage && !heal && attackMod == null && !saveText) return null
  return { attackMod, saveText, damage, heal, subtitle: slotLevel > spell.level ? `at level ${slotLevel}` : undefined }
}
