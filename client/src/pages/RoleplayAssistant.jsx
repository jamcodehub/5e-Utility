import { useState, useEffect, useCallback } from 'react'
import { api, useAuth } from '../context/AuthContext'
import { useCampaign } from '../context/CampaignContext'
import { useToast } from '../hooks/useToast'

// ─── Template engine ────────────────────────────────────────────────────────
// Builds a personalised 4-phase checklist from the rich context the player
// enters manually — not just the sparse character-sheet fields.

const CLASS_HOOKS = {
  fighter:   { explore: "Offer to take point when scouting — your combat instincts make you the party's natural shield.", combat: "Call out enemy positioning to allies each round to show your tactical mind." },
  rogue:     { explore: "Suggest casing the area ahead alone; stay in character while scouting.", combat: "Pick one distinct target per fight and narrate your flanking approach." },
  wizard:    { explore: "Reference obscure lore when encountering ruins, creatures, or magical phenomena.", combat: "Name your spells dramatically and describe the feeling of channelling magic." },
  sorcerer:  { explore: "Let your wild magic nature show — react with surprise or unease when power feels unstable.", combat: "Describe the visceral, involuntary sensation of power surging through you." },
  cleric:    { explore: "Invoke your deity's domain in observations. Let divinity shape what you notice first.", combat: "Narrate prayers before healing; make divine power feel like a conversation, not a button." },
  druid:     { explore: "React visibly to the health of nature — note corruption, beauty, or wrongness in the land.", combat: "Describe Wild Shape as a spiritual connection, not just a stat swap." },
  paladin:   { explore: "Make your oath visible in small choices — who you protect, what you refuse to touch.", combat: "Deliver short oaths or condemnations when smiting; justice should feel earned." },
  ranger:    { explore: "Track the environment actively — comment on tracks, weather, the behaviour of wildlife.", combat: "Name your prey before combat and maintain that focus through the fight." },
  bard:      { explore: "Collect rumours and retell them with your own spin; your network is your best tool.", combat: "Hype specific allies with Bardic Inspiration — make the recipient feel chosen." },
  warlock:   { explore: "Show the cost of your pact through fatigue, compulsions, or unsettling patron whispers.", combat: "Describe Eldritch Blast as something alien and cold — beyond your full understanding." },
  monk:      { explore: "React to chaos with visible stillness; your composure is itself a character beat.", combat: "Narrate your breath and footwork; monastic training should feel present in your body." },
  barbarian: { explore: "Let instincts speak louder than words — physical reactions, smells, sounds others miss.", combat: "When raging, narrate the tunnel vision; the world narrows to the threat in front of you." },
}

const RACE_HOOKS = {
  elf:          "Your long memory means you may recognise echoes of history others overlook — play that quietly.",
  dwarf:        "Evaluate stonework, craftsmanship, and underground spaces with professional eyes.",
  halfling:     "Your warmth disarms people; use small comforts (sharing food, remembering names) as character moments.",
  human:        "Your ambition and adaptability are defining traits — show them through decisions under pressure.",
  tiefling:     "Anticipate suspicion from strangers; decide in the moment whether to address it or ignore it.",
  dragonborn:   "Your heritage commands a room — use that presence deliberately; not every door needs to be kicked.",
  gnome:        "Curiosity and tinkering are instincts, not affectations — let them surface at inconvenient moments.",
  'half-elf':   "You read both worlds without fully belonging to either; show that tension in how you navigate groups.",
  'half-orc':   "Your physicality speaks before you do — use that, or work against it, as the moment demands.",
  drow:         "Surface-world light, customs, and open skies are still subtly wrong to you — lean into that.",
}

// ─── Checklist builder ───────────────────────────────────────────────────────

