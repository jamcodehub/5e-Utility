// THE SALT ROAD: levels 1 to 6. The free starter campaign: a road story with a moral choice at the end.

export default {
  id: 'the-salt-road',
  title: 'The Salt Road',
  tagline: 'Cross a vanished sea. Decide who it belongs to.',
  levels: '1 to 6',
  tone: 'Road-trip adventure with real stakes and a hard choice at the end',
  premium: false,
  pitch: 'A dying caravan master, forty urns of living seawater and four hundred miles of white seabed where an ocean used to be. A found-family road story that grows from a first-level escort job into a choice about who the sea belongs to. Built to be easy to run: one level per session, one big set piece and one puzzle each time.',

  guide: {
    story: `Forty years ago the Brineheart Sea left in a single night. Ports became ghost towns on the edge of a white desert. Ships still stand in the salt on their keels. The only thing that crosses the seabed now is the Salt Road, a line of marker-poles that caravans follow from the dying port of Low Tarn in the west to Kesh Maren in the east, the one great city that still has water: a reservoir the size of a county, held back by the Dam of Nine Hands.

The party is hired as outriders by Oriel Marrow, master of Marrow & Daughters, a failing family caravan. Oriel is dying of salt-lung and is carrying her last cargo: forty sealed urns of "seed-water", live seawater that the Kesh water-guilds pay fortunes for. She wants three things. To pay her daughters' debts. To get the urns there in one piece. And to see water, real open water, before she dies.

THE TRUTH (revealed slowly, never all at once): the sea did not drain. It was taken. The founders of Kesh Maren, the Dam-Compact, trapped the tide-spirit Ommerel Who Returns in the foundations of the dam, and the sea followed its captive the way a child follows a stolen parent. The urns do not hold seawater. They hold Ommerel's children, tide-sparks, and the Compact needs fresh ones every generation to keep the dam's binding alive. Oriel's cargo is exactly what they are waiting for.

Ommerel has been calling its children home along the Salt Road. That is why the wrecks sing at night, why the dune-hounds go mad, why the urns grow warm and sweat as the caravan nears the dam, and why fourteen-year-old Pip Marrow-Ode, who can hear the tide, has not slept properly in a month.

THE CHOICE at the Dam of Nine Hands has three honest answers. Deliver the urns, and the binding holds another generation: two million people in Kesh drink, and the basin towns keep dying slowly. Break the urns at the dam, and the sea comes home: the basin lives again, but Kesh's reservoir empties within a season and a city goes thirsty. Or earn a third way, a tide-treaty with Ommerel, which can only be won with everything the party has built along the road, and which costs the party something real.`,
    currentArc: `ACT ONE, Low Tarn to the Wreck Forest (levels 1 and 2). The party joins the caravan, takes their first night on the white, and learns the road is wrong: things are sweating, singing and hunting. Run Session 1 next.`,
    lastSession: '',
    worldNotes: `TONE AND PROMISE. Hot white days, cold black nights, the sound of salt crunching under wheels. This is a story about who we owe things to, so every scene should be about people first and danger second. The caravan is a family and the party should feel adopted by it within one session.

THE ROAD (a light travel system, use it or skip it). Track three numbers on a card for the whole caravan, each from 0 to 6: WATER, MORALE and URN-HEAT. Start at Water 5, Morale 4, Urn-Heat 0. Each travel day the party makes ONE group check (the scout's skill, helped by anyone with a good idea): success keeps the numbers, failure drops Water or Morale by 1. Good roleplay at camp (a story, a song, repairing something together) raises Morale by 1. Urn-Heat rises by 1 whenever the party does something dishonest to the caravan or ignores Pip, and by 1 each act as the dam gets closer. At Urn-Heat 6 the urns crack on their own and the third option is lost. At Water 0 or Morale 0 the caravan is in crisis (a scene, not a game over: someone has to sacrifice something).

ROAD DEBTS. At the start of Session 1 every player writes one line: why they took this job, and what they owe or are owed. Tie one of these to every session. Oriel remembers them all.

DIFFICULTY SCALING. Every encounter gives three numbers. Use STANDARD for 4 players at the listed level. For 3 players or a new table, use EASY. For 5 or 6 players, or a table that likes a fight, use HARD. If a fight is going badly, Marrow & Daughters help: Bran fires the wagon ballista, Tamsin throws oil, Oriel loses a turn coughing. Never let the family steal the kill.

ROLE SPOTLIGHTS. Every session lists a moment for the scout, the face, the healer, the scholar, the fighter and the trickster. These are jobs, not classes: a barbarian can be the scout, a wizard can be the face. Make sure each player gets at least one by the end of a session.

PUZZLES. Every puzzle has a clean solution, three hints that get progressively kinder, and a skill route so a stuck table can pay a cost instead of stopping. Never let a puzzle block the story.

SAFETY AND PACING. Oriel dies at the end of Session 5. It is meant to hurt, and it lands because the party has spent four sessions with her. If your table is not ready for that, she can survive in a coma until the dam, but she cannot walk again.`,
    npcs: [
      { name: 'Oriel Marrow', description: 'Caravan-master, 61, thin as a wagon spoke, sucks a grey salt-stone to keep her cough down. Plain-spoken, funny, impossible to bribe. Wants to see open water before she dies. Secret: her husband Dael was killed by a Compact factor when he tried to open an urn, and she carries his last letter unopened in her boot.', characterRelation: 'Hires each party member personally and remembers the first small lie they tell her. Her approval is the emotional spine of the campaign.' },
      { name: 'Tamsin Marrow', description: 'Oriel\'s eldest, 29, keeps the ledger and the schedule. Cold, precise, frightened of debt more than of death. Secret: she has signed notes of credit to Sister Ines to cover the caravan\'s losses, which makes her the Compact\'s unwilling lever.', characterRelation: 'Distrusts the party until one of them keeps a promise that cost them money. Then she is the most loyal person on the road.' },
      { name: 'Pip Marrow-Ode', description: 'Oriel\'s granddaughter, 14, apprentice wagon-hand. Can hear the tide in her teeth and has been humming to calm the urns since she was nine without knowing why. Funny, stubborn, hates being protected.', characterRelation: 'Attaches to whoever treats her as a colleague, not a child. Her song is the key to the third ending.' },
      { name: 'Brannoch "Bran" Oakes', description: 'Wagon-wright and former sea captain, 58, one ear, a drinker who has not touched a drop since Low Tarn. Was on the water the night the sea left and has never told anyone what he saw: the sea walking away in a line, like a crowd leaving a theatre.', characterRelation: 'Teaches the party the road. Wants someone to finally hear his story without telling him it was only a storm.' },
      { name: 'Sister Ines Vael', description: 'A pilgrim priest of the Mercy of Water who joins the caravan at Tallow Station. Warm, generous, always the first to share her water. Actually a Compact factor from Kesh\'s thirstiest ward who believes, completely, that she is saving two million people.', characterRelation: 'Befriends the healer or the face. She is never a cartoon villain: she gives the party a reason to side with her.' },
      { name: 'Juro Skerrin', description: 'Raider-king of the Bone Fleet, who sail sand-skiffs between the wrecks. Young, theatrical, honest about his crimes. His people are dying of thirst at the sea\'s edge and he wants water, not a fight.', characterRelation: 'Offers the party a deal in Session 4 that is better than it sounds. Can become an ally, a rival, or a casualty.' },
      { name: 'Warden Quillon Haast', description: 'Senior dam-warden at the Dam of Nine Hands, 50s, tired and decent. Has noticed that the dam does not leak the way a dam should, and has been quietly keeping a notebook.', characterRelation: 'The party\'s inside contact at Kesh Maren in Session 6, if they treat him well. Can open the sluice-gates from inside.' },
      { name: 'Ommerel Who Returns', description: 'A tide-spirit the size of an ocean, caged under a dam. Speaks through standing water in a voice like a crowd breathing out. Does not hate; it is homesick. Cannot lie, but only answers the question that was asked.', characterRelation: 'Speaks to Pip first, then to anyone who has earned it. Its offer in Session 6 is the heart of the campaign.' },
    ],
    quests: [
      { title: 'Deliver the seed-water', description: 'Get forty sealed urns from Low Tarn to the Dam of Nine Hands in Kesh Maren, four hundred miles east, before Oriel\'s debts come due at the next full moon.' },
      { title: 'A road debt for every traveller', description: 'Each party member has a reason they took the job. Resolve at least one personal debt on the road. Oriel knows what they are.' },
      { title: 'Why do the wrecks sing?', description: 'Every wreck on the Salt Road hums at night in the same four notes, and the sound gets louder the closer the caravan gets to Kesh Maren. Find out who is singing.' },
      { title: 'Bone Fleet toll', description: 'The Bone Fleet hunts the middle of the road. Pay their toll, fight them off, or find out what they truly want.' },
      { title: 'Pip\'s song', description: 'Pip hums the same four notes that the wrecks sing. Help her understand why before the urns finish warming.' },
      { title: 'Oriel\'s last wish', description: 'Oriel has never seen open water. See that she does.' },
    ],
  },

  lore: [
    { title: 'Low Tarn', tag: 'location', content: 'Western end of the road. A port whose docks end in a cliff of salt, with a lighthouse still lit every night out of habit. Population 400 and falling. The caravan assembles in the old harbour: forty-one urns on six wagons, all wrapped in wet sailcloth. Landmarks for the opening scene: the Last Tide Tavern (a bar built inside a beached ferry), the Weighing House where Tamsin settles the books, and the harbourmaster\'s office with the sea-level plaque stopped at forty years ago.' },
    { title: 'The Wreck Forest', tag: 'location', content: 'A hundred miles of ships standing on their keels in the salt, a tangle of masts and hulls the caravan has to thread through. Wind makes the rigging sing; at night something else does. Navigation is a maze: any wagon can get lost in the shadows. Hazards: collapsing yards (DC 12 Dex save, 2d6 bludgeoning), salt-glare (disadvantage on Perception beyond 60 feet at noon), brine pools (DC 11 Con save or 1 level of exhaustion that fades after a rest).' },
    { title: 'The Singing Hull', tag: 'location', content: 'The wreck of the Mercy of Dawn, a Compact survey ship, lying on its side at the centre of the forest. The hull is hollow and acts like a sounding board: it sings Ommerel\'s call in four notes. Inside: a flooded hold with a real tide that rises and falls on its own, the captain\'s cabin with the logs, and a crew of drowned sailors who never stopped working. Make it feel like a church built from a ship.' },
    { title: 'Tallow Station', tag: 'location', content: 'The only oasis on the road: a walled waystation built around a deep well that has never run dry, run by a cheerful widow, Marta Tallow. Everything here is for sale and everyone is friendly. This is where Sister Ines joins the caravan and where the Bone Fleet makes first contact. The well water tastes faintly of the sea.' },
    { title: 'The Glass Flats', tag: 'location', content: 'A day\'s walk of perfectly flat, perfectly mirrored salt that shows the sky upside down and, at midday, shows a sea that is not there. Sound carries oddly. Travel is slow and every creature sees a different lake. A true tide-pool lies at the exact centre: the only open water on the whole road, a ring of water thirty feet wide that never evaporates.' },
    { title: 'Kesh Maren and the Dam of Nine Hands', tag: 'location', content: 'A city of two million built round a reservoir the colour of slate. Nine enormous stone hands, one for every founding house, hold the sluice-gates closed. Inside the dam: the Pressure Hall (nine control wheels), the Binding Chamber at the bottom with a pool where Ommerel is held, and a tide-lock used to feed new sparks into the water. Guards wear grey with a white hand on the shoulder.' },
    { title: 'Marrow & Daughters', tag: 'faction', content: 'A family caravan, nine people and six wagons. Poor, proud, one bad season from breaking up. They treat hired hands like family because they cannot afford to treat them like anything else. Strengths: they know the road, they have tools, they are loyal. Weaknesses: debt, secrets, one bad guide away from disaster. If the party mistreats them, Morale drops and the story turns cold.' },
    { title: 'The Dam-Compact', tag: 'faction', content: 'The nine founding houses of Kesh Maren and the guilds that serve them. Not villains: administrators who inherited a crime and learned to live with it. They believe the city dies without the dam. Methods: credit, patience, the occasional accident. Their agents are never in a hurry. When the party meets them, they should find them reasonable, and be disturbed by how reasonable.' },
    { title: 'The Bone Fleet', tag: 'faction', content: 'Raiders who sail sand-skiffs, light boats with salt-runners and rag sails, between the ships of the Wreck Forest. Three hundred men, women and children living in the carcass of a whaling fleet. They take tolls in water, not coin, and have killed no one in three years. Led by Juro Skerrin, who knows the sea is out there somewhere and wants it back.' },
    { title: 'Salt-mad dune hounds', tag: 'enemy', maxHp: 11, content: 'Lean, white-furred hounds driven frantic by the sound of the sea. Use WOLF stats (AC 13, 11 HP). They fight in a pack and flee when half are down. EASY: 3 hounds, no pack tactics. STANDARD: 5 hounds. HARD: 7 hounds plus one alpha with 20 HP. Tell the players they are crying, not snarling. Hounds that are calmed (Animal Handling DC 12, or Pip humming) become loyal companions for the rest of the road.' },
    { title: 'Brine-wights', tag: 'enemy', maxHp: 22, content: 'Drowned sailors who rise from the salt, still doing their last orders: hauling, bailing, mooring. Use ZOMBIE stats (AC 8, 22 HP) but they are slow and graceful, and they do not attack anyone who is helping them with their work. Each wight is carrying something that matters (a letter, a locket, a coil of rope). EASY: 3 wights. STANDARD: 5 wights. HARD: 7 wights and the bosun, who has 40 HP and hits twice.' },
    { title: 'Salt-lurkers', tag: 'enemy', maxHp: 13, content: 'Giant crabs the colour of bleached bone that wait just under the crust. Use GIANT CRAB stats (AC 11, 13 HP), but their burrow ambush gives them advantage on the first attack against an unaware creature. One is huge: 30 HP and a claw that grapples. They are scavengers, not hunters, and a thrown ration will distract one.' },
    { title: 'Captain Hollowell, the Revenant of the Mercy of Dawn', tag: 'boss', maxHp: 58, content: 'The ship\'s master, bound to his ship by the Compact so that he could never tell what he saw. AC 14, 58 HP, speed 30 ft, immune to poison, resistance to necrotic. Attacks: Rusted Cutlass +5 (1d8+3 slashing), Command the Hull (recharge 5-6, the ship\'s timbers lash out in a 15 ft cone, DC 13 Dex save, 3d6 bludgeoning). Tide Pull: at the start of each round the sea in the hold rises or falls and so does the floor, creating difficult terrain on alternating sides. He does not want to fight. If someone speaks his daughter\'s name (found in the logs) he stops, takes off his hat, and gives the party his testimony. EASY: 40 HP, no Command the Hull. HARD: 80 HP, adds two brine-wight sailors.' },
    { title: 'Seed-water urn', tag: 'item', content: 'A clay urn the size of a loaf, sealed with wax and a tide-stone cap, wrapped in wet sailcloth. Warm to the touch when it should be cool. When you press an ear to it you can hear a tiny tide going in and out. If an urn breaks, the water inside moves on its own towards the east. Forty-one urns in total; Oriel\'s wagon holds the one she will not let anyone open.' },
    { title: 'The Night the Sea Left', tag: 'event', content: 'Forty years ago. Fishers on the western shore say the water went out in a single long breath, with a sound like a crowd standing up. In the morning the horizon was a white line. Bran saw it from the deck of his ship: the sea walking east in a line, with the stars still reflected in it. Everyone who was there tells it differently; everyone remembers the sound.' },
  ],

  sessions: [
    {
      title: 'Session 1, Low Tarn: four hundred miles of nothing (level 1)',
      content: `GOAL: introduce the caravan as a family the party wants to protect, set up the road debts, and run the first night on the white. By the end of the session the players should know the names of everyone in the family and be worried about Oriel's cough.

OPEN WITH (read aloud): "Low Tarn smells of tar, fish that left forty years ago, and hot salt. The docks end in a cliff. At the foot of it, six wagons are being packed by people who clearly love each other and are very tired. An old woman in a salt-stained coat is counting urns out loud, coughing between numbers, and she has not looked up once."

SCENES
1. The Weighing House. Oriel hires each PC in turn and asks one personal question. Players write their road debt on a card. Tamsin takes down their names, their prices and, quietly, their lies.
2. Packing the wagons. Pip asks to help the party; anyone who treats her as a colleague gets her trust. She explains that the urns are warm and she hums to cool them.
3. Out on the white. Establish the road: marker-poles every mile, the glare, the silence. Run one group travel check (scout, DC 11). Bran shows the party the first wreck and tells them about the sea, but only as a story.
4. The night camp. Wagon circle, cold, cough, and the first sound of the wrecks singing four notes in the distance. Pip stops humming; the urns go warm.
5. Dune hounds (level 1 fight). They come in a pack from the dark, crying rather than snarling.

PUZZLE: The Warm Urns. The urns are heating. The party can investigate: the cap-stones are warm, the wax is cracking. SOLUTION: the urns respond to the four-note song. Pip humming it cools them; a bard or a musician can repeat it. Hints: (1) the urns are hottest when the wrecks sing; (2) Pip knows something; (3) the notes match the ones from the distant wrecks. Skill route: Nature or Arcana DC 13 identifies the warmth as a reaction to sound.

ROLE SPOTLIGHTS: Scout: finds the safe line through the salt-crust (no travel penalty). Face: wins Tamsin\'s respect by haggling the first night\'s water fairly. Healer: Oriel\'s cough: Medicine DC 11 to see it is salt-lung and she is much sicker than she says. Scholar: identifies the four notes as a tidal figure, not a song (Arcana or History DC 12). Fighter: holds the line when the hounds hit the first wagon. Trickster: spots that someone has already tampered with an urn seal (Investigation DC 14).

ENCOUNTER: SALT-MAD DUNE HOUNDS. EASY: 3 hounds. STANDARD: 5. HARD: 7 and an alpha. Tell the table the hounds are crying; hounds that are calmed become allies.

CHARACTER BEATS: Ask each player how their character reacts when Oriel coughs blood into a rag and hides it. Let each answer shape a line of dialogue for Oriel to remember.

REWARDS: Level 2 at dawn. Each PC receives a salt-stone from Oriel: a keepsake worth nothing and everything.

HOOK: Pip says quietly, "That sound is getting louder." Oriel says, "Then we drive faster."`,
    },
    {
      title: 'Session 2, The Wreck Forest (level 2)',
      content: `GOAL: get the caravan through the maze of ships, solve the first real puzzle, and make the party feel the weight of the road. By the end the party should suspect that the sea was taken, not lost.

OPEN WITH (read aloud): "Masts rise out of the salt like a drowned forest. Hulls lean against each other, their bows pointing to a sky they were never meant to see. Wind in the rigging makes a sound like a hundred people clearing their throats. Somewhere deep in the tangle, something answers in four notes."

SCENES
1. Threading the forest. The scout leads. Run two checks (DC 12) as the caravan weaves between hulls; each failure costs Water or Morale. On a success the scout finds a gap the wagons were never meant to use.
2. Bran's ship, the Gull's Mercy. Bran asks to stop at a particular wreck. In the captain's cabin there is a locked strongroom and a note: "For whoever finds it first." Opening it is the puzzle.
3. Camp inside a hull. Quiet scene: Tamsin audits the party's spending out loud, Pip draws a map of where the singing comes from, Bran tells a true story about the night the sea left. Raise Morale if the party engages.
4. Brine-wights. They rise in the night, silently continuing their last orders. The party can fight them, or notice they are not attacking anyone who is helping.

PUZZLE: The Strongroom Fish. A bronze door with five brass fish on rails: Minnow, Perch, Carp, Pike and Sturgeon. A plate reads: "Swim in the order I was fed." A scrap of Bran\'s ledger gives the rules: (a) the Sturgeon is never first or last. (b) The Minnow swims directly between the Perch and the Pike. (c) The Carp swims somewhere before the Sturgeon. (d) The Pike is first or last. SOLUTION, left to right: Carp, Sturgeon, Perch, Minnow, Pike. Hints: (1) the Pike must be an end, and if it is first the rest cannot work; (2) the Perch, Minnow and Pike are a block of three; (3) the Sturgeon and Carp fill the first two places. Skill route: Thieves\' Tools DC 15 or Athletics DC 17 forces the door but breaks what is inside (a map is torn in half, losing one clue).

INSIDE THE STRONGROOM: a Compact survey chart of the basin before the sea left, with the dam marked and the words "Binding, phase one" written in red; a case of 6 healing potions; Bran\'s old captain\'s hat.

ROLE SPOTLIGHTS: Scout: finds the path and the safe camp. Face: gets Bran talking. Healer: Oriel has a coughing fit during the climb; a Medicine DC 12 check or a healing spell buys her a day. Scholar: reads the chart and spots the nine hands on the dam. Fighter: holds a collapsing mast long enough for a wagon to pass (Athletics DC 13). Trickster: opens the strongroom without the puzzle.

ENCOUNTER: BRINE-WIGHTS. EASY: 3. STANDARD: 5. HARD: 7 and a bosun with 40 HP. Each wight carries a small object; ask each player what theirs is.

CHARACTER BEATS: Bran tells the story. Ask the player of the most skeptical PC what they say when he finishes.

REWARDS: Level 3. The chart (give the players a handout of the dam with nine hands). The strongroom potions.

HOOK: In the morning, two of the urns have cracked. Nothing has leaked. They are empty. Pip says, "They went home."`,
    },
    {
      title: 'Session 3, The Singing Hull (level 3)',
      content: `GOAL: find the source of the singing and meet the first real boss. The party learns that the sea was taken by a binding, and that someone paid the Compact to keep it quiet.

OPEN WITH (read aloud): "The Mercy of Dawn lies on its side like a cathedral someone dropped. Four notes pour from the hull, steady as breathing. Every urn in the caravan is as warm as a living hand."

SCENES
1. The approach. The caravan cannot go around: the road runs straight through the wreck\'s shadow. Pip insists on going in. She is not asking.
2. The tide hold. A flooded hold where the water rises and falls on its own every minute. The floor is alternately wet and dry. Use it to create dynamic terrain.
3. The logs. In the captain\'s cabin the party finds Hollowell\'s ship\'s logs, last entry dated the night the sea left: "They are not taking the water. They are taking the one it follows." The entry mentions a daughter, Marit, left behind in Kesh Maren.
4. Captain Hollowell. The revenant is bound to the ship and cannot speak about what he saw. He fights until someone speaks his daughter\'s name, then removes his hat and tells the truth.

PUZZLE: The Tide Clock. A brass instrument in the cabin tells the hold when to rise and fall. Three rings, each carrying moon phases, must be aligned so that the tide is OUT. Rule on the plate: "Dark moon, the third bell, the sea goes out." SOLUTION: set the outer ring to the dark moon, the middle ring to the third bell mark, and leave the inner ring on ebb. Hints: (1) the plate names three things, and there are three rings; (2) the rings only show moon, bell and tide; (3) the log says the night was dark. Skill route: Arcana or Sailing DC 14 reads the instrument. Failing the puzzle leaves the hold flooded for the whole fight.

ROLE SPOTLIGHTS: Scout: finds a safe path across the hold\'s moving floor. Face: speaks to the captain after the fight. Healer: treats the wights that stand calm in the corners (Medicine DC 12): they leave a clue for each success. Scholar: reads the logs. Fighter: tank for the captain\'s Command the Hull. Trickster: slips the strongbox in the cabin: inside is a Compact retainer letter, signed by Sister Ines Vael.

ENCOUNTER: CAPTAIN HOLLOWELL (boss, see Lore). EASY: 40 HP, no Command the Hull. STANDARD: 58 HP. HARD: 80 HP plus two brine-wight sailors. The fight can end early the moment someone says Marit, in which case the party earns his testimony without a death.

CHARACTER BEATS: Hollowell asks what the party would do for someone they loved. Let each answer. Oriel overhears and says nothing.

REWARDS: Level 4. A Compact retainer letter (a clue and a hook). Hollowell\'s hat: wearing it grants advantage on one saving throw against fear per day.

HOOK: A lone skiff, sail like a white fin, follows the caravan on the horizon. At dusk a banner appears: a skull made of oars. The Bone Fleet.`,
    },
    {
      title: 'Session 4, Tallow Station (level 4)',
      content: `GOAL: a social session with a set piece in the middle. The party meets Sister Ines and Juro Skerrin, learns the shape of the Compact, and loses control of events. Close with Tamsin\'s secret coming out.

OPEN WITH (read aloud): "Tallow Station rises out of the white like a sandcastle with a well in its heart. Painted shutters, laundry, children running between the wagons. A woman in a grey travelling coat waves from the gate and calls out, 'Water first, bargaining after.' Her smile is perfect."

SCENES
1. Water first. Marta Tallow welcomes the caravan. The well is warm and tastes of the sea. Sister Ines Vael shares her supper with the party and asks, gently, about the cargo. The honest answer is that she already knows.
2. Ines\' pitch. Ines is brilliant at meeting people where they are. She tells the party the truth about the dam in the way that makes the Compact sound merciful: two million people, one thirsty ward, one old crime. She offers to buy the urns at triple price. Give her a speech worth considering.
3. Tamsin\'s note. During the night Tamsin is seen slipping a folded note to Ines. Confronting her reveals the debt notes. Tamsin is ashamed and furious in equal measure.
4. Juro Skerrin\'s offer. The Bone Fleet rides in at dawn. Juro does not want a fight. He wants water for three hundred people and offers safe passage through the dunes in exchange for five urns. The offer is real. The urns are not safe in his hands.
5. SET PIECE: the skiff battle. If the party refuses, or Ines meddles, the Bone Fleet attack at the edge of the station. Skiffs weave between the wagons; the party can leap from wagon to skiff.

PUZZLE: Ines\' Ledger Trick. Ines slides a bargain across the table: nine small clauses, one of which is a lie. SOLUTION: the clause that says "water delivered by the third night" cannot be true because the dam is four nights away. Hints: (1) read every clause as a promise about time; (2) check the road distance; (3) Tamsin has the schedule. Skill route: Insight DC 14 spots which clause she looked away from while reading.

ROLE SPOTLIGHTS: Scout: spots the skiffs\' approach and picks the wagon circle. Face: negotiates with Juro. Healer: tends to a Bone Fleet child with salt-lung and earns Juro\'s trust. Scholar: reads the contract. Fighter: holds the gate. Trickster: finds Ines\' second set of papers in her room (Investigation DC 15): a list of Compact agents along the road.

ENCOUNTER: BONE FLEET SKIFF RAID. EASY: 4 raiders (Bandit stats). STANDARD: 6 raiders and a skiff-captain (Bandit Captain stats). HARD: 8 raiders, a captain and a sand-whale that surfaces mid-fight. Raiders flee when Juro does.

CHARACTER BEATS: Ines asks the party who they would save if they could only save one town. Do not accept a hedge.

REWARDS: Level 5. A Bone Fleet skiff-whistle, usable once to call a skiff. A list of Compact agents.

HOOK: Oriel collapses. Pip says, "The urns want to go faster." Oriel opens her eyes and says, "Then we do not stop again."`,
    },
    {
      title: 'Session 5, The Glass Flats (level 5)',
      content: `GOAL: the emotional centre of the campaign. A mirage puzzle, a parley with Ommerel through Pip, and the death of Oriel Marrow. By the end the party has chosen what they are carrying and why.

OPEN WITH (read aloud): "The Flats are so flat the horizon curls up at the edges. The sky is below your feet. At noon a sea appears ahead, deep blue, whitecaps running to the edge of the world. Every animal in the caravan stops walking at once."

SCENES
1. The mirage. Everyone sees a different sea. Run it as a roleplay prompt: ask each player what their character sees in the water. The answers become the party\'s motivations for the finale.
2. The wrong road. The mirage drags the wagons off the road. The group must navigate by the markers and the sound. Run three group checks (DC 13); each failure costs Water.
3. Oriel\'s request. Oriel asks to be carried to the water. Everyone knows it is a mirage. Bran says, "Take her to the real one," and tells the party about the tide-pool at the centre of the Flats.
4. The tide-pool. A ring of real water, thirty feet wide, on the exact centre. Pip kneels and sings. Ommerel answers through the water. This is its first voice.
5. Oriel and the sea. Oriel steps into the shallows. She sees the sea as it was. She says what she needs to say. She dies at sunset.

PUZZLE: Which Sea Is Real. Each creature sees a different lake. Only one point has no reflection of its own sky. SOLUTION: find the one spot where the mirrored sky shows the stars wrong: only the real water reflects the actual sky above. Hints: (1) the mirage reflects a sky, but is it the right one?; (2) look for the place where the stars are in the wrong places; (3) Pip points straight at it. Skill route: Survival DC 14 or Perception DC 15.

ROLE SPOTLIGHTS: Scout: finds the true centre. Face: Ommerel will only answer a question asked with respect. Healer: eases Oriel\'s last hour (Medicine or Religion). Scholar: translates Ommerel\'s grammar (it answers only what was asked). Fighter: carries Oriel across the Flats. Trickster: holds off a Compact tail who follows the caravan.

ENCOUNTER: none by default. If the table wants a fight, SALT-LURKERS ambush from under the crust. EASY: 2. STANDARD: 3 and a huge one. HARD: 5 and a huge one.

CHARACTER BEATS: Give each PC a minute alone with Oriel before she dies. She remembers every road debt.

REWARDS: Level 6. Oriel\'s salt-stone and Dael\'s unopened letter. The letter says: "Do not take them to Kesh. Take them home."

HOOK: At dawn Ines is waiting at the edge of the Flats with a company of grey-coated guards and an apology. "I am sorry for your loss," she says, and she is.`,
    },
    {
      title: 'Session 6, The Dam of Nine Hands (level 6)',
      content: `GOAL: the finale. Infiltrate the dam, solve the Nine Hands puzzle, face Ommerel, and choose. The campaign ends on the choice and the consequences the party earned.

OPEN WITH (read aloud): "Kesh Maren is a city that has never been thirsty. Water everywhere: fountains, canals, laundries. And above them all, a wall the colour of thunder with nine stone hands pressed flat against it, holding the world back."

SCENES
1. The gate. Ines meets the party openly at the city gate and offers a final deal: deliver the urns, keep your pay, and no one is harmed. Her offer is genuine. Warden Haast, watching, gives the party a small sign.
2. Into the dam. With Haast\'s help the party enters the Pressure Hall. Nine great wheels, nine locked gates.
3. The Nine Hands puzzle (below).
4. The Binding Chamber. Ommerel speaks, not through Pip alone. The sea in the chamber is cold and dark and rises to meet the urns. Ines is here, offering to bargain.
5. The choice. Give the table a clear decision point and let them argue it out.

PUZZLE: The Nine Hands. Nine wheels, each one turning a hand that holds a gate shut. Each wheel has a number from one to nine carved on its rim. A plaque reads: "Open the last gate first. The hand that holds the sea holds the most." SOLUTION: the wheels must be turned in descending order of their numbers, nine to one, because each gate\'s pressure is carried by the gates below it. Hints: (1) the plaque is a rule, not a poem; (2) count which gate holds the most weight; (3) Haast\'s notebook gives the order. Skill route: Engineering or Investigation DC 15. A mistake floods the Pressure Hall with 1d6 water per round for three rounds.

ROLE SPOTLIGHTS: Scout: finds the service stairs and the guard rotation (Survival or Stealth DC 14). Face: the gate conversation with Ines and the final talk with Ommerel. Healer: reaches Warden Haast when he collapses from the pressure fumes (Medicine DC 13). Scholar: reads the binding glyphs in the Chamber and finds the clause that allows a treaty (Arcana DC 16). Fighter: holds the Pressure Hall door against the Compact guard. Trickster: bypasses the tide-lock so the urns can be opened early.

THE THREE ENDINGS
DELIVER: the urns are poured into the binding. The sea stays under the dam for another generation. Ines thanks the party and means it. Epilogue: Kesh drinks; the basin towns fade; Pip refuses to come home.
RELEASE: the party breaks the urns. The sea comes home in a single breath. Epilogue: the basin lives again. Kesh begins to thirst. Ines becomes the party\'s enemy or their ally depending on how they treated her.
TREATY: the party earns Ommerel\'s trust (Urn-Heat below 4, Pip\'s song, Dael\'s letter, Oriel\'s salt-stones). Ommerel will release the sea slowly over ten years in exchange for a tithe: one memory from each party member that they will never recover. The sea returns. Kesh has time to adapt. Everyone loses something and everyone gets something.

ENCOUNTER: THE BINDING (boss, optional). If the party picks a fight, or Ines does: OMMEREL, BOUND. AC 15, 150 HP, resistance to nonmagical weapons. Phase one (150 to 75): Crushing Tide (DC 15 Str save, 4d6 bludgeoning, pushes 20 ft). Phase two (75 and below): the dam begins to crack; at the start of each round a section of floor floods. EASY: 100 HP, one phase. HARD: 200 HP, plus Ines\' Stillwater Guard (4 Veterans).

CHARACTER BEATS: Ask each player what their character gives up for the ending they chose. Make it small, specific, and true.

REWARDS: Level 7 if you wish to continue. Whatever the ending, the party gains Oriel\'s caravan and the Marrow family name.

HOOK FOR A SEQUEL: Whichever ending they pick, something in the east answers. A single wave, very high, very far away, rising against the horizon.`,
    },
  ],
}
