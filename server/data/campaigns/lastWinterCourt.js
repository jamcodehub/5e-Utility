// THE LAST WINTER COURT: levels 5 to 10. A fey heist with court intrigue and bargains that always have a price.

export default {
  id: 'the-last-winter-court',
  title: 'The Last Winter Court',
  tagline: 'Rob the fey court that keeps winter alive. Everything you take, you owe.',
  levels: '5 to 10',
  tone: 'Stylish heist with fey bargains, a masquerade ball and a heart that is not metaphorical',
  premium: true,
  pitch: 'A widow hires the party to steal back the years her husband sold to the Hoar Queen. The Winter Court has kept the last night of winter going for a hundred years; its vault, the Larder of Years, holds every mortal lifetime it ever bought. A proper heist in six acts: the offer, the casing, the masquerade, the vault, the betrayal and the choice. Every favour from a fey creature creates a Debt, and every Debt gets called in. Built around heist roles so every player has a job to be brilliant at.',

  // Battle maps made with the map generator (files in data/campaigns/maps/<id>/), and which ones each session uses.
  maps: ['last-embers','frozen-road','long-dusk-fair','court','pale-gardens','larder','cracking-lake'],
  sessionMaps: [['last-embers','frozen-road'],['long-dusk-fair'],['court'],['larder','pale-gardens'],['cracking-lake'],['cracking-lake','pale-gardens']],

  // The DM's shop: items to hand out, some made for this story (marked Story item).
  shop: [
    { name: "Bottled breath", qty: 3, weight: 0.5, value: "30 gp", notes: "Story item. A flask of held-in winter air. Open it to create a 10 ft radius of perfect silence for 1 round, or to whisper a message that only one named person will hear." },
    { name: "A secondhand shadow", qty: 2, weight: 0, value: "A favour", notes: "Story item. A shadow Wick has bought from someone who will not miss it. Wear it for one hour for advantage on a Stealth check. Its owner may want it back. Taking it creates a Debt." },
    { name: "Cold-iron nails", qty: 5, weight: 0.1, value: "5 gp", notes: "Story item. Pinned to a surface, a nail forces any fey within 10 ft to make a DC 14 Wisdom save or stop for a round. Using one breaks a Courtesy and raises Notice by 1." },
    { name: "Masquerade masks (set of six)", qty: 1, weight: 2, value: "60 gp", notes: "Story item. Each is different: a fox, a heron, a moth, a stag, a crow and a blank. Advantage on Deception checks to pass as a courtier. Each mask has one flaw the Court will notice." },
    { name: "Forged Midwinter invitation", qty: 3, weight: 0, value: "50 gp", notes: "Story item. Passes a quick look at the gate. Withstands Master Thistlewick for one question; a second question raises Notice by 1." },
    { name: "Frost-wine flask", qty: 3, weight: 1, value: "25 gp", notes: "Story item. Gives resistance to cold damage for 1 hour. Accepted from a fey, it also creates a Debt; bought at the Fair, it does not, but the stallholder will remember." },
    { name: "Loaf of moonlight", qty: 3, weight: 1, value: "10 gp", notes: "Story item. Feeds a character for a day, never spoils. Mortals who eat it dream of the Court for a week and wake up cold." },
    { name: "Winter coat (Cold Anvil make)", qty: 4, weight: 6, value: "5 gp", notes: "Heavy wool. Advantage on saves against cold weather. Ilse's village makes them and will give the party one each." },
    { name: "Ilse's notes on the Courtesies", qty: 1, weight: 0, value: "Priceless", notes: "Story item. Seventeen years of notes in a widow's neat hand. Gives advantage on History checks about fey etiquette, and the answers to the Session 1 test." },
    { name: "Ring of Larder keys", qty: 1, weight: 1, value: "Priceless", notes: "Story item. Lifted from a servant in Session 3. Opens the service door to the Larder stair. Any Knight of the Hoar Guard will recognise it." },
    { name: "Corvin's jar", qty: 1, weight: 2, value: "Priceless", notes: "Story item. A sealed jar of glowing amber with Corvin Harrowgate's name on the lid: forty years. Break the seal beside him to free him." },
    { name: "The jar of black ice", qty: 1, weight: 1, value: "Priceless", notes: "Story item. Metal sticks to it. A single snowflake that does not melt: the last day of winter. Do not hand this out before Session 4." },
    { name: "Potion of healing", qty: 3, weight: 0.5, value: "50 gp", notes: "Restores 2d4+2 hit points. The Fair sells them as 'bottled warmth' for twice the price." },
  ],

  guide: {
    story: `Across the frozen lake of Hollin-Vael it is always the last night of winter. The Winter Court has held that night for a hundred years by the will of the Hoar Queen Orsolya, who cannot bear to let it end. Her palace sits in the middle of the ice; its dancers do not tire, its candles do not gutter, and its servants do not age. Mortals who cross the lake are offered bargains: a harvest, a cure, a child. The Court collects its price in years, and keeps them in sealed jars in the Larder of Years, the deepest cellar of the palace.

Ilse Harrowgate, a widow from the village of Cold Anvil, hires the party. Seventeen years ago her husband Corvin sold forty years of his life to the Court for a harvest that saved the village. He was taken in the middle of the night, and in the Court he stands now, a living statue in the Pale Gardens, hearing but unable to speak. She wants one jar: the one labelled with his name. She will pay everything she has, which is not much and is all of it.

THE TRUTH: the Larder does not only hold lifetimes. At the heart of the vault, in a jar of black ice, is the Queen\'s own last day of winter, the day she has refused to let end. It is her heart. If it is broken, spring comes and the Court melts, and so do the fey who cannot live without winter. The Queen was once a mortal girl who traded away the rest of her life to keep a single night from ending (the night her son was born). She has been living that night for a hundred years, because the morning after was the day she was supposed to die.

Her son, Prince Thaw, wants it to end. He is the leader of a quiet faction in the Court that wants spring, and he will help the party if they bring him the black jar.

THE CHOICE: steal Corvin\'s jar and slip out (Ilse gets her husband back, the Court goes on), steal the black jar and break it (spring comes; the Court dies; every mortal bargain is void, which frees many people and kills a few fey friends), or find a third way: ask the Queen for the morning, and give her a reason to let it come.`,
    currentArc: `ACT ONE, The Offer (level 5). The party takes the job, learns the Courtesies, and builds their crew. Run Session 1 next.`,
    lastSession: '',
    worldNotes: `TONE AND PROMISE. A heist film in a fairy tale. Everything is elegant, everything is dangerous, and every fey creature is polite right up until it is not. The best heist moments are the ones the players plan, so give them room to plan. Always ask: "How are you doing that?" and let them describe the plan before they roll.

HEIST ROLES. At the start of Session 1 every player picks a role: FACE (talks), MASTERMIND (plans and watches), INFILTRATOR (sneaks), MUSCLE (carries and fights), TINKER (locks, traps, devices) or WILDCARD (magic and surprises). Two players can share a role. Each session lists a moment for each of them.

THE COURTESIES (rules of the fey). In the Winter Court: (1) never say thank you, it is an admission of debt; (2) never refuse a gift, it is an insult; (3) never give your true name; (4) never lie outright, the fey cannot and find it vulgar; (5) cold iron is rude. Breaking a Courtesy gives the Court a hold on you. Use the NOTICE track below.

NOTICE TRACK. Keep a number from 0 to 6 on a card. It starts at 0. It rises by 1 whenever the party breaks a Courtesy, fails a social check publicly, or leaves a clear trail. At 3 the guards start asking questions. At 5 the Queen herself takes an interest. At 6 the Court closes its doors and the heist becomes an escape. Notice falls by 1 when the party creates a convincing distraction.

DEBTS. Every favour from a fey creature creates a Debt. At the end of the campaign each Debt is called in: it can be paid in a small, specific, true thing (a name, a shadow, a laugh, a first sight of something). Keep a list of Debts on a card and read it aloud in Session 6. The best part of a Debt is deciding what to pay.

DIFFICULTY SCALING. Every encounter gives EASY, STANDARD and HARD numbers for 4 players at the listed level. Add one rank for 5 or 6 players. If a heist plan goes wrong, let it go wrong in an interesting way instead of a fatal one.

PUZZLES. Every puzzle has a clean solution, three hints and a skill route. Puzzles here are logic problems tied to the Court\'s rules, so they work best when the players argue over them.`,
    npcs: [
      { name: 'Ilse Harrowgate', description: 'A widow from Cold Anvil, 52, farmer\'s hands and a lawyer\'s patience. She has spent seventeen years learning every rule of the Court and has never been able to enter it. She does not cry in public and does not forgive easily.', characterRelation: 'Hires the party. She will offer everything she has. By the end, she is the one who decides what the party owes her.' },
      { name: 'Queen Orsolya, the Hoar Queen', description: 'Ruler of the Winter Court. Tall, grave, unhurried. Her smile is almost kind. She was a mortal girl once, and she has not slept in a hundred years. She is the most dangerous person in any room and the least cruel.', characterRelation: 'She is fascinated by clever mortals. If the party impress her she offers them a bargain.' },
      { name: 'Corvin Harrowgate (the Pale Man)', description: 'Ilse\'s husband, standing in the Pale Gardens as a living statue of frosted marble. He can hear and see everything around him. He cannot speak, but his eyes track people he trusts.', characterRelation: 'When the party finds him, he communicates by moving his hand one finger at a time. He has been listening to the Court for seventeen years and knows its secrets.' },
      { name: 'Wick the Lamplighter', description: 'A fey thief and informant, small, quick-witted, lit from within like a candle. Works for whoever pays best. Loves clever plans and hates being owed. His price for help is always a shadow, which he collects.', characterRelation: 'The party\'s first fey crew member. He is fun, treacherous and honest about both.' },
      { name: 'Master Aubergine Thistlewick', description: 'The Court\'s Master of Etiquette. A round, joyful stickler for protocol. Cannot lie. Can only enforce rules exactly as written, and delights in loopholes. Loves a clever mortal.', characterRelation: 'The first obstacle at the gate. If the party respects the rules, he becomes an unexpected ally.' },
      { name: 'Lady Sable', description: 'A courtier and rival thief, elegant and amused. She is also after the Larder, for her own reasons: she wants a lifetime she sold in her youth.', characterRelation: 'A rival in Session 3, an ally of convenience in Session 4 and the one who betrays the party in Session 5 unless they have treated her fairly.' },
      { name: 'Captain Rime Vael', description: 'Captain of the Hoar Guard. A scar across a face made of ice, absolute loyalty, no sense of humour. Genuinely wants to protect the Queen and sees the mortals as thieves.', characterRelation: 'The physical threat. He will not take bribes and cannot be tricked, but he can be shown something he did not know.' },
      { name: 'Prince Thaw', description: 'The Queen\'s son, eternally nineteen, tired of the Court. He has a quiet faction that wants spring. Warm for a fey, cautious for a prince, hopeful in a way that costs him something every day.', characterRelation: 'The party\'s secret ally at the heart of the Court. If they bring him the black jar, he gives them what they need.' },
    ],
    quests: [
      { title: "Corvin's jar", kind: 'main', description: "Steal the one jar in the Larder of Years labelled with Corvin Harrowgate's name, and free him from the Pale Gardens." },
      { title: "Learn the Courtesies", kind: 'main', description: "Study the rules of the Winter Court well enough to walk through its gate without giving the Court a hold on you." },
      { title: "Build the crew", kind: 'main', description: "Recruit the specialists the job needs: a thief who knows the palace, a forger of invitations, a fey who can walk through ice. Each has a price." },
      { title: "The Masquerade", kind: 'main', description: "Attend the Midwinter Ball in disguise, map the palace and find the way to the Larder." },
      { title: "The three locks", kind: 'main', description: "Open the three locks of the Larder of Years: frost, name and measure." },
      { title: "What the Queen keeps", kind: 'main', description: "Find out what is in the black jar at the heart of the vault, and decide what to do with it." },
      { title: "Lady Sable's offer", kind: 'side', description: "A rival thief wants the Larder too, and has a lifetime of her own to buy back. Decide whether to trust her." },
      { title: "A shadow for Wick", kind: 'side', description: "Every favour from a fey creature creates a Debt. Keep a list, and decide in advance what you are willing to pay." },
    ],
  },

  lore: [
    { title: 'The Inn of Last Embers', tag: 'location', content: 'The party\'s base, a lakeside inn at the edge of the ice, run by a one-eyed innkeeper called Brae. The last warm hearth for forty miles. Rooms smell of woodsmoke and wet wool. The back room has a table with a map of the Court laid out in spilled salt. Ilse waits here.' },
    { title: 'The Frozen Road', tag: 'location', content: 'A road of black ice across the lake, marked with iron lamp-posts that do not burn. Travelling it takes a day and a night, and you must follow the Courtesies as you go: do not step off, do not answer when your name is called, do not look back at the shore. Hazards: thin ice (DC 13 Dex save or fall in, 2d6 cold), the Whispering (DC 12 Wis save or answer a voice and gain a Debt).' },
    { title: 'The Long Dusk Fair', tag: 'location', content: 'A market beneath the palace walls, open from dusk to dusk. Stalls sell everything: warm songs, bottled breath, loaves of moonlight, secondhand shadows. This is where the party learns the rules, finds crew and gathers intelligence. Every stallholder tells the truth, and every truth is chosen.' },
    { title: 'The Court of Hollin-Vael', tag: 'location', content: 'A palace of white stone and black ice that seems to be made of frozen music. Great hall for the Ball, long corridors of mirrors that show other seasons, the Pale Gardens of statues, and a staircase of nine hundred steps that leads down to the Larder. The air smells of snow and candlewax.' },
    { title: 'The Pale Gardens', tag: 'location', content: 'A formal garden of statues, each a living mortal who sold something to the Court and has been frozen mid-gesture. Paths of frost, hedges of ice, a fountain that runs backwards. Corvin stands at the far end beside a bench. The statues can hear.' },
    { title: 'The Larder of Years', tag: 'location', content: 'The deepest cellar: a hall of shelves rising into darkness, each shelf holding rows of sealed jars. Every jar glows faintly with a lifetime. Three locks guard the inner door: a lock of frost, a lock of names and a lock of measure. At the far end, beyond the third door, hangs a single jar of black ice.' },
    { title: 'The Hoar Court', tag: 'faction', content: 'The nobility and servants of the Winter Court, a hundred souls in white and silver who have not seen spring in a century. They are not cruel, but they are bound by rules older than any of them. Most want the Queen to stay as she is, because they cannot remember being anything else.' },
    { title: 'The Thaw', tag: 'faction', content: 'A quiet circle of courtiers, servants and one prince who want spring to come. They meet in the kitchens and the laundry. They have been planning for decades and have never found anyone who could get to the vault. Led in secret by Prince Thaw.' },
    { title: 'The Lamplighters', tag: 'faction', content: 'A guild of fey thieves, spies and fixers, headquartered in the Fair. They take payment in shadows, names and favours. Every lamplighter carries a small light and is loyal to whoever has the most interesting offer. Wick is their best.' },
    { title: 'Rime Hounds', tag: 'enemy', maxHp: 37, content: 'Pale, long-legged hounds with frost-white fur and breath like winter. Use WINTER WOLF stats (AC 13, 37 HP) with Frost Breath (recharge 5-6, 15 ft cone, DC 12 Con save, 4d8 cold). They hunt in packs along the Frozen Road. EASY: 2 hounds. STANDARD: 3. HARD: 5 and an alpha with 60 HP.' },
    { title: 'Hoarfrost Knights', tag: 'enemy', maxHp: 52, content: 'Guards of the Court in armour of living ice, who do not tire. Use KNIGHT stats (AC 18, 52 HP), reskinned: Frost Lance (+5, 2d8+3 cold). Immune to cold, vulnerable to fire. They never leave a post. EASY: 2 knights. STANDARD: 3. HARD: 5 and Captain Vael.' },
    { title: 'Ice Mimics', tag: 'enemy', maxHp: 58, content: 'Courtiers\' reflections that have learned to step out of mirrors. Use MIMIC stats (AC 12, 58 HP), reskinned as silver-eyed doubles of the party members. They copy actions and attempt to swap places. EASY: 1. STANDARD: 2. HARD: 3 and one that is a perfect double of a player character.' },
    { title: 'Captain Rime Vael', tag: 'boss', maxHp: 110, content: 'Captain of the Hoar Guard. AC 18, 110 HP, immune to cold and charm. Attacks: Icebrand Greatsword +9 (2d6+5 slashing plus 2d6 cold), twice per turn. Frozen Command (bonus action): one ally within 30 ft gains temporary hit points equal to 10 and moves up to 15 ft. Hoarfrost Aura: creatures within 10 ft have disadvantage on Dexterity saves. EASY: 80 HP, one attack. HARD: 150 HP and two Hoarfrost Knights.' },
    { title: 'Queen Orsolya, the Hoar Queen', tag: 'boss', maxHp: 165, content: 'Use ARCHMAGE stats (AC 17, 165 HP) re-skinned. Spells: cone of cold, wall of ice, hold monster, dominate person, time stop (once). She does not want to fight. She stops if someone offers her morning. Legendary action: Winter\'s Stillness (a creature within 30 ft must succeed on a DC 17 Wis save or be frozen in place for 1 round). EASY: 110 HP, no legendary action. HARD: 220 HP and the Hoarfrost Knights.' },
    { title: 'The Jar of Black Ice', tag: 'item', content: 'A small jar of black ice, cold enough that metal sticks to it. Inside, a single snowflake that does not melt: the last day of winter. If it breaks, spring comes. If it is kept, the Court survives. If it is returned to the Queen with an apology, she may let it go.' },
    { title: 'The Bargain of the Harvest', tag: 'event', content: 'Seventeen years ago, on a night of black frost, the village of Cold Anvil lost its harvest. Corvin Harrowgate crossed the lake and made a bargain with the Hoar Queen: forty years of his life for a full barn. The next morning the barn was full, and he was gone. The village remembers him as a hero; Ilse remembers him as a husband.' },
  ],

  sessions: [
    {
      title: 'Session 1, The offer (level 5)',
      content: `GOAL: set up the job, choose heist roles, teach the Courtesies and recruit the first crew member. Make the players feel clever before anything goes wrong.

OPEN WITH (read aloud): "The Inn of Last Embers is the last warm place at the edge of the world. Beyond its door the frozen lake of Hollin-Vael stretches to a horizon of black ice and a faint glow like a city under glass. A woman in a patched coat is waiting at the table in the back. She has already set out five cups."

SCENES
1. Ilse\'s offer. She explains the job: one jar, one husband. She offers everything she has: a deed, a ring, a sum of money. She also gives the party a stack of notes in her handwriting: the Courtesies. Each player chooses a heist role.
2. Learning the rules. Brae the innkeeper has seen many people cross the lake and few return. He teaches the Courtesies, with stories.
3. The crew. Wick the Lamplighter appears at the window, offering his services. His price is a shadow. The party can negotiate.
4. The crossing. At dusk the party crosses the Frozen Road. Rime Hounds hunt along the way.

PUZZLE: The Courtesy Test. Brae runs the party through five scenarios. Which of these breaks a Courtesy? (a) Accepting a cup of wine and drinking it. (b) Thanking the host for the wine. (c) Telling the host you are a merchant from the south. (d) Saying you will not drink. (e) Giving your true name. SOLUTION: (b), (d) and (e) break a Courtesy; (a) and (c) do not, provided (c) is true. Hints: (1) which of these are admissions of debt? (2) which refuses a gift? (3) which gives something away? Skill route: Insight DC 12 or History DC 13 lets a player recall the rule.

ROLE SPOTLIGHTS: Face: negotiates Wick\'s price down from a shadow to a laugh. Mastermind: spots that the Frozen Road has a path with fewer lamp-posts. Infiltrator: scouts the shoreline. Muscle: carries Ilse\'s gear across the ice. Tinker: examines the iron lamp-posts and finds they are part of a ward. Wildcard: reads the Whispering and does not answer.

ENCOUNTER: RIME HOUNDS on the Frozen Road. EASY: 2 hounds. STANDARD: 3. HARD: 5 and an alpha.

CHARACTER BEATS: Ilse asks the party why they took the job. Their answers matter later.

REWARDS: Level 6. Ilse\'s notes. A Debt to Wick if the party takes his help.

HOOK: Across the ice, the lights of the palace come on, one by one, though no one has lit them.`,
    },
    {
      title: 'Session 2, Casing the court (level 6)',
      content: `GOAL: a planning-and-intelligence session at the Long Dusk Fair. The party gathers three pieces of intelligence, solves the Seating Puzzle and chooses an entry plan.

OPEN WITH (read aloud): "The Long Dusk Fair is the loudest place you have ever been, and not one voice is raised. Stalls of silver and glass sell warm songs and bottled breath. A man with a lantern for a head sells shadows by the yard. A woman with a mouthful of thorns says the price of a name is whatever you would miss least."

SCENES
1. Stalls and favours. The party tours the Fair. Each stall offers one useful piece of information in exchange for a small price.
2. Master Thistlewick at the gate. The Master of Etiquette checks invitations and tests every guest\'s manners. He is delighted by a clever answer.
3. The seating chart. To get an invitation, the party must forge a seat at the Midwinter Ball.
4. Plan the heist. Players choose entry, vault route and escape plan. The DM makes notes of every detail; the plan will be tested.

PUZZLE: The Seating Chart. Five guests must be seated in a row of five chairs at the Ball: Lord Rime, Lady Sable, Duke Thorn, Master Thistlewick and Prince Thaw. The rules, from Thistlewick himself: (a) the Prince sits at one end. (b) Lady Sable sits next to the Prince. (c) Lord Rime does not sit next to the Prince. (d) Master Thistlewick sits between Duke Thorn and Lord Rime. (e) Duke Thorn sits next to Lady Sable. SOLUTION: Prince Thaw, Lady Sable, Duke Thorn, Master Thistlewick, Lord Rime (or the mirror image). Hints: (1) the Prince is at an end; (2) Sable must be next to him, and so must Thorn be next to Sable; (3) Thistlewick has Thorn and Rime on either side. Skill route: Deception DC 15 to bluff a different seat, but this raises Notice by 1.

ROLE SPOTLIGHTS: Face: wins Thistlewick over with a flawless formal bow. Mastermind: maps the palace from three stalls\' stories. Infiltrator: lifts a guest invitation without being noticed. Muscle: wins a wager at the strength stall for a Debt-free favour. Tinker: reads the palace\'s heating ducts. Wildcard: traps a lamplighter\'s shadow in a jar.

ENCOUNTER: none by default. If a Courtesy is broken, use HOARFROST KNIGHTS at the gate. EASY: 2. STANDARD: 3. HARD: 5.

CHARACTER BEATS: Each player says their disguise and its one weakness.

REWARDS: Level 6 to 7. Three forged invitations. A map of the palace\'s service corridors.

HOOK: A note arrives, slid under the party\'s door. "I know what you want," it says. "I want the same. Tonight, at the third bell. L.S."`,
    },
    {
      title: 'Session 3, The masquerade (level 7)',
      content: `GOAL: the social set piece. The party attends the Midwinter Ball in disguise, gathers the last intelligence, finds the way to the Larder and meets the Queen. A masked-spy puzzle and a dance challenge.

OPEN WITH (read aloud): "Midwinter at the Court of Hollin-Vael. A thousand candles, none dripping. A hall of white stone, the ceiling lost in snow. Musicians play with their eyes closed. Everyone is masked and everyone is smiling. At the far end, on a throne the colour of a winter sky, the Hoar Queen watches the dancers with a patience that is almost kind."

SCENES
1. Arrival. The party presents their invitations to Master Thistlewick. Any faux pas raises Notice.
2. Lady Sable. The rival thief approaches with an offer: help each other get into the Larder and split what is inside.
3. The dance. A skill challenge in which the party dances through the ball while gathering information. Each dance has a purpose.
4. The spy. A mortal spy in the Queen\'s hall may sabotage the party. The party must identify her before she identifies them.
5. The Queen. Orsolya invites one of the party to dance. This is a conversation as much as a dance.

PUZZLE: The Masked Mortal. Four masked courtiers stand in a ring: Fox, Heron, Moth and Stag. Exactly one of them is a mortal in disguise. Fey creatures can only say true things; the mortal may lie. They speak: Fox: "The Stag is fey." Heron: "The Moth is mortal." Moth: "The Fox is fey." Stag: "The Heron is not fey." SOLUTION: the Heron is the mortal. Hints: (1) the fey cannot lie, so test each statement; (2) assume the Fox is the mortal and see what breaks; (3) if the Heron is the mortal, check whether the other three can all be telling the truth. Skill route: Insight DC 15 on the Heron shows the lie in her tone.

ROLE SPOTLIGHTS: Face: dances with the Queen without breaking a Courtesy. Mastermind: spots the exit to the Larder staircase behind the tapestry. Infiltrator: lifts the Larder\'s ring of keys from a distracted servant. Muscle: carries a collapsed courtier out of the ballroom, a perfect distraction. Tinker: sabotages the chandelier\'s counterweights. Wildcard: casts a minor illusion of a second Queen.

ENCOUNTER: ICE MIMICS (if the party fails the spy puzzle or the Queen dances with the wrong person). EASY: 1. STANDARD: 2. HARD: 3 and a perfect double.

CHARACTER BEATS: The Queen asks one of the party what they would give to keep the best night of their life from ending. Let the player answer honestly.

REWARDS: Level 7 to 8. The ring of keys. A Debt to the Queen if they accept her gift.

HOOK: As the music stops, Prince Thaw steps out of a doorway and says quietly, "Come with me before the third bell. I know the way down."`,
    },
    {
      title: 'Session 4, The Larder of Years (level 8)',
      content: `GOAL: the heist itself. The party descends nine hundred steps to the Larder, opens three locks and finds Corvin\'s jar and the black jar. Every earlier plan gets tested.

OPEN WITH (read aloud): "Nine hundred steps spiral down into the dark. The walls sweat frost. At the bottom, a hall of shelves rises beyond sight, each shelf holding rows of glowing jars, and in each jar a lifetime, still warm."

SCENES
1. The descent. The staircase is trapped. A skill challenge uses every role.
2. The first lock: Frost. A door of ice that must be thawed without melting it entirely.
3. The second lock: Names. A door that opens only to the name of someone not present. The party can choose the name, but the door remembers.
4. The third lock: Measure. A door that wants exactly four measures of cold light, poured from two jars.
5. The black jar. At the heart of the Larder, beyond the third door, hangs a single jar of black ice.

PUZZLE: The Measure of Cold Light. Two vessels stand by the third door: a 3-measure jar and a 5-measure jar, and a well of cold light. The door wants exactly 4 measures in the 5-measure jar. SOLUTION: fill the 5, pour into the 3 (leaving 2 in the 5), empty the 3, pour the 2 from the 5 into the 3, fill the 5 again, and top up the 3 from the 5 (it needs 1), leaving exactly 4 in the 5. Hints: (1) you can only measure by filling, emptying and pouring; (2) first make 2; (3) with 2 in the small jar, fill the large one and top up. Skill route: Arcana DC 15 or Sleight of Hand DC 16 can shave the measure, but the door notices and Notice rises by 1.

ROLE SPOTLIGHTS: Face: talks the Larder\'s guardian spirit into looking the other way. Mastermind: times the guard rotation. Infiltrator: finds Corvin\'s jar on a shelf of thousands. Muscle: holds the door of ice against the thaw. Tinker: bypasses the lock of frost with a heated wire. Wildcard: shields the party from the Larder\'s cold.

ENCOUNTER: HOARFROST KNIGHTS and ICE MIMICS in the vault. EASY: 2 knights. STANDARD: 3 knights and 1 mimic. HARD: 5 knights and 2 mimics. A good plan lets the party avoid most of this.

CHARACTER BEATS: When the party finds Corvin\'s jar, ask each player what they would do if it were their own lifetime.

REWARDS: Level 8 to 9. Corvin\'s jar. The black jar if they take it.

HOOK: Behind them, the stairs echo with footsteps. Lady Sable steps out of the shadows holding a knife and a smile. "You were very good," she says. "Thank you."`,
    },
    {
      title: 'Session 5, The betrayal and the lake (level 9)',
      content: `GOAL: an escape set piece. Lady Sable\'s betrayal, Captain Vael\'s pursuit and a chase across a lake that cracks beneath the party\'s feet. Close with the Queen\'s arrival.

OPEN WITH (read aloud): "The ice groans. All across the lake, as far as you can see, hairline cracks run through the black. Behind you, the palace is lit from every window. The Hoarfrost Knights pour out of the gate in a long white line."

SCENES
1. Sable\'s betrayal. The thief seizes Corvin\'s jar (or the black one) and runs. The party can chase or let her go.
2. The pursuit. Captain Vael leads the Hoar Guard across the ice. The party runs.
3. The cracking lake. A skill challenge: each round the ice breaks in a new pattern.
4. The Queen on the ice. Orsolya walks across the lake in a column of falling snow and asks the party, politely, to stop.
5. The confrontation. The party can fight, flee, bargain or tell her what they know.

PUZZLE: The Cracking Ice. Seven ice floes, A through G, lie between the party (on A) and the far shore (G). The ice shows which floes touch: A touches B and C; B touches A and D; C touches A and E; D touches B and F; E touches C and F; F touches D, E and G; G touches F. The Hoarfrost Knights stand on floes B and D, so the party cannot use them. SOLUTION: A, C, E, F, G. Hints: (1) G can only be reached from F; (2) F can be reached from D or E, and D is held by the knights; (3) E can only be reached from C, and C from A. Skill route: Survival DC 14 reads the cracking pattern.

ROLE SPOTLIGHTS: Face: stalls the Queen for one vital round. Mastermind: calls the route. Infiltrator: retrieves the jar from Sable. Muscle: carries a collapsing ally across a floe. Tinker: improvises a bridge from the sled. Wildcard: freezes the water briefly with a spell.

ENCOUNTER: CAPTAIN RIME VAEL and the Hoar Guard. EASY: Vael (80 HP, one attack) and 2 knights. STANDARD: Vael and 3 knights. HARD: Vael (150 HP) and 5 knights. Terrain: each round, one 10 ft square of ice breaks (DC 14 Dex save or fall into freezing water, 2d6 cold).

CHARACTER BEATS: Ilse arrives on the shore. Ask each player what they say to her.

REWARDS: Level 9 to 10. A clear view of what the Queen wants.

HOOK: The Queen holds out her hand. "Give me what you took," she says. "I will not hurt you. I will only ask you something."`,
    },
    {
      title: 'Session 6, The last day (level 10)',
      content: `GOAL: the finale. The party faces the Queen, the black jar and the choice, and pays every Debt. A quiet, emotional end to a heist that was never really about the jar.

OPEN WITH (read aloud): "The Queen sits on the ice in a chair of falling snow. She does not look like a ruler. She looks like a woman who has been awake for a hundred years. In her hands, as lightly as a cup of tea, she holds the jar of black ice. 'I have kept this night,' she says, 'because tomorrow I was supposed to die.'"

SCENES
1. The Queen\'s story. Orsolya tells the party the truth: a mortal girl, a night, a son. She is tired. She does not know how to stop.
2. Prince Thaw. He steps out of the crowd and asks his mother to let go. He does not push her.
3. The choice. The party decides whether to steal Corvin\'s jar, break the black jar, or ask the Queen for morning.
4. The Debts. Every Debt is called in. Each player chooses what to pay.

PUZZLE: The Queen\'s Question. The Queen asks the party a question: "What would you give to keep the best night of your life from ending?" This is not a riddle with an answer, but a conversation. SOLUTION: the answer that moves her is the honest one: that you would give anything, and that you would regret it. A player who says something true to her gives her what she needs to let go. Hints: (1) she cannot lie, and values honesty; (2) the Prince has been waiting for a reason; (3) Ilse can say what she lost. Skill route: Persuasion DC 18, or Insight DC 16 to know what she wants to hear.

THE THREE ENDINGS
STEAL: the party takes Corvin\'s jar and leaves. Corvin is freed. The Court goes on. Ilse is happy and the party knows they could have done more.
BREAK: the black jar breaks and spring comes in a breath. The Court melts. Many bargains are void, many fey friends die. The village of Cold Anvil sees a green morning for the first time in a century.
MORNING: the Queen lets the last day end. She lives one more morning, and dies in the sun with her son beside her. The Court becomes a summer court. Every mortal is freed. Everyone pays.

ENCOUNTER: QUEEN ORSOLYA (optional boss, see Lore). EASY: 110 HP, no legendary action. STANDARD: 165 HP. HARD: 220 HP and the Hoarfrost Knights. A fight happens only if the party breaks the jar against her will or the Queen chooses to resist.

ROLE SPOTLIGHTS: Face: speaks to the Queen. Mastermind: foresees the consequences of each ending. Infiltrator: gets Corvin\'s jar out under the Queen\'s nose. Muscle: shields the Prince. Tinker: opens the black jar without breaking it. Wildcard: holds the thaw back long enough for the Queen to speak.

CHARACTER BEATS: Read the list of Debts aloud and ask each player what they pay.

REWARDS: Level 11 if you wish to continue. Ilse\'s gratitude. A Debt cleared is a gift.

HOOK FOR A SEQUEL: Whichever ending they choose, a letter arrives for the party sealed with green wax. The Summer Court has heard what they did.`,
    },
  ],
}