function buildChecklist(ctx) {
  const cls      = (ctx.characterClass || '').toLowerCase().replace(/\s+/g, '')
  const race     = (ctx.race || '').toLowerCase()
  const name     = ctx.name || 'Your character'
  const bg       = ((ctx.background || '') + ' ' + (ctx.personality || '') + ' ' + (ctx.lore || '')).toLowerCase()
  const lastSess = (ctx.lastSession || '').trim()
  const profBonus = ctx.profBonus ?? 2

  const classHook = Object.entries(CLASS_HOOKS).find(([k]) => cls.includes(k))?.[1]
  const raceHook  = Object.entries(RACE_HOOKS).find(([k]) => race.includes(k))?.[1]

  const hasTragedy  = /lost|death|killed|died|orphan|grief|tragedy|revenge/.test(bg)
  const hasSecret   = /secret|hiding|disguise|hidden|past/.test(bg)
  const hasShy      = /shy|quiet|anxious|nervous|introverted|awkward/.test(bg)
  const hasArrogant = /arrogant|proud|confident|boastful|superior/.test(bg)
  const hasNoble    = /noble|aristocrat|lord|lady|royal|court/.test(bg)
  const hasCriminal = /criminal|thief|outlaw|exile|prison|assassin/.test(bg)
  const hasFaith    = /faith|god|goddess|deity|temple|divine|prayer|worship/.test(bg)
  const hasLoss     = /lost|abandoned|left behind|betrayed|alone/.test(bg)

  const personalityBeat = hasTragedy
    ? `When the group rests, let a quiet grief surface — not melodramatically, just a moment of stillness others might notice.`
    : hasSecret
    ? `Find one moment this session to let ${name}'s mask slip slightly. A hesitation, a deflection. Let the secret breathe.`
    : hasShy
    ? `Challenge yourself: say something in one social scene that ${name} would normally stay quiet about.`
    : hasArrogant
    ? `Let ${name}'s confidence make one wrong call this session — then decide how they respond to being wrong.`
    : hasNoble
    ? `Your upbringing shapes how you read power dynamics in every room — play the social chess even when combat is the obvious answer.`
    : hasCriminal
    ? `Old habits are a resource and a liability. Let one surface this session and decide whether it helps or complicates things.`
    : hasFaith
    ? `Let your faith be a lens, not just a trait. Comment on events through your deity's values — even quietly.`
    : hasLoss
    ? `You've learned to hold people at arm's length. Let something this session make that harder.`
    : `Choose one recurring verbal tic, gesture, or habit for ${name} this session and return to it consistently.`

  const goalBeat = ctx.goals && ctx.goals.trim()
    ? `Your driving goal is: "${ctx.goals.trim()}". Look for one moment this session — even small — to move toward it or be reminded of what it costs.`
    : `Before the session starts, remind yourself what ${name} wants right now. Let that want shape at least one decision.`

  const continuityBeat = lastSess
    ? `Last session: ${lastSess.charAt(0).toUpperCase() + lastSess.slice(1)}. Carry something forward — reference it in dialogue, let ${name}'s reaction still be present today.`
    : `Identify one unresolved thread from a previous session and find a way to acknowledge it — even if only internally.`

  return [
    {
      phase: 'Phase 1: Pre-Session Mindset',
      headerColor: '#7e22ce',
      headerBg: 'rgba(126,34,206,0.08)',
      items: [
        {
          title: 'Know your numbers cold',
          desc: `HP, AC, initiative bonus, and your top two go-to actions. Hesitating on mechanics breaks immersion for the whole table.`,
          goal: 'Arrive prepared, not scrambling mid-game.',
        },
        {
          title: 'Your personal goal for today',
          desc: goalBeat,
          goal: 'Gives your play direction beyond the plot.',
        },
        {
          title: 'Continuity hook',
          desc: continuityBeat,
          goal: 'Characters who remember create a living world.',
        },
        raceHook ? {
          title: `${ctx.race || 'Racial'} identity`,
          desc: raceHook,
          goal: 'Ground the character in something deeper than class mechanics.',
        } : null,
      ].filter(Boolean),
    },
    {
      phase: 'Phase 2: Exploration & Environment',
      headerColor: '#1d6a3a',
      headerBg: 'rgba(29,106,58,0.08)',
      items: [
        classHook ? {
          title: `${ctx.characterClass || 'Class'} roleplay hook`,
          desc: classHook.explore,
          goal: 'Make your class identity visible outside of combat.',
        } : null,
        {
          title: "React to the world, don't just navigate it",
          desc: 'Comment on smells, architecture, weather, sounds. Let the setting land on your character.',
          goal: 'Immersion for everyone at the table.',
        },
        {
          title: 'Engage one NPC beyond transaction',
          desc: "Ask a shopkeeper about their day. Remember a guard's name. Treat one background character like a person.",
          goal: 'Build a world that feels inhabited.',
        },
        ctx.campaignContext && ctx.campaignContext.trim() ? {
          title: 'Lean into the campaign setting',
          desc: `The campaign is: "${ctx.campaignContext.trim()}". Let this world's specific flavour shape how ${name} perceives and speaks about what's around them.`,
          goal: 'Your character exists inside this world, not just passing through it.',
        } : null,
      ].filter(Boolean),
    },
    {
      phase: 'Phase 3: Social & Character Depth',
      headerColor: '#9a7c3a',
      headerBg: 'rgba(154,124,58,0.08)',
      items: [
        {
          title: 'Your personality in action',
          desc: personalityBeat,
          goal: `Make ${name} memorable, not just competent.`,
        },
        ctx.personality && ctx.personality.trim() ? {
          title: 'Express a personality trait organically',
          desc: `You described ${name} as: "${ctx.personality.trim()}". Find one scene this session where that trait drives a choice — not as performance, but as inevitability.`,
          goal: 'Traits are only real when they cost something.',
        } : null,
        {
          title: `Proficiency bonus reminder (+${profBonus})`,
          desc: `You add +${profBonus} to proficient skill checks. When ${name} does something they're trained in, let the confidence show in how they approach it — not just in the roll.`,
          goal: 'Use mechanics to fuel roleplay, not replace it.',
        },
        {
          title: "Acknowledge another character's moment",
          desc: `When a party member does something in-character or impressive, let ${name} react. Nod, comment, remember it aloud later.`,
          goal: 'Party chemistry that feels earned, not performed.',
        },
      ].filter(Boolean),
    },
    {
      phase: 'Phase 4: Combat & Crisis',
      headerColor: '#b03030',
      headerBg: 'rgba(176,48,48,0.08)',
      items: [
        classHook ? {
          title: `${ctx.characterClass || 'Class'} combat identity`,
          desc: classHook.combat,
          goal: 'Make fights feel like story, not board game.',
        } : null,
        {
          title: "Describe your actions, don't just declare them",
          desc: '"I drive my shoulder into their shield and sweep their legs" beats "I attack." Before you roll, say what your character physically does.',
          goal: 'Narrate > declare.',
        },
        {
          title: 'React to taking damage',
          desc: `When ${name} takes a hit, give it a moment. Grunt, stagger, glance at the wound. HP is an abstraction; pain is real.`,
          goal: 'Keep tension alive even when the numbers are fine.',
        },
        ctx.lore && ctx.lore.trim() ? {
          title: 'Let your lore surface under pressure',
          desc: `${name}'s history: "${ctx.lore.length > 120 ? ctx.lore.slice(0, 120).trim() + '…' : ctx.lore.trim()}". In moments of danger, old wounds, instincts, and memories rise — let them.`,
          goal: 'Crisis reveals character. Use it.',
        } : null,
      ].filter(Boolean),
    },
  ]
}

