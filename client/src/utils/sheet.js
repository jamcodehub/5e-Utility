import { abilityMod, proficiencyBonus, armorClass, spellSaveDc, spellAttackBonus } from './rules5e'

export const COINS = [['pp', 'Platinum'], ['gp', 'Gold'], ['ep', 'Electrum'], ['sp', 'Silver'], ['cp', 'Copper']]
// Conditions that drop a creature's speed to 0 (SRD 5.1)
const ZERO_SPEED = ['grappled', 'restrained', 'paralyzed', 'petrified', 'stunned', 'unconscious']
export const itemWeight = (i) => (i.custom ? i.weight || 0 : i.def?.weight || 0) * (i.qty || 1)

// Everything derived from a character sheet + the SRD data, shared by the Actions, Gear, print and share views.
export function derive(char, srd) {
  const level = char.level || 1
  const prof = char.profBonus || proficiencyBonus(level)
  const stats = char.stats || {}
  const mod = (a) => abilityMod(stats[a])
  const cls = srd.classes.find(c => c.id === char.srd?.classId)
    || srd.classes.find(c => c.name.toLowerCase() === (char.class || '').trim().toLowerCase())
  const raceName = (char.race || '').trim().toLowerCase()
  const race = srd.races.find(r => r.id === char.srd?.raceId) || srd.races.find(r => r.name.toLowerCase() === raceName)
    || srd.races.find(r => r.subraces?.some(s => s.name.toLowerCase() === raceName))
  const equipById = Object.fromEntries(srd.equipment.map(e => [e.id, e]))
  const items = (char.srd?.equipment || []).map(e => ({ ...e, def: equipById[e.id] }))
  const worn = items.filter(i => i.equipped && i.def)
  const armor = worn.find(i => i.def.category === 'armor' && i.def.armorCategory !== 'Shield')?.def
  const shield = worn.find(i => i.def.armorCategory === 'Shield')?.def
  const ac = armorClass({ stats, armor, shield, classId: cls?.id })

  const profText = new Set([...(char.proficiencies || []), ...(char.srd?.skills || [])].map(p => String(p).toLowerCase()))
  const classProfs = new Set([...(cls?.proficiencies || []), ...(char.proficiencies || [])].map(p => String(p).toLowerCase()))
  const skillProf = (s) => profText.has(`skill-${s.id}`) || profText.has(s.name.toLowerCase())
  const expertise = (s) => (char.srd?.expertise || []).includes(`skill-${s.id}`)
  const skillMod = (s) => mod(s.ability) + (skillProf(s) ? prof : 0) + (expertise(s) ? prof : 0)
  const saveProf = (a) => !!cls?.saves?.includes(a) || classProfs.has(`saving-throw-${a}`)
  const saveMod = (a) => mod(a) + (saveProf(a) ? prof : 0)
  const perception = srd.core.skills.find(s => s.id === 'perception')

  const str = stats.str || 10
  const weight = items.reduce((t, i) => t + itemWeight(i), 0)
    + COINS.reduce((t, [k]) => t + (char.currency?.[k] || 0), 0) / 50
  const encumbrance = weight > str * 10 ? 'heavy' : weight > str * 5 ? 'encumbered' : 'none'

  const exhaustion = char.combat?.exhaustion || 0
  const conditions = char.combat?.conditions || []
  let speed = race?.speed ?? 30
  if (armor?.strMin && str < armor.strMin) speed -= 10
  if (encumbrance === 'encumbered') speed -= 10
  if (encumbrance === 'heavy') speed -= 20
  if (exhaustion >= 2) speed = Math.floor(speed / 2)
  if (exhaustion >= 5 || conditions.some(c => ZERO_SPEED.includes(c))) speed = 0
  speed = Math.max(0, speed)

  const castAbility = cls?.spellcasting?.ability
  const castMod = castAbility ? mod(castAbility) : 0
  return {
    level, prof, stats, mod, cls, race, equipById, items, armor, shield, ac,
    skillProf, expertise, skillMod, saveProf, saveMod,
    passive: 10 + (perception ? skillMod(perception) : mod('wis')),
    initiative: mod('dex'), speed, baseSpeed: race?.speed ?? 30,
    weight, capacity: str * 15, encumbrance,
    castAbility, castMod, spellDc: castAbility ? spellSaveDc(prof, castMod) : null, spellAtk: castAbility ? spellAttackBonus(prof, castMod) : null,
  }
}

// The one feat in the SRD 5.1
export const FEATS = {
  grappler: {
    name: 'Grappler', prereq: 'Strength 13 or higher',
    desc: ["You've developed the skills necessary to hold your own in close-quarters grappling. You gain the following benefits:",
      '- You have advantage on attack rolls against a creature you are grappling.',
      '- You can use your action to try to pin a creature grappled by you. To do so, make another grapple check. If you succeed, you and the creature are both restrained until the grapple ends.'],
  },
}

// SRD domain / oath spells: always prepared and free of the preparation limit.
const ALWAYS_PREPARED = {
  life: { cls: 'cleric', unlock: { 1: 1, 2: 3, 3: 5, 4: 7, 5: 9 }, spells: { 1: ['bless', 'cure-wounds'], 2: ['lesser-restoration', 'spiritual-weapon'], 3: ['beacon-of-hope', 'revivify'], 4: ['death-ward', 'guardian-of-faith'], 5: ['mass-cure-wounds', 'raise-dead'] } },
  devotion: { cls: 'paladin', unlock: { 1: 3, 2: 5, 3: 9, 4: 13, 5: 17 }, spells: { 1: ['protection-from-evil-and-good', 'sanctuary'], 2: ['lesser-restoration', 'zone-of-truth'], 3: ['beacon-of-hope', 'dispel-magic'], 4: ['freedom-of-movement', 'guardian-of-faith'], 5: ['commune', 'flame-strike'] } },
}
export function alwaysPrepared(subclassId, level) {
  const row = ALWAYS_PREPARED[subclassId]
  if (!row) return []
  return Object.entries(row.spells).filter(([tier]) => level >= row.unlock[tier]).flatMap(([, ids]) => ids)
}

// Attack bonus and damage for a weapon (proficiency applies if the class is trained, or the class is unknown).
export function weaponStats(w, d) {
  const finesse = w.properties?.includes('finesse')
  const ranged = w.weaponRange === 'Ranged'
  const ability = finesse ? (d.mod('dex') >= d.mod('str') ? 'dex' : 'str') : ranged ? 'dex' : 'str'
  const cat = String(w.weaponCategory || '').toLowerCase()
  const profs = new Set([...(d.cls?.proficiencies || [])].map(p => String(p).toLowerCase()))
  const trained = !d.cls || profs.has(`${cat}-weapons`) || profs.has(`${w.id}s`) || profs.has(w.id)
  const bonus = d.mod(ability)
  return { atk: bonus + (trained ? d.prof : 0), dmg: `${w.damage?.dice || ''}${bonus ? (bonus > 0 ? '+' : '') + bonus : ''}`, type: w.damage?.type || '' }
}
