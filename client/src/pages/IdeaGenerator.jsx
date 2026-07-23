import { useState } from 'react'

const SEEDS = {
  npc: ['a one-eyed blacksmith with a hidden noble past', 'a cheerful gravedigger who talks to the dead', 'a retired pirate captain running a tea house', 'a paranoid alchemist convinced everyone is a spy', 'a young noble secretly moonlighting as a thief', 'a wandering bard collecting tragic love songs'],
  location: ['a floating market above a bottomless chasm', 'a village built inside a sleeping giant\'s ribcage', 'an abandoned lighthouse that hums at midnight', 'a tavern that only appears during storms', 'a library where the books rearrange themselves', 'ruins of a temple slowly being reclaimed by crystal'],
  hook: ['a letter arrives addressed to someone who died years ago', 'the town well starts producing wine instead of water', 'a caravan vanishes leaving only footprints that end mid-stride', 'a rival adventuring party claims to have already finished the quest', 'the players\' shadows start acting independently', 'a dragon requests a lawyer'],
  item: ['a lantern that only lights in the presence of lies', 'a coin that always lands on the side you need', 'a sword that whispers the name of its next victim', 'a cloak stitched from captured nightmares', 'a music box that replays your worst memory', 'a key that opens exactly one door, once'],
  encounter: ['a friendly ogre who just wants directions', 'a puzzle guarded by riddling gargoyles', 'a merchant caravan ambushed by its own guards', 'a ghost reliving its final moments on a loop', 'twin bandits who finish each other\'s sentences', 'a cult performing a ritual that seems oddly wholesome'],
}

const LABELS = { npc: 'NPC', location: 'Location', hook: 'Plot Hook', item: 'Magic Item', encounter: 'Encounter' }

export default function IdeaGenerator() {
  const [category, setCategory] = useState('npc')
  const [ideas, setIdeas] = useState([])

  const generate = () => {
    const pool = SEEDS[category]
    const picks = new Set()
    while (picks.size < 3 && picks.size < pool.length) picks.add(pool[Math.floor(Math.random() * pool.length)])
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
        {Object.keys(SEEDS).map(k => (
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
