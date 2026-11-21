import { useState, useEffect, useCallback } from 'react'
import { api, useAuth } from '../context/AuthContext'
import { useCampaign } from '../context/CampaignContext'
import { useToast } from '../hooks/useToast'
import { SkeletonRoleplayPage } from '../components/Skeleton'
import { isPublicDemoPath } from '../utils/demoRuntime'
import UpgradeModal from '../components/UpgradeModal'

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
  halfelf:     "You read both worlds without fully belonging to either; show that tension in how you navigate groups.",
  halforc:     "Your physicality speaks before you do — use that, or work against it, as the moment demands.",
  drow:         "Surface-world light, customs, and open skies are still subtly wrong to you — lean into that.",
}

// ─── Checklist builder ───────────────────────────────────────────────────────

function buildChecklist(ctx, dmGuide = {}) {
  const cls      = (ctx.characterClass || '').toLowerCase().replace(/\s+/g, '')
  const race     = (ctx.race || '').toLowerCase()
  const name     = ctx.name || 'Your character'
  const bg       = ((ctx.background || '') + ' ' + (ctx.personality || '') + ' ' + (ctx.lore || '')).toLowerCase()
  const lastSess = (ctx.lastSession || '').trim()
  const profBonus = ctx.profBonus ?? 2

  const dmLastSess   = (dmGuide.lastSession || '').trim()
  const dmSetting    = (dmGuide.currentArc || dmGuide.story || '').trim()
  const activeQuests = (dmGuide.quests || []).filter(q => q.status === 'active' && q.title)
  const allNpcs      = (dmGuide.npcs || []).filter(n => n.name)

  const classHook = Object.entries(CLASS_HOOKS).find(([k]) => cls.includes(k))?.[1]
  const raceHook  = Object.entries(RACE_HOOKS).find(([k]) => race.includes(k))?.[1]

  // ── Background flags ────────────────────────────────────────────────────────
  const hasTragedy  = /lost|death|killed|died|orphan|grief|tragedy|revenge/.test(bg)
  const hasSecret   = /secret|hiding|disguise|hidden|past/.test(bg)
  const hasShy      = /shy|quiet|anxious|nervous|introverted|awkward/.test(bg)
  const hasArrogant = /arrogant|proud|confident|boastful|superior/.test(bg)
  const hasNoble    = /noble|aristocrat|lord|lady|royal|court/.test(bg)
  const hasCriminal = /criminal|thief|outlaw|exile|prison|assassin/.test(bg)
  const hasFaith    = /faith|god|goddess|deity|temple|divine|prayer|worship/.test(bg)
  const hasLoss     = /lost|abandoned|left behind|betrayed|alone/.test(bg)
  const hasMystery  = /mystery|unknown|searching|find|looking|seeking/.test(bg)

  // ── NPCs split by whether they have a personal relation for this character ──
  // The DM may have typed the player's character name into characterRelation,
  // or written a personal hook in it. Either way it's more specific than a
  // generic description. We surface those as direct "seek out" action items.
  const npcWithRelation    = allNpcs.filter(n => n.characterRelation && n.characterRelation.trim())
  const npcWithoutRelation = allNpcs.filter(n => !n.characterRelation || !n.characterRelation.trim())

  // ── Quest items ─────────────────────────────────────────────────────────────
  // Quests with a characterRelation are personal hooks; those without are party tasks.
  const personalQuests = activeQuests.filter(q => q.characterRelation && q.characterRelation.trim())
  const partyQuests    = activeQuests.filter(q => !q.characterRelation || !q.characterRelation.trim())

  // ── Backstory-triggered NPC hooks ───────────────────────────────────────────
  // If the DM has an NPC whose description matches a background flag, surface it
  // as a personal enquiry rather than a generic "engage an NPC" item.
  const faithNpc    = allNpcs.find(n => /temple|priest|cleric|shrine|deity|divine|god|faith/.test((n.description || '').toLowerCase()))
  const criminalNpc = allNpcs.find(n => /guild|fence|underworld|thief|outlaw|crime|shadow/.test((n.description || '').toLowerCase()))
  const nobleNpc    = allNpcs.find(n => /lord|duke|court|noble|knight|herald|baron/.test((n.description || '').toLowerCase()))
  const mysteryNpc  = allNpcs.find(n => /scholar|sage|wizard|archivist|historian|librarian|lore/.test((n.description || '').toLowerCase()))

  // ── Shared-quest party interaction ──────────────────────────────────────────
  // If there are quests, the party likely has shared context worth comparing.
  // Pick the quest most likely to involve multiple characters.
  const partyQuestHook = activeQuests.find(q => q.description && q.description.trim()) || activeQuests[0]

  // ── Personality / continuity beats ──────────────────────────────────────────
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

  const effectiveSess = dmLastSess || lastSess
  const continuityBeat = effectiveSess
    ? `Last session: ${effectiveSess.charAt(0).toUpperCase() + effectiveSess.slice(1)}. Carry something forward — reference it in dialogue, let ${name}'s reaction still be present today.`
    : `Identify one unresolved thread from a previous session and find a way to acknowledge it — even if only internally.`

  // ── Backstory enquiry item — derived from background + available NPCs ───────
  const backstoryEnquiry = (() => {
    if (hasFaith && faithNpc)
      return { title: `Seek out ${faithNpc.name}`, desc: `Your faith is part of who ${name} is. ${faithNpc.name} ${faithNpc.characterRelation ? `— ${faithNpc.characterRelation}` : 'may offer spiritual counsel, prophecy, or knowledge connected to your path'}. Approach them as a believer, not just an information source.`, goal: 'Let your beliefs drive an interaction, not just your goals.' }
    if (hasCriminal && criminalNpc)
      return { title: `Reach out to ${criminalNpc.name}`, desc: `${name}'s past opens doors the party can't see. ${criminalNpc.name} ${criminalNpc.characterRelation ? `— ${criminalNpc.characterRelation}` : 'operates in circles your background gives you access to'}. Use that — carefully.`, goal: "Your history is a tool. Use it before it uses you." }
    if (hasNoble && nobleNpc)
      return { title: `Navigate ${nobleNpc.name}`, desc: `Your noble instincts tell you exactly how much power ${nobleNpc.name} holds in this room. ${nobleNpc.characterRelation ? nobleNpc.characterRelation : 'Play the courtly game — what do they want, and what can you trade?'}`, goal: 'Politics is just combat with words.' }
    if ((hasMystery || hasTragedy || hasSecret) && mysteryNpc)
      return { title: `Enquire of ${mysteryNpc.name}`, desc: `There are answers ${name} has been searching for. ${mysteryNpc.name} ${mysteryNpc.characterRelation ? `— ${mysteryNpc.characterRelation}` : 'deals in knowledge — if anyone can shed light on your past, it may be them'}. Find a moment to ask.`, goal: "Some questions are more dangerous than their answers." }
    if (hasFaith)
      return { title: 'Find a moment of private devotion', desc: `A prayer, a touched symbol, a quiet word to your god. ${name}'s faith doesn't need a temple — it just needs a moment. Let the session see it.`, goal: 'Faith shown in small actions is more powerful than grand proclamations.' }
    if (hasCriminal)
      return { title: 'Tap your old network', desc: `${name} knows people the party doesn't. A contact, a favour owed, a back-channel. Find one moment this session to use that shadow-world access for the group's benefit — or just to stay ahead.`, goal: 'Your past is a resource. Use it before it catches up with you.' }
    if (ctx.lore && ctx.lore.trim() && allNpcs.length)
      return { title: `Enquire of ${allNpcs[0].name} about your past`, desc: `${name}'s history: "${ctx.lore.slice(0, 100).trim()}${ctx.lore.length > 100 ? '…' : ''}". Ask ${allNpcs[0].name} whether they know anything about it — obliquely if needed. You might be surprised.`, goal: 'Backstory becomes story when it enters the world.' }
    return null
  })()

  return [
    {
      phase: 'Phase 1: Pre-Session Preparation',
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
      phase: 'Phase 2: Leads & Investigation',
      headerColor: '#1d6a3a',
      headerBg: 'rgba(29,106,58,0.08)',
      items: [
        // Personal NPC hooks (DM has written a specific relation for this character)
        ...npcWithRelation.slice(0, 3).map(n => ({
          title: `Seek out ${n.name}`,
          desc: n.characterRelation.trim() + (n.description ? ` — ${n.description.slice(0, 80).trim()}` : ''),
          goal: `${n.name} is relevant to your story specifically. Don't let this session pass without engaging them.`,
        })),
        // Personal quest hooks
        ...personalQuests.slice(0, 2).map(q => ({
          title: `Follow your thread: "${q.title}"`,
          desc: q.characterRelation.trim() + (q.description ? ` Context: ${q.description.slice(0, 80).trim()}` : ''),
          goal: 'Your personal stake in this quest is what makes it matter. Make that visible.',
        })),
        // Party quests (no personal relation — still needs engagement)
        ...partyQuests.slice(0, 1).map(q => ({
          title: `Advance the party's quest: "${q.title}"`,
          desc: q.description
            ? `${q.description.slice(0, 120).trim()} — Ask questions, gather information, push the thread forward as ${name}.`
            : `Ask a local — a tavern keeper, a merchant, a guard — what they know about the people or places involved in "${q.title}". Background characters often know more than they let on.`,
          goal: 'Quest progress should feel like character action, not task completion.',
        })),
        // Generic NPCs (description only, no personal relation)
        npcWithRelation.length === 0 && npcWithoutRelation.length > 0 ? {
          title: `Engage ${npcWithoutRelation[0].name}`,
          desc: npcWithoutRelation[0].description
            ? `${npcWithoutRelation[0].description.slice(0, 120).trim()} — Go beyond transaction. Ask them something real.`
            : `The DM has placed ${npcWithoutRelation[0].name} in this world for a reason. Treat them like a person, not a quest marker.`,
          goal: 'Build a world that feels inhabited.',
        } : null,
        // Fall back to generic if no DM data at all
        allNpcs.length === 0 && activeQuests.length === 0 ? {
          title: "React to the world, don't just navigate it",
          desc: `Comment on smells, architecture, weather, sounds. ${(dmSetting || ctx.campaignContext || '').trim() ? `Current arc: "${(dmSetting || ctx.campaignContext).trim()}". ` : ''}Let the setting land on ${name}.`,
          goal: 'Immersion for everyone at the table.',
        } : null,
        classHook ? {
          title: `${ctx.characterClass || 'Class'} exploration hook`,
          desc: classHook.explore,
          goal: 'Make your class identity visible outside of combat.',
        } : null,
      ].filter(Boolean),
    },
    {
      phase: 'Phase 3: Social, Party & Personal Depth',
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
        // Backstory enquiry — faith, criminal, mystery, or generic lore hook
        backstoryEnquiry,
        // Party information sharing — prompted by shared quest context
        partyQuestHook ? {
          title: 'Compare notes with your party',
          desc: `The party is all tangled in "${partyQuestHook.title}" — but each character has seen different angles. Before the session escalates, actively ask your allies what they already know. Someone may have a piece you're missing.`,
          goal: 'Shared information changes strategy. Don\'t assume you\'re the only one with a stake in this.',
        } : {
          title: 'Share what your character knows',
          desc: `${name} has their own read on events — share it with the party in character, not as a player. Your perspective may shift how the group moves next.`,
          goal: 'Party chemistry is built through in-character communication, not just combat.',
        },
        {
          title: `Proficiency bonus reminder (+${profBonus})`,
          desc: `You add +${profBonus} to proficient skill checks. When ${name} does something they're trained in, let the confidence show — not just in the roll.`,
          goal: 'Use mechanics to fuel roleplay, not replace it.',
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
        // If there's a personal quest, crises may directly relate to it
        personalQuests.length ? {
          title: `If things escalate around "${personalQuests[0].title}"…`,
          desc: personalQuests[0].characterRelation
            ? `The DM has flagged this is personal to ${name}: "${personalQuests[0].characterRelation}". If combat or crisis erupts in this context, don't just fight — let the stakes land emotionally.`
            : `This quest has personal weight for ${name}. If it turns dangerous, play the fear or fury — not just the tactics.`,
          goal: 'The best combat moments are emotionally charged, not just mechanically satisfying.',
        } : null,
      ].filter(Boolean),
    },
  ]
}

