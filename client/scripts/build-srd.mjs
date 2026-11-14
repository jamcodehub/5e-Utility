// Downloads the SRD 5.1 dataset (5e-bits/5e-database, 2014/en) and compacts it
// into src/data/srd/*.json. Run with: node scripts/build-srd.mjs
// SRD 5.1 content © Wizards of the Coast LLC, licensed CC-BY-4.0.
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const BASE = 'https://raw.githubusercontent.com/5e-bits/5e-database/main/src/2014/en/5e-SRD-'
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/data/srd')

const get = async (name) => {
  const res = await fetch(`${BASE}${name}.json`)
  if (!res.ok) throw new Error(`Failed to fetch ${name}: ${res.status}`)
  return res.json()
}
const id = (ref) => ref?.index
const ids = (list) => (list || []).map(id)
const strip = (obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && !(Array.isArray(v) && !v.length)))

// Choice blocks come in several shapes; flatten to { choose, desc, from: [ids] | null (any) }
function flattenChoice(c) {
  if (!c) return undefined
  const f = c.from
  let from = null
  if (f?.option_set_type === 'options_array') {
    from = f.options.map(o => o.item?.index || o.of?.index || o.choice?.desc).filter(Boolean)
  } else if (f?.option_set_type === 'equipment_category') {
    from = [`category:${f.equipment_category.index}`]
  }
  return strip({ choose: c.choose, desc: c.desc, from })
}

const [abilityScores, skills, conditions, classes, levels, subclasses, features, races, subraces, traits,
  backgrounds, equipment, spells, rules, ruleSections, languages, proficiencies, weaponProps] = await Promise.all([
  get('Ability-Scores'), get('Skills'), get('Conditions'), get('Classes'), get('Levels'), get('Subclasses'),
  get('Features'), get('Races'), get('Subraces'), get('Traits'), get('Backgrounds'), get('Equipment'),
  get('Spells'), get('Rules'), get('Rule-Sections'), get('Languages'), get('Proficiencies'), get('Weapon-Properties'),
])

const out = {}

out.core = {
  abilities: abilityScores.map(a => ({ id: a.index, name: a.full_name, abbr: a.name, desc: a.desc })),
  skills: skills.map(s => ({ id: s.index, name: s.name, ability: id(s.ability_score), desc: s.desc })),
  conditions: conditions.map(c => ({ id: c.index, name: c.name, desc: c.desc })),
  languages: languages.map(l => ({ id: l.index, name: l.name, type: l.type, script: l.script })),
  weaponProperties: weaponProps.map(w => ({ id: w.index, name: w.name, desc: w.desc })),
  proficiencies: Object.fromEntries(proficiencies.map(p => [p.index, p.name])),
}

out.features = Object.fromEntries(features.map(f => [f.index, strip({
  name: f.name, level: f.level, class: id(f.class), subclass: id(f.subclass), desc: f.desc,
})]))

// Spell slot / class-specific progression keyed by class and subclass
const byClass = {}
const subLevels = {}
for (const l of levels) {
  const row = strip({
    level: l.level, prof: l.prof_bonus, asi: l.ability_score_bonuses || undefined,
    features: ids(l.features), classSpecific: l.class_specific, spellcasting: l.spellcasting,
  })
  if (l.subclass) (subLevels[l.subclass.index] ||= []).push(row)
  else (byClass[l.class.index] ||= []).push(row)
}
for (const k of Object.keys(byClass)) byClass[k].sort((a, b) => a.level - b.level)

out.classes = classes.map(c => {
  const subs = subclasses.filter(s => s.class.index === c.index)
  return strip({
    id: c.index, name: c.name, hitDie: c.hit_die,
    saves: ids(c.saving_throws),
    proficiencies: ids(c.proficiencies),
    proficiencyChoices: (c.proficiency_choices || []).map(flattenChoice),
    startingEquipment: (c.starting_equipment || []).map(e => ({ id: e.equipment.index, qty: e.quantity })),
    startingEquipmentOptions: (c.starting_equipment_options || []).map(o => ({ desc: o.desc, choose: o.choose })),
    multiclassing: strip({
      prerequisites: (c.multi_classing?.prerequisites || []).map(p => ({ ability: id(p.ability_score), min: p.minimum_score })),
      proficiencies: ids(c.multi_classing?.proficiencies),
    }),
    spellcasting: c.spellcasting ? { ability: id(c.spellcasting.spellcasting_ability), level: c.spellcasting.level, info: c.spellcasting.info } : undefined,
    levels: byClass[c.index] || [],
    subclasses: subs.map(s => ({
      id: s.index, name: s.name, flavor: s.subclass_flavor, desc: s.desc, levels: (subLevels[s.index] || []).sort((a, b) => a.level - b.level),
    })),
  })
})