// ─── Storage key ─────────────────────────────────────────────────────────────
const storageKey = (campaignId) => `rp_context_${campaignId}`

const emptyCtx = () => ({
  name: '', race: '', characterClass: '', level: '', profBonus: 2,
  background: '', personality: '', goals: '', lore: '',
  campaignContext: '', lastSession: '',
})

// ─── Component ───────────────────────────────────────────────────────────────

export default function RoleplayAssistant() {
  const { activeCampaign } = useCampaign()
  const { isPremium } = useAuth()
  const { toast, ToastContainer } = useToast()

  // step: 'context' | 'checklist'
  const [step, setStep]               = useState('context')
  const [ctx, setCtx]                 = useState(emptyCtx())
  const [checklist, setChecklist]     = useState(null)
  const [sessionCount, setSessionCount] = useState(0)
  const [loading, setLoading]         = useState(false)
  const [checked, setChecked]         = useState({})
  const [charLoaded, setCharLoaded]   = useState(false)

  // Pre-fill form from character sheet; prefer saved context from localStorage
  const loadChar = useCallback(async () => {
    if (!activeCampaign) return
    try {
      const saved = localStorage.getItem(storageKey(activeCampaign._id))
      if (saved) {
        try { setCtx(JSON.parse(saved)); setCharLoaded(true); } catch {}
      }
      const char = await api(`/campaigns/${activeCampaign._id}/character`)
      if (char) {
        setSessionCount(char.roleplaySessionCount || 0)
        if (!saved) {
          setCtx(prev => ({
            ...prev,
            name: char.name || '',
            race: char.race || '',
            characterClass: char.class || '',
            level: String(char.level || ''),
            profBonus: char.profBonus ?? 2,
            background: char.notes || '',
          }))
        }
        setCharLoaded(true)
      }
    } catch {
      setCharLoaded(true)
    }
  }, [activeCampaign])

  useEffect(() => { loadChar() }, [loadChar])

  // Persist context to localStorage whenever it changes
  useEffect(() => {
    if (activeCampaign && charLoaded) {
      localStorage.setItem(storageKey(activeCampaign._id), JSON.stringify(ctx))
    }
  }, [ctx, activeCampaign, charLoaded])

  const set = (field) => (e) => setCtx(p => ({ ...p, [field]: e.target.value }))

  const canGenerate   = isPremium || sessionCount === 0
  const contextReady  = ctx.name.trim() && ctx.characterClass.trim() && ctx.background.trim()

  const generate = async () => {
    if (!contextReady) { toast('Fill in Name, Class, and Background at minimum.'); return }
    setLoading(true)
    try {
      const res = await api(`/campaigns/${activeCampaign._id}/roleplay-session`, { method: 'POST' })
      setSessionCount(res.sessionCount)
      setChecklist(buildChecklist(ctx))
      setChecked({})
      setStep('checklist')
    } catch (err) {
      toast(err.message || 'Failed to start session')
    }
    setLoading(false)
  }

  const reset  = () => { setStep('context'); setChecklist(null); setChecked({}) }
  const toggle = (key) => setChecked(p => ({ ...p, [key]: !p[key] }))

  if (!activeCampaign) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}>
        Select a campaign to use the Roleplay Assistant.
      </div>
    )
  }

  // ── Step 1: Context form ────────────────────────────────────────────────────
  if (step === 'context') {
    return (
      <div className="page-content">
        <div className="page-header-row" style={{ marginBottom: 4 }}>
          <div>
            <h2 style={{ fontSize: 22, marginBottom: 4 }}>Roleplay Assistant</h2>
            <p style={{ color: 'var(--text-2)', fontSize: 14, margin: 0 }}>
              Tell the assistant about your character first — the more detail you give, the more personalised your session plan will be.
            </p>
          </div>
          {sessionCount > 0 && (
            <div style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'right' }}>
              {sessionCount} session{sessionCount !== 1 ? 's' : ''} run
              {!isPremium && sessionCount >= 1 && (
                <div style={{ color: '#c0392b', marginTop: 2 }}>Upgrade for more sessions</div>
              )}
            </div>
          )}
        </div>

        {/* Premium gate warning */}
        {!canGenerate && (
          <div className="card" style={{ padding: '14px 18px', marginBottom: 16, borderLeft: '3px solid #c0392b', maxWidth: 620 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, color: '#c0392b' }}>Premium required</div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 10 }}>
              Your first session was free. Upgrade to Premium to generate unlimited session plans.
            </div>
            <button className="btn btn-gold" onClick={() => window.location.href = '/premium'}>✦ Upgrade to Premium</button>
          </div>
        )}

        <div style={{ maxWidth: 620, display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Character basics */}
          <div className="card" style={{ padding: '18px 20px' }}>
            <SectionLabel>Character Basics</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Character Name *" value={ctx.name} onChange={set('name')} placeholder="e.g. Caelindra" />
              <Field label="Race" value={ctx.race} onChange={set('race')} placeholder="e.g. High Elf" />
              <Field label="Class *" value={ctx.characterClass} onChange={set('characterClass')} placeholder="e.g. Wizard" />
              <Field label="Level" value={ctx.level} onChange={set('level')} placeholder="e.g. 5" type="number" />
            </div>
          </div>

          {/* Character depth */}
          <div className="card" style={{ padding: '18px 20px' }}>
            <SectionLabel>Character Depth</SectionLabel>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 14, lineHeight: 1.5 }}>
              Copy from your character sheet, DnD Beyond, or write it freehand. The more you include, the more specific your plan becomes.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <TextArea
                label="Background / Origin *"
                value={ctx.background}
                onChange={set('background')}
                placeholder={"Where did your character come from? What shaped them before the campaign began?\ne.g. 'Raised in a thieves guild after being abandoned as a child. Left after refusing to kill an innocent mark.'"}
                rows={3}
              />
              <TextArea
                label="Personality Traits"
                value={ctx.personality}
                onChange={set('personality')}
                placeholder={"How do they speak, carry themselves, treat others? Key quirks or mannerisms.\ne.g. 'Speaks formally even in casual settings. Hates being touched. Laughs at the wrong moments when nervous.'"}
                rows={2}
              />
              <TextArea
                label="Goals & Motivations"
                value={ctx.goals}
                onChange={set('goals')}
                placeholder={"What does your character want — short and long term?\ne.g. 'Prove they deserve their title. Find the brother who vanished during the war.'"}
                rows={2}
              />
              <TextArea
                label="Lore / Secrets / Backstory Detail"
                value={ctx.lore}
                onChange={set('lore')}
                placeholder={"Secrets, relationships, fears, scars, obligations. Anything that drives or haunts them.\ne.g. 'Carries a debt to a demon lord she hasn't told the party about. Terrified of fire — her village burned.'"}
                rows={3}
              />
            </div>
          </div>

          {/* Campaign context */}
          <div className="card" style={{ padding: '18px 20px' }}>
            <SectionLabel>Campaign Context</SectionLabel>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 14, lineHeight: 1.5 }}>
              Helps tailor suggestions to the world and current story arc. Update "Last Session" each week.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <TextArea
                label="Campaign Description / Setting"
                value={ctx.campaignContext}
                onChange={set('campaignContext')}
                placeholder={"What is this campaign about? The tone, setting, stakes.\ne.g. 'Political intrigue in a dying empire. The party is trying to prevent a succession war while being manipulated by multiple factions.'"}
                rows={2}
              />
              <TextArea
                label="What Happened Last Session?"
                value={ctx.lastSession}
                onChange={set('lastSession')}
                placeholder={"A quick 2–3 sentence recap — creates continuity hooks in your plan.\ne.g. 'We infiltrated the Duke's masquerade ball. Valeria recognised my character and didn't give us away — we don't know why yet.'"}
                rows={2}
              />
            </div>
          </div>

          {/* Generate */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 32 }}>
            {!contextReady && (
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Fill in Name, Class, and Background to continue.</div>
            )}
            <button
              className="btn btn-primary"
              style={{ opacity: (!contextReady || !canGenerate) ? 0.5 : 1, maxWidth: 280 }}
              disabled={!contextReady || !canGenerate || loading}
              onClick={generate}
            >
              {loading ? 'Building your plan…' : sessionCount === 0 ? '✦ Generate Session Plan  (Free)' : '✦ Generate Session Plan'}
            </button>
            {sessionCount === 0 && (
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>First session is free · Subsequent sessions require Premium</div>
            )}
          </div>

        </div>
        <ToastContainer />
      </div>
    )
  }

  // ── Step 2: Checklist ───────────────────────────────────────────────────────
  return (
    <div className="page-content">
      <div className="page-header-row" style={{ marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 22, marginBottom: 4 }}>Session #{sessionCount} Plan</h2>
          <p style={{ color: 'var(--text-2)', fontSize: 14, margin: 0 }}>
            {ctx.name}{[ctx.race, ctx.characterClass, ctx.level ? `Level ${ctx.level}` : ''].filter(Boolean).length > 0
              ? ' · ' + [ctx.race, ctx.characterClass, ctx.level ? `Level ${ctx.level}` : ''].filter(Boolean).join(' · ')
              : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={reset}>← Edit Context</button>
          <button className="btn btn-ghost btn-sm" onClick={() => { setChecklist(buildChecklist(ctx)); setChecked({}) }}>↺ Regenerate</button>
        </div>
      </div>

      {/* Pro tip */}
      <div style={{ padding: '10px 14px', marginBottom: 16, maxWidth: 700, background: 'var(--gold-bg)', border: '1px solid var(--gold-border)', borderRadius: 8, fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>
        <strong style={{ color: 'var(--gold)' }}>How to use this:</strong> Pick <strong>2–3 items</strong> to focus on — not all of them. Tick items as the session progresses. Consistency over multiple sessions is what makes a character unforgettable.
      </div>

      <div style={{ maxWidth: 700 }}>
        {checklist.map((phase) => {
          const done = phase.items.filter(item => checked[phase.phase + item.title]).length
          return (
            <div key={phase.phase} className="card" style={{ marginBottom: 14, overflow: 'hidden' }}>
              <div style={{ padding: '10px 16px', background: phase.headerBg, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontFamily: 'Cinzel, serif', fontSize: 13, fontWeight: 600, color: phase.headerColor }}>{phase.phase}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{done}/{phase.items.length} done</div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--surface2)' }}>
                    <th style={{ width: 32, padding: '6px 12px' }} />
                    <th style={{ padding: '6px 12px', textAlign: 'left', fontSize: 10, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Action</th>
                    <th style={{ padding: '6px 12px', textAlign: 'left', fontSize: 10, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', width: '35%' }}>In-Game Goal</th>
                  </tr>
                </thead>
                <tbody>
                  {phase.items.map((item) => {
                    const key    = phase.phase + item.title
                    const isDone = !!checked[key]
                    return (
                      <tr
                        key={key}
                        style={{ borderTop: '1px solid var(--border)', background: isDone ? 'var(--gold-bg)' : 'transparent', opacity: isDone ? 0.55 : 1, cursor: 'pointer', transition: 'opacity .15s, background .15s' }}
                        onClick={() => toggle(key)}
                      >
                        <td style={{ padding: '10px 12px', textAlign: 'center', verticalAlign: 'top' }}>
                          <div style={{ width: 16, height: 16, borderRadius: 3, border: `2px solid ${isDone ? 'var(--gold)' : 'var(--border-strong)'}`, background: isDone ? 'var(--gold)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '2px auto 0' }}>
                            {isDone && <span style={{ fontSize: 10, color: 'var(--bg)', fontWeight: 700 }}>✓</span>}
                          </div>
                        </td>
                        <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 3, textDecoration: isDone ? 'line-through' : 'none' }}>{item.title}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.55 }}>{item.desc}</div>
                        </td>
                        <td style={{ padding: '10px 12px', verticalAlign: 'top', fontSize: 12, color: 'var(--text-3)', lineHeight: 1.55 }}>{item.goal}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )
        })}
      </div>

      <ToastContainer />
    </div>
  )
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <div style={{ fontFamily: 'Cinzel, serif', fontSize: 12, fontWeight: 600, color: 'var(--gold)', marginBottom: 14, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
      {children}
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</span>
      <input
        type={type}
        className="input"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{ width: '100%' }}
      />
    </label>
  )
}

function TextArea({ label, value, onChange, placeholder, rows = 3 }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</span>
      <textarea
        className="input"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        style={{ width: '100%', resize: 'vertical', lineHeight: 1.55, fontSize: 13 }}
      />
    </label>
  )
}
