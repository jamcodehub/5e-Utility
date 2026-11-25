// ASHES OF THE MERIDIAN LINE: levels 8 to 13. War, diplomacy and a failing ward; the allies you earn decide the final battle.

export default {
  id: 'ashes-of-the-meridian-line',
  title: 'Ashes of the Meridian Line',
  tagline: 'Two cities at war. One wall holding back the ash. You are the only neutral party left.',
  levels: '8 to 13',
  tone: 'Political thriller turning into a siege epic; trust, compromise and the cost of peace',
  premium: true,
  pitch: 'Two cities have fought for eleven years across the Meridian Line, an ancient wall of brass pillars that holds back the Ashlands. The party are the last neutral Envoys, sent to broker a ceasefire. They find out both governments already know the Line is failing, and that the war is the lie that lets them hide it. Six sessions of negotiation, espionage and logic puzzles build to a mass battle whose difficulty is set by the allies the party has earned.',

  // Battle maps made with the map generator (files in data/campaigns/maps/<id>/), and which ones each session uses.
  maps: ['corrans-gate','counting-house','hearth-hall','quills-hut','ashlands','the-line'],
  sessionMaps: [['corrans-gate'],['counting-house'],['hearth-hall'],['ashlands','quills-hut'],['the-line'],['the-line','ashlands']],

  guide: {
    story: `The Meridian Line is a wall of nine hundred brass pillars, each as tall as a cathedral, running two hundred miles across the neck of a continent. West of it lies the Republic of Veyra, a merchant city of canals and ledgers. East of it lies Dunmark, a mountain theocracy that keeps its hearths burning day and night. South of it lies the Ashlands, a plain of cinder that was once a kingdom and now is a grey waste that moves when the wind does not.

Eleven years ago the two cities went to war over which of them has the right to maintain the Line. The siege of Corran\'s Gate, the great pass at the centre of the Line, has lasted four of those years. Both sides are bleeding. The Concord, a neutral order of arbiters, has sent its last four Envoys to broker a ceasefire. They are the party.

THE TRUTH: the Line is failing. Pillars have been falling for twenty years, one every season, and the Ashlands are creeping. Both governments know. Both are hiding it from their own people, because a city that learns the wall is breaking panics, and because each hopes that if the other is weakened it can seize the Line\'s controls and shore up its own side. The war is not a mistake; it is a cover story, kept alive by the two leaders who have each privately decided that the other must not be allowed to know how bad it is.

The Line was built by two sets of hands. Veyra holds the Chord, a set of nine tuning forks that sound the ward. Dunmark holds the Key-stones, three carved stones that seat the ward\'s heart. Neither works without the other. Both cities have forgotten this, or pretended to.

A third party wants the Line to fail: the Ashen Choir, a cult that believes the Ashlands are not a waste but a prison, and that the Line should come down. Their agent Vesper has been working both sides of the war for years.

THE ENDGAME: the Ashfall. When the next pillar falls the Ashlands rise as an army. The party has to bring both cities together to hold the Line for one night, using the Chord and the Key-stones together. How many allies the party has earned determines how hard that night is. The ending is the choice of who holds the Line afterwards.`,
    currentArc: `ACT ONE, The Envoys\' Table (levels 8 and 9). The party arrives at Corran\'s Gate to open ceasefire talks and survives the first attempt on a delegate\'s life. Run Session 1 next.`,
    lastSession: '',
    worldNotes: `TONE AND PROMISE. A political thriller that turns into a siege epic. The first half is people in rooms, each wanting something, each lying a little. The second half is everyone you met standing on a wall. The payoff is only as big as the relationships the party built, so make sure the NPCs feel like people.

ALLIES TRACK. Keep a number from 0 to 6 on a card. It starts at 0. The party gains 1 Ally whenever they win a faction\'s real trust (not just a deal), such as Captain Kest, Brother Dacian, Magister Quill, the Veyran Counting House, the Hearth-Guard or the Concord. In Session 6 the Allies track sets how many forces hold the Line and how many threats the party must face alone.

ENVOY STANDING. The party has a standing with each city (Veyra and Dunmark), from -3 (hated) to +3 (trusted). It starts at 0 for both. Gains and losses come from choices, not rolls. At -3 with either city, the party loses access to that city\'s help. At +3 with both, a ceasefire becomes possible.

THE WAR CLOCK. Keep a number from 0 to 8. It rises by 1 each session unless the party does something to reduce it, and falls by 1 with each real concession or de-escalation. At 8 both armies march and the Line falls early: the finale becomes a fighting retreat.

DIFFICULTY SCALING. Every encounter gives EASY, STANDARD and HARD numbers for 4 players at the listed level. Add one rank for 5 or 6 players. The finale is scaled by Allies: see Session 6.

ROLE SPOTLIGHTS. Each session lists a moment for the scout, the face, the healer, the scholar, the fighter and the trickster. These are jobs, not classes.

PUZZLES. Every puzzle has a clean solution, three hints and a skill route. Puzzles here are logic and planning problems drawn from the politics, so let the players argue.

SAFETY. War, civilian casualties and loss of loved ones. Check with the table before Session 4.`,
    npcs: [
      { name: 'Lord-Concord Hadrian Vale', description: 'The Concord\'s senior arbiter, 74, dry as old paper, who hired the party. A man who has seen too many wars end on the wrong terms. Secret: he is dying, and has seen enough of the Line to suspect what is happening. He has told no one.', characterRelation: 'Hires the party, opens the talks and is the first piece of evidence that the Concord is not entirely neutral.' },
      { name: 'First Voice Selene Dray', description: 'The leader of the Republic of Veyra, 44, brilliant and tired, an accountant who rose by being right about money. Sincere about protecting Veyra and ruthless about it. Secret: she has a ledger that proves the Line is failing and has hidden it from the Senate.', characterRelation: 'Treats the party as assets. If they earn her respect she becomes the most pragmatic ally in the campaign.' },
      { name: 'Hearth-Marshal Oswin Brandt', description: 'Supreme commander of Dunmark\'s armies, 58, built like a door and as quiet. Devout in a way that is almost shy. He has buried more soldiers than he can count and is honest about what he fears.', characterRelation: 'He will not be tricked, but he can be shown something he did not know.' },
      { name: 'Captain Mira Kest', description: 'A Veyran field commander, 35, who disobeys orders to protect civilians. Cynical about politics and absolutely loyal to her soldiers. Lost her brother in the siege.', characterRelation: 'The party\'s most likely friend in the Veyran army. Wins their trust by being the first to tell them the truth about the front.' },
      { name: 'Brother Dacian Holt', description: 'A Dunmark chaplain and diplomat, 40, whose faith is sincere and whose church is not. He has begun to doubt the official story of the war and is the party\'s quiet contact inside the citadel.', characterRelation: 'Introduces the party to the Hearth-Guard and to the key-stones. The kind of ally you only appreciate once you have lost him.' },
      { name: 'Vesper', description: 'Agent of the Ashen Choir, apparently a charming Veyran courtier and a Dunmark chaplain at the same time. Gentle, funny, patient. Believes the Line is a prison and that the Ashlands deserve to be free.', characterRelation: 'Befriends the party early, often turns up helping them, and is the saboteur of the Line. Their motives are not entirely wrong.' },
      { name: 'Magister Ottoline Quill', description: 'The last tinker who ever maintained the Line, 82, nearly deaf, brilliant and cantankerous. Lives alone in a repair-hut at the foot of Pillar Nine. Speaks in shorthand and swears in dead languages.', characterRelation: 'The key to understanding the Chord and the Key-stones. Will help anyone who brings her tea and listens.' },
    ],
    quests: [
      { title: "Open the ceasefire talks", kind: 'main', description: "Bring both delegations to the table at Corran's Gate and survive the first week of negotiations." },
      { title: "Who wants the talks to fail?", kind: 'main', description: "An attempt is made on a delegate's life before the first session. Find out who benefits from the war continuing." },
      { title: "The Veyran ledger", kind: 'main', description: "Follow the money in the Counting House to find out what the Republic is hiding." },
      { title: "The Key-stones of Dunmark", kind: 'main', description: "Win the trust of the Hearth-Guard enough to learn where the Key-stones are kept and what they do." },
      { title: "The failing Line", kind: 'main', description: "Travel to the Line itself, find the fallen pillars and learn what is wrong." },
      { title: "Hold the Line", kind: 'main', description: "On the night of the Ashfall, bring both cities together to defend the wall and re-seat the ward." },
      { title: "Captain Kest's brother", kind: 'side', description: "Mira Kest lost her brother in the siege. Learn what happened to him, and whether anyone on either side is still lying about it." },
      { title: "Tea for Magister Quill", kind: 'side', description: "The last tinker of the Line is nearly deaf and will help anyone who brings her tea and listens. Be that person." },
    ],
  },

  lore: [
    { title: 'Corran\'s Gate', tag: 'location', content: 'The great pass in the centre of the Line, the only gap in two hundred miles of pillars. Neutral ground since the siege began. A stone town of tents and timber, divided by a white-chalk line: Veyran flags to the west, Dunmark hearths to the east, and the Concord\'s grey pavilion in the middle. The air tastes of smoke and wet iron.' },
    { title: 'The Republic of Veyra', tag: 'location', content: 'A merchant republic of canals, ledgers and glass-roofed markets. Clean, loud, rich. The Counting House is its real government: a hall of ten thousand clerks and one very sharp First Voice. The harbour court is a place where deals are made over fish.' },
    { title: 'The Counting House', tag: 'location', content: 'The heart of Veyran power, a vast hall of desks, ledgers and pneumatic tubes. Every transaction in the Republic passes through it. A basement vault contains the Chord, nine brass tuning forks wrapped in felt, and a ledger the Senate has never been shown.' },
    { title: 'The Dunmark Citadel', tag: 'location', content: 'A mountain fortress of black stone with a hundred thousand lamps. Warm, solemn, ritual. The Hearth Hall at its centre holds the three Key-stones in a stone cradle that is lit day and night. The Hearth-Guard patrols in pairs.' },
    { title: 'The Meridian Line', tag: 'location', content: 'Nine hundred brass pillars, each three hundred feet tall, standing a mile apart across two hundred miles. They hum faintly, a note just below hearing. Pillars Seven, Eleven and Twenty-Three have fallen; each lies in a heap of green-black corroded brass. The ground beside every fallen pillar is grey with ash.' },
    { title: 'The Ashlands', tag: 'location', content: 'A plain of fine grey cinder, flat to the horizon, marked with the ribs of dead buildings. The wind never stops. Things move under the ash that are not wind. Travelling here without the Line\'s protection is dangerous: a cinder storm gives disadvantage on all Perception checks and deals 1d4 fire damage per round without cover.' },
    { title: 'The Republic of Veyra (faction)', tag: 'faction', content: 'The Senate, the Counting House and the First Voice. They want the war to end on terms that leave Veyra safe and in charge of the Line. They lie by omission and win by arithmetic. Their army is professional, well supplied and tired.' },
    { title: 'The Hearth of Dunmark', tag: 'faction', content: 'The Hearth-Marshal, the Hearth-Guard and the church of the Eternal Flame. They want the war to end on terms that preserve the faith and the Key-stones. They lie rarely, and are surprised when others do. Their army is disciplined, devout and outnumbered.' },
    { title: 'The Concord', tag: 'faction', content: 'A neutral order of arbiters who have kept the peace between cities for three hundred years. Honest, boring, underfunded. Their grey pavilion is the only place both armies have promised not to bomb.' },
    { title: 'The Ashen Choir', tag: 'faction', content: 'A cult that believes the Ashlands are a prison and that the Line should come down. They wear grey, speak softly and have infiltrated both cities. Their agents are almost always helpful. They do not believe they are villains.' },
    { title: 'Ash Legionnaires', tag: 'enemy', maxHp: 58, content: 'Dead soldiers risen from the cinder in the armour of the old kingdom, grey and silent, marching in step. Use VETERAN stats (AC 17, 58 HP) with the Undead type, immune to poison and exhaustion. Ash Cloud (when one dies it releases a 10 ft cloud: DC 14 Con save or blinded for 1 round). EASY: 4. STANDARD: 6. HARD: 9 and a centurion with 90 HP.' },
    { title: 'Cinder Wraiths', tag: 'enemy', maxHp: 67, content: 'Smoke-shapes with the faces of the dead, who wail when the wind rises. Use WRAITH stats (AC 13, 67 HP). Ash-bound: they are weakened by water (disadvantage on attacks if drenched). EASY: 2. STANDARD: 3. HARD: 5.' },
    { title: 'Ashen Hulks', tag: 'enemy', maxHp: 93, content: 'Giant constructs of ash and iron, heaped together from broken pillars. Use FLESH GOLEM stats (AC 9, 93 HP) re-skinned. Berserk: when reduced to half HP, they make a free attack against the nearest creature. Vulnerable to cold. EASY: 1. STANDARD: 2. HARD: 3.' },
    { title: 'Vesper of the Ashen Choir', tag: 'boss', maxHp: 120, content: 'The Choir\'s agent. Use ASSASSIN stats (AC 15, 78 HP) enhanced to 120 HP, with spellcasting: invisibility, fear, dimension door, greater invisibility. Sing the Ash (once per fight, a 30 ft aura: DC 16 Wis save or the target drops what it holds). Vesper does not want to kill the party. They want to be heard. EASY: 80 HP. HARD: 160 HP and 4 Ash Legionnaires.' },
    { title: 'The Ash Titan', tag: 'boss', maxHp: 300, content: 'The Ashlands\' last defence, a thing of grey cinder and brass shards the size of a hill that rises when the final pillar falls. AC 18, 300 HP, immune to poison and fire, resistance to nonmagical weapons. Attacks: Slam (+12, 4d10+6 bludgeoning), Ashfall (recharge 5-6, 60 ft cone, DC 17 Con save, 8d6 fire). Legendary: Rise (the ground cracks, creatures in 20 ft make a DC 17 Dex save or fall prone). EASY: 200 HP. HARD: 400 HP and Ashen Hulks. The Titan can only be ended by the Chord, not by damage alone.' },
    { title: 'The Chord', tag: 'item', content: 'Nine brass tuning forks wrapped in felt, each as long as a forearm and engraved with a pillar number. Struck in the right order, they carry a note along the Line and re-seat the ward. Veyra has kept them in the Counting House vault for a century.' },
    { title: 'The Key-stones', tag: 'item', content: 'Three carved stones the size of loaves, each engraved with a nested pattern. Placed on the right pillars, they lock the ward\'s heart. Dunmark has kept them in the Hearth Hall as holy relics.' },
    { title: 'The Fall of Pillar Seven', tag: 'event', content: 'Twenty years ago, on a clear morning, Pillar Seven fell without warning. It was the first. Veyra blamed Dunmark\'s saboteurs, Dunmark blamed Veyran engineers. Neither was right. It was the beginning of the war.' },
  ],

  sessions: [
    {
      title: 'Session 1, The Envoys\' table (level 8)',
      content: `GOAL: introduce the war, the people and the stakes. Open talks at Corran\'s Gate and survive an assassination attempt. The party should feel the weight of eleven years of grief before anyone says a word about the wall.

OPEN WITH (read aloud): "Corran\'s Gate in the fourth year of siege. A white chalk line runs down the middle of a street. West of it, Veyran flags and wet canvas. East of it, the red glow of Dunmark\'s hearths. In the middle, a grey pavilion no one has shelled, and an old man in a plain coat holding the door open for you."

SCENES
1. Lord Vale\'s briefing. The Concord\'s senior arbiter explains the stakes and introduces both delegations. He gives each player an Envoy\'s seal and tells them to be boring and honest.
2. The first table. Selene Dray and Oswin Brandt sit down at opposite ends of a long table. Neither will speak first. The party must break the silence.
3. The attempt. During the first recess, a Veyran delegate (a secretary named Pell) collapses from poison. Someone wanted the talks to fail.
4. The investigation. The party tracks the poison to a vial found in the Dunmark half of the camp, and a witness who saw a cloaked figure in grey.

PUZZLE: The Treaty Order. Four clauses must be agreed in an order: A (prisoner exchange), B (border patrol), C (trade), D (Line tribute). Rules from the two delegations: (a) Veyra insists C comes before A. (b) Dunmark insists B comes before D. (c) B cannot be first. (d) A must come before D. (e) B comes immediately after C. SOLUTION: C, B, A, D. Hints: (1) D must come after both A and B; (2) C is first, since A and D cannot be, and B cannot be; (3) B comes straight after C. Skill route: Persuasion DC 16 to talk the delegations into an order, but both will remember the favour.

ROLE SPOTLIGHTS: Scout: reads the camp\'s layout and finds the route the poisoner took. Face: breaks the silence between Dray and Brandt. Healer: saves Secretary Pell with a quick antidote (Medicine DC 15). Scholar: identifies the poison as a Choir formulation. Fighter: stops a mob from storming the pavilion. Trickster: lifts the vial from the Dunmark side without being seen.

ENCOUNTER: AN ANGRY CROWD (skill challenge) or ASH LEGIONNAIRES that wander in from the Ashlands during the night. EASY: 3. STANDARD: 4. HARD: 6.

CHARACTER BEATS: Ask each player what the war took from their character, or what they would most like it to give back.

REWARDS: Level 9. A Concord seal. A lead on Vesper.

HOOK: Vesper, a charming Veyran courtier, finds the party at the pavilion\'s edge and offers to help. "I want this to end more than anyone," they say, and it is the truth.`,
    },
    {
      title: 'Session 2, The Veyran court (level 9)',
      content: `GOAL: political infiltration. The party goes to Veyra, learns what the Republic is hiding, and finds the first evidence that the Line is failing. Win Captain Kest.

OPEN WITH (read aloud): "Veyra is the cleanest city you have ever seen. The canals run clear; the clerks run on rails. Every wall has a number. Every bridge has a toll. At the centre of it all, a glass-roofed hall with ten thousand desks, and a woman at the highest one who has not looked up from her ledger in your presence."

SCENES
1. Audience with the First Voice. Dray receives the party in a room with no chairs. She is polite, exact and wholly unforthcoming.
2. Captain Kest. A field commander home on leave finds the party in a tavern and tells them what the front is really like.
3. The Counting House. A heist or a negotiation: the party needs access to the ledgers. Dray\'s clerk Tolliver, an honest man with a bad conscience, may help.
4. The vault. The party finds the Chord and a ledger showing that the Republic has been quietly shipping brass from every collapsed pillar to a hidden foundry.

PUZZLE: The Ledger. Seven payments to a single payee over seven months: 40, 55, 70, 85, 105, 115, 130. All but one follow a pattern. SOLUTION: the fifth payment (105) is wrong; the pattern adds 15 each time, so it should be 100. The extra 5 is a side-payment to the saboteur who has been paid in both cities. Hints: (1) look at the differences between neighbours; (2) most differences are the same; (3) find the one that is not. Skill route: Investigation DC 14 or Insight DC 15.

ROLE SPOTLIGHTS: Scout: finds the back route into the vault. Face: talks Tolliver into helping. Healer: treats the wounded outside the Counting House and learns what rumours there are. Scholar: reads the shipping manifests. Fighter: walks the party through the Senate guards. Trickster: opens the vault door.

ENCOUNTER: SENATE GUARDS or a rogue Counting House constable. EASY: 4 Veterans. STANDARD: 6 Veterans. HARD: 8 Veterans and a Knight.

CHARACTER BEATS: Captain Kest asks the party who they would die for. Let each answer.

REWARDS: Level 9 to 10. The ledger. Captain Kest as an Ally.

HOOK: In the vault, behind the Chord, a message in Dray\'s handwriting: "If you are reading this, I have failed. The pillars are falling. Tell no one."`,
    },
    {
      title: 'Session 3, The Dunmark citadel (level 10)',
      content: `GOAL: the mirror of Session 2. The party goes to Dunmark, wins Brother Dacian, and learns where the Key-stones are and what they do.

OPEN WITH (read aloud): "Dunmark is a city that has never been cold. Lamps in every window. Warmth in every wall. At the heart of the citadel, the Hearth Hall: a vast round chamber lit by a single fire that has not gone out in nine hundred years, and in its centre, on a stone cradle, three carved stones."

SCENES
1. The Hearth-Marshal. Brandt receives the party in the Hearth Hall. He is gracious and implacable.
2. Brother Dacian. A chaplain who has begun to doubt the official war tells the party about the pillars and the Choir.
3. The trial of the Hearth. To win access to the Key-stones, the party must pass a ritual trial: an open debate before the Hearth-Guard, played as a skill challenge.
4. The Key-stones. Dacian shows them the stones: three, each with a nested pattern that matches the pillar numbers.

PUZZLE: The Seating of the Stones. Three stones must be set on a ring of nine pillars, numbered 1 to 9. A carving in the Hearth Hall reads: "The first sits where the siege\'s days were counted by root. The second three pillars on. The third, three more." The siege of Corran\'s Gate lasted 81 days in its first assault. SOLUTION: the first stone sits on pillar 9 (the square root of 81); the second three pillars on (counting round the ring) is pillar 3; the third three more is pillar 6. Hints: (1) find the number the siege\'s days were counted by root; (2) the pillars wrap around from 9 to 1; (3) the stones are spaced three apart. Skill route: History DC 15 or Arcana DC 16 to recognise the pattern.

ROLE SPOTLIGHTS: Scout: finds the postern gate for a clean exit. Face: wins the debate before the Hearth-Guard. Healer: attends the Hearth-Marshal\'s wounded and earns his trust. Scholar: decodes the carving. Fighter: spars with a Hearth-Guard champion. Trickster: switches a decoy for a Key-stone.

ENCOUNTER: THE HEARTH-GUARD CHAMPION (a duel). EASY: 1 Knight (52 HP). STANDARD: Knight and 2 Veterans. HARD: 2 Knights and 4 Veterans.

CHARACTER BEATS: Brother Dacian asks each player what they believe in, and why.

REWARDS: Level 10 to 11. Dacian and the Hearth-Guard as Allies if the debate went well. The location of the Key-stones.

HOOK: A messenger arrives with a report from the Line: another pillar has fallen. Pillar Fourteen. It is the first in a day.`,
    },
    {
      title: 'Session 4, The Line (level 11)',
      content: `GOAL: a journey to the Line itself. The party meets Magister Quill, sees what is happening to the pillars and confronts Vesper. End with the revelation that someone is sabotaging the wall.

OPEN WITH (read aloud): "From a distance the Line is a row of needles. Up close each pillar is a cathedral of corroded brass, humming at a pitch that sets your teeth on edge. Where the pillars have fallen the ground is grey, and the grey is spreading. A small stone hut sits at the foot of Pillar Nine, with smoke coming from its chimney."

SCENES
1. The road south. The party travels with an escort of both armies, a fragile peace on the move.
2. Magister Quill. An old woman, almost deaf, lives in a hut at the base of Pillar Nine. She has kept the Line alive by hand for sixty years. She has been waiting for someone to ask.
3. The failing Line. Quill shows the party the fallen pillars and how the Chord and Key-stones work together.
4. Vesper. The Ashen Choir\'s agent appears and speaks honestly. The Line is a prison, they say, and the Ashlands deserve to be free.
5. The ambush. Vesper\'s allies attack the party\'s escort.

PUZZLE: The Pillar Inscriptions. Six pillars, A to F, each carry an inscription describing their height. A: "I am taller than exactly two others." B: "I am the shortest." C: "I am taller than exactly four others." D: "I am taller than exactly three others." E: "I am taller than exactly one other." F: "I am the tallest." The Chord must be struck from tallest to shortest. SOLUTION: F, C, D, A, E, B. Hints: (1) each pillar says how many others it is taller than, so the numbers are 5, 4, 3, 2, 1, 0; (2) F is the tallest and B is the shortest; (3) the rest follow from the numbers. Skill route: Investigation DC 14, or Quill gives the order if asked politely.

ROLE SPOTLIGHTS: Scout: spots the ambush in the cinder. Face: speaks with Vesper honestly. Healer: treats the soldiers wounded in the ambush. Scholar: reads Quill\'s notes and finds the clause about the Chord. Fighter: holds the pass. Trickster: sabotages the Choir\'s ladder-trap.

ENCOUNTER: THE CHOIR AMBUSH. EASY: 4 Ash Legionnaires. STANDARD: 6 and 2 Cinder Wraiths. HARD: 9, 3 Wraiths and an Ashen Hulk.

CHARACTER BEATS: Vesper asks each player: "If you were buried alive, would you want someone to dig?"

REWARDS: Level 11 to 12. Quill as an Ally. The pillar order.

HOOK: Quill says: "A pillar falls every season. The next is Pillar Nine, and it is falling in six days. That is when the Ash rises."`,
    },
    {
      title: 'Session 5, The night before (level 12)',
      content: `GOAL: assemble the defence. The party brings both armies to the Line, plans the defence and faces Vesper\'s last gambit. Gather every Ally the party has earned.

OPEN WITH (read aloud): "The night before the Ashfall is the strangest night of the war. Two armies camp on either side of the Line, close enough to see each other\'s fires. Nobody speaks. Nobody sleeps. A boy from Veyra and a boy from Dunmark are playing a game of dice between the two camps, and the dice are shared."

SCENES
1. Convening the armies. The party must persuade Dray and Brandt to put aside the war for one night. This is the diplomatic climax of the campaign.
2. Kest and Dacian. The party\'s Allies come to them with their own forces.
3. The plan. The party and their Allies draw up the defence: which force holds which pillar.
4. Vesper\'s last gambit. In the small hours Vesper tries to sabotage the Chord. The party can stop them, or listen.

PUZZLE: The Defence of the Line. Five pillars, numbered 1 to 5, must each be held by one group: two by Veyra, two by Dunmark and one by the party. Rules: (a) no two neighbouring pillars are held by the same group; (b) Dunmark holds pillar 3; (c) the party does not hold an end pillar; (d) Veyra holds pillar 1. SOLUTION: Veyra, party, Dunmark, Veyra, Dunmark (pillars 1 to 5). Hints: (1) Veyra is at pillar 1 and Dunmark at pillar 3, so the party must be at 2 or 4; (2) the party cannot be at pillar 5; (3) check that no neighbours are the same. Skill route: Investigation DC 15 or History DC 14 to remember the troop layout.

ROLE SPOTLIGHTS: Scout: places lookouts on the south wall. Face: brings Dray and Brandt to the same table. Healer: sets up the field hospital between the camps. Scholar: confirms the Chord\'s order with Quill. Fighter: rallies the troops. Trickster: catches Vesper at the Chord.

ENCOUNTER: VESPER (optional boss, see Lore). EASY: 80 HP. STANDARD: 120 HP. HARD: 160 HP and 4 Ash Legionnaires. A fight happens only if Vesper tries to destroy the Chord and cannot be talked down.

CHARACTER BEATS: Ask each player to say, to the camp, what their character is defending.

REWARDS: Level 12 to 13. Every Ally the party has earned. The Chord and the Key-stones, in place.

HOOK: At dawn, the southern horizon turns from grey to black. The ground trembles. The last pillar falls.`,
    },
    {
      title: 'Session 6, The Ashfall (level 13)',
      content: `GOAL: the finale. Hold the Line for one night, play the Chord, and decide who keeps it. The battle is scaled by the Allies the party has earned.

OPEN WITH (read aloud): "The Ashfall begins as a sound: a long, low breath from the whole south at once. Then the cinder lifts, ten thousand feet of it, and from inside it come the soldiers of a kingdom that died a thousand years ago, grey as ghosts, marching in step. On the Line, two armies who have spent eleven years killing each other stand shoulder to shoulder."

SCENES
1. The first wave. Ash Legionnaires strike the pillars. The party and their Allies must hold five pillars through a night.
2. The Battle Track. Run five rounds of the night. In each round, one pillar is threatened; the party chooses where to fight. Allies hold the other pillars. Each pillar they fail to hold costs 1 Ally.
3. The Ash Titan. At the end of the fifth round the Titan rises from the Ashlands.
4. The Chord. The party must place the Key-stones and strike the Chord to re-seat the ward.
5. The dawn. The Titan falls, or does not. The Line holds, or does not.

PUZZLE: The Final Chord. To re-seat the ward, the party must do both things they learned: place the three Key-stones on the right pillars, then strike the Chord in the right order. SOLUTION: Key-stones on pillars 9, 3 and 6 (Session 3); strike the Chord in the order F, C, D, A, E, B (Session 4). Hints: (1) the stones are spaced three apart, starting at the root of the siege\'s days; (2) the inscriptions order the pillars by height; (3) the Chord is struck tallest first. Skill route: Arcana DC 18 lets Quill\'s notes fill in a missing step, but at a cost: the party loses one Ally.

SCALING BY ALLIES. With 5 to 6 Allies run the EASY version: the Titan has 200 HP and all five pillars hold on their own. With 3 to 4 Allies run STANDARD: the Titan has 300 HP and one pillar falls. With 0 to 2 Allies run HARD: the Titan has 400 HP, two pillars fall, and the party must hold alone for one round.

ROLE SPOTLIGHTS: Scout: calls the Titan\'s approach. Face: keeps the armies together when morale breaks. Healer: keeps the Allies alive through the night. Scholar: guides the Chord. Fighter: holds the pillar the Titan strikes first. Trickster: places the last Key-stone while under fire.

THE ENDINGS
THE CONCORD: both cities share the Line. A joint college of tinkers is founded in Quill\'s hut. The war ends. A hard peace.
THE VEYRAN SEAL: Veyra keeps the Chord and Dunmark loses its stones. The Line holds, but the east resents it for a generation.
THE DUNMARK DOMINION: Dunmark keeps the Key-stones and takes the Chord. The Line holds, with a war waiting underneath.
THE FREE ASH: Vesper wins. The Line is allowed to fall. Nobody knows what the Ashlands were, and now they will find out.

ENCOUNTER: THE ASH TITAN (boss, see Lore). EASY: 200 HP. STANDARD: 300 HP. HARD: 400 HP and 2 Ashen Hulks.

CHARACTER BEATS: Ask each player what their character does when the night is over.

REWARDS: Level 14 if you wish to continue. A peace, a legacy and a choice.

HOOK FOR A SEQUEL: In the grey morning, Quill is still laughing. "Now for the other eight hundred and ninety-seven," she says.`,
    },
  ],
}