// ─── Storage key ─────────────────────────────────────────────────────────────
const storageKey = (campaignId) => `rp_context_${campaignId}`
// Separate key for the generated plan itself (step/checklist/checked) so a
// generated session plan survives navigating to other pages/tabs and back,
// instead of resetting to the context form every time.
const planStorageKey = (campaignId) => `rp_plan_${campaignId}`

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
  const [dmGuide, setDmGuide]         = useState({})
  // Every generated session plan is kept as a tab: { id, label, checklist, checklistLevel, checked }
  const [plans, setPlans]             = useState([])
  const [activePlanId, setActivePlanId] = useState(null)
  const [sessionCount, setSessionCount] = useState(0)
  const [loading, setLoading]         = useState(false)
  const activePlan     = plans.find(p => p.id === activePlanId) || plans[plans.length - 1] || null
  const checklist      = activePlan?.checklist || null
  const checklistLevel = activePlan?.checklistLevel ?? null   // level when last generated
  const checked        = activePlan?.checked || {}
  const [renamingId, setRenamingId] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const startRename = (p) => { setRenamingId(p.id); setRenameValue(p.label) }
  const commitRename = () => {
    const v = renameValue.trim()
    if (renamingId && v) updatePlan(renamingId, { label: v.slice(0, 60) })
    setRenamingId(null)
  }
  const renameInput = (
    <input className="input" autoFocus value={renameValue} maxLength={60}
      onChange={e => setRenameValue(e.target.value)} onBlur={commitRename} onClick={e => e.stopPropagation()}
      onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setRenamingId(null) }}
      style={{ padding: '2px 6px', fontSize: 13, width: 140 }} />
  )
  const updatePlan = (id, patch) => setPlans(ps => ps.map(p => p.id === id ? { ...p, ...patch } : p))
  const [charLoaded, setCharLoaded]   = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [planLoaded, setPlanLoaded]   = useState(false)

  // Pre-fill form from character sheet; prefer saved context from localStorage
  const loadChar = useCallback(async () => {
    if (!activeCampaign || activeCampaign.isPersonal) return
    setCharLoaded(false)
    try {
      const saved = isPublicDemoPath() ? null : localStorage.getItem(storageKey(activeCampaign._id))
      if (saved) {
        try { setCtx(JSON.parse(saved)); setCharLoaded(true); } catch {}
      }
      const [char, guide] = await Promise.all([
        api(`/campaigns/${activeCampaign._id}/character`),
        api(`/campaigns/${activeCampaign._id}/guide`).catch(() => ({})),
      ])
      if (guide) setDmGuide(guide)
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
            background: char.background || char.notes || '',
            personality: char.personality || '',
            goals: char.goals || '',
            lore: char.lore || '',
          }))
        }
      }
      setCharLoaded(true)
    } catch {
      setCharLoaded(true)
    }
  }, [activeCampaign])

  useEffect(() => { loadChar() }, [loadChar])

  // Restore a previously generated plan (if any) so switching tabs/pages and
  // coming back doesn't reset the user to the context form.
  useEffect(() => {
    if (!activeCampaign) return
    setPlanLoaded(false)
    try {
      const saved = isPublicDemoPath() ? null : localStorage.getItem(planStorageKey(activeCampaign._id))
      if (saved) {
        const parsed = JSON.parse(saved)
        // Older saves stored a single plan; wrap it as the first tab
        const restored = Array.isArray(parsed.plans) ? parsed.plans
          : parsed.checklist ? [{ id: 'legacy', label: 'Session plan', checklist: parsed.checklist, checklistLevel: parsed.checklistLevel ?? null, checked: parsed.checked || {} }]
          : []
        if (restored.length) {
          setPlans(restored)
          setActivePlanId(parsed.activePlanId || restored[restored.length - 1].id)
          setStep(parsed.step || 'checklist')
        } else {
          setPlans([]); setActivePlanId(null); setStep('context')
        }
      } else {
        setPlans([]); setActivePlanId(null); setStep('context')
      }
    } catch { /* ignore malformed storage */ }
    setPlanLoaded(true)
  }, [activeCampaign])

  // Persist the generated plan whenever it changes
  useEffect(() => {
    if (!activeCampaign || !planLoaded) return
    if (plans.length) {
      if (!isPublicDemoPath()) localStorage.setItem(planStorageKey(activeCampaign._id), JSON.stringify({ step, plans, activePlanId }))
    } else {
      if (!isPublicDemoPath()) localStorage.removeItem(planStorageKey(activeCampaign._id))
    }
  }, [activeCampaign, planLoaded, step, plans, activePlanId])

  // Persist context to localStorage whenever it changes
  useEffect(() => {
    if (activeCampaign && charLoaded) {
      if (!isPublicDemoPath()) localStorage.setItem(storageKey(activeCampaign._id), JSON.stringify(ctx))
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
      // Persist depth back to character so DM can see it in Campaign Guide
      api(`/campaigns/${activeCampaign._id}/character/depth`, {
        method: 'PATCH',
        body: { background: ctx.background, personality: ctx.personality, goals: ctx.goals, lore: ctx.lore },
      }).catch(() => {})
      const id = `plan_${Date.now()}`
      setPlans(ps => [...ps, { id, label: `Session #${res.sessionCount}`, checklist: buildChecklist(ctx, dmGuide), checklistLevel: Number(ctx.level) || null, checked: {} }])
      setActivePlanId(id)
      setStep('checklist')
    } catch (err) {
      toast(err.message || 'Failed to start session')
    }
    setLoading(false)
  }

  const reset  = () => setStep('context')
  const toggle = (key) => { if (activePlan) updatePlan(activePlan.id, { checked: { ...activePlan.checked, [key]: !activePlan.checked[key] } }) }

  const closePlan = (id) => {
    const remaining = plans.filter(p => p.id !== id)
    setPlans(remaining)
    if (!remaining.length) { setActivePlanId(null); setStep('context') }
    else if (activePlan?.id === id) setActivePlanId(remaining[remaining.length - 1].id)
  }

  // Regenerate rebuilds the active tab's plan from the latest context and the
  // DM's latest guide (re-fetched, since the DM may have updated quests/NPCs).
  const regenerate = async (level) => {
    if (!canGenerate) { setShowUpgrade(true); return }
    if (!activePlan) return
    let guide = dmGuide
    try {
      const fresh = await api(`/campaigns/${activeCampaign._id}/guide`)
      if (fresh) { guide = fresh; setDmGuide(fresh) }
    } catch { /* fall back to cached guide */ }
    updatePlan(activePlan.id, {
      checklist: buildChecklist(ctx, guide),
      checked: {},
      ...(level !== undefined ? { checklistLevel: level } : {}),
    })
    toast('Plan regenerated from your latest context and DM guide.')
  }

  if (!activeCampaign) {
    return (
      <div className="page-content">
        <div className="page-header-row" style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 20, marginBottom: 2 }}>Roleplay Assistant</h2>
        </div>
        <div style={{ color: 'var(--text-3)' }}>Select a campaign to use the Roleplay Assistant.</div>
      </div>
    )
  }

  if (activeCampaign.isPersonal) {
    return (
      <div className="page-content">
        <div className="page-header-row" style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 20, marginBottom: 2 }}>Roleplay Assistant</h2>
        </div>
        <div style={{ color: 'var(--text-3)' }}>You need to join a campaign first.</div>
      </div>
    )
  }

  if (!charLoaded) return <SkeletonRoleplayPage />

  // ── Step 1: Context form ────────────────────────────────────────────────────
  if (step === 'context') {
    return (
      <div className="roleplay-page" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', padding: '20px 24px 0' }}>
        {/* Header */}
        <div className="roleplay-header" style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16, flexShrink: 0 }}>
          <div>
            <h2 style={{ fontSize: 20, marginBottom: 2 }}>Roleplay Assistant</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, marginLeft: 16 }}>
            {plans.length > 0 && (
              <button className="btn btn-ghost btn-sm" onClick={() => setStep('checklist')}>View plans ({plans.length})</button>
            )}
            {sessionCount > 0 && (
              <div style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'right' }}>
                {sessionCount} session{sessionCount !== 1 ? 's' : ''} run
                {!isPremium && <div style={{ color: '#c0392b', marginTop: 2 }}>Upgrade for more</div>}
              </div>
            )}
          </div>
        </div>

        {/* Two-column body — fills remaining height */}
        <div className="roleplay-form-layout" style={{ display: 'flex', gap: 16, flex: 1, overflow: 'hidden', paddingBottom: 20 }}>

          {/* LEFT — scrollable form */}
          <div className="roleplay-form-column" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingRight: 4 }}>

            <div className="card" style={{ padding: '14px 16px', flexShrink: 0 }}>
              <SectionLabel>Character Basics</SectionLabel>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <Field label="Name *" value={ctx.name} onChange={set('name')} placeholder="e.g. Caelindra" />
                <Field label="Race" value={ctx.race} onChange={set('race')} placeholder="e.g. High Elf" />
                <Field label="Class *" value={ctx.characterClass} onChange={set('characterClass')} placeholder="e.g. Wizard" />
                <Field label="Level" value={ctx.level} onChange={set('level')} placeholder="e.g. 5" type="number" />
              </div>
            </div>

            <div className="card" style={{ padding: '14px 16px', flexShrink: 0 }}>
              <SectionLabel>Character Depth</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <TextArea label="Background / Origin *" value={ctx.background} onChange={set('background')}
                  placeholder={"Where did they come from? What shaped them?\ne.g. Raised in a thieves guild. Left after refusing to kill an innocent mark."} rows={2} />
                <TextArea label="Personality Traits" value={ctx.personality} onChange={set('personality')}
                  placeholder={"How do they speak, carry themselves, treat others?\ne.g. Speaks formally. Hates being touched. Laughs at wrong moments."} rows={2} />
                <TextArea label="Goals & Motivations" value={ctx.goals} onChange={set('goals')}
                  placeholder={"What do they want — short and long term?\ne.g. Prove they deserve their title. Find the brother who vanished."} rows={2} />
                <TextArea label="Lore / Secrets / Backstory" value={ctx.lore} onChange={set('lore')}
                  placeholder={"Secrets, fears, scars, obligations.\ne.g. Carries a debt to a demon lord. Terrified of fire — her village burned."} rows={2} />
              </div>
            </div>

          </div>

          {/* RIGHT — sticky generate panel */}
          <div className="roleplay-generate-column" style={{ width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Generate card */}
            <div className="card" style={{ padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontFamily: 'var(--font-title)', fontSize: 12, fontWeight: 600, color: 'var(--gold)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Ready to Play</div>

              {/* Completion indicators */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { label: 'Name',        done: !!ctx.name.trim(),            req: true },
                  { label: 'Class',       done: !!ctx.characterClass.trim(),  req: true },
                  { label: 'Background',  done: !!ctx.background.trim(),      req: true },
                  { label: 'Personality', done: !!ctx.personality.trim() },
                  { label: 'Goals',       done: !!ctx.goals.trim() },
                  { label: 'Lore',        done: !!ctx.lore.trim() },
                ].map(({ label, done, req }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12 }}>
                    <div style={{ width: 14, height: 14, borderRadius: 3, flexShrink: 0, border: `2px solid ${done ? 'var(--gold)' : 'var(--border-strong)'}`, background: done ? 'var(--gold)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {done && <span style={{ fontSize: 9, color: 'var(--bg)', fontWeight: 700 }}>✓</span>}
                    </div>
                    <span style={{ color: done ? 'var(--text)' : 'var(--text-3)' }}>{label}</span>
                    {req && <span style={{ fontSize: 9, color: '#c0392b' }}>*</span>}
                  </div>
                ))}
                {/* DM guide status — separate row */}
                {(() => {
                  const hasGuide = !!(dmGuide.story || dmGuide.currentArc || dmGuide.lastSession || (dmGuide.npcs || []).length || (dmGuide.quests || []).length)
                  return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, marginTop: 2, paddingTop: 6, borderTop: '1px solid var(--border)' }}>
                      <div style={{ width: 14, height: 14, borderRadius: 3, flexShrink: 0, border: `2px solid ${hasGuide ? 'var(--gold)' : 'var(--border-strong)'}`, background: hasGuide ? 'var(--gold)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {hasGuide && <span style={{ fontSize: 9, color: 'var(--bg)', fontWeight: 700 }}>✓</span>}
                      </div>
                      <span style={{ color: hasGuide ? 'var(--text)' : 'var(--text-3)' }}>DM Guide</span>
                      {!hasGuide && <span style={{ fontSize: 10, color: 'var(--text-3)' }}>(optional)</span>}
                    </div>
                  )
                })()}
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                {canGenerate ? (
                  <>
                    <button
                      className="btn btn-primary"
                      style={{ width: '100%', justifyContent: 'center', opacity: !contextReady ? 0.45 : 1, fontSize: 13 }}
                      disabled={!contextReady || loading}
                      onClick={generate}
                    >
                      {loading ? 'Building…' : sessionCount === 0 ? '✦ Generate (Free)' : '✦ Generate Plan'}
                    </button>
                    {sessionCount === 0 && (
                      <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 6, textAlign: 'center', lineHeight: 1.4 }}>First session free · Premium for unlimited</div>
                    )}
                    {!contextReady && (
                      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6, textAlign: 'center' }}>Fill in the required fields (*) first</div>
                    )}
                  </>
                ) : (
                  <>
                    <button className="btn btn-gold" style={{ width: '100%', justifyContent: 'center' }} onClick={() => window.location.href = '/premium'}>✦ Upgrade to Premium</button>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6, textAlign: 'center', lineHeight: 1.4 }}>Your first session was free. Premium unlocks unlimited plans.</div>
                  </>
                )}
              </div>
            </div>

            {/* DM context preview */}
            {(() => {
              const hasGuide = !!(dmGuide.story || dmGuide.currentArc || dmGuide.lastSession || (dmGuide.npcs || []).length || (dmGuide.quests || []).length)
              if (!hasGuide) return (
                <div style={{ padding: '12px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 3, fontSize: 11, color: 'var(--text-3)', lineHeight: 1.6 }}>
                  <strong style={{ color: 'var(--text-2)' }}>DM Guide not set up yet</strong><br />
                  Ask your DM to fill in the Campaign Guide tab — it adds campaign context, last session recaps, NPC hooks, and quest ties to your plan automatically.
                </div>
              )
              return (
                <div style={{ padding: '12px 14px', background: 'var(--gold-bg)', border: '1px solid var(--gold-border)', borderRadius: 3, fontSize: 11, color: 'var(--text-2)', lineHeight: 1.7 }}>
                  <div style={{ fontFamily: 'var(--font-title)', fontSize: 10, fontWeight: 600, color: 'var(--gold)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8 }}>DM Context Active</div>
                  {dmGuide.currentArc && <div style={{ marginBottom: 5 }}><strong style={{ color: 'var(--text)' }}>Arc:</strong> {dmGuide.currentArc.slice(0, 80)}{dmGuide.currentArc.length > 80 ? '…' : ''}</div>}
                  {dmGuide.lastSession && <div style={{ marginBottom: 5 }}><strong style={{ color: 'var(--text)' }}>Last session:</strong> {dmGuide.lastSession.slice(0, 80)}{dmGuide.lastSession.length > 80 ? '…' : ''}</div>}
                  {(dmGuide.npcs || []).filter(n => n.name).length > 0 && <div style={{ marginBottom: 5 }}><strong style={{ color: 'var(--text)' }}>NPCs:</strong> {(dmGuide.npcs || []).filter(n => n.name).map(n => n.name).join(', ')}</div>}
                  {(dmGuide.quests || []).filter(q => q.status === 'active' && q.title).length > 0 && <div><strong style={{ color: 'var(--text)' }}>Active quests:</strong> {(dmGuide.quests || []).filter(q => q.status === 'active' && q.title).map(q => q.title).join(', ')}</div>}
                </div>
              )
            })()}

          </div>
        </div>

        <ToastContainer />
      </div>
    )
  }

  // ── Step 2: Checklist ───────────────────────────────────────────────────────
  return (
    <div className="page-content">
      <div role="tablist" style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid var(--border)', overflowX: 'auto' }}>
        {plans.map(p => {
          const isActive = p.id === activePlan?.id
          return (
            <div key={p.id} role="tab" aria-selected={isActive} onClick={() => setActivePlanId(p.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: 13, fontWeight: 600, color: isActive ? 'var(--gold)' : 'var(--text-3)', borderBottom: `2px solid ${isActive ? 'var(--gold)' : 'transparent'}`, marginBottom: -1 }}>
              {renamingId === p.id ? renameInput : (
                <span title="Double-click to rename" onDoubleClick={() => startRename(p)}>{p.label}</span>
              )}
              <span title="Close plan" aria-label={`Close ${p.label}`} onClick={(ev) => { ev.stopPropagation(); closePlan(p.id) }} style={{ fontSize: 14, opacity: 0.6, lineHeight: 1 }}>×</span>
            </div>
          )
        })}
        <div role="tab" onClick={reset} title="Generate a new session plan"
          style={{ padding: '8px 14px', cursor: 'pointer', fontSize: 13, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>+ New</div>
      </div>

      <div className="page-header-row" style={{ marginBottom: 16 }}>
        <div>
          {renamingId === activePlan?.id ? renameInput : (
            <h2 style={{ fontSize: 22, marginBottom: 4, cursor: 'text' }} title="Click to rename" onClick={() => startRename(activePlan)}>{activePlan?.label}</h2>
          )}
          <p style={{ color: 'var(--text-2)', fontSize: 14, margin: 0 }}>
            {ctx.name}{[ctx.race, ctx.characterClass, ctx.level ? `Level ${ctx.level}` : ''].filter(Boolean).length > 0
              ? ' · ' + [ctx.race, ctx.characterClass, ctx.level ? `Level ${ctx.level}` : ''].filter(Boolean).join(' · ')
              : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={reset}>← Edit Context</button>
          <button className="btn btn-ghost btn-sm" onClick={() => regenerate()}>↺ Regenerate</button>
        </div>
      </div>

      {/* Level-up banner — premium only */}
      {isPremium && checklistLevel !== null && Number(ctx.level) > checklistLevel && (
        <div style={{ padding: '10px 14px', marginBottom: 12, maxWidth: 700, background: 'linear-gradient(90deg, var(--gold-bg), rgba(154,124,58,0.08))', border: '2px solid var(--gold-border)', borderRadius: 3, fontSize: 12, color: 'var(--text)', lineHeight: 1.6, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div><span style={{ color: 'var(--gold)', fontWeight: 700 }}>✦ You've reached Level {ctx.level}!</span> Your session plan can be refreshed to reflect your new abilities and hooks.</div>
          <button
            className="btn btn-primary btn-sm"
            style={{ flexShrink: 0 }}
            onClick={() => regenerate(Number(ctx.level))}
          >Regenerate for Lvl {ctx.level}</button>
        </div>
      )}

      {/* Pro tip */}
      <div style={{ padding: '10px 14px', marginBottom: 16, maxWidth: 700, background: 'var(--gold-bg)', border: '1px solid var(--gold-border)', borderRadius: 3, fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>
        <strong style={{ color: 'var(--gold)' }}>How to use this:</strong> Pick <strong>2–3 items</strong> to focus on — not all of them. Tick items as the session progresses. Consistency over multiple sessions is what makes a character unforgettable.
      </div>

      <div style={{ maxWidth: 700 }}>
        {checklist.map((phase) => {
          const done = phase.items.filter(item => checked[phase.phase + item.title]).length
          return (
            <div key={phase.phase} className="card" style={{ marginBottom: 14, overflow: 'hidden' }}>
              <div style={{ padding: '10px 16px', background: phase.headerBg, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontFamily: 'var(--font-title)', fontSize: 13, fontWeight: 600, color: phase.headerColor }}>{phase.phase}</div>
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
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} message="Your first session plan was free. Upgrade to Premium to regenerate or run unlimited roleplay sessions." />}
    </div>
  )
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <div style={{ fontFamily: 'var(--font-title)', fontSize: 12, fontWeight: 600, color: 'var(--gold)', marginBottom: 14, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
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
