// Short-form rule summaries built from the SRD 5.1 data, for hover tooltips.
// Each function returns { title, tag, stats: [], summary } or null.

const ABBR = { strength: 'STR', dexterity: 'DEX', constitution: 'CON', intelligence: 'INT', wisdom: 'WIS', charisma: 'CHA' }
const firstSentence = (parts, max = 170) => {
  const text = (Array.isArray(parts) ? parts.join(' ') : parts || '').replace(/^[-*#\s]+/, '').replace(/\s+/g, ' ').trim()
  const m = text.match(/^.*?[.!?](\s|$)/)
  const s = (m ? m[0] : text).trim()
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s
}

export function spellTip(sp) {
  if (!sp) return null
  const text = (sp.desc || []).join(' ')
  const dmg = text.match(/(\d+d\d+(?:\s*\+\s*\d+)?)\s+(\w+)\s+damage/i)
  const save = text.match(/(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma) saving throw/i)
  const heal = text.match(/regains?[^.]*?(\d+d\d+(?:\s*\+\s*\w+)?)\s+hit points/i)
  const effect = []
  if (dmg) effect.push(`Dmg: ${dmg[1].replace(/\s+/g, '')} ${dmg[2].toLowerCase()}`)
  if (heal) effect.push(`Heals: ${heal[1].replace(/\s+/g, '')}`)
  if (save) effect.push(`${ABBR[save[1].toLowerCase()]} save`)
  if (/(ranged|melee) spell attack/i.test(text)) effect.push('Spell attack')
  if (sp.concentration) effect.push('Concentration')
  return {
    title: sp.name,
    tag: sp.level ? `Level ${sp.level} ${sp.school}` : `Cantrip · ${sp.school}`,
    stats: [`${sp.castingTime} · ${sp.range} · ${(sp.components || []).join('')} · ${sp.duration}`, effect.join(' · ')].filter(Boolean),
    summary: firstSentence(sp.desc),
  }
}

export function equipTip(def) {
  if (!def) return null
  const stats = []
  if (def.category === 'weapon') {
    if (def.damage) {
      const two = def.twoHandedDamage ? ` (${def.twoHandedDamage.dice} two-handed)` : ''
      stats.push(`Dmg: ${def.damage.dice} ${def.damage.type}${two}`)
    }
    const range = def.range ? (def.range.long ? `${def.range.normal}/${def.range.long} ft` : `${def.range.normal} ft`) : ''
    stats.push([def.weaponCategory, def.weaponRange, range].filter(Boolean).join(' · '))
    if (def.properties?.length) stats.push(def.properties.join(', '))
  } else if (def.category === 'armor' && def.ac) {
    const dex = def.ac.dexBonus ? (def.ac.maxBonus ? ` + Dex (max ${def.ac.maxBonus})` : ' + Dex') : ''
    stats.push(def.armorCategory === 'Shield' ? `+${def.ac.base} AC` : `AC ${def.ac.base}${dex}`)
    if (def.strMin) stats.push(`Needs STR ${def.strMin}`)
    if (def.stealthDisadvantage) stats.push('Stealth disadvantage')
  }
  if (def.weight) stats.push(`${def.weight} lb · ${def.cost || ''}`.trim())
  return { title: def.name, tag: def.armorCategory || def.weaponCategory || def.category.replace(/-/g, ' '), stats: stats.filter(Boolean), summary: '' }
}

export function abilityTip(core, id) {
  const a = core?.abilities?.find(x => x.id === id)
  return a ? { title: a.name, tag: 'Ability score', stats: [], summary: firstSentence(a.desc) } : null
}

export function skillTip(core, skill) {
  if (!skill) return null
  const ab = core?.abilities?.find(x => x.id === skill.ability)
  return { title: skill.name, tag: `${ab?.abbr || skill.ability?.toUpperCase()} check`, stats: [], summary: firstSentence((skill.desc || []).join(' ').replace(/^Your [^()]*\([^)]*\) check /i, '')) }
}

export function conditionTip(core, id) {
  const c = core?.conditions?.find(x => x.id === id)
  return c ? { title: c.name, tag: 'Condition', stats: [], summary: firstSentence(c.desc) } : null
}
