import type { AdventureText } from '../types'

/** « La Flamme sous la montagne » en anglais (`lib/autoGm/dragonCampaign.ts`). */

const ACT1 = 'Act I · Mistvale'
const ACT2 = 'Act II · The Royal City'
const ACT3 = 'Act III · The Wildlands'
const FINAL = 'Finale · Ashpeak'

export const DRAGON_CAMPAIGN_EN: AdventureText = {
  title: 'The Flame Beneath the Mountain',
  pitch:
    "A complete campaign in three acts and a finale: from the goblins of Mistvale to the red dragon's lair. Three roads, random encounters, five possible endings.",
  scenes: {
    taverne: {
      title: 'The Golden Boar',
      chapter: ACT1,
      narration: [
        'The kingdom of Aurelion, blue and gold, sleeps beneath the lion banner. On the horizon, the mountain of Ashpeak smokes gently, as it has for a thousand years.',
        'Chance has brought you together at the Golden Boar, the tavern of the village of Mistvale. The fire crackles, the soup is hot… and the room is strangely empty.',
        'The door flies open. The mayor, out of breath, looks around for anyone carrying a weapon. He finds you.',
      ],
      gmNotes:
        "The campaign's common thread: the cult of the Eye in the Flame, hidden all the way up to the king's court, wants to wake Pyraxis, the red dragon sleeping beneath Ashpeak, with the help of a vampire lord. The goblins and bandits of Act I are paid by the cult to empty the roads.",
      show: 'The kingdom of Aurelion',
      label: 'Listen to the mayor',
    },
    place: {
      title: 'The village square',
      chapter: ACT1,
      narration: [
        '"Goblins!" The mayor mops his brow. "They raid the farms at night, and on the south road, bandits attack every cart. Not a single merchant dares come anymore."',
        'A farmer steps forward, her voice shaking: "The ones who burned my barn had a strange sign painted on their shields. An eye… in a flame."',
        'The mayor hands you a purse: "Help us. Where do you want to start?"',
      ],
      show: 'The mayor of Mistvale',
      prompt: 'Where do you start?',
      options: {
        foret: "Follow the goblins' tracks into the forest",
        route: 'Escort a merchant on the south road',
        diseuse: 'Question the fortune teller at the end of the square',
      },
    },
    diseuse: {
      title: "The fortune teller's cards",
      chapter: ACT1,
      narration: [
        'Under her tent, which smells of wax and incense, the fortune teller turns over three cards: a flame, an eye, an upside-down crown.',
        '"What sleeps beneath the mountain does not like to be woken. Yet those who bear the eye want exactly that. And one of them sits very close to the throne."',
      ],
      gmNotes:
        'The upside-down crown foretells the traitor at court (Lady Isolde, Act II). The "prophecy" clue opens an option against the goblin king.',
      show: 'The fortune teller',
      prompt: 'Where do you go now?',
      options: {
        foret: "Head into the forest, on the goblins' trail",
        route: 'Take the south road, where the bandits prowl',
      },
    },
    ferme: {
      title: 'The burnt barn',
      chapter: ACT1,
      narration: [
        'At the edge of the forest, Jeanne\'s farm is still smoking. The barn is nothing but a skeleton of black beams. Jeanne points at the trampled mud: "They went that way. I can\'t read tracks like these."',
        'Bare footprints, wolf prints, dragged sacks. And, fainter, tracks that lead not to the forest but toward the rocks.',
      ],
      show: 'Jeanne, the farmer',
      prompt: 'Read the tracks: you need two successes.',
      reason: 'Read the goblin tracks',
    },
    ferme_piste: {
      title: "The scouts' path",
      chapter: ACT1,
      narration: [
        'The faint tracks belong to the goblin scouts: they lead to a gap in the rocks, behind their camp. No one guards it, since no one knows about it.',
        'Jeanne gives you bread and cheese for the road. "Bring my cow back, if she\'s still alive."',
        'At the end of the path, a goblin scout is rummaging through a sack of apples, his back turned. You saw him before he saw you.',
      ],
      prompt: 'Surprise the scout before he raises the alarm.',
      foes: {
        'eclaireur-1': 'The apple-thief scout',
      },
    },
    ferme_eclaireurs: {
      title: 'The scouts',
      chapter: ACT1,
      narration: [
        'While you go round in circles in the mud, two goblins come out of the ruined barn, arms full of chickens. They drop everything and draw their blades.',
      ],
      prompt: 'Drive the scouts off the farm.',
      foes: {
        'eclaireur-1': 'The chicken goblin',
        'eclaireur-2': 'The goblin archer',
      },
    },
    ferme_ko: {
      title: 'Chickens and shame',
      chapter: ACT1,
      narration: [
        'The scouts leave you sprawled in the mud and run off toward the forest with the chickens. Jeanne helps you up without a word.',
        'The goblin camp now knows someone is coming.',
      ],
      label: 'Enter the forest',
    },
    route: {
      title: 'The south road',
      chapter: ACT1,
      narration: [
        'A cheerful, talkative peddler travels with you, his cart full of trinkets. The road winds between the hills.',
        'Around a bend, an overturned cart blocks the way. The peddler suddenly falls silent.',
      ],
      label: 'Move forward carefully',
    },
    route_bandits: {
      title: 'The ambush',
      chapter: ACT1,
      narration: [
        'Red scarves burst out of the bushes. A woman in a long coat, two blades at her hips, blocks your way with a smile.',
        '"The road is closed, orders from above. Leave the cart, and walk away on your own two legs."',
      ],
      gmNotes: "The leader is paid by the cult to cut the village off from the rest of the kingdom. She doesn't like her employers and can be made to talk.",
      show: 'The bandit leader',
      prompt: 'What do you do?',
      options: {
        combat: 'Draw your weapons',
        parler: 'Ask her who gives the orders "from above"',
      },
    },
    bandits_combat: {
      title: 'Battle on the road',
      chapter: ACT1,
      narration: ['The giant with the club charges first, the crossbowwoman takes aim. You must strike fast and hard.'],
      prompt: 'Rout the bandits.',
      foes: {
        'bandit-1': 'The bandit in the scarf',
        brute: 'The brute with the club',
        arbaletriere: 'The crossbowwoman',
      },
    },
    bandits_parler: {
      title: 'Bargaining with the leader',
      chapter: ACT1,
      narration: ["You lower your weapons. The leader raises an eyebrow: she hadn't expected anyone to ask her questions."],
      prompt: 'Get her talking.',
      reason: 'Get the bandit leader to talk',
    },
    bandits_vaincus: {
      title: 'The red scarves flee',
      chapter: ACT1,
      narration: [
        "The bandits scatter into the hills. In the leader's abandoned satchel, a letter sealed with purple wax: an eye in a flame.",
        '"Block the road until the new moon. The goblin camp will receive the rest of the gold." No signature.',
      ],
      label: 'March toward the goblin camp',
    },
    bandits_parle: {
      title: 'What the leader says',
      chapter: ACT1,
      narration: [
        'The leader spits on the ground. "Purple robes, who pay in fresh gold from the royal city. They pay the goblins too. I don\'t like their eyes."',
        'She tosses you their letter of orders, sealed with an eye in a flame, and whistles the retreat.',
        'The brute with the club doesn\'t move. "Me, I got paid in advance." He swings his club, a bandit at his heels. The leader shrugs and walks away.',
      ],
      show: 'The bandit leader',
      prompt: 'Calm down the brute and his sidekick.',
      foes: {
        brute: 'The brute with the club',
        'bandit-1': 'The bandit in the scarf',
      },
    },
    bandits_blesses: {
      title: 'Bolts and clubs',
      chapter: ACT1,
      narration: [
        "A crossbow bolt grazes you, a club blow doesn't miss: everyone loses 3 HP in the retreat.",
        'The bandits finally make off with two sacks of trinkets. The peddler, for his part, shows you goblin tracks heading into the woods.',
      ],
      label: 'Follow the tracks',
    },
    bandits_defaite: {
      title: 'Biting the dust',
      chapter: ACT1,
      narration: [
        'The last of you falls into the dust. The leader sheathes her blades, laughing: "Not today, heroes." The bandits ride off with the whole cart.',
        'The peddler helps you up one by one, crestfallen. Only one thing is left to follow: goblin tracks heading toward the river.',
      ],
      label: 'Follow the tracks',
    },
    route_loups: {
      title: 'The dark wolves',
      chapter: ACT1,
      narration: [
        "They aren't bandits: three big black wolves are devouring the overturned cart's supplies. They wear leather harnesses. Goblin mounts.",
        'The biggest one lifts its head and growls.',
      ],
      prompt: 'Drive the wolves off before they charge: you need two successes.',
      reason: 'Drive off the dark wolves',
    },
    loups_fuient: {
      title: 'The pack leader',
      chapter: ACT1,
      narration: [
        'A waved torch, a shout, a well-thrown stone: two wolves run off toward the forest.',
        "The biggest one doesn't back away. He lowers his head, lips curled: he is the pack leader, and he won't run from you.",
      ],
      prompt: 'Bring down the pack leader.',
      foes: {
        'loup-1': 'The pack leader',
      },
    },
    loups_combat: {
      title: 'The pack charges',
      chapter: ACT1,
      narration: ['The wolves no longer back away. The biggest one leaps, while the other two circle around you to bite at your legs.'],
      prompt: 'Hold the pack at bay.',
      foes: {
        'loup-1': 'The great wolf',
        'loup-2': 'A dark wolf',
        'loup-3': 'A dark wolf',
      },
    },
    loups_vaincus: {
      title: 'The harnesses',
      chapter: ACT1,
      narration: ['The last wolf limps away. On the leather harnesses, the same crude mark: an eye in a flame. The goblins are not far.'],
      label: 'Follow the wolves into the forest',
    },
    loups_mordent: {
      title: 'Fangs and claws',
      chapter: ACT1,
      narration: ['The pack leaves you on the ground, covered in bites, and runs off toward the forest with the supplies. You follow its tracks, limping.'],
      label: 'Follow the wolves into the forest',
    },
    gue: {
      title: 'The flooded ford',
      chapter: ACT1,
      narration: [
        'The tracks lead to a river swollen by the rains. The ford vanishes beneath brown water full of branches. On the far bank, smoke from the goblin camp rises between the trees.',
        'The peddler turns back and slips you a red vial: "For your trouble. I\'ll wait for you in the village. If you come back."',
      ],
      prompt: 'Cross holding on to one another: you need two successes.',
      reason: 'Cross the flooded ford',
    },
    gue_courant: {
      title: 'The current',
      chapter: ACT1,
      narration: [
        'A foot slips, and the current rolls you over the stones. Everyone loses 2 HP before reaching the far bank, soaked to the bone.',
      ],
      label: 'Follow the smoke',
    },
    foret: {
      title: 'The misty forest',
      chapter: ACT1,
      narration: [
        "The morning mist clings to the tree trunks. The goblins' tracks are easy to follow: broken branches, gnawed bones, a feather caught on a bramble.",
        'Near the stream, something moves.',
      ],
      show: 'The misty forest',
      label: 'Approach the stream',
    },
    foret_guide: {
      title: 'The elf guide',
      chapter: ACT1,
      narration: [
        'An elf with a longbow steps out of the mist. "Sylvaen. I\'ve been tracking these goblins for three days. They captured a dwarf blacksmith, and I know a path that runs behind their palisade."',
      ],
      show: 'Sylvaen, elf guide',
      label: 'Follow Sylvaen',
    },
    foret_herboriste: {
      title: 'The herbalist',
      chapter: ACT1,
      narration: [
        "An old woman is gathering herbs by the water. She doesn't seem surprised to see you.",
        '"Going to the goblin camp? Drink this first." Her bitter brew restores all your strength. "And beware the shaman: his smoke puts you to sleep."',
        'She stuffs a handful of dried herbs into your hands: "Chew these when it bleeds."',
      ],
      show: 'The old herbalist',
      label: 'Keep going toward the camp',
    },
    foret_araignee: {
      title: 'The web',
      chapter: ACT1,
      narration: ['A huge web blocks the path, and its owner slowly lowers herself from a branch: a spider the size of a pony.'],
      prompt: 'Get past without ending up wrapped.',
      reason: 'Escape the giant spider',
    },
    araignee_ok: {
      title: 'Clear of the web',
      chapter: ACT1,
      narration: ['A leap to the side, a roll under a root: the spider bites nothing but mist. The camp is not far now.'],
      label: 'Keep going toward the camp',
    },
    araignee_ko: {
      title: 'Caught in the web',
      chapter: ACT1,
      narration: ['The web sticks to your arms and the bite burns: everyone loses 2 HP before hacking free with their blades.'],
      label: 'Keep going toward the camp',
    },
    camp: {
      title: 'The goblin camp',
      chapter: ACT1,
      narration: [
        'Behind a palisade of stakes: a dozen hide tents, smoking fires, shrill laughter. In a cage in the middle of the camp, a chained dwarf woman curses her guards.',
        'A shaman circles the fire, waving a smoking staff. No one is keeping watch on the side by the rocks.',
      ],
      gmNotes:
        'The prisoner is Brunhild, the village\'s dwarf blacksmith. Once freed, she will later forge weapons that help against the dragon (the "forge" clue).',
      prompt: 'How do you get into the camp?',
      options: {
        assaut: 'Attack head-on, screaming',
        nuit: 'Wait for nightfall and sneak to the cage',
        sentier: "Take Sylvaen's secret path",
        rochers: "Go through the scouts' gap in the rocks",
      },
    },
    camp_assaut: {
      title: 'Charge!',
      chapter: ACT1,
      narration: ['You smash through the palisade gate. The goblins grab their spears, squealing, and the shaman raises his smoking staff.'],
      prompt: 'Sweep the goblins aside.',
      foes: {
        'gob-1': 'The spear goblin',
        'gob-archer': 'The goblin archer',
        'gob-chaman': 'The shaman',
      },
    },
    camp_nuit: {
      title: 'Quiet as a wolf',
      chapter: ACT1,
      narration: [
        'Night falls. The fires die down, the snoring rises. You creep along the palisade to the cage, one step at a time.',
        "Three dangerous stretches: the palisade, the tents, the shaman's fire. Every sound wakes someone.",
      ],
      prompt: 'Get closer without a sound: three successes open the cage silently.',
      reason: 'Sneak into the sleeping camp',
    },
    camp_alerte: {
      title: 'A goblin wakes up',
      chapter: ACT1,
      narration: [
        'You are almost there when a goblin gets up for a drink. He sees you, opens his mouth… The shaman stumbles out of his tent. You must silence them before the whole camp wakes.',
      ],
      prompt: 'Silence them, quickly.',
      foes: {
        'gob-1': 'The thirsty goblin',
        'gob-chaman': 'The shaman',
      },
    },
    camp_fumee: {
      title: "The shaman's smoke",
      chapter: ACT1,
      narration: [
        "The shaman blows into his staff: a green smoke stings your eyes, and you fall one by one, half asleep, under the goblins' spears.",
        'In the confusion, you still manage to break the cage. The dwarf grabs your arm: "This way, to their king\'s cave!"',
      ],
      label: 'Run to the cave',
    },
    avant_poste: {
      title: 'The ruined outpost',
      chapter: ACT1,
      narration: [
        'Before the camp, the path crosses the ruins of an old watchtower. The goblins have turned it into an outpost: a fire, sacks of loot, a wolf chained to a pillar.',
        "On the wall, a goblin holds a great ram's horn. If he blows it, the whole camp will know you are coming.",
      ],
      gmNotes: 'Mandatory fight. The vote only decides how hard it is: silencing the horn blower first removes two enemies.',
      show: 'The goblin with the horn',
      prompt: 'How do you take the outpost?',
      options: {
        charge: 'Charge right away, before the horn sounds',
        discret: 'Climb the wall silently to silence the horn blower',
        ruse: 'Throw stones further off to lure the guards away',
      },
    },
    avant_poste_mur: {
      title: 'The tower wall',
      chapter: ACT1,
      narration: [
        'The tower stones are loose and covered in moss. The horn blower has his back to you, the horn on his hip.',
      ],
      prompt: 'Climb without dislodging a single stone.',
      reason: 'Climb the wall in silence',
    },
    avant_poste_ruse: {
      title: 'Stones in the night',
      chapter: ACT1,
      narration: [
        "A pebble in the bushes, then another, a little further. You must aim well so they think it's an animal, not intruders.",
      ],
      prompt: 'Fool the guards.',
      reason: 'Lure the guards away',
    },
    avant_poste_surprise: {
      title: 'The horn falls silent',
      chapter: ACT1,
      narration: [
        'The horn blower collapses without a cry, his horn rolling into the grass. The archer, who went to see what was moving, gets lost in the dark.',
        'Only the spear guard and his wolf are left, facing you with a growl.',
      ],
      prompt: 'Finish off the outpost guards.',
      foes: {
        'gob-lance': 'The goblin with the spear',
        loup: 'The chained wolf',
      },
    },
    avant_poste_combat: {
      title: "The ram's horn",
      chapter: ACT1,
      narration: [
        'The horn bellows across the valley. The goblins grab their weapons, and someone unchains the wolf.',
      ],
      prompt: 'Take the outpost.',
      foes: {
        'gob-cor': 'The horn blower',
        'gob-lance': 'The goblin with the spear',
        'gob-archer': 'The goblin archer',
        loup: 'The chained wolf',
      },
    },
    avant_poste_butin: {
      title: "The goblins' loot",
      chapter: ACT1,
      narration: [
        "In the outpost's sacks: chickens, a cowbell, saucepans… and a red vial sealed with wax, stolen from a traveller.",
        'You catch your breath by the fire. Further on, smoke from the goblin camp rises between the trees.',
      ],
      label: 'Approach the camp',
    },
    avant_poste_ko: {
      title: 'The horn has sounded',
      chapter: ACT1,
      narration: [
        'The goblins leave you for dead and run to warn the camp, blowing their horn. You come to at nightfall, in the grass of the ruins.',
        'A little rest, a little bread: you set off again, more carefully.',
      ],
      label: 'Approach the camp',
    },
    grotte_gardes: {
      title: 'The cave mouth',
      chapter: ACT1,
      narration: [
        "The path climbs to a black opening in the cliff, lit by torches. In front of it, the king's personal guard: a goblin in saucepan armour, a shaman covered in bones, and the king's wolf, huge, with yellow eyes.",
        '"No one gets through!" yelps the guard. "Except the dead. And you\'re not dead yet."',
      ],
      prompt: 'Force your way through.',
      foes: {
        'garde-1': "The king's guard",
        'garde-chaman': 'The bone shaman',
        'loup-roi': "The king's wolf",
      },
    },
    grotte_gardes_ko: {
      title: 'Dragged before the king',
      chapter: ACT1,
      narration: [
        'The guards tie you up and drag you into the cave, before the throne. The king wants to see with his own eyes these heroes everyone is talking about.',
        'While he gloats, you gnaw at your bonds. Time to catch your breath, and you are free, facing him.',
      ],
      label: 'Get back up',
    },
    camp_libere: {
      title: 'The blacksmith freed',
      chapter: ACT1,
      narration: [
        'The cage swings open. The dwarf rubs her wrists: "Brunhild, blacksmith of Mistvale. Thank you. These runts took me to forge chains for them. Huge chains, for a huge beast."',
        '"Their king is in the cave up there. And he\'s not alone: a fellow in a purple robe talks to him every evening."',
      ],
      show: 'Brunhild, the blacksmith',
      label: 'Climb to the cave',
    },
    grotte: {
      title: 'The bone throne',
      chapter: ACT1,
      narration: [
        'At the back of the cave, on a throne of bones and scrap iron, an enormous goblin wears a twisted crown. At his feet, a pile of loot. Beside him, a man in a purple robe.',
        '"Kill them, Majesty," the cultist whispers. "My masters will double your gold."',
      ],
      gmNotes: 'The goblin king thinks he is the cult\'s ally, but the cult plans to sacrifice him to the dragon. The letter or the prophecy can turn him.',
      show: 'The goblin king',
      prompt: 'What do you do?',
      options: {
        roi: 'Challenge the goblin king',
        cultiste: 'Leap at the cultist before he slips away',
        lettre: "Show the king the cult's letter: he will be sacrificed",
        prophetie: "Repeat the fortune teller's prophecy to the king",
      },
    },
    grotte_roi: {
      title: 'Duel at the foot of the throne',
      chapter: ACT1,
      narration: ['The goblin king steps down from his throne, swinging a mace bristling with nails. Behind him, the cultist draws a curved dagger.'],
      prompt: 'Bring down the goblin king.',
      foes: {
        'roi-gobelin': 'The goblin king',
        cultiste: 'The cultist',
      },
    },
    grotte_cultiste: {
      title: 'Catching the cultist',
      chapter: ACT1,
      narration: ['The cultist backs toward a crack in the rock. The goblin king hesitates.'],
      prompt: 'Grab him before he reaches the crack.',
      reason: 'Catch the cultist',
    },
    grotte_trahi: {
      title: 'The king betrayed',
      chapter: ACT1,
      narration: ['The goblin king narrows his eyes, looks at the cultist… and bursts into nasty laughter.'],
      prompt: 'Convince him for good.',
      reason: 'Turn the goblin king against the cult',
    },
    grotte_dur: {
      title: 'The brawl',
      chapter: ACT1,
      narration: [
        "Everything goes wrong: the king's mace, the cultist's daggers, goblins rushing in. Everyone loses 4 HP.",
        'You win in the end, out of breath. The goblin king escapes into the tunnels; the cultist was not so lucky.',
      ],
      label: 'Search the cultist',
    },
    grotte_defaite: {
      title: 'At the foot of the throne',
      chapter: ACT1,
      narration: [
        'The king\'s mace knocks you down one after another. He sets his foot on your chest, then bursts out laughing: "The cult wanted you dead. The goblin king lets you live. To annoy them."',
        'He disappears into the tunnels with his loot. The cultist tripped in the brawl: he lies unconscious near the throne.',
      ],
      label: 'Search the cultist',
    },
    acte1_allie: {
      title: 'A crown for two',
      chapter: ACT1,
      narration: [
        '"Sacrificed? Me?" The goblin king grabs the cultist by the collar and throws him at your feet. "Keep him. And if you go and smack those purple robes, my goblins will come. For the loot."',
      ],
      label: 'Search the cultist',
    },
    acte1_fin: {
      title: 'The medallion',
      chapter: ACT1,
      narration: [
        'On the cultist, a gold medallion: an eye in a flame. Engraved on the back: "For the Lady, at the port of Aurelia, when the Viper docks."',
        "Mistvale celebrates you all night long at the Golden Boar. The innkeeper fills your packs, a red vial in each; the mayor entrusts you with a letter for the king, and at last everyone gets a real night's sleep: you are back on your feet.",
        'In the morning, the road to the royal city awaits.',
      ],
      show: 'The innkeeper of the Golden Boar',
      label: 'Set off for the royal city',
    },
    ruines: {
      title: 'The ruins by the road',
      chapter: ACT1,
      narration: [
        'On the second evening, the road runs past elven ruins overgrown with ivy. An old hermit tends a fire there. He looks at your medallion and nods.',
        '"The eye in the flame… I know this sign. The runes on these walls tell how it was defeated, a thousand years ago. If you can read them."',
      ],
      show: 'The hermit of the ruins',
      prompt: 'What do you do?',
      options: {
        ecouter: 'Sit by the fire and study the runes with him',
        route: 'Thank him and set off again',
      },
    },
    ermite: {
      title: 'The runes on the wall',
      chapter: ACT1,
      narration: [
        'The hermit scrapes the moss off a wall. The runes are worn, half erased. You must guess the missing ones, one by one, before the fire dies.',
      ],
      prompt: 'Decipher the runes: you need two successes.',
      reason: 'Decipher the elven runes',
    },
    ermite_savoir: {
      title: 'The secret of the runes',
      chapter: ACT1,
      narration: [
        'The runes speak of a circle of fire, and of the three signs that undo it. The hermit makes you repeat them until you know them by heart.',
        '"One day, someone will draw this circle. On that day, erase these three." In the morning, he is gone, and so is his fire.',
      ],
      label: 'Set off again',
    },
    aurelia: {
      title: 'Aurelia at dusk',
      chapter: ACT2,
      narration: [
        'Three days on the road, and here is Aurelia: its blue ramparts, its golden roofs, its lanterns lighting up one by one. Above the palace, the golden lion flutters in the wind.',
        "The mayor's letter opens the palace gates for you the very next morning.",
      ],
      show: 'Aurelia, the royal city',
      label: 'Present yourselves at the palace',
    },
    audience: {
      title: 'The throne room',
      chapter: ACT2,
      narration: [
        'The king listens in silence, his hand on the pommel of his sword. Beside him, the crown princess studies you with curiosity. Further off stand the captain of the guard and the court mage, buried in a book.',
        'Near the throne, a lady with a fan smiles politely. "Goblins, bandits… Majesty, these are country tales."',
      ],
      gmNotes:
        'Lady Isolde, the lady with the fan, is the "Lady" of the medallion: she leads the cult at court. Showing the medallion in front of her alerts her.',
      show: 'The king of Aurelion',
      prompt: 'What do you do with the medallion?',
      options: {
        cour: 'Show it to the king, in front of the whole court',
        capitaine: 'Show it secretly to the captain of the guard',
        mage: 'Ask the court mage to study the medallion',
        aveline: 'Take up the challenge of Dame Aveline, the knight who doubts you',
        rien: 'Say nothing and investigate the city on your own',
      },
    },
    aveline_duel: {
      title: "Dame Aveline's challenge",
      chapter: ACT2,
      narration: [
        'A knight in bright armour steps forward at the foot of the throne. "Dame Aveline, of the royal guard. Peasants who defeated a goblin king? Allow me to doubt it."',
        'In the palace courtyard, she hands you blunted swords. "First to put the other on the ground. If you win, my sword is yours."',
      ],
      gmNotes: 'Aveline is loyal and honest. Winning the duel brings her to the sanctuary antechamber.',
      show: 'Dame Aveline',
      prompt: 'Beat Dame Aveline in a duel.',
      foes: {
        aveline: 'Dame Aveline',
      },
    },
    aveline_allie: {
      title: "Aveline's sword",
      chapter: ACT2,
      narration: [
        'Aveline gets up laughing and clasps your forearm. "I was wrong. When you find these cultists, send word: I\'ll be there."',
        "She slips you a red vial from the guard's stores.",
      ],
      label: 'Go down into the city',
    },
    aveline_respect: {
      title: 'Biting the dust',
      chapter: ACT2,
      narration: [
        'Aveline\'s pommel sends you into the sand. She holds out her hand to help you up. "Not bad. But the cult won\'t be using blunted swords."',
      ],
      label: 'Go down into the city',
    },
    auberge: {
      title: 'The Blue Lantern',
      chapter: ACT2,
      narration: [
        'Night falls on Aurelia. You take rooms at the Blue Lantern, a noisy inn near the market. The innkeeper looks at you a little too long as he hands over the keys.',
        'Around midnight, the music stops. In the corridor, a floorboard creaks.',
      ],
      gmNotes: 'Cult assassins come to finish the job: the fight is mandatory, preparation makes it easier.',
      show: 'The innkeeper of the Blue Lantern',
      prompt: 'What do you do tonight?',
      options: {
        veiller: 'Keep watch in turns, ear against the door',
        piege: 'String a wire and empty tankards in front of the door',
        dormir: "Sleep, it's been a long day",
      },
    },
    auberge_veille: {
      title: 'A shadow under the door',
      chapter: ACT2,
      narration: [
        'The hours pass. A shadow slides under the door, then a second one.',
      ],
      prompt: "Don't fall asleep: Wisdom roll.",
      reason: 'Hear the assassins coming',
    },
    auberge_piege: {
      title: 'The wire and the tankards',
      chapter: ACT2,
      narration: [
        'A wire at ankle height, tankards stacked behind it: at the slightest step, the whole floor will hear it.',
      ],
      prompt: 'Set the trap without it being seen: Intelligence roll.',
      reason: 'Set a hidden trap',
    },
    auberge_guet: {
      title: 'The assassins trapped',
      chapter: ACT2,
      narration: [
        "The tankards tumble down, the door opens on two masked figures who didn't expect to find you standing, weapons in hand.",
      ],
      prompt: 'The assassins are caught off guard: strike first.',
      foes: {
        'fanatique-1': 'The masked assassin',
        'cultiste-1': 'The cultist with the knife',
      },
    },
    auberge_nuit: {
      title: 'Knives in the dark',
      chapter: ACT2,
      narration: [
        'You wake up with a blade at your throat. Three masked figures in the room, and the smell of sulphur.',
      ],
      prompt: 'Defend yourselves in the dark.',
      foes: {
        'fanatique-1': 'The masked assassin',
        'cultiste-1': 'The cultist with the knife',
        'cultiste-2': 'The cultist with the rope',
      },
    },
    auberge_indice: {
      title: 'The tattooed eye',
      chapter: ACT2,
      narration: [
        "On the assassin's wrist, an eye in a flame, tattooed in black ink. The innkeeper, pale as a sheet, admits he was paid to leave the door open.",
        'To make amends, he gives you clean bandages and breakfast. "They were asking about you at the market. Be careful."',
      ],
      show: 'The innkeeper of the Blue Lantern',
      label: 'Go and investigate',
    },
    auberge_ko: {
      title: 'Left for dead',
      chapter: ACT2,
      narration: [
        'The assassins leave you for dead and escape through the window. In the morning, a maid finds you and runs for a healer.',
      ],
      label: 'Go and investigate, still dazed',
    },
    audience_cour: {
      title: 'The fan snaps shut',
      chapter: ACT2,
      narration: [
        "The medallion gleams in your hand. The hall murmurs. The king frowns… and the lady's fan snaps shut.",
        '"Lady Isolde," the captain whispers in your ear. "She just turned pale." When you look up again, Isolde has already left the hall.',
      ],
      show: 'Lady Isolde',
      label: 'Go down into the city',
    },
    audience_capitaine: {
      title: 'An ally in the guard',
      chapter: ACT2,
      narration: [
        'In a palace corridor, the captain examines the medallion. "I\'ve seen this symbol on crates at the port. I can\'t act without proof… but I can send you my guards when you need them."',
      ],
      show: 'The captain of the guard',
      label: 'Go down into the city',
    },
    bibliotheque: {
      title: 'The royal library',
      chapter: ACT2,
      narration: [
        'The mage takes you to the palace library, between shelves that rise all the way to the vaults. "This symbol is old. Very old. Help me look."',
        'Hundreds of grimoires, and little time before nightfall.',
      ],
      show: 'The court mage',
      prompt: 'Search the grimoires: you need two successes.',
      reason: 'Find the symbol in the grimoires',
    },
    bibliotheque_ok: {
      title: 'The circle of the Eye',
      chapter: ACT2,
      narration: [
        'In a grimoire bound in red leather: the symbol of the eye in the flame, and the drawing of a summoning circle. Three runes are circled: the ones that undo it.',
        '"Keep that in mind," says the mage, closing the book. "And tell no one what you are looking for."',
      ],
      label: 'Go down into the city',
    },
    rues: {
      title: 'The cobbled streets',
      chapter: ACT2,
      narration: ['Stalls, alleys, the market crowd: the cult could be hiding anywhere. You keep your ears open and ask questions.'],
      label: 'Look for a lead',
    },
    rues_voleur: {
      title: 'The informant',
      chapter: ACT2,
      narration: [
        'A hooded young man rolls a coin between his fingers. "Thread, at your service. For three gold coins, I\'ll tell you where the Viper\'s crates go."',
        '"They arrive at the port at night and go down into the sewers. They smell of sulfur, enough to turn your stomach."',
      ],
      show: 'Thread, the informant',
      label: 'Think about what comes next',
    },
    rues_alchimiste: {
      title: 'The alchemist',
      chapter: ACT2,
      narration: [
        'In a shop that smokes from every corner, a bespectacled alchemist greets you. "Ember incense? Someone bought three barrels of it from me. Nobody buys that! It\'s used to… wake up big sleeping beasts."',
        'He slips you a blue vial: "Frost powder. Thrown into a brazier, it smothers the incense."',
        'For two coins, he adds flasks of alchemist\'s fire: "These you throw. Then you step back."',
      ],
      show: 'The alchemist',
      label: 'Think about what comes next',
    },
    antichambre: {
      title: 'The antechamber',
      chapter: ACT2,
      narration: [
        'A corridor of black stone, green torches, and a heavy door carved with an eye. In front of it, two fanatics in red robes and a little devil cackling on a brazier.',
      ],
      gmNotes: 'The sanctuary guardians: the fight is mandatory. Aveline (won in the duel) holds some of them back.',
      prompt: 'How do you get past the guardians?',
      options: {
        force: 'Charge before they raise the alarm',
        ombre: 'Slip through the shadows to take them from behind',
        aveline: 'Signal Dame Aveline, who followed you',
      },
    },
    antichambre_ombre: {
      title: 'In the shadows',
      chapter: ACT2,
      narration: [
        'The torches make the shadows dance. You must hug the wall without a single link of mail jingling.',
      ],
      prompt: 'Get close without being seen: you need two successes.',
      reason: 'Slip behind the guardians',
    },
    antichambre_combat: {
      title: 'The sanctuary guardians',
      chapter: ACT2,
      narration: [
        '"Intruders!" The fanatics draw their curved daggers, and the imp leaps from the brazier, spitting sparks.',
      ],
      prompt: 'Cut down the guardians.',
      foes: {
        'fanatique-1': 'The fanatic in red',
        'fanatique-2': 'The fanatic with daggers',
        diablotin: 'The brazier imp',
      },
    },
    antichambre_surprise: {
      title: 'Taken from behind',
      chapter: ACT2,
      narration: [
        'The first fanatic collapses without a sound. The second turns around too late, and the imp squeals with rage.',
      ],
      prompt: 'Finish it before the alarm sounds.',
      foes: {
        'fanatique-2': 'The fanatic with daggers',
        diablotin: 'The brazier imp',
      },
    },
    antichambre_aveline: {
      title: 'Aveline to the rescue',
      chapter: ACT2,
      narration: [
        'Aveline bursts from the staircase, shield first, and slams the first fanatic into the wall. "The other two are yours!"',
      ],
      show: 'Dame Aveline',
      prompt: 'Aveline holds the first one: deal with the others.',
      foes: {
        'fanatique-2': 'The fanatic with daggers',
        diablotin: 'The brazier imp',
      },
    },
    antichambre_ko: {
      title: 'Dragged to the door',
      chapter: ACT2,
      narration: [
        'The guardians disarm you and drag you to the carved door. "The high priest will want to see them." A mistake: you still have your fists.',
      ],
      label: 'Break free and go in',
    },
    rues_embuscade: {
      title: 'The masks',
      chapter: ACT2,
      narration: ['An alley that is too quiet. Two masked figures, curved daggers in hand, drop on you from the rooftops. Someone knows you are here.'],
      prompt: 'Turn the ambush around.',
      foes: {
        'fanatique-1': 'The small fanatic',
        'fanatique-2': 'The masked fanatic',
      },
    },
    embuscade_ok: {
      title: 'A talkative fanatic',
      chapter: ACT2,
      narration: [
        'You disarm the smaller of the two. Under threat, he spits: "The sanctuary… beneath the city. By the port or by the sewers, you\'ll be too late!"',
      ],
      label: 'Think about what comes next',
    },
    embuscade_ko: {
      title: 'Curved daggers',
      chapter: ACT2,
      narration: [
        'The daggers are fast and poisoned. You fall into the gutter, and the fanatics vanish over the rooftops, leaving a strong smell of sulfur behind them.',
      ],
      label: 'Think about what comes next',
    },
    choix_ville: {
      title: 'The port or the sewers',
      chapter: ACT2,
      narration: ['Every lead points beneath the city, where the cult is preparing something. Two ways to get down there.'],
      prompt: 'Which way do you go down?',
      options: {
        port: 'Through the port, where the Viper docks',
        egouts: 'Through the sewers, following the smell of sulfur',
        gardes: "With the captain's guards, through the main sewer gate",
        piste: 'Through the hidden door you were told about',
      },
    },
    port: {
      title: 'The docks',
      chapter: ACT2,
      narration: [
        'At the port, a captain in a tricorn hat waves you over. "Mara. The Viper, over there, is my old ship. Stolen by purple robes. They\'re unloading tonight."',
        'Cultists are rolling barrels toward a warehouse. A trapdoor there leads underground.',
      ],
      show: 'The port of Aurelia',
      prompt: 'Slip into the warehouse: you need two successes.',
      reason: 'Get into the warehouse unseen',
    },
    port_ok: {
      title: 'The trapdoor',
      chapter: ACT2,
      narration: [
        'Between two barrels, you dash to the trapdoor. Mara follows you: "These barrels are full of ember incense. If we empty one into the harbour, that\'s one less."',
        'Beneath the trapdoor, a stone staircase leads down, hot as an oven.',
      ],
      label: 'Go down',
    },
    port_ko: {
      title: 'Brawl on the Viper',
      chapter: ACT2,
      narration: ['A barrel rolls, a cultist shouts. You are cornered on the deck of the Viper, among the rigging. Mara draws her sabre: "My ship, my rules!"'],
      prompt: 'Clear the deck of the Viper.',
      foes: {
        'cultiste-1': 'A knife-wielding cultist',
        'cultiste-2': 'A knife-wielding cultist',
      },
    },
    port_sauves: {
      title: 'Fished out',
      chapter: ACT2,
      narration: [
        'A blow from an oar, a plunge, and the cold water of the harbour. Mara and her sailors fish you out one by one while the cultists laugh on deck.',
        '"They left the trapdoor open," Mara whispers. "They don\'t think you\'ll come back. Prove them wrong."',
      ],
      label: 'Go down',
    },
    egouts: {
      title: 'The sewers',
      chapter: ACT2,
      narration: [
        'Dirty water laps beneath the vaults. The smell of sulfur becomes unbearable. Shrill laughter echoes: little winged demons are playing with rats.',
      ],
      prompt: 'Find the right tunnel without waking the brood: you need two successes.',
      reason: 'Follow the trail of sulfur',
    },
    egouts_gardes: {
      title: "The king's guards",
      chapter: ACT2,
      narration: [
        'The captain keeps her word: six guards in blue cloaks open the main sewer gate for you. The imps flee before the halberds.',
        'You move fast, and without a scratch.',
      ],
      label: 'Press on to the sanctuary',
    },
    egouts_ok: {
      title: 'The right tunnel',
      chapter: ACT2,
      narration: ['Traces of sulfur, cart marks, a door far too new for a sewer: you are there, without a sound.'],
      label: 'Push the door open',
    },
    egouts_ko: {
      title: 'The brood',
      chapter: ACT2,
      narration: ['One misstep in the water, and the brood of imps falls on you, cackling, claws out.'],
      prompt: 'Drive off the imps.',
      foes: {
        'diablotin-1': 'A cackling imp',
        'diablotin-2': 'A cackling imp',
      },
    },
    egouts_morsures: {
      title: 'Clawed and bitten',
      chapter: ACT2,
      narration: [
        "The imps leave you in the filthy water, covered in scratches, and fly off sniggering. They weren't careful: the sanctuary door is right there, ajar.",
      ],
      label: 'Push the door',
    },
    sanctuaire: {
      title: 'The sanctuary of the Eye',
      chapter: ACT2,
      narration: [
        'An underground hall, black columns, a summoning circle pulsing with purple light. Braziers burn a thick red incense.',
        'In the centre, a man in a golden mask is chanting. Inside the circle, something massive and horned is starting to take shape.',
      ],
      gmNotes:
        'The high priest is opening a passage to Ashpeak and summoning a demon to guard it. If he finishes his ritual, the demon appears. The incense can be smothered with the frost powder.',
      show: 'The high priest',
      prompt: 'What do you do?',
      options: {
        rituel: 'Break the summoning circle',
        pretre: 'Rush the high priest',
        encens: "Smother the braziers' incense",
        runes: 'Erase the three runes you have learned',
      },
    },
    rituel: {
      title: 'The purple circle',
      chapter: ACT2,
      narration: ["You throw yourselves onto the circle's runes. They burn beneath your fingers, and every mistake makes the horned shape grow."],
      prompt: 'Erase the right runes: you need two successes.',
      reason: 'Break the summoning circle',
    },
    pretre: {
      title: 'The golden mask',
      chapter: ACT2,
      narration: ['The high priest sees you coming and raises his hands. His two cultists throw themselves in front of him to give him time to finish.'],
      prompt: 'Strike down the high priest before the last syllable.',
      foes: {
        'grand-pretre': 'The high priest',
        'cultiste-1': 'A cultist',
        'cultiste-2': 'A cultist',
      },
    },
    demon: {
      title: 'The horned demon',
      chapter: ACT2,
      narration: [
        'Too late. The circle explodes, and a horned demon, as tall as two men, steps out of the flames with a roar. Behind it, the high priest escapes through a passage of fire.',
      ],
      show: 'The horned demon',
      prompt: 'Send the demon back into the flames.',
      foes: {
        demon: 'The horned demon',
      },
    },
    pretre_defaite: {
      title: 'The last syllable',
      chapter: ACT2,
      narration: [
        "You fall under the cultists' daggers. The high priest speaks the last syllable: the circle explodes, and a horned demon steps out, as tall as two men.",
        'It steps over your bodies without a glance and follows its master into a passage of fire. To them, you no longer matter.',
      ],
      label: 'Search the sanctuary',
    },
    demon_vaincu: {
      title: 'Ashes',
      chapter: ACT2,
      narration: ['The demon collapses into smoking ashes. The sanctuary is silent. The high priest is far away.'],
      label: 'Search the sanctuary',
    },
    demon_defaite: {
      title: 'The demon leaves',
      chapter: ACT2,
      narration: [
        'The demon smashes you against the columns, one after another. Then it raises its head, as if called, and plunges into the passage of fire after its master.',
        "You get up in an empty sanctuary. The cult didn't finish you off: it has better things to do, and that is what worries you.",
      ],
      label: 'Search the sanctuary',
    },
    rituel_brise: {
      title: 'The ritual broken',
      chapter: ACT2,
      narration: [
        'The braziers go out with a hiss, the circle cracks. The half-formed demon dissolves into smoke.',
        'The high priest steps back, furious. "Too late, anyway. The seals will fall." He throws a handful of embers and disappears into a passage of fire.',
      ],
      label: 'Search the sanctuary',
    },
    revelation: {
      title: "The cult's plan",
      chapter: ACT2,
      narration: [
        'On the altar, a map of the kingdom and letters signed "I.": Lady Isolde. The cult wants to wake Pyraxis, the red dragon sleeping beneath Ashpeak, and offer it the kingdom.',
        "The only way to the heart of the mountain goes through the castle of its ally, a vampire lord. The high priest is racing there. Isolde, for her part, fled the city during the night.",
      ],
      show: 'Lady Isolde',
      label: 'Bring the news to the palace',
    },
    temple: {
      title: 'The blessing',
      chapter: ACT2,
      narration: [
        'The king welcomes you as heroes and sends you to the temple of light. Beneath the stained glass, the high priestess heals your wounds: you are back on your feet.',
        'She traces a symbol of light on your forehead. "Against the dead and the drinkers of blood, this blessing will protect you. Once."',
        'The king gives you horses. Ashpeak is a week\'s ride away, and three roads lead there.',
      ],
      show: 'The high priestess',
      label: 'Set off for Ashpeak',
    },
    terres: {
      title: 'Three roads',
      chapter: ACT3,
      narration: [
        "The map of the kingdom lies spread before you. Ashpeak smokes to the north. Through the pass, you must cross orc territory. Through the marsh, that of a witch who is said to know the vampires' secrets. Through the old royal crypt, a passage under the mountain… guarded by the dead.",
      ],
      gmNotes:
        "Each road grants an ally or a weapon for the finale: the orcs (storming the castle), the witch's stake (against the vampire), the spectral knight (against the dragon).",
      prompt: 'Which road do you take?',
      options: {
        col: 'The orc pass, through the snow',
        marais: "The witch's marsh",
        crypte: 'The crypt of the ancient kings',
      },
    },
    col: {
      title: 'The snowy pass',
      chapter: ACT3,
      narration: ['The wind howls, the snow lashes your faces. The horses balk. Higher up, war drums echo between the peaks.'],
      label: 'Climb toward the pass',
    },
    col_avalanche: {
      title: 'The avalanche',
      chapter: ACT3,
      narration: ['A dull rumble, overhead. The whole slope starts sliding toward you.'],
      prompt: 'Hold on under the snow: you need two successes.',
      reason: 'Survive the avalanche',
    },
    col_ensevelis: {
      title: 'Buried',
      chapter: ACT3,
      narration: [
        'The snow rolls you, crushes you, chills you to the bone. Everyone loses 4 HP before digging toward the light… under the arrows of an orc patrol.',
      ],
      label: 'Get back up',
    },
    col_patrouille: {
      title: 'The patrol',
      chapter: ACT3,
      narration: ['Figures in the storm: two orcs painted red and an ogre dragging a tree trunk as a club.'],
      prompt: 'Stand up to the patrol.',
      foes: {
        'orc-1': 'The orc with the axe',
        'orc-2': 'The orc archer',
        ogre: 'The ogre',
      },
    },
    col_ogre: {
      title: 'Tied up',
      chapter: ACT3,
      narration: [
        'The orcs throw you to the ground. When you open your eyes again, they have tied you up and are dragging you to their chief.',
      ],
      label: 'Let them take you',
    },
    col_archers: {
      title: 'The pass archers',
      chapter: ACT3,
      narration: [
        'On the ridge, two orc archers nock their arrows. Between them, a shaman covered in bones shakes a crackling staff.',
      ],
      prompt: 'Climb up to them under the arrows.',
      foes: {
        'archer-1': 'The orc archer',
        'archer-2': 'The orc bowwoman',
        chaman: 'The bone shaman',
      },
    },
    camp_orc: {
      title: 'The war camp',
      chapter: ACT3,
      narration: [
        'A palisade of stakes, fires, fur tents. The warchief, covered in scars, leans on an axe bigger than you. "Grokh. The purple robes promised me your villages. Why shouldn\'t I eat you?"',
      ],
      gmNotes: 'Grokh respects strength and hates being deceived. The medallion proves the cult also means to hand the orcs over to the dragon.',
      show: 'Grokh, warchief',
      prompt: 'What do you answer Grokh?',
      options: {
        duel: 'Challenge him to a duel of honour',
        parler: 'Explain that the dragon will burn the orcs too',
        medaillon: "Throw him the cult's medallion: proof of their betrayal",
      },
    },
    orc_duel: {
      title: 'Duel of honour',
      chapter: ACT3,
      narration: [
        'The orcs form a circle and beat on their shields. Grokh twirls his axe, laughing.',
        '"First to fall. If it\'s me, we\'ll talk."',
      ],
      prompt: 'Put Grokh on the ground.',
      foes: {
        'chef-orc': 'Grokh, the warchief',
      },
    },
    orc_parler: {
      title: 'Talking to the orcs',
      chapter: ACT3,
      narration: [
        "You speak of the dragon, of the flames, of the villages that will burn, the orcs' as much as anyone's. The shaman listens, eyes half-closed.",
      ],
      prompt: 'Find words that strike home: you need two successes.',
      reason: 'Convince Grokh',
    },
    orc_allies: {
      title: "Grokh's horde",
      chapter: ACT3,
      narration: [
        'Grokh plants his axe in the ground. "The purple robes lied to us. So we\'ll go and knock their teeth in." The whole horde roars with him.',
        'The orcs open the northern road for you, all the way to the bridge over the gorge.',
      ],
      label: 'March toward the bridge',
    },
    orc_defaite: {
      title: 'Thrown out of the camp',
      chapter: ACT3,
      narration: [
        "Grokh isn't convinced. Punches, blows from axe handles: everyone loses 3 HP. You are thrown out of the camp, without a guide.",
        'The only road left runs through an old mine, on the mountainside.',
      ],
      label: 'Enter the mine',
    },
    mine: {
      title: 'The abandoned mine',
      chapter: ACT3,
      narration: [
        'Rusty rails, overturned carts, and small yellow eyes in the dark. Kobolds in the cult\'s service guard the tunnel. "For the Great Red!" yelps the first one.',
      ],
      prompt: "Get through the kobolds' tunnel.",
      foes: {
        'kobold-1': 'A kobold with a pickaxe',
        'kobold-2': 'A kobold with a pickaxe',
        'kobold-3': 'A kobold with a sling',
      },
    },
    mine_ko: {
      title: 'The mine cart',
      chapter: ACT3,
      narration: [
        'The kobolds knock you out with their pickaxes and throw you into a mine cart, which they push down the slope, laughing. You hurtle down the tunnel in the dark… and the cart spits you out at the very end, in front of a bridge.',
      ],
      label: 'Get up',
    },
    pont: {
      title: 'The bridge over the gorge',
      chapter: ACT3,
      narration: ['An old stone bridge over a raging torrent. In the middle, a massive troll demands a toll: "One of you. The fattest."'],
      prompt: 'How do you cross the bridge?',
      options: {
        force: 'Push the troll into the torrent',
        ruse: 'Offer him a riddle',
      },
    },
    pont_force: {
      title: 'Hand to hand',
      chapter: ACT3,
      narration: ['You all charge together. The troll spreads his arms and grins with all his mossy teeth.'],
      prompt: 'Push! You need two successes to tip him over.',
      reason: 'Push the troll into the torrent',
    },
    pont_combat: {
      title: 'The troll gets angry',
      chapter: ACT3,
      narration: ['The troll doesn\'t budge an inch. He tears a stone from the parapet and weighs it in his hand. "My turn."'],
      prompt: 'Bring down the troll before he breaks the bridge.',
      foes: {
        troll: 'The bridge troll',
      },
    },
    pont_ruse: {
      title: 'The riddle',
      chapter: ACT3,
      narration: ['"A riddle?" The troll scratches his head. "Fine. But if I get it, I eat."'],
      prompt: "Ask a riddle he won't solve.",
      reason: 'Confuse the troll',
    },
    pont_passe: {
      title: 'The other side',
      chapter: ACT3,
      narration: [
        'The troll ends up in the torrent, or sitting there scratching his head: no matter, the bridge is yours. Beyond, the road climbs toward an old dwarven gate carved into the cliff.',
      ],
      label: 'Climb to the gate',
    },
    porte_naine: {
      title: 'The dwarven gate',
      chapter: ACT3,
      narration: [
        'A gate as tall as three men, covered in dwarven runes. In front of it, a stone statue holds an axe. As you approach, its eyes light up with an orange glow.',
        '"None shall pass without the word of the elders."',
      ],
      gmNotes: 'The stone guardian wakes up no matter what. Reading the runes weakens it before the fight.',
      show: 'The stone guardian',
      prompt: 'What do you do?',
      options: {
        combat: "Strike it before it's fully awake",
        runes: 'Decipher the runes to find the word of the elders',
      },
    },
    porte_naine_runes: {
      title: 'The runes',
      chapter: ACT3,
      narration: [
        'The runes are worn by the wind. Some speak of forges, others of oaths.',
      ],
      prompt: 'Find the word of the elders: Intelligence roll.',
      reason: 'Decipher the dwarven runes',
    },
    porte_naine_fissure: {
      title: 'The crack',
      chapter: ACT3,
      narration: [
        'You speak the word. The guardian stops dead, and a crack runs across its chest. It still raises its axe, but more slowly.',
      ],
      prompt: 'Shatter the cracked guardian.',
      foes: {
        gardien: 'The cracked guardian',
      },
    },
    porte_naine_combat: {
      title: 'The stone guardian',
      chapter: ACT3,
      narration: [
        'The statue steps down from its plinth in a crash of rocks. Every step shakes the cliff.',
      ],
      prompt: 'Bring down the stone guardian.',
      foes: {
        gardien: 'The stone guardian',
      },
    },
    porte_naine_ok: {
      title: 'The dwarven halls',
      chapter: ACT3,
      narration: [
        "The guardian collapses into a pile of pebbles. The gate opens onto empty halls, where the dwarves left a red vial on an altar. At the end, a staircase comes out under the storm, facing the vampire's castle.",
      ],
      label: 'March toward the castle',
    },
    porte_naine_ko: {
      title: 'Under the rocks',
      chapter: ACT3,
      narration: [
        "The stone axe sends you rolling down the slope. The guardian returns to its plinth, satisfied. It takes you an hour to find a path around the gate, up to the vampire's castle.",
      ],
      label: 'March toward the castle',
    },
    pont_coups: {
      title: "The troll's club",
      chapter: ACT3,
      narration: [
        "The troll's club shakes the bridge and sends you rolling across the stones. Pleased with himself, the troll sits back down to count his teeth, and you crawl past behind his back.",
      ],
      label: 'Climb to the gate',
    },
    marais: {
      title: 'The marsh',
      chapter: ACT3,
      narration: [
        "Rotten boardwalks, bubbling green water, trees covered in moss. The horses refuse to go any further. The witch's hut lies at the heart of the marsh.",
      ],
      show: "The witch's marsh",
      label: 'Move along the boardwalks',
    },
    marais_lezards: {
      title: 'The lizardfolk',
      chapter: ACT3,
      narration: ['Lizardfolk rise from the water, spears raised. They hiss something that sounds like "Intruders!"'],
      prompt: 'What do you do?',
      options: {
        combat: 'Drive them back with your blades',
        parler: 'Show them you come in peace',
      },
    },
    lezards_combat: {
      title: 'Fight on the boardwalks',
      chapter: ACT3,
      narration: ['The boardwalks sway beneath your feet. The spears aim at your legs.'],
      prompt: 'Drive back the lizardfolk.',
      foes: {
        'lezard-1': 'The lizardfolk spearman',
        'lezard-2': 'The lizardfolk shieldbearer',
      },
    },
    marais_defaite: {
      title: 'In the mud',
      chapter: ACT3,
      narration: [
        'You fall into the mud, exhausted. When you drag yourselves out, your foes are gone, and green smoke rises between the trees, behind a moss-covered mound.',
      ],
      label: 'Follow the smoke',
    },
    lezards_parler: {
      title: 'Words of peace',
      chapter: ACT3,
      narration: ['You put away your weapons and raise your hands. The lizardfolk exchange glances.'],
      prompt: 'Win their trust.',
      reason: 'Parley with the lizardfolk',
    },
    marais_guides: {
      title: 'A safe path',
      chapter: ACT3,
      narration: [
        '"The old woman… she scares us too," hisses the tallest. They lead you along a dry path, but stop dead in front of a moss-covered mound. "We go no further."',
      ],
      label: 'Go on alone',
    },
    tertre: {
      title: 'The ghoul mound',
      chapter: ACT3,
      narration: [
        'The mound is an old, half-drowned tomb. The earth moves. Two ghouls crawl out, grey-skinned, claws black with mud, and sniff the air in your direction.',
      ],
      gmNotes: "The guardians of the witch's path: the fight is mandatory.",
      prompt: 'Drive back the ghouls before they paralyse you.',
      foes: {
        'goule-1': 'The black-clawed ghoul',
        'goule-2': 'The starving ghoul',
      },
    },
    tertre_ko: {
      title: 'Paralysed',
      chapter: ACT3,
      narration: [
        "The ghouls' claws freeze your limbs. They drag you to a hut on stilts… and flee when the door opens.",
      ],
      label: 'Get back up',
    },
    marais_araignees: {
      title: 'The marsh webs',
      chapter: ACT3,
      narration: ['Between the trees, webs as thick as ship sails. Two giant spiders watch you with their eight eyes.'],
      prompt: 'Cross without getting caught: you need two successes.',
      reason: 'Cross the spider wood',
    },
    araignees_combat: {
      title: 'Caught in the web',
      chapter: ACT3,
      narration: ['A sticky thread catches your ankle. The two spiders come down from their webs, in no hurry.'],
      prompt: 'Cut the webs and drive back the spiders.',
      foes: {
        'araignee-1': 'The great spider',
        'araignee-2': 'The hairy spider',
      },
    },
    cabane: {
      title: 'The hut on stilts',
      chapter: ACT3,
      narration: [
        'The door opens before you knock. An old woman, wrinkled like an apple, smiles at you with all three of her teeth. "Mother Mire. You want to kill the vampire. I know it. I want that too."',
        '"I have the ash stake that will pierce his heart. But nothing is free, my little ones."',
      ],
      gmNotes:
        "Mother Mire hates the vampire, who stole her youth. She wants a little of the heroes' life in exchange: real HP. She can also be tricked or forced.",
      show: 'Mother Mire, the witch',
      prompt: 'How do you get the stake?',
      options: {
        payer: 'Accept her price, whatever it is',
        ruse: 'Trick her with a false promise',
        force: 'Take the stake by force',
      },
    },
    sorciere_prix: {
      title: 'The price',
      chapter: ACT3,
      narration: [
        'Mother Mire touches your foreheads one by one. A chill runs through you: everyone loses 3 HP, and she grows a year younger. "Deal."',
        "She hands you an ash stake carved with runes, and shows you a path to the vampire's castle.",
      ],
      label: 'Take the path',
    },
    sorciere_ruse: {
      title: 'The false promise',
      chapter: ACT3,
      narration: ['"When the vampire is dead, his castle will be yours," you promise. Mother Mire narrows her eyes.'],
      prompt: 'Keep a straight face.',
      reason: 'Trick Mother Mire',
    },
    sorciere_force: {
      title: 'The stake or your life',
      chapter: ACT3,
      narration: [
        'You draw your weapons. Mother Mire whistles through her teeth, and a moss-covered troll crawls out from under the hut.',
      ],
      prompt: 'Get past the troll and grab the stake.',
      foes: {
        troll: 'The mossy troll',
        sorciere: 'Mother Mire',
      },
    },
    marais_noyes: {
      title: 'The drowned',
      chapter: ACT3,
      narration: [
        "At the end of the path, the black water starts to bubble. Two drowned dead rise from it, covered in weed: Mother Mire's former visitors, who didn't pay.",
      ],
      prompt: 'Send the drowned back to the bottom of the marsh.',
      foes: {
        'noye-1': 'The weed-covered drowned man',
        'noye-2': 'The drowned woman with the necklace',
      },
    },
    marais_noyes_ko: {
      title: 'The black water',
      chapter: ACT3,
      narration: [
        "The drowned pull you under the water. You tear yourselves free just in time, spitting mud, and they sink back to the bottom. The vampire's castle is not far now.",
      ],
      label: 'March toward the castle',
    },
    sorciere_dupee: {
      title: 'The ash stake',
      chapter: ACT3,
      narration: [
        "The ash stake is yours. Mother Mire grumbles curses in an old dialect as you hurry north. The vampire's castle is not far now.",
      ],
      label: 'Hurry toward the castle',
    },
    sorciere_malediction: {
      title: 'The curse',
      chapter: ACT3,
      narration: [
        'Mother Mire bursts out laughing and throws a handful of cursed mud at you: everyone loses 5 HP. "Off you go, and may the vampire gobble you up!" Without the stake, you set off again toward the castle.',
      ],
      label: 'Back on the road',
    },
    cimetiere: {
      title: "The kings' graveyard",
      chapter: ACT3,
      narration: [
        'The crypt opens at the far end of an old graveyard, on a windswept hill. Overturned tombstones, freshly dug earth.',
        'Between the gravestones, two figures stagger: dead risen from the ground, sniffing the air. You must reach the crypt door without them smelling you.',
      ],
      prompt: 'Slip between the graves without a sound: you need two successes.',
      reason: 'Cross the graveyard',
    },
    cimetiere_combat: {
      title: 'The dead rise',
      chapter: ACT3,
      narration: ['A branch snaps. The two dead turn their heads toward you at the same time, and start running.'],
      prompt: 'Send the dead back to their graves.',
      foes: {
        'zombie-1': 'A hungry corpse',
        'zombie-2': 'A hungry corpse',
      },
    },
    cimetiere_ko: {
      title: 'In the pit',
      chapter: ACT3,
      narration: [
        'The dead drag you into an open grave and leave you there, as if to keep you fresh. At the bottom, a rusty grate: it leads straight into the crypt.',
      ],
      label: 'Go through the grate',
    },
    crypte: {
      title: 'The royal crypt',
      chapter: ACT3,
      narration: [
        'Beneath the hill of the ancient kings, the crypt opens onto broken sarcophagi. A green glow floats between the pillars. The dead sleep no more: they rise, creaking.',
      ],
      prompt: 'What do you do?',
      options: {
        force: 'Fight your way through the skeletons',
        lumiere: "Raise the priestess's blessing",
      },
    },
    crypte_combat: {
      title: 'Bone and dust',
      chapter: ACT3,
      narration: ['The skeletons advance in tight ranks, rusty swords raised. Behind them, a corpse bigger than the others drags a chain.'],
      prompt: 'Break their ranks.',
      foes: {
        'squelette-1': 'The skeleton soldier',
        'squelette-2': 'The skeleton archer',
        zombie: 'The corpse with the chain',
      },
    },
    crypte_lumiere: {
      title: 'The light of the temple',
      chapter: ACT3,
      narration: [
        'The symbol on your forehead lights up like a sun. The skeletons collapse into piles of bones. The blessing is spent, but the way is clear.',
      ],
      label: 'Go deeper',
    },
    crypte_griffes: {
      title: 'Ghoul claws',
      chapter: ACT3,
      narration: [
        'You fall under the blows of the dead. A ghoul bursts from a sarcophagus and drags you, paralysed, down to the lower halls, for later. Its claws let go when a cold light flares up.',
      ],
      label: 'Go deeper',
    },
    crypte_salles: {
      title: 'The spectral knight',
      chapter: ACT3,
      narration: [
        'Further down, before a portcullis, a translucent knight bars your way. "I am Galvan, last guardian of the seal of Ashpeak. A necromancer has bound me to these halls. Free me, or face me."',
      ],
      gmNotes: 'Galvan sealed Pyraxis a thousand years ago. Once freed, he can remake the seal in the dragon\'s lair (the "galvan" clue).',
      show: 'Sir Galvan, the spectral knight',
      prompt: "Break the necromancer's bond with your words: you need two successes.",
      reason: 'Free Sir Galvan',
    },
    galvan_libre: {
      title: "Galvan's oath",
      chapter: ACT3,
      narration: ['The knight kneels. "I will follow you to the dragon. But first, the one who bound me must be punished."'],
      label: 'Open the portcullis',
    },
    galvan_combat: {
      title: 'The spectre attacks',
      chapter: ACT3,
      narration: ["The bond is too strong. Galvan's eyes light up green, and his spectral sword rises against you."],
      prompt: 'Stand against the spectral knight.',
      foes: {
        spectre: 'Sir Galvan, the spectre',
      },
    },
    galvan_repos: {
      title: "The knight's rest",
      chapter: ACT3,
      narration: [
        'The spectre crumbles into glowing dust. "Thank you," he breathes as he fades. Galvan is at peace, but he will never remake the seal. The portcullis opens.',
      ],
      label: 'Open the portcullis',
    },
    galvan_fuite: {
      title: 'The portcullis',
      chapter: ACT3,
      narration: [
        'The spectral sword throws you to the ground, one after another. Galvan raises his weapon to finish off the last of you… and stops, trembling, as if fighting himself. He vanishes, moaning, and the portcullis creaks.',
      ],
      label: 'Crawl under the portcullis',
    },
    necromancien: {
      title: 'The necromancer',
      chapter: ACT3,
      narration: [
        'Behind the portcullis, a staircase climbs to a round room full of books. A man in a black robe raises a glowing skull, and a corpse rises at his feet. "The cult promised me no one would come."',
      ],
      show: 'The necromancer',
      prompt: 'Strike down the necromancer.',
      foes: {
        necromancien: 'The necromancer',
        zombie: "The necromancer's corpse",
      },
    },
    liche: {
      title: 'The lich',
      chapter: ACT3,
      narration: [
        "It isn't a necromancer waiting for you, but his master: a crowned lich with eyes of blue flame. It hasn't spoken in a hundred years, and its voice freezes the air.",
        '"You have come to die. Good."',
      ],
      show: 'The crowned lich',
      prompt: 'Find the flaw in its phylactery, the gem in its sceptre: you need two successes.',
      reason: 'Uncover the secret of the phylactery',
    },
    liche_combat: {
      title: "The lich's wrath",
      chapter: ACT3,
      narration: ['The lich raises its sceptre, and the air begins to freeze. Only one thing is left to do: strike, again and again.'],
      prompt: 'Shatter the lich.',
      foes: {
        liche: 'The crowned lich',
      },
    },
    crypte_maudits: {
      title: 'The magic of the dead',
      chapter: ACT3,
      narration: [
        'A green bolt throws you to the ground. Your foe thinks you are dead and sinks into the depths, toward the castle. When you get up, chilled to the bone, the tower is empty.',
      ],
      label: 'Find the way out',
    },
    crypte_sortie: {
      title: 'Under the mountain',
      chapter: ACT3,
      narration: [
        "Behind the tower, on a table, a red vial no one will drink anymore. A long tunnel climbs northward. When you come out, night is falling, and the vampire's castle rises on its peak, right in front of you.",
      ],
      label: 'March toward the castle',
    },
    crypte_porte: {
      title: 'The archers at the door',
      chapter: ACT3,
      narration: [
        "The dead didn't smell a thing. But in front of the crypt door, two skeleton archers slowly turn their skulls toward you, and draw their bows.",
      ],
      prompt: 'Bring down the archers before the next volley.',
      foes: {
        'archer-1': 'The skeleton archer',
        'archer-2': 'The skeleton archer',
      },
    },
    liche_affaiblie: {
      title: 'The cracked gem',
      chapter: ACT3,
      narration: [
        "The sceptre's gem cracks under your blows. The lich screams: its magic escapes through the crack, but its claws are still there.",
      ],
      prompt: 'Finish off the weakened lich.',
      foes: {
        liche: 'The lich with the cracked gem',
      },
    },
    approche: {
      title: 'The castle in the storm',
      chapter: FINAL,
      narration: [
        "The storm breaks over the peak. The vampire's castle, black and red, guards the only door to the heart of Ashpeak. Lightning lights up its towers.",
      ],
      show: "The vampire's castle",
      label: 'Approach the castle',
    },
    chauves_souris: {
      title: 'The black wings',
      chapter: FINAL,
      narration: ['A black cloud drops from the towers: giant bats, dozens of them, going for your throats.'],
      prompt: 'Protect yourselves all the way to the door: you need two successes.',
      reason: 'Cross the swarm of bats',
    },
    nuee: {
      title: 'The swarm',
      chapter: FINAL,
      narration: [
        'The swarm scatters, but two giant bats, as big as horses, dive at you screeching.',
      ],
      prompt: 'Bring down the two giants.',
      foes: {
        'chauve-souris-1': 'The giant bat',
        'chauve-souris-2': 'The red-eyed bat',
      },
    },
    nuee_ko: {
      title: 'Wings and fangs',
      chapter: FINAL,
      narration: [
        'Wings, fangs, claws: you crawl to the great door and slam it behind you.',
      ],
      label: 'Enter the great hall',
    },
    loup_garou: {
      title: 'The gatekeeper',
      chapter: FINAL,
      narration: [
        "Before the door, a figure writhes under the moon and becomes an enormous beast, all fangs and fur. The vampire's werewolf howls at the night.",
      ],
      show: 'The werewolf',
      prompt: 'Bring down the werewolf.',
      foes: {
        'loup-garou': 'The werewolf',
      },
    },
    loup_garou_ko: {
      title: 'Moon fangs',
      chapter: FINAL,
      narration: ['The werewolf leaves you on the ground, torn up, then a whistle calls it inside. The castle door creaks open on its own: you are expected.'],
      label: 'Go in',
    },
    porte_ouverte: {
      title: 'You are expected',
      chapter: FINAL,
      narration: [
        'The great door is open. No guards, no beasts. Just a red carpet, lit candles… and a soft voice: "Do come in. We were expecting you."',
        'In the hall, two vampire spawn smile at you with all their teeth. "The master wants to see you. He didn\'t say in one piece."',
      ],
      prompt: 'Get past the welcoming committee.',
      foes: {
        'rejeton-1': 'The smiling spawn',
        'rejeton-2': 'The clawed spawn',
      },
    },
    porte_ouverte_ko: {
      title: 'Dragged across the carpet',
      chapter: FINAL,
      narration: [
        'The spawn force you to your knees and drag you by the collar to the great hall, like presents. "Master, they are here."',
      ],
      label: 'Raise your head',
    },
    grande_salle: {
      title: 'The vampire lord',
      chapter: FINAL,
      narration: [
        'Beneath the chandeliers, a pale man in black and red raises a goblet to you. Beside him stands Lady Isolde, fan in hand.',
        '"The dragon is already waking, my friends. Once it has burned the kingdom, it will leave the survivors to me. A fair bargain. Would you like to be part of it?"',
      ],
      gmNotes: "The vampire is dangerous in a straight fight. The witch's stake, the blessing or Grokh's horde change everything.",
      show: 'The vampire lord',
      prompt: 'What do you do?',
      options: {
        combat: 'Fight him, here and now',
        pieu: "Drive Mother Mire's stake into his heart",
        benediction: "Raise the priestess's blessing against him",
        orcs: "Sound the horn: Grokh's horde breaks down the doors",
      },
    },
    vampire_combat: {
      title: 'Dance with the vampire',
      chapter: FINAL,
      narration: ['The vampire sets down his goblet and vanishes in a cloud of mist, only to reappear behind you. His two spawn leap down from the balconies.'],
      prompt: 'Strike down the vampire lord before he drains you dry.',
      foes: {
        vampire: 'The vampire lord',
        'rejeton-1': 'A vampire spawn',
        'rejeton-2': 'A vampire spawn',
      },
    },
    vampire_lumiere: {
      title: 'The light of the temple',
      chapter: FINAL,
      narration: ["The priestess's symbol blazes on your forehead. The vampire recoils, hissing, hands over his eyes."],
      prompt: 'Drive him back to the window, toward the dawn: three successes.',
      reason: 'Drive back the vampire with the blessing',
    },
    vampire_horde: {
      title: 'The horde',
      chapter: FINAL,
      narration: [
        "The horn rings out. The castle doors burst under orc axes, and Grokh charges in, roaring. The spawn flee, the vampire falls back.",
        "In the melee, Grokh's axe finds its mark. The vampire lord crumbles into ashes.",
      ],
      label: 'Look for Isolde',
    },
    vampire_morsure: {
      title: 'The bite',
      chapter: FINAL,
      narration: [
        'The vampire is too fast. His fangs find one throat, then another, and you fall one by one onto the red carpet.',
        'But dawn is breaking, and a ray of sunlight pierces a shattered stained-glass window. The vampire screams, bursts into flames, and flees into the depths of the castle.',
      ],
      label: 'Look for Isolde',
    },
    vampire_vaincu: {
      title: "Isolde's escape",
      chapter: FINAL,
      narration: [
        'The master of the castle is no more. Lady Isolde, for her part, has fled down a staircase that sinks into the rock, toward the heart of the mountain.',
        'You follow her down the stairs. Below, galleries dug into the rock, and the sound of claws drawing closer.',
      ],
      label: 'Go down',
    },
    tunnels: {
      title: 'The kobold tunnels',
      chapter: FINAL,
      narration: [
        "Kobolds guard the galleries, led by a red-scaled dragonborn guard. They haven't seen your torch yet.",
      ],
      gmNotes: "The lair's guards: the fight is mandatory, stealth makes it shorter.",
      prompt: 'How do you get through?',
      options: {
        force: 'Charge into the gallery',
        ombre: 'Put out the torch and slip around them in the dark',
      },
    },
    tunnels_ombre: {
      title: 'In the dark',
      chapter: FINAL,
      narration: [
        'No more torch. Just the glow of lava in the distance, and the sound of your hearts.',
      ],
      prompt: 'Move silently through the galleries: you need two successes.',
      reason: 'Slip past the guards in the dark',
    },
    tunnels_combat: {
      title: "The lair's guard",
      chapter: FINAL,
      narration: [
        '"For the Great Red!" The kobolds yelp, and the dragonborn lowers his spear.',
      ],
      prompt: "Break the lair's guard.",
      foes: {
        'kobold-1': 'A kobold with a sling',
        'kobold-2': 'A kobold with a pickaxe',
        drakeide: 'The dragonborn guard',
      },
    },
    tunnels_surprise: {
      title: 'Behind his back',
      chapter: FINAL,
      narration: [
        'The kobolds are snoring in their corner. Only the dragonborn stands guard, and he has his back to you.',
      ],
      prompt: 'Bring down the dragonborn before he wakes the others.',
      foes: {
        drakeide: 'The dragonborn guard',
      },
    },
    tunnels_ko: {
      title: 'Thrown into the gallery',
      chapter: FINAL,
      narration: [
        "The guards leave you for dead at the bottom of a gallery. They're wrong: at the end, an abandoned guardroom awaits you, right above the lair.",
      ],
      label: 'Crawl to the room',
    },
    veillee: {
      title: 'The last vigil',
      chapter: FINAL,
      narration: [
        'An old dwarven guardroom, forgotten above the lair. On a shelf, a red vial still sealed. An hour of silence. You dress your wounds, sharpen your weapons, think of Mistvale, of Aurelia. You are back on your feet.',
        'Beneath your feet, the mountain rumbles. Something immense is breathing.',
      ],
      label: 'Descend toward the dragon',
    },
    repaire: {
      title: "Pyraxis's lair",
      chapter: FINAL,
      narration: [
        'An immense cavern, red with lava. A mountain of gold. And lying on it, a red dragon as big as a cathedral, its eyes still half-closed.',
        'The high priest and Lady Isolde chant before it. With every word, one more scale catches fire. Kobolds and dragonborn guards stand watch.',
      ],
      gmNotes:
        "Pyraxis isn't awake yet. Stopping the ritual puts it back to sleep; Galvan can remake the seal. If it wakes, you must defeat it or bargain with a furious dragon.",
      show: 'Ashpeak',
      prompt: 'Only a few moments left. What do you do?',
      options: {
        rituel: 'Interrupt the ritual',
        pretre: 'Strike down the high priest',
        galvan: 'Let Sir Galvan remake the seal',
        forge: 'Raise the weapons Brunhild forged against the dragon',
        gobelins: "Unleash the king's goblins on the kobolds, and rush the priest",
      },
    },
    repaire_rituel: {
      title: 'The forbidden words',
      chapter: FINAL,
      narration: ['You throw yourselves between the cultists and the dragon, drowning out their voices with your own.'],
      prompt: 'Break the litany: three successes before the chant ends.',
      reason: 'Interrupt the waking ritual',
    },
    repaire_pretre: {
      title: 'The mask falls',
      chapter: FINAL,
      narration: ['You rush the high priest. The kobolds get in the way, the dragonborn raise their spears.'],
      prompt: 'Strike down the high priest before the ritual ends.',
      foes: {
        'grand-pretre': 'The high priest',
        'kobold-1': 'A kobold',
        drakeide: 'The dragonborn guard',
      },
    },
    pretre_tombe: {
      title: 'The high priest falls',
      chapter: FINAL,
      narration: [
        'The high priest collapses, his golden mask rolling across the gold. Isolde screams and flees. But the ritual was almost complete: the dragon opens one eye.',
        '"Who… dares?" The voice of Pyraxis shakes the mountain.',
      ],
      prompt: 'The dragon is looking at you. What do you do?',
      options: {
        parler: 'Talk to it: the cult wanted to make it a slave',
        combat: "Fight it before it's fully awake",
      },
    },
    repaire_forge: {
      title: "Brunhild's steel",
      chapter: FINAL,
      narration: [
        "Brunhild gave you her finest pieces, quenched in the dragon's blood she had kept since childhood. The metal sings as it meets the heat.",
        'Pyraxis, half asleep, rises too slowly. His scales give way beneath that steel.',
      ],
      prompt: 'Strike at the gap in the scales.',
      foes: {
        dragon: 'Pyraxis, half awake',
      },
    },
    eveil: {
      title: 'The awakening',
      chapter: FINAL,
      narration: [
        'Too late. Pyraxis rises, and the cavern lights up. A blast of fire sweeps the cavern: the high priest and Isolde vanish in the flames of their own master. You dove behind the gold, just in time.',
        '"A thousand years of sleep… and this is what I am offered on waking?"',
      ],
      show: 'Pyraxis, the red dragon',
      prompt: 'Pyraxis is awake. What do you do?',
      options: {
        parler: 'Talk to it, despite everything',
        combat: 'Fight it to the end',
        fuir: 'Flee to warn the kingdom',
      },
    },
    dragon_parler: {
      title: 'Talking to the dragon',
      chapter: FINAL,
      narration: ['You lower your weapons. The dragon tilts its immense head toward you. Its breath smells of sulfur and embers.'],
      prompt: 'Convince Pyraxis: three arguments that strike home.',
      reason: 'Bargain with Pyraxis',
    },
    dragon_combat: {
      title: 'Against the dragon',
      chapter: FINAL,
      narration: ['Pyraxis spreads its wings. The whole cavern becomes a battlefield of lava and gold.'],
      prompt: 'Bring down Pyraxis.',
      foes: {
        dragon: 'Pyraxis, the red dragon',
      },
    },
    fin_sceau: {
      title: "Galvan's seal",
      chapter: FINAL,
      narration: [
        'Sir Galvan steps forward, his spectral sword raised. He traces in the air the seal he traced a thousand years ago. The cultists scream, the lava freezes, and the dragon closes its eye.',
        '"My oath is fulfilled," the knight murmurs, and he fades into the light. The cult is broken, Isolde is captured, and Pyraxis will sleep for another thousand years.',
      ],
      end: 'The seal is remade',
    },
    fin_sommeil: {
      title: 'Sleep, Pyraxis',
      chapter: FINAL,
      narration: [
        "The litany breaks. The dragon's scales go out one by one, and Pyraxis lets out a long sigh of smoke before falling back asleep on its gold.",
        'The high priest is captured, and Isolde too. In Aurelia, the king has every bell rung. Your names are engraved beneath the golden lion.',
      ],
      end: 'The dragon sleeps on',
    },
    fin_pacte: {
      title: "The dragon's pact",
      chapter: FINAL,
      narration: [
        'Pyraxis listens to you for a long time. Then it laughs, a laugh that shakes the mountain. "Slaves! They wanted to make me their hunting dog."',
        'The dragon flies off through the summit of Ashpeak, carrying the cult away in its claws. It will not return, it promises, as long as the kingdom keeps its word: never touch its gold. A strange treaty, but a treaty all the same.',
      ],
      end: 'A pact with Pyraxis',
    },
    fin_victoire: {
      title: 'The fall of the dragon',
      chapter: FINAL,
      narration: [
        'The blow lands. Pyraxis roars one last time and collapses onto its gold with a crash of thunder. The lava calms. Silence returns beneath the mountain.',
        'The bards will long sing the tale of the dragonslayers. With a treasure like that, Mistvale will get a new tavern, and the kingdom will have heroes for a long time to come.',
      ],
      end: 'Pyraxis is defeated',
    },
    fin_retraite: {
      title: 'The red sky',
      chapter: FINAL,
      narration: [
        'Beaten or fleeing, you leave the cavern through the tunnels, the heat at your backs. Behind you, Pyraxis takes flight above Ashpeak, and the sky turns red.',
        'You survived. The kingdom is warned, and the armies gather beneath the golden lion. The war against the dragon has only just begun… To be continued!',
      ],
      end: 'The dragon is free',
    },
  },
}
