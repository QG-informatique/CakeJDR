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
      reason: 'Rout the bandits',
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
        'She tosses you their letter of orders, sealed with an eye in a flame, and vanishes with her gang. The road is clear.',
      ],
      label: 'March toward the goblin camp',
    },
    bandits_blesses: {
      title: 'Bolts and clubs',
      chapter: ACT1,
      narration: [
        "A crossbow bolt grazes you, a club blow doesn't miss: everyone loses 3 HP.",
        'The bandits finally make off with two sacks of trinkets. The peddler, for his part, shows you goblin tracks heading into the woods.',
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
      prompt: 'Drive the wolves off before they charge.',
      reason: 'Drive off the dark wolves',
    },
    loups_fuient: {
      title: 'The wolves bolt',
      chapter: ACT1,
      narration: ['A waved torch, a shout, a well-thrown stone: the wolves run off toward the forest. All you have to do is follow them.'],
      label: 'Follow the wolves into the forest',
    },
    loups_mordent: {
      title: 'Fangs and claws',
      chapter: ACT1,
      narration: ['The wolves leap first. Fangs, claws, a confused brawl: everyone loses 3 HP before the pack flees toward the forest.'],
      label: 'Follow the wolves into the forest',
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
      },
    },
    camp_assaut: {
      title: 'Charge!',
      chapter: ACT1,
      narration: ['You smash through the palisade gate. The goblins grab their spears, squealing.'],
      prompt: 'Sweep the goblins aside.',
      reason: 'Storm the camp',
    },
    camp_nuit: {
      title: 'Quiet as a wolf',
      chapter: ACT1,
      narration: ['Night falls. The fires die down, the snoring rises. You creep along the palisade to the cage.'],
      prompt: 'Get closer without a sound.',
      reason: 'Sneak into the sleeping camp',
    },
    camp_fumee: {
      title: "The shaman's smoke",
      chapter: ACT1,
      narration: [
        'The shaman has spotted you. He blows into his staff: a green smoke stings your eyes, and spears rain down. Everyone loses 4 HP.',
        'In the confusion, you still manage to break the cage. The dwarf grabs your arm: "This way, to their king\'s cave!"',
      ],
      label: 'Run to the cave',
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
      narration: ['The goblin king steps down from his throne, swinging a mace bristling with nails.'],
      prompt: 'Bring down the goblin king.',
      reason: 'Defeat the goblin king',
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
        "Everything goes wrong: the king's mace, the cultist's daggers, goblins rushing in. Everyone loses 5 HP.",
        'You win in the end, out of breath. The goblin king escapes into the tunnels; the cultist was not so lucky.',
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
        'Mistvale celebrates you all night long. The mayor entrusts you with a letter for the king, and at last everyone gets a real night\'s sleep: you are back on your feet.',
        'In the morning, the road to the royal city awaits.',
      ],
      label: 'Set off for the royal city',
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
        'The king listens in silence, his hand on the pommel of his sword. To his right, the captain of the guard. To his left, the court mage, buried in a book.',
        'Near the throne, a lady with a fan smiles politely. "Goblins, bandits… Majesty, these are country tales."',
      ],
      gmNotes: 'Lady Isolde, the lady with the fan, is the "Lady" of the medallion: she leads the cult at court. Showing the medallion in front of her alerts her.',
      show: 'The king of Aurelion',
      prompt: 'What do you do with the medallion?',
      options: {
        cour: 'Show it to the king, in front of the whole court',
        capitaine: 'Show it secretly to the captain of the guard',
        rien: 'Say nothing and investigate the city on your own',
      },
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
      ],
      show: 'The alchemist',
      label: 'Think about what comes next',
    },
    rues_embuscade: {
      title: 'The masks',
      chapter: ACT2,
      narration: ['An alley that is too quiet. Two masked figures, curved daggers in hand, drop on you from the rooftops. Someone knows you are here.'],
      prompt: 'Turn the ambush around.',
      reason: "Foil the fanatics' ambush",
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
        'The daggers are fast and poisoned: everyone loses 4 HP. The fanatics vanish over the rooftops, leaving a strong smell of sulfur behind them.',
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
      show: 'Captain Mara',
      prompt: 'Slip into the warehouse.',
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
      title: 'Brawl on the docks',
      chapter: ACT2,
      narration: [
        'A barrel rolls, a cultist shouts. A brawl on the docks: everyone loses 3 HP, but Mara and her sailors clear the way for you.',
        'You dive through the trapdoor before reinforcements arrive.',
      ],
      label: 'Go down',
    },
    egouts: {
      title: 'The sewers',
      chapter: ACT2,
      narration: [
        'Dirty water laps beneath the vaults. The smell of sulfur becomes unbearable. Shrill laughter echoes: little winged demons are playing with rats.',
      ],
      prompt: 'Find the right tunnel without waking the whole brood.',
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
      narration: [
        'One misstep in the water, and the whole brood of imps falls on you, biting and scratching. Everyone loses 3 HP before finding the sanctuary door.',
      ],
      label: 'Push the door open',
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
      },
    },
    rituel: {
      title: 'The purple circle',
      chapter: ACT2,
      narration: ["You throw yourselves onto the circle's runes. They burn beneath your fingers."],
      prompt: 'Erase the right runes.',
      reason: 'Break the summoning circle',
    },
    pretre: {
      title: 'The golden mask',
      chapter: ACT2,
      narration: ['The high priest sees you coming and raises his hands. He only needs a few more words to finish.'],
      prompt: 'Strike before the last syllable.',
      reason: 'Interrupt the high priest',
    },
    demon: {
      title: 'The horned demon',
      chapter: ACT2,
      narration: [
        'Too late. The circle explodes, and a horned demon, as tall as two men, steps out of the flames with a roar. Its first blow sends you flying: everyone loses 5 HP.',
        'The fight is terrible. When the demon finally collapses into ashes, the high priest has vanished through a passage of fire.',
      ],
      show: 'The horned demon',
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
      prompt: 'Hold on under the snow.',
      reason: 'Survive the avalanche',
    },
    col_ensevelis: {
      title: 'Buried',
      chapter: ACT3,
      narration: [
        'The snow rolls you, crushes you, chills you to the bone. Everyone loses 4 HP before digging toward the light… right in front of the stakes of an orc camp.',
      ],
      label: 'Get back up',
    },
    col_patrouille: {
      title: 'The patrol',
      chapter: ACT3,
      narration: ['Figures in the storm: two orcs painted red and an ogre dragging a tree trunk as a club.'],
      prompt: 'Stand up to the patrol.',
      reason: 'Drive off the orc patrol',
    },
    col_ogre: {
      title: "The ogre's trunk",
      chapter: ACT3,
      narration: ["The ogre's trunk sweeps away everything in its path: everyone loses 4 HP. The orcs tie you up and drag you to their chief."],
      label: 'Let them take you',
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
      narration: ['The orcs form a circle and beat on their shields. Grokh twirls his axe, laughing.'],
      prompt: 'Hold your ground against Grokh.',
      reason: 'Duel against Grokh',
    },
    orc_parler: {
      title: 'Talking to the orcs',
      chapter: ACT3,
      narration: [
        "You speak of the dragon, of the flames, of the villages that will burn, the orcs' as much as anyone's. The shaman listens, eyes half-closed.",
      ],
      prompt: 'Find words that strike home.',
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
        "Grokh isn't convinced. Punches, blows from axe handles: everyone loses 5 HP. You are thrown out of the camp, onto the road to the bridge.",
      ],
      label: 'Set off again, aching',
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
      prompt: 'Push!',
      reason: 'Push the troll into the torrent',
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
        "The troll ends up in the torrent, or sitting there scratching his head: no matter, the bridge is yours. Beyond, on a peak, the vampire's castle stands out against the storm.",
      ],
      label: 'March toward the castle',
    },
    pont_coups: {
      title: "The troll's club",
      chapter: ACT3,
      narration: [
        "The troll's club shakes the bridge: everyone loses 4 HP. You finally run across while he looks for his teeth in the torrent.",
      ],
      label: 'March toward the castle',
    },
    marais: {
      title: 'The marsh',
      chapter: ACT3,
      narration: [
        "Rotten boardwalks, bubbling green water, trees covered in moss. The horses refuse to go any further. The witch's hut lies at the heart of the marsh.",
      ],
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
      prompt: 'Keep your balance and strike.',
      reason: 'Drive back the lizardfolk',
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
      narration: ['"The old woman… she scares us too," hisses the tallest. They lead you along a dry path to the hut on stilts.'],
      label: 'Knock on the door',
    },
    marais_araignees: {
      title: 'The marsh webs',
      chapter: ACT3,
      narration: ['Between the trees, webs as thick as ship sails. Two giant spiders watch you with their eight eyes.'],
      prompt: 'Cross without getting caught.',
      reason: 'Cross the spider wood',
    },
    marais_morsures: {
      title: 'Bites and venom',
      chapter: ACT3,
      narration: ["Bites, venom, stagnant water: everyone loses 4 HP before arriving, soaked, at the witch's hut."],
      label: 'Knock on the door',
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
      narration: ['You draw your weapons. Mother Mire whistles through her teeth, and a moss-covered troll crawls out from under the hut.'],
      prompt: 'Get past the troll and grab the stake.',
      reason: 'Take the stake by force',
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
      narration: ['The skeletons advance in tight ranks, rusty swords raised.'],
      prompt: 'Break their ranks.',
      reason: 'Get past the skeletons',
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
        'A ghoul bursts from a sarcophagus while you fight the skeletons. Its claws paralyse: everyone loses 4 HP before sending it back to its tomb.',
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
      prompt: "Break the necromancer's bond with your words.",
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
      narration: [
        'The bond is too strong. The spectral sword passes through armour and shields: everyone loses 4 HP before Galvan fades away, moaning.',
      ],
      label: 'Open the portcullis',
    },
    necromancien: {
      title: 'The necromancer',
      chapter: ACT3,
      narration: [
        'Behind the portcullis, a staircase climbs to a round room full of books. A man in a black robe raises a glowing skull. "The cult promised me no one would come."',
      ],
      show: 'The necromancer',
      prompt: 'Wrench the glowing skull from him.',
      reason: 'Disarm the necromancer',
    },
    liche: {
      title: 'The lich',
      chapter: ACT3,
      narration: [
        "It isn't a necromancer waiting for you, but his master: a crowned lich with eyes of blue flame. It hasn't spoken in a hundred years, and its voice freezes the air.",
        '"You have come to die. Good."',
      ],
      show: 'The crowned lich',
      prompt: 'Shatter its phylactery, the gem in its sceptre.',
      reason: "Shatter the lich's phylactery",
    },
    crypte_maudits: {
      title: 'The magic of the dead',
      chapter: ACT3,
      narration: ['A green bolt chills your blood: everyone loses 5 HP. The fight drags on, but your foe finally crumbles into dust.'],
      label: 'Find the way out',
    },
    crypte_sortie: {
      title: 'Under the mountain',
      chapter: ACT3,
      narration: [
        "Behind the tower, a long tunnel climbs northward. When you come out, night is falling, and the vampire's castle rises on its peak, right in front of you.",
      ],
      label: 'March toward the castle',
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
      prompt: 'Protect yourselves all the way to the door.',
      reason: 'Cross the swarm of bats',
    },
    nuee: {
      title: 'The swarm',
      chapter: FINAL,
      narration: ['Wings, fangs, claws: everyone loses 3 HP before slamming the great door behind you.'],
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
      reason: 'Defeat the werewolf',
    },
    loup_garou_ko: {
      title: 'Moon fangs',
      chapter: FINAL,
      narration: ['The werewolf tears into you before it falls: everyone loses 4 HP. The castle door creaks open on its own.'],
      label: 'Go in',
    },
    porte_ouverte: {
      title: 'You are expected',
      chapter: FINAL,
      narration: [
        'The great door is open. No guards, no beasts. Just a red carpet, lit candles… and a soft voice: "Do come in. We were expecting you."',
      ],
      label: 'Go in',
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
      narration: ['The vampire sets down his goblet and vanishes in a cloud of mist, only to reappear behind you.'],
      prompt: 'Hit him before he drains you dry.',
      reason: 'Defeat the vampire lord',
    },
    vampire_lumiere: {
      title: 'The light of the temple',
      chapter: FINAL,
      narration: ["The priestess's symbol blazes on your forehead. The vampire recoils, hissing, hands over his eyes."],
      prompt: 'Drive him back to the window, toward the dawn.',
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
        'The vampire is too fast. His fangs find one throat, then another: everyone loses 6 HP.',
        'But dawn is breaking, and a ray of sunlight pierces a shattered stained-glass window. The vampire screams, bursts into flames, and flees into the depths of the castle.',
      ],
      label: 'Look for Isolde',
    },
    vampire_vaincu: {
      title: "Isolde's escape",
      chapter: FINAL,
      narration: [
        'The master of the castle is no more. Lady Isolde, for her part, has fled down a staircase that sinks into the rock, toward the heart of the mountain.',
        'You find an empty bedroom, beds, supplies. An hour of rest before the final descent.',
      ],
      label: 'Rest',
    },
    veillee: {
      title: 'The last vigil',
      chapter: FINAL,
      narration: [
        'An hour of silence. You dress your wounds, sharpen your weapons, think of Mistvale, of Aurelia. You are back on your feet.',
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
      prompt: 'Break the litany.',
      reason: 'Interrupt the waking ritual',
    },
    repaire_pretre: {
      title: 'The mask falls',
      chapter: FINAL,
      narration: ['You rush the high priest. The kobolds get in the way, the dragonborn raise their spears.'],
      prompt: 'Reach the high priest.',
      reason: 'Strike down the high priest',
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
      ],
      prompt: 'Strike at the gap in the scales.',
      reason: "Strike the dragon with Brunhild's steel",
    },
    eveil: {
      title: 'The awakening',
      chapter: FINAL,
      narration: [
        'Too late. Pyraxis rises, and the cavern lights up. A blast of fire sweeps everything: everyone loses 6 HP. The high priest and Isolde vanish in the flames of their own master.',
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
      prompt: 'Convince Pyraxis.',
      reason: 'Bargain with Pyraxis',
    },
    dragon_combat: {
      title: 'Against the dragon',
      chapter: FINAL,
      narration: ['Pyraxis spreads its wings. The whole cavern becomes a battlefield of lava and gold.'],
      prompt: 'The blow that will decide everything.',
      reason: 'Defeat Pyraxis',
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
        'You flee through the tunnels, the heat at your backs. Behind you, Pyraxis takes flight above Ashpeak, and the sky turns red.',
        'You survived. The kingdom is warned, and the armies gather beneath the golden lion. The war against the dragon has only just begun… To be continued!',
      ],
      end: 'The dragon is free',
    },
  },
}
