// Import of a public D&D Beyond character. D&D Beyond has no official API: this reads the same undocumented JSON the
// character page uses (it works for characters set to Public, no login) and maps it onto our sheet. It can change or be
// switched off by D&D Beyond at any time, so everything here is defensive and the result is only a starting point that the
// player reviews before saving.

const ABILITIES = [['str', 'strength'], ['dex', 'dexterity'], ['con', 'constitution'], ['int', 'intelligence'], ['wis', 'wisdom'], ['cha', 'charisma']]
const SKILLS = ['acrobatics', 'animal-handling', 'arcana', 'athletics', 'deception', 'history', 'insight', 'intimidation', 'investigation',
  'medicine', 'nature', 'perception', 'performance', 'persuasion', 'religion', 'sleight-of-hand', 'stealth', 'survival']
const titleCase = (kebab) => kebab.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
const mod = (score) => Math.floor((score - 10) / 2)
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null)

// Only the numeric id is ever used (to build a fixed D&D Beyond address), so a pasted link can never make the server
// fetch an arbitrary address. Accepts the character link, a share link, or the bare number.
export function parseCharacterId(input) {
  const text = typeof input === 'string' ? input.trim() : ''
  if (/^\d{5,12}$/.test(text)) return text
  let url
  try { url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`) } catch { return null }
  const host = url.hostname.toLowerCase()
  if (!(host === 'dndbeyond.com' || host.endsWith('.dndbeyond.com') || host === 'ddb.ac')) return null
  const m = url.pathname.match(/\/characters\/(\d{5,12})(?:\/|$)/)
  return m ? m[1] : null
}

export const characterServiceUrl = (id) => `https://character-service.dndbeyond.com/character/v5/character/${id}`

// Modifiers granted by the character itself (race, class, background, feats), not by items or conditions.
const ownModifiers = (data) => ['race', 'class', 'background', 'feat'].flatMap(k => (Array.isArray(data.modifiers?.[k]) ? data.modifiers[k] : []))
const modValue = (m) => num(m.fixedValue) ?? num(m.value) ?? 0

export function mapCharacter(data) {
  const warnings = []
  const mods = ownModifiers(data)
  const classes = Array.isArray(data.classes) ? data.classes : []
  const level = Math.max(1, Math.min(20, classes.reduce((t, c) => t + (num(c.level) || 0), 0) || 1))

  // Ability scores: base + manual bonus + bonuses from race / class / feats, unless the player typed an override.
  const stats = {}
  ABILITIES.forEach(([key, full], i) => {
    const base = num(data.stats?.[i]?.value) ?? 10
    const extra = num(data.bonusStats?.[i]?.value) || 0
    const fromRules = mods.filter(m => m.type === 'bonus' && m.subType === `${full}-score`).reduce((t, m) => t + modValue(m), 0)
    const override = num(data.overrideStats?.[i]?.value)
    stats[key] = Math.max(1, Math.min(30, override ?? base + extra + fromRules))
  })

  const profBonus = 2 + Math.floor((level - 1) / 4)

  // Hit points: D&D Beyond stores the rolled / fixed base, so the Constitution bonus and per-level bonuses are added here.
  const perLevel = mods.filter(m => m.type === 'bonus' && m.subType === 'hit-points-per-level').reduce((t, m) => t + modValue(m), 0)
  const override = num(data.overrideHitPoints)
  const max = Math.max(1, override ?? ((num(data.baseHitPoints) || 0) + mod(stats.con) * level + (num(data.bonusHitPoints) || 0) + perLevel * level))
  const current = Math.max(0, Math.min(max, max - (num(data.removedHitPoints) || 0)))

  // Armour class is not stored by D&D Beyond (it is worked out on the page), so this is an estimate from worn armour.
  const worn = (Array.isArray(data.inventory) ? data.inventory : []).filter(i => i.equipped && i.definition?.filterType === 'Armor')
  const body = worn.filter(i => [1, 2, 3].includes(i.definition.armorTypeId)).sort((a, b) => (b.definition.armorClass || 0) - (a.definition.armorClass || 0))[0]
  const shield = worn.find(i => i.definition.armorTypeId === 4)
  const dex = mod(stats.dex)
  let ac = 10 + dex
  if (body) {
    const t = body.definition.armorTypeId
    ac = (num(body.definition.armorClass) || 10) + (t === 1 ? dex : t === 2 ? Math.min(dex, 2) : 0)
  }
  if (shield) ac += num(shield.definition.armorClass) || 2
  ac += mods.filter(m => m.type === 'bonus' && m.subType === 'armor-class' && !m.restriction).reduce((t, m) => t + modValue(m), 0)
  warnings.push('Armour class is an estimate from worn armour (class features such as Unarmored Defense are not counted). Please check it.')

  // Proficiencies, written the way the rest of the app reads them: skill names, saving-throw-xxx, and anything else by name.
  const profs = new Set()
  for (const m of mods.filter(x => x.type === 'proficiency' && typeof x.subType === 'string')) {
    const save = ABILITIES.find(([, full]) => m.subType === `${full}-saving-throws`)
    if (save) profs.add(`saving-throw-${save[0]}`)
    else if (SKILLS.includes(m.subType)) profs.add(titleCase(m.subType))
    else profs.add(m.friendlySubtypeName || titleCase(m.subType))
  }

  const t = data.traits || {}
  const personality = [['Personality', t.personalityTraits], ['Ideals', t.ideals], ['Bonds', t.bonds], ['Flaws', t.flaws]]
    .filter(([, v]) => typeof v === 'string' && v.trim()).map(([k, v]) => `${k}: ${v.trim()}`).join('\n')

  const c = data.currencies || {}
  const id = num(data.id)
  const clean = (s) => (typeof s === 'string' ? s.trim() : '')
  const fields = {
    name: clean(data.name).slice(0, 80),
    race: clean(data.race?.fullName || data.race?.baseRaceName).slice(0, 60),
    class: classes.map(x => clean(x.definition?.name)).filter(Boolean).join(' / ').slice(0, 80),
    level, stats, profBonus, ac,
    hp: { current, max },
    proficiencies: [...profs].slice(0, 60),
    background: clean(data.background?.definition?.name || data.background?.customBackground?.name).slice(0, 80),
    personality: personality.slice(0, 4000),
    lore: clean(data.notes?.backstory).slice(0, 8000),
    currency: { cp: num(c.cp) || 0, sp: num(c.sp) || 0, ep: num(c.ep) || 0, gp: num(c.gp) || 0, pp: num(c.pp) || 0 },
    dndBeyondUrl: id ? `https://www.dndbeyond.com/characters/${id}` : '',
  }
  return { fields, warnings }
}
