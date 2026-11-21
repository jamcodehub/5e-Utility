// Downloads the SRD 5.1 monster list (5e-bits/5e-database, 2014/en) and compacts it into
// src/data/srd/monsters.json for the battle tracker. Run with: node scripts/build-srd-monsters.mjs
// SRD 5.1 content © Wizards of the Coast LLC, licensed CC-BY-4.0.
import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const URL_ = 'https://raw.githubusercontent.com/5e-bits/5e-database/main/src/2014/en/5e-SRD-Monsters.json'
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/data/srd/monsters.json')

const res = await fetch(URL_)
if (!res.ok) throw new Error(`Failed to fetch monsters: ${res.status}`)
const raw = await res.json()

const speedText = (s = {}) => Object.entries(s).map(([k, v]) => (k === 'walk' ? v : `${k} ${v}`)).join(', ')
const crText = (n) => (n === 0.125 ? '1/8' : n === 0.25 ? '1/4' : n === 0.5 ? '1/2' : String(n))

const monsters = raw.map(m => {
  const attacks = (m.actions || [])
    .filter(a => a.attack_bonus !== undefined && a.damage?.length)
    .map(a => ({
      name: a.name,
      bonus: a.attack_bonus,
      // several damage parts (e.g. piercing + lightning) are summed into one roll
      dmg: a.damage.map(d => d.damage_dice).filter(Boolean).join('+'),
      type: a.damage.map(d => d.damage_type?.name?.toLowerCase()).filter(Boolean).join(' + '),
    }))
    .filter(a => a.dmg)
  const multiattack = (m.actions || []).find(a => a.name === 'Multiattack')?.desc
  return {
    id: m.index, name: m.name, size: m.size, type: m.type, cr: crText(m.challenge_rating),
    ac: m.armor_class?.[0]?.value ?? 10, hp: m.hit_points, hd: m.hit_dice, speed: speedText(m.speed),
    abil: [m.strength, m.dexterity, m.constitution, m.intelligence, m.wisdom, m.charisma],
    attacks, ...(multiattack ? { multi: multiattack } : {}),
  }
}).sort((a, b) => a.name.localeCompare(b.name))

await writeFile(OUT, JSON.stringify(monsters))
console.log(`Wrote ${monsters.length} monsters to ${OUT}`)
