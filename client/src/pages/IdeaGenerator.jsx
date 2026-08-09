import { useState } from 'react'

// Instead of a small fixed list of pre-written lines, each category combines
// several word banks into a template. With banks this size the number of
// possible combinations is in the tens of thousands per category.
const NAMES = ['Corvin', 'Maelis', 'Thassa', 'Brindle', 'Oskar', 'Yennis', 'Dravik', 'Selphine', 'Guthrie', 'Norwyn', 'Isolde', 'Baltrick', 'Fenwick', 'Morrigan', 'Talvin', 'Ysolde', 'Corrin', 'Halric', 'Tamsyn', 'Wrenna']
const JOBS = ['blacksmith', 'gravedigger', 'pirate captain', 'alchemist', 'bard', 'innkeeper', 'tax collector', 'cartographer', 'exorcist', 'beekeeper', 'undertaker', 'fortune teller', 'locksmith', 'herbalist', 'bounty hunter', 'librarian', 'shipwright', 'stablehand']
const TRAITS = ['a hidden noble past', 'a paranoid streak', 'a gift for lying convincingly', 'an unshakable calm', 'a talent for getting lost on purpose', 'a debt they refuse to discuss', 'a pet that seems smarter than them', 'a habit of speaking in riddles', 'a missing eye and a wild story about it', 'a secret rivalry with someone in town', 'an inability to lie', 'a collection of oddly specific grudges']

const PLACES = ['floating market', 'sunken cathedral', 'moss-choked observatory', 'abandoned lighthouse', 'sleeping giant\'s ribcage', 'clockwork greenhouse', 'salt-crusted shipwreck', 'library of forgotten names', 'inverted waterfall', 'frozen carnival', 'crumbling opera house', 'bottomless well shaft']
const PLACE_TWISTS = ['that only appears during a full moon', 'guarded by something that used to be human', 'where every echo answers a question truthfully', 'that hums a different tune each visit', 'slowly being reclaimed by crystal', 'where time runs backward after sundown', 'that no map agrees on the location of', 'built atop a sealed dragon\'s grave']

const HOOK_OPENERS = ['A letter arrives addressed to someone who died years ago', 'The town well starts producing wine instead of water', 'A caravan vanishes, leaving only footprints that end mid-stride', 'A rival adventuring party claims to have already finished the quest', 'The players\' shadows begin acting independently', 'A dragon requests a lawyer', 'Every mirror in town shows a five-second delay', 'A child claims to remember a war that never happened', 'The local temple bell rings backward at midnight', 'A merchant offers an absurd price for something worthless']
const HOOK_TWISTS = ['and only the party seems to notice', 'and the guards refuse to investigate', 'while the weather grows steadily worse', 'just as an old enemy resurfaces', 'and no one else remembers it happening', 'right before the harvest festival', 'and it keeps happening to someone new each night']

const ITEM_ADJ = ['whispering', 'tarnished', 'weightless', 'ever-warm', 'silent', 'flickering', 'bloodwarm', 'hollow', 'frostbitten', 'sunless']
const ITEM_NOUN = ['lantern', 'coin', 'sword', 'cloak', 'music box', 'key', 'ring', 'quill', 'mirror shard', 'hourglass']
const ITEM_POWER = ['only lights in the presence of a lie', 'always lands on the side you need', 'whispers the name of its next victim', 'is stitched from captured nightmares', 'replays your worst memory on a loop', 'opens exactly one door, once, ever', 'grows heavier the longer you keep a secret', 'writes a word from your future when you\'re not looking']

const ENC_A = ['a friendly ogre who just wants directions', 'a puzzle guarded by riddling gargoyles', 'a merchant caravan ambushed by its own guards', 'a ghost reliving its final moments on a loop', 'twin bandits who finish each other\'s sentences', 'a cult performing a ritual that seems oddly wholesome', 'a talking animal insisting it used to be a person', 'a duel that has been going on for three days']
const ENC_TWIST = ['that turns out to be a test', 'with a much bigger threat watching from nearby', 'that only gets stranger the longer it continues', 'that the party accidentally started', 'no one asked for, including the participants']

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)] }

const GENERATORS = {
  npc: () => `${rand(NAMES)}, ${rand(JOBS)} with ${rand(TRAITS)}`,
  location: () => `A ${rand(PLACES)} ${rand(PLACE_TWISTS)}`,
  hook: () => `${rand(HOOK_OPENERS)}, ${rand(HOOK_TWISTS)}`,
  item: () => `A ${rand(ITEM_ADJ)} ${rand(ITEM_NOUN)} that ${rand(ITEM_POWER)}`,
  encounter: () => `${rand(ENC_A)}, ${rand(ENC_TWIST)}`,
}

const LABELS = { npc: 'NPC', location: 'Location', hook: 'Plot Hook', item: 'Magic Item', encounter: 'Encounter' }

export default function IdeaGenerator() {
  const [category, setCategory] = useState('npc')
  const [ideas, setIdeas] = useState([])

  const generate = () => {
    const gen = GENERATORS[category]
    const picks = new Set()
    let guard = 0
    while (picks.size < 3 && guard < 30) { picks.add(gen()); guard++ }
    setIdeas([...picks])
  }

  return (
    <div className="page-content">
      <div className="page-header-row" style={{ marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, marginBottom: 4 }}>Idea Generator</h2>
          <p style={{ color: 'var(--text-2)', fontSize: 14, margin: 0 }}>Instant inspiration when the table goes quiet.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {Object.keys(GENERATORS).map(k => (
          <button key={k} onClick={() => setCategory(k)} className={`btn btn-sm ${category === k ? 'btn-primary' : 'btn-ghost'}`}>{LABELS[k]}</button>
        ))}
      </div>

      <button className="btn btn-primary" onClick={generate} style={{ marginBottom: 20 }}>✦ Generate ideas</button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 640 }}>
        {ideas.map((idea, i) => (
          <div key={i} className="card" style={{ padding: '14px 16px', fontSize: 14 }}>
            <span style={{ color: 'var(--gold)', fontWeight: 600, marginRight: 6 }}>{LABELS[category]}:</span>{idea}
          </div>
        ))}
        {ideas.length === 0 && <div style={{ color: 'var(--text-3)', fontSize: 13 }}>Pick a category and generate to see ideas here.</div>}
      </div>
    </div>
  )
}