out.traits = Object.fromEntries(traits.map(t => [t.index, strip({
  name: t.name, desc: t.desc, proficiencies: ids(t.proficiencies),
})]))

out.races = races.map(r => strip({
  id: r.index, name: r.name, speed: r.speed, size: r.size, sizeDesc: r.size_description,
  abilityBonuses: (r.ability_bonuses || []).map(b => ({ ability: id(b.ability_score), bonus: b.bonus })),
  abilityBonusOptions: r.ability_bonus_options ? { choose: r.ability_bonus_options.choose, from: r.ability_bonus_options.from.options.map(o => ({ ability: id(o.ability_score), bonus: o.bonus })) } : undefined,
  age: r.age, alignment: r.alignment,
  languages: ids(r.languages), languageDesc: r.language_desc,
  languageOptions: flattenChoice(r.language_options),
  proficiencies: ids(r.starting_proficiencies),
  proficiencyOptions: flattenChoice(r.starting_proficiency_options),
  traits: ids(r.traits),
  subraces: subraces.filter(s => s.race.index === r.index).map(s => strip({
    id: s.index, name: s.name, desc: s.desc,
    abilityBonuses: (s.ability_bonuses || []).map(b => ({ ability: id(b.ability_score), bonus: b.bonus })),
    traits: ids(s.racial_traits),
    languageOptions: flattenChoice(s.language_options),
  })),
}))

out.backgrounds = backgrounds.map(b => strip({
  id: b.index, name: b.name,
  proficiencies: ids(b.starting_proficiencies),
  languageOptions: flattenChoice(b.language_options),
  equipment: (b.starting_equipment || []).map(e => ({ id: e.equipment.index, qty: e.quantity })),
  equipmentOptions: (b.starting_equipment_options || []).map(flattenChoice),
  feature: b.feature,
  personalityTraits: b.personality_traits?.from?.options?.map(o => o.string),
  ideals: b.ideals?.from?.options?.map(o => o.desc),
  bonds: b.bonds?.from?.options?.map(o => o.string),
  flaws: b.flaws?.from?.options?.map(o => o.string),
}))

out.equipment = equipment.map(e => strip({
  id: e.index, name: e.name, category: id(e.equipment_category), cost: e.cost ? `${e.cost.quantity} ${e.cost.unit}` : undefined, weight: e.weight,
  armorCategory: e.armor_category, ac: e.armor_class ? { base: e.armor_class.base, dexBonus: e.armor_class.dex_bonus, maxDex: e.armor_class.max_bonus ?? undefined } : undefined,
  strMin: e.str_minimum || undefined, stealthDisadvantage: e.stealth_disadvantage || undefined,
  weaponCategory: e.weapon_category, weaponRange: e.weapon_range,
  damage: e.damage ? { dice: e.damage.damage_dice, type: id(e.damage.damage_type) } : undefined,
  twoHandedDamage: e.two_handed_damage ? { dice: e.two_handed_damage.damage_dice, type: id(e.two_handed_damage.damage_type) } : undefined,
  range: e.range, properties: ids(e.properties), desc: e.desc,
}))

out.spells = spells.map(s => strip({
  id: s.index, name: s.name, level: s.level, school: s.school?.name,
  castingTime: s.casting_time, range: s.range, components: s.components, material: s.material,
  ritual: s.ritual || undefined, concentration: s.concentration || undefined, duration: s.duration,
  desc: s.desc, higher: s.higher_level,
  classes: ids(s.classes), subclasses: ids(s.subclasses),
  attackType: s.attack_type,
  save: s.dc ? { ability: id(s.dc.dc_type), success: s.dc.dc_success } : undefined,
  damage: s.damage?.[0] ? strip({
    type: id(s.damage[0].damage_type), atSlot: s.damage[0].damage_at_slot_level, atLevel: s.damage[0].damage_at_character_level,
  }) : undefined,
  heal: s.heal_at_slot_level,
  area: s.area_of_effect ? { type: s.area_of_effect.type, size: s.area_of_effect.size } : undefined,
}))

out.rules = ruleSections.map(r => ({ id: r.index, name: r.name, desc: r.desc }))
out.rulesIndex = rules.map(r => ({ id: r.index, name: r.name, desc: r.desc, sections: ids(r.subsections) }))

await mkdir(OUT, { recursive: true })
for (const [name, data] of Object.entries(out)) {
  await writeFile(path.join(OUT, `${name}.json`), JSON.stringify(data))
  console.log(name, Array.isArray(data) ? data.length : Object.keys(data).length)
}
