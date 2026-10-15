import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useState } from 'react'
import './PublicDemo.css'

const FEATURES = [
  { id: 'storyboard', label: 'Storyboard', icon: '▤', description: 'Bring your campaign scenes to life.' },
  { id: 'journal', label: 'Journal', icon: '✎', description: 'Keep every character’s story close.' },
  { id: 'battle-map', label: 'Battle Map', icon: '▦', description: 'Build a battlefield and move your party.' },
  { id: 'battle-tracker', label: 'Battle Tracker', icon: '⚔', description: 'Keep initiative and hit points in hand.' },
  { id: 'roleplay', label: 'Roleplay', icon: '❖', description: 'Find your character’s voice.' },
]

const STORY_SCENES = [
  { title: 'The Road to Emberfall', text: 'Rain follows the old kingsroad. Ahead, a lantern burns in the window of an inn that should have been abandoned.' },
  { title: 'A Debt in the Dark', text: 'A hooded courier offers a brass signet and a warning: someone in Emberfall already knows your names.' },
  { title: 'The Ashen Crown', text: 'Beneath the ruined chapel, a crown of blackened iron hums with a power that remembers its last wearer.' },
]

const JOURNAL_ENTRIES = [
  { title: 'A stranger at the inn', date: 'Day 12 of Mirtul', text: 'The innkeeper recognized our crest, though none of us had shown it. I do not trust the man in the green cloak.' },
  { title: 'The bridge at dusk', date: 'Day 13 of Mirtul', text: 'We found fresh tracks on the old bridge. Too many for a patrol, too few for an army.' },
  { title: 'A promise kept', date: 'Day 14 of Mirtul', text: 'We brought the missing courier home. The village bells rang until sunset.' },
]

const MAP_LAYOUT = [
  '................',
  '..ggg....wwww...',
  '..ggg....w..w...',
  '......s....w....',
  '.ww......ggg....',
  '.w.......ggg..s.',
  '.ww..ggg........',
  '.....ggg........',
  '....wwww........',
  '....w..w....ggg.',
  '.........s..ggg.',
  '................',
]

const INITIAL_COMBATANTS = [
  { name: 'Sir Rowan', role: 'Paladin · Ally', hp: 34, maxHp: 42, initiative: 19, color: '#d6aa55' },
  { name: 'Ashen Guard', role: 'Enemy', hp: 27, maxHp: 35, initiative: 15, color: '#b95b4a' },
  { name: 'Mira Quickstep', role: 'Ranger · Ally', hp: 22, maxHp: 28, initiative: 12, color: '#6b9d70' },
]

function DemoSidebar({ active }) {
  return (
    <aside className="demo-sidebar">
      <Link to="/" className="demo-brand" aria-label="5eUtility demo home">
        <span className="demo-brand-mark">5e</span>
        <span><strong>5eUtility</strong><small>YOUR CAMPAIGN, AT HAND</small></span>
      </Link>
      <div className="demo-sidebar-label">EXPLORE THE DEMO</div>
      <nav className="demo-nav" aria-label="Demo pages">
        {FEATURES.map(feature => (
          <Link
            key={feature.id}
            to={`/demo/${feature.id}`}
            className={`demo-nav-link${active === feature.id ? ' is-active' : ''}`}
            aria-current={active === feature.id ? 'page' : undefined}
          >
            <span className="demo-nav-icon" aria-hidden="true">{feature.icon}</span>
            <span>{feature.label}</span>
            <span className="demo-nav-arrow" aria-hidden="true">›</span>
          </Link>
        ))}
      </nav>
      <div className="demo-sidebar-footer">
        <span className="demo-online-dot" />
        Sample campaign · changes are temporary
      </div>
    </aside>
  )
}

function SaveProgressPanel() {
  return (
    <aside className="demo-save-column">
      <div className="demo-save-card">
        <span className="demo-save-emblem" aria-hidden="true">✦</span>
        <p className="demo-eyebrow">KEEP YOUR ADVENTURE</p>
        <h2>Save your progress</h2>
        <p className="demo-save-copy">Create an account to keep your characters, campaign notes, maps, and session plans.</p>
        <Link className="demo-signup-button" to="/login">Create a free account <span aria-hidden="true">→</span></Link>
        <Link className="demo-login-link" to="/login">Already have an account? <strong>Sign in</strong></Link>
      </div>
      <div className="demo-save-note">
        <span aria-hidden="true">⌁</span>
        Demo edits stay in this browser session and are never saved to an account.
      </div>
    </aside>
  )
}

