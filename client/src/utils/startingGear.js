// Turns the SRD's starting-equipment text ("(a) chain mail or (b) leather armor, longbow, and 20 arrows")
// into choosable options that resolve to real SRD items where possible.
const norm = (s) => s.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()
const NUM = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 }
const variants = (n) => [n, n.replace(/ies$/, 'y'), n.replace(/s$/, ''), n.replace(/es$/, '')]
const ALIAS = { bolts: 'crossbow-bolt', arrows: 'arrow', 'wooden shield': 'shield', 'shortbow and quiver of 20 arrows': 'shortbow' }
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)

function parsePart(part, byName) {
  const m = part.trim().replace(/^(an?|the)\s+(?=\d)/i, '').match(/^(\d+|an?|one|two|three|four|five|six|seven|eight|nine|ten)\s+(.*)$/i)
  const qty = m ? (NUM[m[1].toLowerCase()] || Number(m[1])) : 1
  const name = (m ? m[2] : part).trim()
  const pick = norm(name).match(/^(?:any )?(martial|simple)(?: (melee|ranged))? weapons?$/)
  if (pick) return { kind: 'pick', weaponCategory: cap(pick[1]), range: pick[2] ? cap(pick[2]) : null, qty }
  const n = norm(name.replace(/\(.*?\)/g, ''))
  const hit = (ALIAS[n] && Object.values(byName).find(e => e.id === ALIAS[n])) || variants(n).map(v => byName[v] || byName[`${v} armor`]).find(Boolean)
  if (hit) return { kind: 'item', id: hit.id, name: hit.name, qty }
  return { kind: 'custom', name: cap(name.replace(/\.$/, '')), qty }
}

export function parseGear(text, equipment) {
  const byName = {}
  equipment.forEach(e => {
    byName[norm(e.name)] = e
    const [head, tail] = e.name.split(',').map(x => x.trim()) // "Crossbow, light" also answers to "light crossbow"
    if (tail) byName[norm(`${tail} ${head}`)] = e
  })
  const cleaned = text.replace(/^\(\s*[a-z]\s*\)\s*/i, '').replace(/\s+or\s*$/i, '').replace(/\.$/, '')
  return cleaned.split(/,\s*(?:and\s+)?|\s+and\s+(?=an?\s|\d|two|three)/i).map(s => s.trim()).filter(Boolean).map(p => parsePart(p, byName))
}

// A class's starting equipment as groups; each group has 1+ options of parsed items.
export function startingGroups(cls, equipment) {
  const groups = []
  const fixed = (cls?.startingEquipment || []).map(e => ({ kind: 'item', id: e.id, qty: e.qty, name: equipment.find(x => x.id === e.id)?.name || e.id }))
  ;(cls?.startingEquipmentOptions || []).forEach(opt => {
    const parts = opt.desc.split(/\(\s*[a-z]\s*\)/i).map(s => s.replace(/\s+or\s*$/i, '').replace(/^[\s,]+/, '').trim()).filter(Boolean)
    const choices = parts.map(p => ({ text: p, items: parseGear(p, equipment) }))
    if (choices.length > 1) groups.push({ choices })
    else if (choices.length === 1) fixed.push(...choices[0].items)
  })
  return { fixed, groups }
}

// Resolve chosen options (index per group) + weapon picks into inventory entries.
export function resolveGear(startingGear, choice, picks) {
  const out = []
  const add = (it, key) => {
    if (it.kind === "pick") {
      const id = picks[key]
      if (id) out.push({ id, qty: it.qty })
    } else if (it.kind === 'item') out.push({ id: it.id, qty: it.qty })
    else out.push({ id: `custom-${out.length}-${Date.now()}`, custom: true, name: it.name, qty: it.qty, weight: 0 })
  }
  startingGear.fixed.forEach((it, i) => add(it, `f${i}`))
  startingGear.groups.forEach((g, gi) => g.choices[choice[gi] ?? 0].items.forEach((it, ii) => add(it, `${gi}.${choice[gi] ?? 0}.${ii}`)))
  return out
}
