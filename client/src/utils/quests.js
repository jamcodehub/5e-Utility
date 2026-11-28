// Campaign quests: shown as the main story in order first, then side quests. Quests made before this existed have no `kind` and
// keep the order they were written in.

const placeOf = (q, index) => (Number.isFinite(q.order) && q.order > 0 ? q.order : index + 1)

// The quests in the order to show them. `grouped` is true when the guide has a main story (so the page shows its two headings).
export function orderQuests(quests) {
  const list = Array.isArray(quests) ? quests : []
  const tagged = list.map((quest, index) => ({ quest, index }))
  const main = tagged.filter(x => x.quest.kind === 'main').sort((a, b) => placeOf(a.quest, a.index) - placeOf(b.quest, b.index) || a.index - b.index)
  const rest = tagged.filter(x => x.quest.kind !== 'main').sort((a, b) => (a.quest.kind === 'side' && b.quest.kind === 'side' ? placeOf(a.quest, a.index) - placeOf(b.quest, b.index) : 0) || a.index - b.index)
  return { grouped: main.length > 0, main: main.map(x => x.quest), side: rest.map(x => x.quest) }
}

// Which quest to point at: the first main-story quest that is not finished (or the first quest overall when there is no main
// story), with the words to show: "Start here" before anything has begun, "Current" while it is active, otherwise "Up next".
export function questPointer(quests) {
  const { grouped, main, side } = orderQuests(quests)
  const line = grouped ? main : side
  const target = line.find(q => q.status !== 'completed' && q.status !== 'failed')
  if (!target || !target.id) return null
  const untouched = (Array.isArray(quests) ? quests : []).every(q => (q.status || 'active') === 'not-started')
  const text = untouched ? 'Start here' : target.status === 'active' ? 'Current' : 'Up next'
  return { id: target.id, text }
}