function DemoHeader({ title, subtitle }) {
  return (
    <header className="demo-page-header">
      <div>
        <p className="demo-eyebrow">THE WAYFINDER’S LEDGER · DEMO</p>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <span className="demo-live-pill"><span /> LIVE PREVIEW</span>
    </header>
  )
}

function StoryboardDemo() {
  const [sceneIndex, setSceneIndex] = useState(0)
  const scene = STORY_SCENES[sceneIndex]
  return (
    <>
      <DemoHeader title="Your story, unfolding." subtitle="Set the scene, share the moment, and give every session a place in your campaign’s story." />
      <section className="demo-storybook card">
        <div className="demo-storybook-top">
          <span>THE ASHEN CROWN</span>
          <span>CHAPTER {String(sceneIndex + 1).padStart(2, '0')} · 03</span>
        </div>
        <div className="demo-story-art" aria-label="Illustration placeholder for the campaign scene">
          <span className="demo-art-sigil">✧</span>
          <span className="demo-art-label">CAMPAIGN ARTWORK</span>
          <span className="demo-art-caption">A road through the old kingdom</span>
        </div>
        <div className="demo-story-copy">
          <p className="demo-eyebrow">A TALE IN THREE SCENES</p>
          <h2>{scene.title}</h2>
          <p>{scene.text}</p>
          <div className="demo-story-controls">
            <button type="button" className="demo-icon-button" onClick={() => setSceneIndex(index => (index + STORY_SCENES.length - 1) % STORY_SCENES.length)} aria-label="Previous scene">←</button>
            <div className="demo-story-dots" aria-label={`Scene ${sceneIndex + 1} of ${STORY_SCENES.length}`}>
              {STORY_SCENES.map((item, index) => <span key={item.title} className={index === sceneIndex ? 'is-active' : ''} />)}
            </div>
            <button type="button" className="demo-icon-button" onClick={() => setSceneIndex(index => (index + 1) % STORY_SCENES.length)} aria-label="Next scene">→</button>
          </div>
        </div>
      </section>
    </>
  )
}

function JournalDemo() {
  const [selected, setSelected] = useState(0)
  const [entries, setEntries] = useState(JOURNAL_ENTRIES)
  const [draft, setDraft] = useState('')
  const activeEntry = entries[selected]

  const addEntry = () => {
    const text = draft.trim()
    if (!text) return
    const next = [{ title: 'A new page', date: 'Just now', text }, ...entries]
    setEntries(next)
    setSelected(0)
    setDraft('')
  }

  return (
    <>
      <DemoHeader title="A journal for the journey." subtitle="Capture the moments, mysteries, and memories your character will carry forward." />
      <section className="demo-journal card">
        <div className="demo-journal-list">
          <div className="demo-journal-list-head"><span>TRAVELER’S JOURNAL</span><span>✧</span></div>
          {entries.map((entry, index) => (
            <button type="button" key={`${entry.title}-${index}`} className={`demo-journal-entry${selected === index ? ' is-active' : ''}`} onClick={() => setSelected(index)}>
              <span className="demo-journal-entry-date">{entry.date}</span>
              <strong>{entry.title}</strong>
            </button>
          ))}
        </div>
        <article className="demo-journal-page">
          <span className="demo-journal-date">{activeEntry.date}</span>
          <h2>{activeEntry.title}</h2>
          <p>{activeEntry.text}</p>
          <div className="demo-journal-rule" />
          <label className="demo-journal-label" htmlFor="demo-journal-draft">Add a line to your journal</label>
          <textarea id="demo-journal-draft" value={draft} onChange={event => setDraft(event.target.value)} placeholder="What happened on your adventure?" rows={3} />
          <button type="button" className="demo-gold-button" onClick={addEntry} disabled={!draft.trim()}>Add page <span aria-hidden="true">↗</span></button>
        </article>
      </section>
    </>
  )
}

