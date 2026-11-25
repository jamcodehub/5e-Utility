// THE LONG ECLIPSE: levels 11 to 16. A high-level epic pilgrimage; each character carries a personal hearth to the end.

export default {
  id: 'the-long-eclipse',
  title: 'The Long Eclipse',
  tagline: 'The sun has been dimming for a year. Carry an ember across the world to the throne that lit it.',
  levels: '11 to 16',
  tone: 'Mythic pilgrimage and cinematic finale; hope as something you carry, and pay for',
  premium: true,
  pitch: 'The sun has been dimming for a year, and nobody knows why. The Dawn Order sends the party on a pilgrimage with a single ember: through a city of lamps, down the river of the dead and up to the throne where the sun was first lit. Each character walks a personal Hearth Trial. What waits at the end is not a dying god but a lamp holding something back, and the last act is a choice about what it should burn. Built for high-level parties who want cinematic set pieces and real character arcs.',

  // Battle maps made with the map generator (files in data/campaigns/maps/<id>/), and which ones each session uses.
  maps: ['first-hearth','last-light-inn','road-of-lamps','river-of-the-dead','throne-of-dawn','long-night'],
  sessionMaps: [['first-hearth','last-light-inn'],['road-of-lamps'],['river-of-the-dead'],['throne-of-dawn'],['throne-of-dawn'],['long-night']],

  guide: {
    story: `A year ago the sun began to dim. Not suddenly: a shade at a time, so that every morning looks a little more like evening. Crops fail. Cities put lamps in their windows at noon. The oldest people say the light has a different colour now, like a coin held too long in the hand. Nobody knows why. The temples blame each other; the scholars blame the temples.

The Dawn Order, a small, tired order of lamp-keepers, believes the sun is a lantern, that it was lit by someone, and that it can be lit again. They have an ember from the First Hearth, a spark that has burned in a vault for nine hundred years, and a map of the Pilgrim\'s Road to the throne where the sun was first kindled. They need people strong enough to carry it. The party is those people.

THE TRUTH: the sun is a lamp, and it is not dying; it is running out of oil. It was lit by the first people to hold back the Unlit, a cold, patient intelligence that existed before the world had light and that sleeps now, beneath the sun\'s throne, in the dark the lamp keeps away. The lamp\'s fuel is not fire but shared hope: the small acts of kindness, wonder and courage of everyone who lives under it. For the last year the world has been quietly despairing (a plague, a war, a hard winter) and the lamp is guttering. The Unlit is waking.

The Lantern\'s keeper is Aurelian, an old god in the shape of a tired man, who has held the lamp for nine hundred years and has begun to doubt whether people are worth the fuel. His herald, Cassiel Duskborn, a former Dawn priest, has concluded that the kind thing to do is to let the light go out and spare the world the pain of hoping.

THE PILGRIMAGE takes the party through four stations: the Road of Lamps (a city built along a bridge of lanterns), the River of the Dead (to ask the ferryman for passage), the Throne of Dawn (where the truth is told) and the Long Night (where the Unlit wakes). At each station, each character must carry a Hearth: something true they will not give up. The Hearth is the party\'s fuel, and a Hearth that is abandoned goes cold.

THE ENDGAME: the Ember is not enough. The Lantern needs a Hearth from every pilgrim. Whether it is rekindled, replaced, or allowed to go out is the party\'s choice, and the strength of the light depends on how many Hearths are still burning.`,
    currentArc: `ACT ONE, The Dimming (level 11). The party takes the Ember, chooses their Hearth and sets out on the Pilgrim\'s Road. Run Session 1 next.`,
    lastSession: '',
    worldNotes: `TONE AND PROMISE. A mythic pilgrimage, closer to a fairy tale than a war story. Grand set pieces, quiet campfire scenes, a lot of weather. The finale should feel inevitable and earned. Do not rush the quiet scenes: they are what the final choice rests on.

PILGRIM ROLES. At the start of Session 1 each player picks a role for the pilgrimage: BEARER (carries the Ember), WARDEN (guards the party), WAYFINDER (navigates), VOICE (speaks to gods and the dead), SMITH (tends the Ember\'s flame) or KEEPER (records the journey). Two players can share a role. Each session lists a moment for every role.

HEARTHS. At the start of Session 1 each player writes down their character\'s HEARTH: one true thing they will not give up (a person, a promise, a belief, a craft). During the campaign each Hearth is tested in a HEARTH TRIAL, a personal scene in which the character is offered a good reason to abandon it. A character who holds their Hearth through the trial keeps it lit. Track the number of lit Hearths on a card, from 0 to the size of the party. In the finale this number sets how bright the light is.

THE DIMNESS CLOCK. Keep a number from 0 to 8, starting at 3. It rises by 1 each session as the sun dims and falls by 1 when the party restores hope to a place (a lit lantern, a story told, a debt forgiven). At 8 the sun goes out for a day: the finale becomes a fight in darkness. At 0 the sun brightens visibly and the Unlit stirs more slowly.

DIFFICULTY SCALING. Every encounter gives EASY, STANDARD and HARD numbers for 4 players at the listed level. Add one rank for 5 or 6 players. The finale is scaled by lit Hearths: see Session 6.

PUZZLES. Every puzzle has a clean solution, three hints and a skill route. Puzzles here are logic and riddle problems, so let the players argue.

SAFETY. Grief, loss, despair and mortality. Check with the table before Session 3.`,
    npcs: [
      { name: 'Elder Aurelian', description: 'The keeper of the sun, an old god in the shape of a tired man in a plain grey coat. Has trimmed the wick for nine hundred years. Kind, wry and exhausted. He loves the world and has stopped believing it loves him back.', characterRelation: 'Tells the party the truth at the Throne. He is not an enemy: he is someone who needs to be given a reason.' },
      { name: 'Cassiel Duskborn', description: 'Aurelian\'s herald, a former Dawn priest, tall and gentle, with a voice like a lamp being turned down. Believes the kindest thing is to let the light go out. His compassion is real and terrifying.', characterRelation: 'Meets the party on the road and travels with them, honestly, until Session 4. He asks everyone the same question: "What are you afraid you will lose?"' },
      { name: 'Marshal Marisol Vane', description: 'The Dawn Order\'s last field marshal, 60, who sends the party. Practical, dry, a veteran of too many futile sieges. She does not trust prophecy but trusts people.', characterRelation: 'Sends the party and supplies them. She tells each of them, privately, what she would do in their place.' },
      { name: 'Obbin Greyfisher', description: 'The ferryman of the River of the Dead, patient and plain-spoken, with a pipe that never goes out. Has ferried every soul in the world and can name most of them.', characterRelation: 'The key to Session 3. He takes payment in stories, and he remembers every one.' },
      { name: 'Sister Thessaly of the Kindled', description: 'The leader of a rival pilgrim band, 35, a burned hand and an absolute faith. She believes the sun can be saved by sacrifice and has taken to burning the offerings of her own followers. Not cruel, just sure.', characterRelation: 'A rival and an echo of what the party could become. She can become an ally if someone reaches her.' },
      { name: 'Kael Ashmere', description: 'A teenaged astronomer and the party\'s Wayfinder, 17, observant, funny and frightened. Has memorised every star chart in the Order\'s library and has never left the city.', characterRelation: 'Joins the party at the gate. Treated as a person, Kael becomes the emotional centre of the journey.' },
      { name: 'Ysenne, the Last Lampwright', description: 'The keeper of the Road of Lamps, 70, who maintains a bridge of ten thousand lanterns single-handed. Gruff, devoted, nearly blind. Talks to the lamps.', characterRelation: 'Teaches the party to light a lamp for someone else. Her Hearth is the one thing she will not give up: the bridge.' },
      { name: 'The Unlit', description: 'An old, cold intelligence that sleeps beneath the Throne. It does not hate; it has never known anything but the dark. When it speaks, it speaks in the voices of people you have lost, as gently as a lullaby.', characterRelation: 'Appears in Session 5. It asks the party only one thing: to stop.' },
    ],
    quests: [
      { title: "Carry the Ember", kind: 'main', description: "Take the spark from the First Hearth to the Throne of Dawn, at the far end of the Pilgrim's Road, before the sun goes out." },
      { title: "The Road of Lamps", kind: 'main', description: "Cross the bridge of ten thousand lanterns and learn what lighting a lamp for someone else costs." },
      { title: "The River of the Dead", kind: 'main', description: "Persuade the ferryman to carry the living across the river that no living person crosses." },
      { title: "The Throne of Dawn", kind: 'main', description: "Reach the throne where the sun was kindled and hear the truth from the one who tends it." },
      { title: "The Long Night", kind: 'main', description: "Face what the sun has been holding back, and decide what the light should burn." },
      { title: "Carry your Hearth", kind: 'side', description: "Each pilgrim carries one true thing they will not give up. Each will be tested." },
      { title: "Kael's first map", kind: 'side', description: "Kael has never left the city. Help him draw the first map of the Pilgrim's Road that is not copied from a book." },
    ],
  },

  lore: [
    { title: 'The First Hearth', tag: 'location', content: 'A vault beneath the Dawn Order\'s mother-house, a round room with a single iron brazier. A spark has burned there for nine hundred years without fuel. It is warm, pale gold and feels like the moment before someone says your name. The Order keeps it behind nine locked doors, all of which Marshal Vane unlocks in the first scene.' },
    { title: 'The Road of Lamps', tag: 'location', content: 'A city built along a single bridge three miles long, hung with ten thousand lanterns that must be lit by hand every dusk. The bridge spans a gorge of black water that no one has measured. Ysenne tends it. Every lantern was lit by someone for someone: each is engraved on the base with a name and a reason.' },
    { title: 'The River of the Dead', tag: 'location', content: 'A wide, slow, silver-black river under a sky without stars, reached by a stair at the bottom of the gorge. The far shore is lit by a light that does not reach this side. The river is cold, and the cold has a voice: those who touch it hear someone they love say their name. Obbin\'s ferry is a flat boat with a single lantern.' },
    { title: 'The Throne of Dawn', tag: 'location', content: 'A hall of pale stone at the top of a mountain that is not on any map. The throne is empty; a lantern the size of a house hangs above it, burning a little more gold than yellow and flickering. Around it stand seven lesser lamps, the court of the lesser suns, each a person made of light. Beneath the floor, something sleeps.' },
    { title: 'The Long Night', tag: 'location', content: 'The dark beneath the throne: a vast, silent plain where no light reaches, lit only by what the party brings. The floor is cold glass. Sounds travel too far. In the distance, a shape like a hill breathes very slowly.' },
    { title: 'The Dawn Order', tag: 'faction', content: 'A small order of lamp-keepers, mostly old, mostly tired, who tend the First Hearth and keep the old lamps burning. Their rule is simple: light one lamp for someone else every day. They have been losing members for decades and have never lost their faith.' },
    { title: 'The Kindled', tag: 'faction', content: 'A fanatical band of pilgrims who believe the sun can be saved by sacrifice, and who burn their own possessions, then their own memories, then their own flesh to feed it. They are led by Sister Thessaly and cannot be argued with, only heard.' },
    { title: 'The Lesser Suns', tag: 'faction', content: 'Seven minor lamps of the Throne court, each a person made of light who has been shining for a different part of the day: Dawn, Morning, Noon, Afternoon, Evening, Dusk, Night. They advise the Elder and do not agree about anything.' },
    { title: 'Dusk-wolves', tag: 'enemy', maxHp: 75, content: 'Grey wolves the size of horses that stalk the edge of the dimming, drawn by the cold. Use WINTER WOLF stats (AC 13, 75 HP) with the Undead type and vulnerability to radiant damage. Chill Howl (recharge 5-6: DC 15 Wis save or frightened for 1 round). EASY: 3. STANDARD: 5. HARD: 8 and an alpha with 130 HP.' },
    { title: 'The Kindled Zealots', tag: 'enemy', maxHp: 99, content: 'Pilgrims with burned hands and open eyes, who fight with an absolute, joyful fury. Use PRIEST stats (AC 13, 27 HP) boosted to 99 HP, or GLADIATOR stats (AC 16, 112 HP). They attack in waves. Burning Faith: when reduced to half HP they deal an extra 2d6 fire damage and take the same. EASY: 4. STANDARD: 6. HARD: 8 and Sister Thessaly.' },
    { title: 'Shades of the River', tag: 'enemy', maxHp: 67, content: 'The dead who have not yet crossed. Use WRAITH stats (AC 13, 67 HP). They do not want to fight: they want to be heard. A creature that speaks to a shade for a minute makes it friendly. EASY: 3. STANDARD: 5. HARD: 8 and a drowned commander with 120 HP.' },
    { title: 'Cassiel Duskborn, Herald of the Dimming', tag: 'boss', maxHp: 190, content: 'AC 18, 190 HP, immune to charm, fear and necrotic damage. Spells: darkness, greater invisibility, hold monster, fear, cone of cold. Attacks: Dimming Touch (+10, 4d10 necrotic). Lair actions on initiative 20: Dusk (a 30 ft area becomes magical darkness), Lullaby (a creature must succeed on a DC 18 Wis save or drops what it carries), Gloom (nonmagical light sources go out). He wants to be asked a question, not fought. EASY: 130 HP. HARD: 260 HP and 4 Dusk-wolves.' },
    { title: 'The Unlit', tag: 'boss', maxHp: 350, content: 'The thing under the Throne. AC 19, 350 HP, immune to poison and psychic, resistance to nonmagical weapons, vulnerable to radiant. Attacks: Cold Hand (+14, 6d10 cold). Lair actions: Unlight (a 60 ft sphere of darkness where only radiant light counts), Voices (DC 19 Wis save or the creature is stunned by a voice it loves), Deep Cold (all creatures take 4d6 cold). The Unlit loses a legendary action for every lit Hearth. EASY: 250 HP, 3 lit Hearths or more. HARD: 450 HP and no lit Hearths.' },
    { title: 'The Ember', tag: 'item', content: 'A spark the size of a thumb, in a glass lamp with an iron handle. Gives bright light in a 10 ft radius and dim light 20 ft beyond, never needing fuel. Warm to hold, and gets brighter when someone nearby tells the truth. It is a spark of the First Hearth, and it is not enough on its own.' },
    { title: 'The Eclipse Begins', tag: 'event', content: 'A year ago, at noon, the sun went briefly pale and returned a shade dimmer. Every morning since, the dimming has been a little deeper. At first it was beautiful; now it is frightening. Scholars call it the Long Eclipse. The Dawn Order calls it the Wick.' },
  ],

  sessions: [
    {
      title: 'Session 1, The dimming (level 11)',
      content: `GOAL: set the world, choose pilgrim roles and Hearths, meet Kael and Cassiel, and run the first crossing. The party should feel the dim world close around them, and want to go anyway.

OPEN WITH (read aloud): "It is noon, and you can read by a candle. The Dawn Order\'s mother-house is a grey stone building lit by a thousand lamps in the middle of the day. In a round room at the bottom of nine stairs, a woman in a plain coat holds a glass lamp with a spark in it, and she is looking at you the way a doctor looks at a patient who has been brave."

SCENES
1. The Ember. Marshal Vane brings the party into the First Hearth and shows them the spark. She tells them what she knows, which is not much, and what she suspects, which is a great deal.
2. Roles and Hearths. Each player chooses a pilgrim role and writes their Hearth. Vane asks each of them one question and writes down the answer.
3. Kael. A teenager with a star chart and a pack too big for him arrives and introduces himself as the Wayfinder. Vane says, "He has never been outside the city. Be gentle."
4. The road out. The party leaves the city at dusk, as the lamps are lit. On the second night, Dusk-wolves.
5. Cassiel. A tall, gentle man in grey, who has been walking the road alone, asks to join them. He asks the party what they are afraid of losing.

PUZZLE: The Three Lanterns. In the hamlet of Last Light, three lanterns hang in the inn: gold, silver and bronze. Only one holds a true flame. Their inscriptions: Gold: "The flame is in the silver lantern." Silver: "The flame is not in this lantern." Bronze: "The flame is not in the gold lantern." Exactly one of the three inscriptions is true. SOLUTION: the flame is in the gold lantern. Hints: (1) only one inscription can be true; (2) suppose the flame is in the silver, and count the true inscriptions; (3) test the gold. Skill route: Insight DC 15 on the innkeeper, who has been hiding the real lantern. A true flame in the gold lantern is the first thing the party lights.

ROLE SPOTLIGHTS: Bearer: carries the Ember through the dimming. Warden: holds the road against the wolves. Wayfinder: Kael\'s star chart gets the party through a bad night. Voice: speaks to the villagers of Last Light. Smith: tends the Ember against a cold wind. Keeper: records the first night.

ENCOUNTER: DUSK-WOLVES. EASY: 3. STANDARD: 5. HARD: 8 and an alpha.

CHARACTER BEATS: Cassiel asks each PC what they are afraid of losing. Do not let anyone hedge.

REWARDS: Level 12. Each player\'s Hearth is written on a card. The Ember is lit.

HOOK: Past the hills, a bridge of lights stretches across a gorge, so many that it looks like a second sky.`,
    },
    {
      title: 'Session 2, The road of lamps (level 12)',
      content: `GOAL: a city set piece. The party crosses the Road of Lamps, meets Ysenne, learns what it costs to light a lamp for someone else and faces the rival pilgrims. The first Hearth Trial.

OPEN WITH (read aloud): "You have never seen so many lights. A bridge three miles long, hung with ten thousand lanterns, spans a gorge too deep to see the bottom of. Each lantern has a name on its base. A very old woman, almost blind, is walking the length of the bridge with a taper, lighting them one at a time, and talking to them under her breath."

SCENES
1. Ysenne. The last Lampwright greets the party and asks each to light a lamp for someone. She does not say who.
2. Sister Thessaly. The Kindled arrive on the bridge, burning their own possessions at the lamp-posts. They ask to join the pilgrimage and are refused.
3. The lamp-bridge puzzle. A section of the bridge has gone dark. The party must relight it in the right pattern.
4. The first Hearth Trial. One PC is offered something good in exchange for their Hearth. Choose the Hearth that the story has set up best, and make the offer real.

PUZZLE: The Lamp-Bridge. Five lamps in a row, numbered 1 to 5, are in this state: lit, dark, dark, lit, dark. Pressing a lamp toggles it and its immediate neighbours. The goal is all five lit, using the fewest presses. SOLUTION: press lamp 3, then lamp 5 (two presses). Start: lit, dark, dark, lit, dark. After 3: lit, lit, lit, dark, dark. After 5: lit, lit, lit, lit, lit. Hints: (1) a press toggles three lamps, or two at an end; (2) lamp 5 is dark and only presses of 4 or 5 change it; (3) try the middle first. Skill route: Investigation DC 14.

ROLE SPOTLIGHTS: Bearer: shields the Ember in the wind over the gorge. Warden: stops the Kindled from burning the bridge. Wayfinder: finds the route through the dark section. Voice: talks Sister Thessaly down. Smith: repairs a broken lantern-chain. Keeper: records the names on the lanterns.

ENCOUNTER: THE KINDLED ZEALOTS (if Thessaly\'s band attacks). EASY: 4. STANDARD: 6. HARD: 8 and Sister Thessaly.

CHARACTER BEATS: Each player lights a lamp for someone and says who. Ysenne writes the name on the base.

REWARDS: Level 12 to 13. Ysenne as an Ally. A lamp that never goes out, the first of seven.

HOOK: At the end of the bridge a stair leads down into the gorge. Ysenne says, "That is the way to the river. You do not want to go that way, and you must."`,
    },
    {
      title: 'Session 3, The river of the dead (level 13)',
      content: `GOAL: a descent and a grief session. The party goes down to the River of the Dead, persuades the ferryman to carry the living, and meets the dead. The second Hearth Trial.

OPEN WITH (read aloud): "The river is silver and black and perfectly still. There is no wind. There is no sky. On the near shore a flat boat is tied to a stake, and in it an old man is smoking a pipe that gives off no smoke. 'You are early,' he says. 'Take your time.'"

SCENES
1. The stair. Down a long spiral into the gorge. The air gets colder and the sounds get farther away.
2. Obbin Greyfisher. The ferryman will carry the party across for a price: a story. One story from each pilgrim, told truthfully.
3. The shades. The dead gather at the shore. They do not attack; they ask to be remembered.
4. The crossing. The river speaks in the voices of people the party have lost. The ferry carries only so many.
5. The second Hearth Trial. A PC meets someone they have lost, who asks them to stay.

PUZZLE: The Ferryman\'s Load. Obbin\'s boat carries himself and one passenger at a time. The party must take a Hound, a Lamb and a basket of Reeds across the river. The Hound will eat the Lamb if left alone with it, and the Lamb will eat the Reeds if left alone with them. SOLUTION: take the Lamb across; return empty; take the Hound across; bring the Lamb back; take the Reeds across; return empty; take the Lamb across. Hints: (1) the Lamb is the problem animal, since it is in both dangers; (2) the Lamb goes first; (3) you may bring something back. Skill route: Animal Handling DC 15 to calm the Hound, which allows a shortcut of one trip.

ROLE SPOTLIGHTS: Bearer: keeps the Ember burning against the river\'s cold. Warden: stands between a shade and a PC. Wayfinder: Kael finds the far shore by the one star that is not reflected. Voice: tells the ferryman\'s story. Smith: forges a coin of memory. Keeper: remembers the name the river forgets.

ENCOUNTER: SHADES OF THE RIVER (optional). EASY: 3. STANDARD: 5. HARD: 8 and a drowned commander.

CHARACTER BEATS: Obbin asks each player to tell a story about someone they lost. Let them take their time.

REWARDS: Level 13 to 14. Obbin as an Ally. A coin that pays for one return crossing.

HOOK: On the far shore, in the dark, a light begins to grow: a mountain, and a hall at the top of it with the sun hanging inside.`,
    },
    {
      title: 'Session 4, The throne of dawn (level 14)',
      content: `GOAL: the revelation. The party reaches the Throne, meets the Lesser Suns and Aurelian, learns the truth and faces Cassiel. The third Hearth Trial.

OPEN WITH (read aloud): "A hall of pale stone as large as a valley. In the centre, a lantern the size of a house, burning gold and a little ragged. Seven small suns stand around it like courtiers. An old man in a grey coat sits on the lowest step of the throne with a trimming-knife in his hand. He looks up at you and says, 'Oh. You came all this way. I am so sorry.'"

SCENES
1. The Court of Seven Suns. The Lesser Suns each advise the Elder, and each tells the party something true and something misleading.
2. Aurelian. The Elder explains: the sun is a lamp, it is running low, and under the throne something is waking. He has been tired for a very long time.
3. Cassiel\'s question. The Herald speaks plainly: let the light go out and spare the world the pain of hoping. He is not an enemy; he is the best argument the party will ever hear against what they are doing.
4. The third Hearth Trial. Each PC is shown a vision of what their life would be if they gave up their Hearth and walked away.

PUZZLE: The Court of Suns. Three Lesser Suns, Morning, Noon and Evening, make statements about who is lying. Exactly one of them lies. Morning: "Noon is the eldest." Noon: "I am not the eldest." Evening: "Morning is lying." SOLUTION: Morning is the liar. Hints: (1) only one of the three can lie; (2) suppose Noon is lying, and count the liars; (3) suppose Evening is lying. Skill route: Insight DC 16 on Morning, who has been hiding that it already knew the truth.

ROLE SPOTLIGHTS: Bearer: holds the Ember in the presence of the Lantern. Warden: stands between the party and Cassiel\'s darkness. Wayfinder: Kael reads the Throne\'s star map and finds the Unlit\'s position. Voice: answers Cassiel. Smith: repairs the Lantern\'s wick. Keeper: reads the first inscription: "Light one for someone else."

ENCOUNTER: CASSIEL DUSKBORN (optional boss, see Lore). EASY: 130 HP. STANDARD: 190 HP. HARD: 260 HP and 4 Dusk-wolves. A fight happens only if the party attacks or Cassiel is cornered.

CHARACTER BEATS: Aurelian asks each PC: "Is it worth it?" Their answers matter in the finale.

REWARDS: Level 14 to 15. The truth. The Lantern\'s trimming-knife.

HOOK: The floor shudders. The Lantern flickers once, very hard, and goes dark for a full breath. From under the stone comes a sound like something very large waking.`,
    },
    {
      title: 'Session 5, The night awake (level 15)',
      content: `GOAL: the dark. The Unlit wakes, and the party must hold the throne until the Ember can be carried in. The fourth Hearth Trial, the hardest.

OPEN WITH (read aloud): "It comes up through the floor, not as a monster but as an absence: a cold that is not temperature, a quiet that is not silence. The Lesser Suns flicker one by one. The Lantern gutters. In the dark, someone you have lost says your name, very gently, and asks you to stop."

SCENES
1. The first breath. The Unlit wakes. Lights go out across the hall.
2. The defence. The party holds the throne while the Lesser Suns relight. Each Lesser Sun needs a Hearth to rekindle it.
3. The Unlit speaks. It speaks in the voices of people the party has lost. It asks only one thing: stop.
4. The fourth Hearth Trial. The Unlit shows a PC the one thing they most want and offers it if they let go.
5. Dividing the light. The Ember has fourteen sparks, and three beacons must be lit before dawn.

PUZZLE: Dividing the Light. The Ember\'s fourteen sparks must be shared between three beacons, Dawn, Noon and Dusk. Rules: (a) each beacon gets a different number of sparks; (b) each gets at least two; (c) the brightest beacon has exactly twice as many sparks as the dimmest. SOLUTION: 3, 5 and 6 sparks (the dimmest has 3, the brightest 6, the middle 5). Hints: (1) the brightest has double the dimmest, so try the smallest numbers; (2) the three numbers must total 14; (3) if the dimmest has 3, the brightest has 6, and the middle has 5. Skill route: Arcana DC 17 to feel the Ember\'s weight.

ROLE SPOTLIGHTS: Bearer: carries the Ember through the dark. Warden: holds the door against the Unlit\'s reach. Wayfinder: navigates by the three beacons. Voice: answers the Unlit. Smith: tends the three beacons. Keeper: remembers the names the Unlit speaks.

ENCOUNTER: THE UNLIT\'S REACH. EASY: 4 Shades and a Wraith. STANDARD: 6 Shades and 2 Wraiths. HARD: 8 Shades, 3 Wraiths and Cassiel. The Unlit itself is not fought directly until the finale.

CHARACTER BEATS: This is the emotional centre of the campaign. Whatever the Unlit offers each PC, let them answer in full.

REWARDS: Level 15 to 16. Whatever Hearths are still lit.

HOOK: Aurelian steps forward with the trimming-knife and a calm face. "I know what it costs," he says. "I want you to know I am sorry."`,
    },
    {
      title: 'Session 6, The rekindling (level 16)',
      content: `GOAL: the finale. Face the Unlit, light the Lantern, and choose what the light should burn. The strength of the light depends on how many Hearths are still lit.

OPEN WITH (read aloud): "The Long Night is a plain of black glass, lit only by what you carry. A hundred yards away something the size of a hill is waking, and it has a thousand faces, and every one is someone you have lost. It does not attack. It simply opens its hand, and every light goes out except yours."

SCENES
1. The descent. The party goes down into the dark with the Ember and as many Hearths as they have kept.
2. The Unlit. The old, patient thing speaks to each PC in a voice they love. It asks them to lie down.
3. The choice. The party must decide what to do: rekindle the Lantern (restore the sun at a cost), replace it (build a new light with their Hearths), or let it go out (and spare the world the pain of hope).
4. The rekindling. The Ember is poured into the Lantern in the order the party chooses. The dark fights back.
5. Dawn. One way or another, the sun rises, or does not.

PUZZLE: The Last Pouring. To rekindle the Lantern the Ember must be poured into the three beacons in order of how many sparks they hold, dimmest first. SOLUTION: Dawn (3 sparks), then Noon (5), then Dusk (6): the numbers from Session 5. Hints: (1) the beacons were filled in Session 5; (2) the dimmest goes first; (3) the numbers are 3, 5 and 6. Skill route: Arcana DC 19 to feel the order in the Ember, at the cost of one Hearth growing cold.

SCALING BY HEARTHS. If every PC\'s Hearth is lit, run EASY: the Unlit has 250 HP and loses a legendary action for each lit Hearth. With about half lit, run STANDARD: 350 HP. With none lit, run HARD: 450 HP and no help from the Lesser Suns.

ROLE SPOTLIGHTS: Bearer: carries the Ember into the dark. Warden: holds the line while the pouring is done. Wayfinder: finds the beacons. Voice: answers the Unlit one last time. Smith: shapes the new light. Keeper: speaks the names that cannot be forgotten.

THE ENDINGS
REKINDLE: the Ember is poured into the Lantern and the sun rises, brighter, for a generation. The Unlit sleeps again. Aurelian goes on trimming the wick.
REPLACE: the party builds a new light from their Hearths. The sun changes, warmer and smaller. Aurelian is free. The world is different and no one can say exactly how.
LET IT GO OUT: Cassiel is right. The world goes quiet. A generation of people learn to live by the light they make themselves. The Unlit sleeps, alone.

ENCOUNTER: THE UNLIT (boss, see Lore). EASY: 250 HP. STANDARD: 350 HP. HARD: 450 HP. The fight is a last resort.

CHARACTER BEATS: Ask each player what their Hearth becomes.

REWARDS: Level 17 if you wish to continue. A world that remembers you.

HOOK FOR A SEQUEL: At dawn Kael is standing on the mountain with the star chart in his hands, laughing. "It is a different sky," he says. "There are stars here I have never seen."`,
    },
  ],
}
