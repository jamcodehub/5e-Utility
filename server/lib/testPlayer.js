// Ready-made characters for a DM's "test player": a placeholder player to try a campaign with, usable as a token, in the
// battle tracker and so on. Four simple builds, with HP, AC and proficiencies worked out from the level.
const PRESETS = {
  fighter: { label: 'Fighter', hitDie: 10, ac: 16, stats: { str: 16, dex: 12, con: 15, int: 8, wis: 12, cha: 10 }, saves: ['str', 'con'], skills: ['Athletics', 'Perception'] },
  rogue:   { label: 'Rogue',   hitDie: 8,  ac: 14, stats: { str: 10, dex: 17, con: 13, int: 12, wis: 12, cha: 12 }, saves: ['dex', 'int'], skills: ['Stealth', 'Acrobatics', 'Sleight Of Hand', 'Perception'] },
  wizard:  { label: 'Wizard',  hitDie: 6,  ac: 12, stats: { str: 8, dex: 14, con: 14, int: 17, wis: 12, cha: 10 }, saves: ['int', 'wis'], skills: ['Arcana', 'History'] },
  cleric:  { label: 'Cleric',  hitDie: 8,  ac: 18, stats: { str: 14, dex: 10, con: 14, int: 10, wis: 16, cha: 12 }, saves: ['wis', 'cha'], skills: ['Medicine', 'Insight'] },
}
export const TEST_CLASSES = Object.entries(PRESETS).map(([id, p]) => ({ id, label: p.label }))
export const MAX_TEST_PLAYERS = 4

const mod = (score) => Math.floor((score - 10) / 2)

export function buildTestCharacter({ name, classId, level } = {}) {
  const preset = PRESETS[classId] || PRESETS.fighter
  const lvl = Math.max(1, Math.min(20, Math.floor(Number(level)) || 1))
  const con = mod(preset.stats.con)
  // Level 1 takes the full hit die; each later level takes the average (rounded up), plus the Constitution modifier.
  const max = Math.max(1, preset.hitDie + con + (lvl - 1) * (Math.floor(preset.hitDie / 2) + 1 + con))
  const clean = typeof name === 'string' ? name.trim().replace(/\s+/g, ' ').slice(0, 40) : ''
  return {
    name: clean || `Test ${preset.label}`,
    race: 'Human',
    class: preset.label,
    level: lvl,
    stats: { ...preset.stats },
    hp: { current: max, max },
    ac: preset.ac,
    profBonus: 2 + Math.floor((lvl - 1) / 4),
    proficiencies: [...preset.skills, ...preset.saves.map(s => `saving-throw-${s}`)],
    background: 'Test player',
    notes: 'A placeholder character made by the DM to try the campaign. It is removed together with the test player.',
  }
}