function BattleMapDemo() {
  const [selectedToken, setSelectedToken] = useState(0)
  const [tokens, setTokens] = useState([
    { name: 'Rowan', glyph: 'R', color: '#d6aa55', x: 5, y: 5 },
    { name: 'Mira', glyph: 'M', color: '#6b9d70', x: 7, y: 6 },
    { name: 'Goblin', glyph: 'G', color: '#bd6557', x: 11, y: 4 },
  ])
  const tileStyles = {
    '.': 'demo-map-floor',
    g: 'demo-map-grass',
    w: 'demo-map-water',
    s: 'demo-map-stone',
  }

  const moveToken = (x, y) => setTokens(current => current.map((token, index) => index === selectedToken ? { ...token, x, y } : token))

  return (
    <>
      <DemoHeader title="Set the scene. Play the moment." subtitle="Explore a sample encounter map. Select a token, then move it to any open tile." />
      <section className="demo-map-card card">
        <div className="demo-map-toolbar">
          <div><span className="demo-map-status-dot" /> <strong>THE OLD KING’S ROAD</strong><small>Sample encounter · 16 × 12</small></div>
          <span className="demo-map-light">☀ DAYLIGHT</span>
        </div>
        <div className="demo-map-canvas-wrap">
          <div className="demo-map-grid" role="grid" aria-label="Interactive sample battle map">
            {MAP_LAYOUT.flatMap((row, y) => [...row].map((tile, x) => {
              const token = tokens.find(item => item.x === x && item.y === y)
              return (
                <button
                  type="button"
                  role="gridcell"
                  key={`${x}-${y}`}
                  className={`demo-map-cell ${tileStyles[tile]}`}
                  aria-label={`${tile === 'w' ? 'Water' : tile === 'g' ? 'Grass' : tile === 's' ? 'Stone path' : 'Ground'} at ${x + 1}, ${y + 1}${token ? `, ${token.name}` : ''}`}
                  onClick={() => moveToken(x, y)}
                >
                  {token && <span className={`demo-map-token${selectedToken === tokens.indexOf(token) ? ' is-selected' : ''}`} style={{ '--token-color': token.color }}>{token.glyph}</span>}
                </button>
              )
            }))}
          </div>
        </div>
        <div className="demo-map-token-tray">
          <span className="demo-map-tray-label">MOVE A TOKEN</span>
          {tokens.map((token, index) => (
            <button key={token.name} type="button" className={`demo-token-select${selectedToken === index ? ' is-active' : ''}`} onClick={() => setSelectedToken(index)}>
              <span style={{ '--token-color': token.color }}>{token.glyph}</span>{token.name}
            </button>
          ))}
        </div>
      </section>
    </>
  )
}

