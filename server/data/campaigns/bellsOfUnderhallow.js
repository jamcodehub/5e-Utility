// BELLS OF UNDERHALLOW: levels 3 to 8. A village mystery with a horror engine: every midnight the thirteenth bell makes someone forgotten.

export default {
  id: 'bells-of-underhallow',
  title: 'Bells of Underhallow',
  tagline: 'Every midnight, the thirteenth bell takes someone the whole village forgets.',
  levels: '3 to 8',
  tone: 'Quiet, human horror and detective work; the dread is losing people, not being chased',
  premium: true,
  pitch: 'A hill village where the church bell rings thirteen at midnight and every night one person vanishes from everyone\'s memory, house and all. A slow-burn mystery about grief, remembering and what a community owes its dead. Each player chooses someone their character loves, and in Session 5 the bell takes one of them. Puzzles are deduction, change-ringing and an acrostic, and every session ends on a gut-turn.',

  // Battle maps made with the map generator (files in data/campaigns/maps/<id>/), and which ones each session uses.
  maps: ['underhallow','gilt-lamb','chapel','ringing-chamber','churchyard','crypt'],
  sessionMaps: [['underhallow','gilt-lamb'],['chapel','crypt'],['ringing-chamber'],['churchyard'],['underhallow','chapel'],['crypt','chapel']],

  guide: {
    story: `Underhallow is a village of three hundred souls on a hill above a river fog, famous for one thing: the bells of the Chapel of Hollow Mercy. There are twelve bells in the tower that ring the hours. At midnight there is a thirteenth, a dark bronze bell hanging by itself in the lowest chamber, and it rings once, very softly, and every night since the spring one person disappears from the memory of everyone in the village. Neighbours walk past their house and see an empty plot. Portraits show an empty chair. A name is on every tongue and then it is not.

The party arrives because of a letter. Tobias Ketch, the old bellringer of Underhallow, wrote to each of them before he died. He was a teacher, a creditor, a friend, an old comrade, whatever suits each backstory. His letters say the same thing: "Come before the thirteenth bell finds me. I will be gone from them, but you will remember." He died the night the party arrived, and no one in the village remembers writing to anyone.

THE TRUTH: eighty years ago a plague took two hundred children in a single winter. The priest who rang the bells, Aldous Pell, could not bear that they would be forgotten, and cast a thirteenth bell from the melted bronze of the dead children's burial charms. He bound their names into it. The bell kept them: the Hollow Children, a choir of ghosts who know their names so long as the bell rings. But a bell that holds memory must be fed memory. Every night it eats one living person out of the village's recollection to keep two hundred names alive. The Warden of the Bell, Mother Ysolde Pell, Aldous\'s great-granddaughter, knows. She has always known. She feeds the bell and she keeps a register of the names it takes, and she believes this is a fair trade: one stranger forgotten against two hundred children remembered.

The village has begun to notice. The bell is hungrier than it was. It used to take the old and the lonely. Now it takes the loved. Everyone feels the gaps.

THE ENDGAME has three honest outcomes: let the bell go on (the children are kept, the village slowly empties of itself), destroy the bell (the village is safe and the children truly die this time), or ring the Roll of Names: the whole village remembers the children as people, not as a debt, and the bell's hunger ends. That last one can only be done if the party has learned the name of the first person the bell took, the one Ysolde cannot remember and cannot stop mourning.`,
    currentArc: `ACT ONE, Arrival and the First Forgetting (levels 3 and 4). The party arrives in Underhallow, watches the thirteenth bell take someone, and learns the village\'s rule: if you hold something that belonged to the forgotten, you remember. Run Session 1 next.`,
    lastSession: '',
    worldNotes: `TONE AND PROMISE. This is a quiet, human horror campaign. Nobody is chasing the party with an axe; what is frightening is that someone you loved yesterday is gone and nobody else will help you look for them. Keep scenes small, domestic and specific: a kettle still warm, a child\'s drawing of someone no one can name. Let silence work. Play the villagers as people who have been grieving for months without knowing it.

NAMES AND KEEPINGS. At the start of Session 1 every player writes down one NAME (a living or dead person their character loves) and one KEEPING (an object that belonged to that person and that the character carries). If a player cannot think of one, offer: a sibling, a mentor, a child, an old rival who made them who they are. In Session 5 the bell takes one of the Names. The Keeping is the only thing that will remind the character. This is the emotional engine of the campaign: play it slowly, and do not fudge it.

THE QUIET (rules of the forgetting). At the thirteenth stroke of midnight one person is removed from the memory of everyone who lives in or within a mile of Underhallow. Their house looks abandoned, their name is unspoken, records blur. A person who holds an object that belonged to them remembers all of it. Anyone who carries a Keeping and is not in the village (for example, travelling) is also safe. The forgotten person fades from the world physically over three days: their voice goes first, then their reflection, then their shape.

BELL-HUNGER TRACK. Keep a number from 0 to 6 on a card. It starts at 2. Each time the party feeds the bell (even indirectly, by letting a night pass without resolving the cause) it rises by 1; each time they restore a memory (give someone a Keeping, tell someone a story, ring a name) it falls by 1. At 6 the bell takes two a night and Underhallow starts to break. At 0 the bell is quiet for a night and the village remembers one forgotten person.

DIFFICULTY SCALING. This is a mystery first, so combat is spare. Every encounter gives EASY, STANDARD and HARD numbers for 4 players at the listed level. Add one rank of difficulty for 5 or 6 players. If the table wants a fight and the story does not offer one, use the Faded (see Lore).

ROLE SPOTLIGHTS. Each session lists a moment for the scout, the face, the healer, the scholar, the fighter and the trickster. These are jobs, not classes.

PUZZLES. Every puzzle has a clean solution, three hints that get more generous, and a skill route so a stuck table can pay a cost rather than stall. Puzzles here are mostly deductions, so let the players talk them through aloud.

CONTENT WARNING. Child death (historical), grief, loss of loved ones, memory loss. Check with your table before Session 5.`,
    npcs: [
      { name: 'Mother Ysolde Pell', description: 'Warden of the Bell, 70, small and upright, hands always working at a red scarf that is never finished. Gentle voice, iron conviction. She knows what the bell does and has fed it for forty years, and believes it is mercy. Secret: the first person the bell took, forty years ago, was her own daughter Josephine. Ysolde has no memory of her and has never been able to stop knitting for a child she cannot recall.', characterRelation: 'She treats the party as honoured guests at first and then as a problem. If someone sits and listens to her without arguing, she tells them everything.' },
      { name: 'Tobias Ketch', description: 'The late bellringer. A big, patient man, a joker, who rang the twelve hours for fifty years. Died in the tower the night the party arrived, with a half-finished letter on the table. His ghost can be heard in the clapper of the twelfth bell on dark nights, ringing a single note over and over.', characterRelation: 'Each player decides in Session 1 how Ketch was important to their character. He will be the one who helps from beyond.' },
      { name: 'Wren', description: 'A nine-year-old ghost, the leader of the Hollow Children. Quick, cheeky, bored, endlessly curious. She does not know she is dead. She knows she is hungry for something and she knows the bell is her mother. She will not hurt anyone on purpose.', characterRelation: 'Attaches to the party member who treats her like a person. Her trust is the key to the third ending.' },
      { name: 'Doctor Marguerite Oss', description: 'The village physician, 40s, sharp and rational. She has been keeping a chart of who has disappeared and noticed the pattern before anyone: the bell takes people someone loved. She has a Keeping herself, a stethoscope that was her late husband\'s.', characterRelation: 'The party\'s first ally and the scholar-detective of the village. She will be forgotten at the end of Session 4 unless the party acts.' },
      { name: 'Hob Larrow', description: 'Innkeeper of the Gilt Lamb, a round, talkative man who has been forgetting his own jokes. Secretly he is a Remnant: he was taken once, years ago, and then put back by accident when a Keeping was returned. He remembers being gone.', characterRelation: 'Comic relief who turns out to be the key witness. He will tell the party what it is like to be forgotten if anyone thinks to ask.' },
      { name: 'Brother Caul', description: 'A young priest, 26, devout and gentle, who believes the bell is a sin and should be silenced for good. He has not been told what happens to the children if it is destroyed. He is kind to everyone and likely to do something terrible with the best of intentions.', characterRelation: 'Friendly and earnest, and a plausible ally in Sessions 2 to 4. Becomes the party\'s most dangerous rival in Session 5.' },
      { name: 'The Thirteenth Bell', description: 'A dark bronze bell the size of a wagon wheel, hung alone in the lowest chamber. When it rings the world goes soft at the edges. It does not think, but it does remember: the voices of two hundred children are woven into the sound.', characterRelation: 'It rings at midnight. Each night it asks for a name.' },
    ],
    quests: [
      { title: 'Why were we sent for?', description: 'Tobias Ketch wrote to each of you and then died. Find out what he knew, and why only your party remembers him.' },
      { title: 'Who is missing?', description: 'Every morning someone is gone from Underhallow\'s memory. Learn the rule of the forgetting and who has already been taken.' },
      { title: 'The Belfry', description: 'The thirteenth bell hangs below the twelve. Learn to ring the tower without waking it.' },
      { title: 'Wren\'s game', description: 'The Hollow Children play a game at the edge of the churchyard. Learn the rules before someone else loses.' },
      { title: 'The first name', description: 'The first person the bell took forty years ago has no register entry. Find out who she was.' },
      { title: 'What to do about the bell', description: 'Decide whether to feed it, silence it or ring it differently, and live with what follows.' },
    ],
  },

  lore: [
    { title: 'Underhallow', tag: 'location', content: 'A hill village of grey stone and slate, a single street climbing from the river to the chapel, and a fog that rises every dusk and does not clear until the bell has rung. Three hundred people. Landmarks: the Gilt Lamb (the inn with the oldest lamp), the Cooper\'s Row (a street with one house everyone walks past), Dr Oss\'s surgery, the churchyard with its low iron fence and the swings that move when no one is on them.' },
    { title: 'The Chapel of Hollow Mercy', tag: 'location', content: 'A squat grey chapel with a tall tower that holds twelve hour-bells in the belfry and a thirteenth in the crypt-chamber below. Nave: plain oak pews, a register of names on a lectern. Tower: six tuned bells (the ringing chamber), six more above. The crypt is a round stone chamber with a single high window; the thirteenth bell hangs there on a chain, and the air tastes of cold metal and rain.' },
    { title: 'The Tallow Lane house', tag: 'location', content: 'Number 9, Tallow Lane. Everyone agrees the house is empty. The garden is weeded, a kettle is warm on the stove, three cups are on the table and one chair is pulled out. Someone lives here who is not remembered: Anselm the cooper, his wife Cora and their daughter Pim. They were taken on the first night the party was in the village. If the party discovers them, Cora\'s apron holds her husband\'s ring, which is a Keeping.' },
    { title: 'The Ringing Chamber', tag: 'location', content: 'The first floor of the tower: six ropes hanging through the ceiling, painted with the weight of the bell above them, from 1 (treble) to 6 (tenor). The walls are covered in change-ringing diagrams drawn in chalk by generations of ringers. Ketch\'s notebook is on a shelf with the final change marked in red.' },
    { title: 'The Church Warden\'s House', tag: 'location', content: 'Mother Ysolde\'s home beside the chapel: neat, plain, cold. A drawer of knitting needles. A red scarf half-finished on the table, the stitches uneven, the wool unravelled and re-knitted many times. A locked box under the bed holds the Register of the Quiet, listing the names the bell has taken for eighty years.' },
    { title: 'The Hollow Children', tag: 'faction', content: 'Two hundred ghost children, bound into the thirteenth bell, who play at the edge of the churchyard in the fog. They are not malicious, but they are hungry for being remembered and they do not understand that they are dead. They speak in unison when the bell rings. They play one game: "Who\'s Missing?" They will always tell the truth in the game.' },
    { title: 'The Ringers', tag: 'faction', content: 'The six families who have rung Underhallow\'s bells for three centuries. Their number is falling: no one has joined in years. They know the bells\' patterns and keep the secret that only Ketch ever rang the thirteenth. They distrust outsiders but will help anyone who can ring a clean peal.' },
    { title: 'The Faded', tag: 'enemy', maxHp: 22, content: 'The recently forgotten, in their last day, drifting through the village as if looking for something. Use SPECTER stats (AC 12, 22 HP, incorporeal) but they do not want to hurt anyone: they want to be recognised. Calling a Faded by name (they will answer to the right one) makes them solid for an hour. EASY: 2 Faded. STANDARD: 3. HARD: 5 and one that has a Keeping and is trying to give it away.' },
    { title: 'Shadows of the Hollow Choir', tag: 'enemy', maxHp: 16, content: 'When the bell sounds, children\'s shadows detach from the walls. Use SHADOW stats (AC 12, 16 HP) with a non-lethal twist: a hit drains a memory not strength. A creature reduced to 0 Strength by a shadow forgets one small fact until the next dawn. EASY: 3 shadows. STANDARD: 5. HARD: 7 and a larger shadow (30 HP) that sings.' },
    { title: 'Mother Ysolde Pell, Warden of the Bell', tag: 'boss', maxHp: 45, content: 'If the party fights her, use MAGE stats (AC 12, 45 HP) re-skinned: she carries no spellbook but fights with the bell\'s power. Spells: shield, silvery barbs, hold person, counterspell. Special: Feed the Bell, once per fight she can erase a creature from the memory of its allies for one round (they cannot target or heal it). She does not want to fight and will stop if someone says "Josephine". EASY: 30 HP. HARD: 70 HP and the bell adds a lair action.' },
    { title: 'The Thirteenth Bell', tag: 'boss', maxHp: 120, content: 'The bell as an enemy if the party attempts to destroy it. AC 18, 120 HP, immune to poison, psychic and necrotic, resistance to nonmagical weapons. Lair actions on initiative 20: Toll (each creature makes a DC 15 Wis save or forgets what it was doing and loses its action); Hunger (the bell targets one creature: that creature must succeed on a DC 15 Cha save or an ally forgets it, becoming unable to heal or help it until the end of the next round); Echo (the Faded appear). The bell can be silenced by being rung with its clapper removed, as in the ending. EASY: 80 HP, one lair action. HARD: 160 HP, three lair actions.' },
    { title: 'Tobias Ketch\'s notebook', tag: 'item', content: 'A leather notebook that records every change rung in Underhallow for fifty years. Last page: a half-finished letter to the party and a hand-drawn diagram of the ringing chamber with a series of numbers: the answer to the Belfry puzzle, but with one wrong. Margins: notes about the forgetting. Final line: "It is always the loved who go first. Ask Hob."' },
    { title: 'The Red Scarf', tag: 'item', content: 'A child\'s scarf, half-knitted in red wool. Ysolde has unravelled and re-knitted it a hundred times. If the scarf is returned to a person who loved the forgotten girl, it works as a Keeping and restores that person\'s memory of her. If it is finished, Ysolde remembers everything.' },
    { title: 'The Night of Thirteen Strokes', tag: 'event', content: 'Eighty years ago, on the worst night of the plague winter, Aldous Pell rang the thirteenth bell for the first time. In one night two hundred children were bound into bronze. In the village, no one wept. Everyone forgot why they should. The first person the bell took (forty years ago) was not a villager: Josephine Pell, Ysolde\'s daughter.' },
  ],

  sessions: [
    {
      title: 'Session 1, Arrival and the first forgetting (level 3)',
      content: `GOAL: set the tone (quiet, specific, a little wrong), establish Names and Keepings, and let the party watch the bell take someone. End on the first piece of evidence that this is not a normal haunting.

OPEN WITH (read aloud): "The fog comes up the hill with you. At the top, a small chapel with a tall tower, and at its door a woman with a half-knitted red scarf who looks at you as if you were an overdue promise. 'You are the ones he wrote to,' she says. 'He did not tell me. He did not tell anyone. Come in out of the fog.'"

SCENES
1. The funeral. Tobias Ketch is buried at dusk. Nobody in the village remembers sending for the party but all of them are glad of company. Ask each player: how did Tobias matter to your character? Players write down a Name and a Keeping.
2. The Gilt Lamb. Hob Larrow offers a room and a lot of gossip. Dr Oss sits down across from the party and says, quietly, that she needs people who will remember things with her.
3. The thirteenth stroke. At midnight the fog thickens. Twelve bells ring the hour in the usual way, and then a thirteenth, very soft. The party hears it. In the morning someone is gone.
4. Number 9, Tallow Lane. A house everyone has forgotten. The party is the only one who notices the warm kettle.

PUZZLE: The House Nobody Lives In. Clues: three cups on the table, one chair pulled out, a child\'s boot by the door, a cooper\'s tools hung on the wall, a calendar with a circled date, a woman\'s apron on a hook holding a man\'s ring. SOLUTION: a family of three (cooper, wife and child) lived here, and they were taken on the party\'s first night; the ring is a Keeping. Hints: (1) count the cups; (2) the boot is the wrong size for a man; (3) whose apron is it, and whose ring is in its pocket? Skill route: Investigation DC 13 or Insight DC 14.

ROLE SPOTLIGHTS: Scout: notices the fog moves against the wind (Survival DC 12). Face: gets Hob to admit he has been losing his own jokes. Healer: examines Tobias\'s body and finds no wound; he died asking someone to remember him (Medicine DC 12). Scholar: reads Ketch\'s notebook and sees the pattern in the forgotten names. Fighter: protects the Faded who walks the street at dawn from a frightened mob. Trickster: opens the locked box in the Warden\'s house to find the Register of the Quiet.

ENCOUNTER: THE FADED (optional). EASY: 2. STANDARD: 3. HARD: 5. Use this if the table wants a fight; it is better as a scene.

CHARACTER BEATS: Each player says the Name and Keeping aloud at the funeral. Ysolde listens to every one.

REWARDS: Level 4. Dr Oss\'s chart of the missing. The cooper\'s ring.

HOOK: Dr Oss lays the chart on the table. The date of each disappearance. A pattern. "It is always the ones that someone loved the most," she says. "I am worried about what it takes next."`,
    },
    {
      title: 'Session 2, Who is missing? (level 4)',
      content: `GOAL: an investigation session. The party learns the rules of the Quiet, meets the villagers who half-remember, and finds the mirror-written inscription on the thirteenth bell.

OPEN WITH (read aloud): "The morning after is the worst. People wake with the particular heaviness of having left something behind and no idea what. A woman in the street keeps counting the plates she is carrying. A boy asks everyone if they have seen his sister. No one has a sister."

SCENES
1. The morning rounds. The party talks to the village. Each villager remembers a small thing they cannot explain: a song, a smell, a habit. Collect these as clues.
2. The Register. In the chapel, a register of names lies on the lectern. Names have been blotted out in dozens of hands over decades. Ysolde allows the party to look but not to read the last page.
3. Brother Caul. A young priest who is gentle and desperate. He thinks the bell is a sin. He asks the party to help him silence it, and does not mention what he suspects it holds.
4. The crypt chamber. Under a heavy door, the thirteenth bell hangs on its chain. The air is cold. A band of mirror-writing circles the bell\'s lip.

PUZZLE: The Mirror Band. Around the lip of the bell, in raised letters, runs a line of nonsense: "SREBMEMER ENO ELIHW NETTOGROF TON ERA EW". SOLUTION: read in a mirror, or backwards, it says "WE ARE NOT FORGOTTEN WHILE ONE REMEMBERS". It is the bell's own promise, and the clue that the bell can be kept quiet by remembering, not only by feeding it. Hints: (1) the letters run the wrong way; (2) hold something shiny up to them; (3) read the line from the last letter to the first. Skill route: Arcana DC 13 or Investigation DC 14.

(DM NOTE: give the players a printed handout of the reversed line. Make the reading land emotionally: whoever reads it aloud should say the words slowly.)

ROLE SPOTLIGHTS: Scout: finds the footprints of children in the damp of the crypt, and no adult tracks. Face: gets Ysolde to say one honest sentence. Healer: sits with the woman who is counting plates. Scholar: matches the register\'s blotted names to the villagers\' small memories. Fighter: stands at the crypt door when Caul tries to push through with a hammer. Trickster: sees that the clapper has been tied with a cloth for decades.

ENCOUNTER: SHADOWS OF THE HOLLOW CHOIR (optional). EASY: 3. STANDARD: 5. HARD: 7 and a singer.

CHARACTER BEATS: Ask each player what their character does if the bell takes their Name. They will remember the answer in Session 5.

REWARDS: Level 4 to 5 if the table prefers. A clean copy of the mirror inscription. The first honest sentence from Ysolde: "I would give anything to remember."

HOOK: Hob pulls the party aside. "I was gone once," he says. "I will tell you what it is like if you promise not to tell her."`,
    },
    {
      title: 'Session 3, The belfry (level 5)',
      content: `GOAL: a puzzle-forward session set in the tower. The party learns to ring the bells without waking the thirteenth, discovers Ketch\'s last message, and meets the first real threat from the Hollow Choir.

OPEN WITH (read aloud): "Six ropes hang through the ceiling, each as thick as a wrist, each painted with a number. The walls are covered in chalk: diagrams, hatch marks, names of ringers going back three hundred years. On a shelf, a notebook with the final page marked in red."

SCENES
1. The Ringing Chamber. Ketch\'s notebook records the last peal he rang before he died: the sequence that keeps the thirteenth bell quiet for a night. It is incomplete.
2. Hob\'s story. Hob explains what being forgotten feels like: the cold, the ache, the sense that the whole world is slightly out of tune. He remembers because someone returned his father\'s watch to him by accident.
3. The ringing. The party must ring the six bells in a particular order to keep the thirteenth silent. A mistake rings the thirteenth.
4. The Choir stirs. If the party errs, shadows of children rush out of the walls. The shadows do not hurt, but they take small memories.

PUZZLE: The Silent Peal. Six bells, numbered 1 (treble) to 6 (tenor), must be rung once each in a single order. Rules from Ketch\'s notebook: (a) the 2 rings first, (b) the 6 rings last, (c) no two bells whose numbers differ by one may ring next to each other, (d) the 4 rings before the 1. SOLUTION: 2, 4, 1, 5, 3, 6. Hints: (1) the 2 is first and the 6 is last, so work the middle four; (2) after the 2, the next bell cannot be 1 or 3; (3) the 4 must come before the 1. Skill route: Performance DC 14 can feel the pattern, or let Ketch\'s ghost nudge the rope. A mistake rings the thirteenth and the Choir stirs.

ROLE SPOTLIGHTS: Scout: finds the hidden hatch to the upper bells. Face: calms Brother Caul when he arrives with a hammer. Healer: treats a ringer who forgot how to ring mid-peal. Scholar: reads the chalk diagrams. Fighter: hauls on the tenor rope, which needs 14 Strength. Trickster: spots the loose bell-rope that has been replaced by a thinner one.

ENCOUNTER: SHADOWS OF THE HOLLOW CHOIR. EASY: 3. STANDARD: 5. HARD: 7 and a large singer. If the party rings correctly, no fight happens.

CHARACTER BEATS: When the peal is right, the thirteenth bell makes a sound like a held breath. Ask each player: what do you hear in it?

REWARDS: Level 5 to 6. The correct peal recorded in Ketch\'s notebook. Ysolde sees the party can ring and begins to trust them.

HOOK: A child\'s laugh from the crypt. A girl in the doorway, perhaps nine, wearing a nightgown. "Do you want to play?" she says. "It is called Who\'s Missing."`,
    },
    {
      title: 'Session 4, The Hollow Children (level 6)',
      content: `GOAL: a character-driven session. The party plays Wren\'s game, learns the Hollow Children are not monsters, and discovers the true cost of the thirteenth bell. End by losing Dr Oss.

OPEN WITH (read aloud): "They come out of the fog at the edge of the churchyard, two hundred of them in nightgowns and Sunday clothes, holding hands. They do not look at you. They look at the space beside you where someone ought to be standing. The littlest, a girl with a missing front tooth, says, 'Who\'s missing?'"

SCENES
1. The game. The Hollow Children invite the party to play Who\'s Missing. It is a memory game, played aloud at the table.
2. Wren. The girl speaks. She is not a monster; she is a person who has been dead for eighty years and plays a game every night so that someone will say her name.
3. The Warden\'s confession. Ysolde finds the party in the churchyard and, for the first time, tells the truth. She explains what the bell does and why she feeds it. She asks the party to leave.
4. Dr Oss. At midnight the bell tolls and takes Marguerite Oss. The party remembers her only if one of them carries her stethoscope, the Keeping she gave them in Session 2.

PUZZLE: Who\'s Missing? A memory game played at the table. At the start of the scene the DM reads out twelve children\'s names aloud, slowly: Aldith, Bram, Cass, Dunmore, Elsie, Fenn, Gwyneth, Hal, Ivo, Jessamy, Kit, Lark. Later in the scene the children stand in a ring and the DM reads out eleven names, leaving out Jessamy. SOLUTION: the missing name is Jessamy. The players must have kept the list. In the game, Wren always tells the truth, so she will confirm it. Hints: (1) write the names down as you hear them; (2) count the ring; (3) ask Wren, because in the game she cannot lie. Skill route: Insight DC 13 or History DC 14 lets the DM repeat the list once. Jessamy is the quietest child, and the moment the party names her, she steps out of the ring for the first time.

ROLE SPOTLIGHTS: Scout: notices that only the party\'s shadows have the sun in them. Face: persuades Wren to let the party see the bell\'s memory. Healer: comforts the youngest child. Scholar: puts together that the children\'s names are on the bell\'s inner surface. Fighter: stands between the Choir and a frightened villager. Trickster: slips Dr Oss\'s stethoscope into a pocket before midnight so she can be remembered.

ENCOUNTER: none by default. If the table wants one, SHADOWS OF THE HOLLOW CHOIR under the bell\'s hunger. EASY: 3. STANDARD: 6. HARD: 8 and a singer.

CHARACTER BEATS: Wren asks every PC the same question: "If you were forgotten, would you want someone to keep trying?" Let each answer.

REWARDS: Level 6 to 7. Wren\'s trust. Dr Oss\'s stethoscope, if kept.

HOOK: At dawn the party wakes to find the surgery empty. The chart, the kettle, the little brass plate on the door: all there, unclaimed. And a note in her handwriting that no one else remembers writing: "If you read this, the bell has taken me. Ask Hob where the Register is hidden."`,
    },
    {
      title: 'Session 5, The night everyone forgets (level 7)',
      content: `GOAL: the emotional peak. The bell takes one of the party\'s Names. Play the forgetting slowly and personally. Brother Caul turns on the party. Ysolde makes her last stand.

OPEN WITH (read aloud): "The fog is thicker tonight. The village has begun to board its windows. Somewhere in the dark a child is counting backwards from thirteen, and she has reached six."

SCENES
1. Preparing for the night. The party can use everything they have learned. Villagers help in small ways: lamps in every window, a chain of people holding hands, a song.
2. Brother Caul\'s hammer. He leads a group of villagers to the crypt to break the bell. The party must stop him or help him, and neither is clean.
3. The thirteenth stroke. The bell rings. One of the party\'s Names is taken. Choose the Name by the table\'s vote, or the one the story has treated best.
4. The morning after. The affected player crosses the Name off their sheet. They remember only their Keeping. Play this with care.

PUZZLE: The Keeping Trail. The affected character has an object they do not recognise, a note in their own handwriting they cannot read the meaning of, and a feeling they cannot explain. The other players have to help them reconstruct who they lost by comparing their own memories and clues. SOLUTION: the Keeping is a key to the memory: the affected player must say aloud what the object is and who gave it to them, and as they do, their memory returns, but only if the whole table helps. Hints: (1) ask the player what the object is; (2) ask the other players what they remember about it; (3) tell the story of how it was acquired. Skill route: Insight DC 14 or Medicine DC 13 can gently coax a memory back, once.

ROLE SPOTLIGHTS: Scout: tracks Caul\'s group through the fog. Face: talks Caul down, or breaks him. Healer: sits with the character who has lost their Name. Scholar: recognises that the bell takes the loved first because it feeds on weight. Fighter: guards the crypt door. Trickster: switches the bell\'s clapper cloth before Caul reaches it.

ENCOUNTER: BROTHER CAUL AND HIS CROWD. EASY: Caul (Priest stats, 27 HP) and 4 villagers with hammers. STANDARD: Caul and 6 villagers. HARD: Caul, 8 villagers and a shadow of the Hollow Choir. Better as a social scene than a fight.

CHARACTER BEATS: This is the emotional centre of the campaign. When the Name is taken, stop and let the player play the next scene as if the character has lost something without knowing what. Do not rush.

REWARDS: Level 7. Caul\'s hammer (the bell\'s weakness). A deeper bond with the other players.

HOOK: Ysolde stands in the doorway of the chapel with the red scarf. "I will tell you her name," she says, "if you will let me finish it."`,
    },
    {
      title: 'Session 6, The Roll of Names (level 8)',
      content: `GOAL: the finale. The party learns the name of the first person the bell took, rings the Roll of Names, and decides the fate of the thirteenth bell and the Hollow Children.

OPEN WITH (read aloud): "Midnight. The chapel is full of every person in Underhallow, shoulder to shoulder, holding lamps. The thirteenth bell hangs in its chamber above you. The Hollow Children stand along the walls, hands linked. Mother Ysolde sits on the lowest step of the tower stair with her scarf in her lap. 'It is the first one I took,' she says. 'It is the one I cannot remember. Say her name and I will.'"

SCENES
1. Ketch\'s hymn. In Ketch\'s notebook is a hymn he wrote for the thirteenth bell. Thirteen lines. The first letters of each line hold the name of the first victim.
2. The red scarf. Ysolde finishes the scarf and her memory returns. She remembers her daughter Josephine, and everything she gave up.
3. The choice. The party must decide: let the bell continue, break it, or ring the Roll of Names.
4. The ringing. If the party rings the Roll, the whole village speaks the names of the Hollow Children aloud, one by one. The bell goes quiet.

PUZZLE: The Hymn. Ketch\'s hymn has thirteen lines: "Jealous of the dark, we set the lamp. / Out on the lane the children called. / Silence came and sat among us. / Even the wind forgot their names. / Put the bronze upon the fire. / Hold them, we said, hold them all. / In the bell we cast our grief. / Never let the last one fade. / Each night the bell must eat. / Pay it with a single thing. / Every house keeps one small light. / Let the thirteenth note be hers. / Let her name be rung again." SOLUTION: read the first letter of each line downward: JOSEPHINE PELL. Hints: (1) the first lines look ordinary, but look at how each begins; (2) read the first letters downward; (3) there are thirteen lines and thirteen letters. Skill route: Investigation DC 12.

ROLE SPOTLIGHTS: Scout: gets the villagers into place without a panic. Face: speaks to Ysolde and Wren at the end. Healer: holds Ysolde\'s hand while she remembers. Scholar: finds the acrostic. Fighter: stops Caul one last time. Trickster: takes the clapper out of the bell without waking it.

THE THREE ENDINGS
FEED: the bell continues. The Hollow Children are kept; the village slowly empties of itself. Ysolde stays. A sombre, honest ending.
BREAK: the bell is destroyed with Caul\'s hammer. The Hollow Children truly die. The village is safe and a hole is left in the world that takes a generation to fill. Wren says goodbye.
RING: the party rings the Roll of Names. Two hundred names are spoken aloud by three hundred villagers, one at a time. The bell is quiet. The children are remembered as people, and the bell no longer hungers. Wren is the last to go, and her goodbye is a laugh.

ENCOUNTER: THE THIRTEENTH BELL (optional boss, see Lore). EASY: 80 HP, one lair action. STANDARD: 120 HP, two lair actions. HARD: 160 HP, three lair actions. A fight happens only if the party chooses BREAK or Caul interferes.

CHARACTER BEATS: Ask each player what name their character says aloud in the final ringing.

REWARDS: Level 9 if you wish to continue. The Keeping, and everything it stands for.

HOOK FOR A SEQUEL: Somewhere in the village, a single bell rings once, very softly, with no one touching it. And a letter arrives for the party, in Tobias Ketch\'s handwriting.`,
    },
  ],
}
