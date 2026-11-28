// The Campaign Guide a DM fills in while answering the homebrew "guide me" questions. Only plain, length-limited text is
// accepted; the answers become the guide's story, current arc, world notes, one NPC and one first quest.
const text = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

export function cleanHomebrewGuide(input) {
  const g = input && typeof input === 'object' ? input : {}
  const npcs = (Array.isArray(g.npcs) ? g.npcs : []).slice(0, 5)
    .map((n, i) => ({ id: `npc-${i + 1}`, name: text(n?.name, 80), description: text(n?.description, 1500), characterRelation: '' }))
    .filter(n => n.name || n.description)
  const quests = (Array.isArray(g.quests) ? g.quests : []).slice(0, 5)
    .map((q, i) => ({ id: `quest-${i + 1}`, title: text(q?.title, 120), description: text(q?.description, 1500), status: 'not-started', kind: 'main', order: i + 1, characterRelation: '' }))
    .filter(q => q.title || q.description)
  const out = { story: text(g.story, 6000), currentArc: text(g.currentArc, 3000), worldNotes: text(g.worldNotes, 4000), npcs, quests }
  const empty = !out.story && !out.currentArc && !out.worldNotes && !npcs.length && !quests.length
  return empty ? null : out
}