function BattleTrackerDemo() {
  const [combatants, setCombatants] = useState(INITIAL_COMBATANTS)
  const [activeTurn, setActiveTurn] = useState(0)
  const adjustHp = (index, amount) => setCombatants(current => current.map((person, i) => i === index ? { ...person, hp: Math.max(0, Math.min(person.maxHp, person.hp + amount)) } : person))
  const nextTurn = () => setActiveTurn(index => (index + 1) % combatants.length)

  return (
    <>
      <DemoHeader title="The table is yours." subtitle="Keep initiative moving and the party’s hit points in view." />
      <section className="demo-combat card">
        <div className="demo-combat-head">
          <div><p className="demo-eyebrow">ENCOUNTER IN PROGRESS</p><h2>Ambush on the Old Road</h2></div>
          <button type="button" className="demo-gold-button" onClick={nextTurn}>Next turn <span aria-hidden="true">→</span></button>
        </div>
        <div className="demo-round-label"><span>ROUND 03</span><span>INITIATIVE ORDER</span></div>
        <div className="demo-combat-list">
          {combatants.map((person, index) => (
            <article className={`demo-combatant${activeTurn === index ? ' is-current' : ''}`} key={person.name}>
              <span className="demo-combatant-initiative">{person.initiative}</span>
              <span className="demo-combatant-avatar" style={{ '--token-color': person.color }}>{person.name.slice(0, 1)}</span>
              <div className="demo-combatant-info">
                <strong>{person.name}</strong><span>{person.role}</span>
                <div className="demo-hp-track"><span style={{ width: `${(person.hp / person.maxHp) * 100}%`, background: person.hp / person.maxHp < 0.3 ? '#bc6252' : person.color }} /></div>
              </div>
              <div className="demo-combatant-hp"><strong>{person.hp}</strong><span> / {person.maxHp} HP</span></div>
              <div className="demo-hp-controls">
                <button type="button" onClick={() => adjustHp(index, -1)} aria-label={`Reduce ${person.name}'s hit points`}>−</button>
                <button type="button" onClick={() => adjustHp(index, 1)} aria-label={`Increase ${person.name}'s hit points`}>+</button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}

function RoleplayDemo() {
  const [prompt, setPrompt] = useState('A guarded stranger asks what brings you to Emberfall.')
  const [character, setCharacter] = useState('A curious ranger')
  const [reply, setReply] = useState('')

  const generateReply = () => setReply(`${character}: “I’m following a trail that ends here. If you know this road, perhaps we can help each other.”`)

  return (
    <>
      <DemoHeader title="Find your character’s voice." subtitle="A little inspiration can turn a quiet moment into the start of a story." />
      <section className="demo-roleplay card">
        <div className="demo-roleplay-scene">
          <p className="demo-eyebrow">THE MOMENT</p>
          <h2>A stranger at the crossroads</h2>
          <p>{prompt}</p>
          <div className="demo-prompt-options">
            {[
              'A guarded stranger asks what brings you to Emberfall.',
              'The innkeeper recognizes your family crest.',
              'A child offers you a map with one place crossed out.',
            ].map(item => <button key={item} type="button" className={prompt === item ? 'is-active' : ''} onClick={() => { setPrompt(item); setReply('') }}>{item}</button>)}
          </div>
        </div>
        <div className="demo-roleplay-response">
          <label className="demo-journal-label" htmlFor="demo-character">YOUR CHARACTER</label>
          <input id="demo-character" value={character} onChange={event => setCharacter(event.target.value)} />
          <button type="button" className="demo-gold-button" onClick={generateReply} disabled={!character.trim()}>Find an opening <span aria-hidden="true">✧</span></button>
          {reply ? <blockquote>{reply}</blockquote> : <div className="demo-roleplay-hint">Choose a moment and try a response. This preview runs locally and won’t save.</div>}
        </div>
      </section>
    </>
  )
}

function DemoLanding({ onExplore }) {
  return (
    <section className="demo-hero">
      <div className="demo-hero-backdrop" aria-hidden="true">
        <video className="demo-hero-video" autoPlay muted loop playsInline preload="metadata" aria-hidden="true">
          <source src="https://res.cloudinary.com/crcbzpw6/video/upload/v1792050326/tmpq4v_63hj.mp4" type="video/mp4" />
        </video>
        <div className="demo-hero-shade" />
      </div>
      <div className="demo-hero-content">
        <span className="demo-hero-kicker"><span /> YOUR TABLE. YOUR TALE.</span>
        <h1>Every great story<br /><em>needs a place to begin.</em></h1>
        <p>Bring your characters, campaign, and adventures together in one welcoming home for your D&amp;D table.</p>
        <div className="demo-hero-actions">
          <button type="button" className="demo-hero-cta" onClick={onExplore}>Explore the demo <span aria-hidden="true">→</span></button>
          <Link to="/login" className="demo-hero-signin">Sign in <span aria-hidden="true">↗</span></Link>
        </div>
        <div className="demo-hero-footnote"><span>01 / 05</span><span>SCROLL THE STORY, NOT YOUR SPREADSHEETS</span></div>
      </div>
      <div className="demo-hero-watermark" aria-hidden="true">5e</div>
    </section>
  )
}

export default function PublicDemo() {
  const { feature } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const onLanding = location.pathname === '/'
  const activeFeature = FEATURES.find(item => item.id === feature)

  const explore = () => navigate(`/demo/${FEATURES[0].id}`)
  const content = onLanding
    ? <DemoLanding onExplore={explore} />
    : !activeFeature
      ? <section className="demo-not-found"><h1>That page isn’t in this preview.</h1><Link to={`/demo/${FEATURES[0].id}`}>Explore the demo</Link></section>
      : (
        <div className="demo-page-content">
          {feature === 'storyboard' && <StoryboardDemo />}
          {feature === 'journal' && <JournalDemo />}
          {feature === 'battle-map' && <BattleMapDemo />}
          {feature === 'battle-tracker' && <BattleTrackerDemo />}
          {feature === 'roleplay' && <RoleplayDemo />}
        </div>
      )

  return (
    <div className="demo-app">
      <DemoSidebar active={feature} />
      <main className="demo-main">
        {!onLanding && (
          <div className="demo-topbar">
            <Link to="/" aria-label="Back to 5eUtility introduction">5eUTILITY <span>/ DEMO</span></Link>
            <Link to="/login">Sign in <span aria-hidden="true">↗</span></Link>
          </div>
        )}
        {content}
      </main>
      <SaveProgressPanel />
    </div>
  )
}
