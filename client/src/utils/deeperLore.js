// "Go deeper": the part of the Roleplay Assistant's session plan that sends a player further into their own character. It
// reads what the player has written so far (backstory, personality, goals) and asks for one new step each session, so the
// third session asks for something the first two did not. Pure text, no AI.

// One question per session, each going a layer further in than the last. After the last, the list starts over from a
// harder angle ("the second time round") so a long campaign never runs dry.
const LADDER = [
  { tier: 'Surface', title: 'Say where you come from', desc: (n) => `Write three sentences about ${n}'s life before the adventure: where they grew up, what they lost, and what they wanted. Put them in your Backstory box.` },
  { tier: 'Surface', title: 'Name someone from your past', desc: (n) => `Pick one person ${n} left behind, living or dead, and decide what ${n} owes them or what they owe ${n}. Say their name out loud at the table once.` },
  { tier: 'Closer', title: 'Find your fear', desc: (n) => `Decide what ${n} is most afraid of, and the small lie they tell themselves so they can keep going. Let the lie show up in a decision this session.` },
  { tier: 'Closer', title: 'Remember the day it changed', desc: (n) => `Choose the single memory that explains why ${n} wants what they want. Tell the party a shortened, slightly wrong version of it. Decide what the true version is.` },
  { tier: 'Deeper', title: 'Draw a line you will not cross', desc: (n) => `Decide one thing ${n} would never do. Then ask your DM to put a scene in front of you that tempts ${n} to do it.` },
  { tier: 'Deeper', title: 'Show who you are when no one is watching', desc: (n) => `Give ${n} a private habit, such as a ritual, a superstition or a keepsake, and play it in a quiet moment between the loud ones.` },
  { tier: 'Core', title: 'Decide what would change your mind', desc: (n) => `What would make ${n} give up their main goal, or want something else more? Write it down, then let the story get close to it.` },
  { tier: 'Core', title: 'Write the letter you would never send', desc: (n) => `Write a short letter from ${n} to the person they cannot talk to. Keep it. Read a line of it aloud if the moment is right.` },
]

const clip = (t, n) => { const v = String(t || '').replace(/\s+/g, ' ').trim(); return v.length > n ? `${v.slice(0, n).replace(/\s+\S*$/, '')}…` : v }

// Items for the session plan. `session` is this plan's session number (1 for the first).
export function deeperItems(ctx = {}, dmGuide = {}, session = 1) {
  const name = (ctx.name || '').trim() || 'your character'
  const n = Math.max(1, Number(session) || 1)
  const lore = clip(ctx.lore, 150), goals = clip(ctx.goals, 120)
  const round = Math.floor((n - 1) / LADDER.length)
  const step = LADDER[(n - 1) % LADDER.length]
  const items = []

  // 1. Start from what is already written, and push on it.
  if (lore) {
    items.push({
      title: 'Take one detail of your backstory further',
      desc: `Your backstory says: "${lore}". Pick one name, place or object in it that you have not explained yet and decide the whole story behind it. Add what you decide to your Backstory box before you play.`,
      goal: 'Every session, your backstory should know something it did not know before.',
    })
  } else {
    items.push({
      title: 'Your backstory is still empty',
      desc: `Give ${name} a past: where they come from, what they lost and what they want. Even three sentences changes how you play them. Add it to your Backstory box before the session.`,
      goal: 'A character with a past makes choices. A character without one reacts.',
    })
  }

  // 2. This session's new step down the ladder.
  items.push({
    title: `${step.tier} · ${step.title}${round ? ' (second look)' : ''}`,
    desc: round
      ? `${step.desc(name)} You have done this once already, so go further: what did you get wrong or leave out last time?`
      : step.desc(name),
    goal: `Session ${n} of going deeper. Each one asks for something the last did not.`,
  })

  // 3. Take it to the table, using what the DM has set up right now.
  const npc = (dmGuide.npcs || []).find(x => x.name)
  const quest = (dmGuide.quests || []).find(q => q.title && q.status === 'active') || (dmGuide.quests || []).find(q => q.title && q.status === 'not-started')
  const hook = quest ? `the quest "${quest.title}"` : npc ? npc.name : (dmGuide.currentArc || '').trim() ? 'the current story' : null
  items.push({
    title: 'Bring it to the table',
    desc: hook
      ? `Find a way for what you wrote today to matter in ${hook}${goals ? `, and for it to push on your goal: "${goals}"` : ''}. Tell your DM one sentence of it before play so they can plant something.`
      : `Tell your DM one sentence of what you wrote today so they can plant something for ${name} to find.${goals ? ` Your goal is "${goals}". Aim it that way.` : ''}`,
    goal: 'A backstory the DM knows about is a backstory that shows up in play.',
  })
  return items
}

export const DEEPER_STEPS = LADDER.length
