import type { AdventureText } from '../types'

const CH_SHOP = 'The shop'
const CH_CELLAR = 'The cellar'
const CH_OVEN = 'The old oven'
const CH_MORNING = 'At daybreak'

const RYE_CLUE = 'Rye flour is a feast for sourdough starters: a whole sack would calm even the biggest one.'

/** « La fournée maudite » en anglais (`lib/autoGm/cakeDemo.ts`). */
export const CAKE_DEMO_EN: AdventureText = {
  title: 'The Cursed Batch',
  pitch: 'A half-hour adventure with Cake, the baker mage: three fights, traps, finds and five endings. The automatic GM tells the story, you choose, you roll the dice and you fight.',
  scenes: {
    alerte: {
      chapter: CH_SHOP,
      title: 'The alarm',
      narration: [
        "Five in the morning, in Cake's bakery. The oven is asleep, and the shop still smells of yesterday's brioche.",
        'Mila, your apprentice, bursts in wearing her nightgown, flour all over her hair: "Cake! There\'s noise in the cellar… and the sourdough starters have vanished from their jars!"',
      ],
      gmNotes:
        'Secret: last night, Mila opened Cake\'s old spellbook and relit the cellar oven to try a forbidden recipe, the "bread that rises all by itself". The heat woke the starters, the old Mother Starter with them, and the failed batch became the Burnt Crumb Golem. If someone gets her talking, she confesses and gives two useful clues. The storeroom hides something to heal with and a sack of rye flour, a feast for the starters.',
      prompt: 'What do you do?',
      options: {
        cave: 'Go down to the cellar right away',
        mila: 'Get Mila to talk first',
        reserve: 'Search the storeroom before going down',
      },
      notes: {
        cave: 'a smell of burnt bread rises through the trapdoor',
        mila: 'Mila has flour all the way up in her hair',
        reserve: 'you never know what waits down there',
      },
    },
    mila: {
      chapter: CH_SHOP,
      title: 'Mila is hiding something',
      narration: ['Mila twists her fingers and avoids your eyes. She knows something, that much is certain.'],
      gmNotes: 'Success: Mila confesses and gives the blessed salt, the idea about the oven and a potion. Failure: she keeps quiet.',
      prompt: 'Convince Mila to tell you everything.',
      reason: 'Get Mila to talk',
    },
    mila_aveu: {
      chapter: CH_SHOP,
      title: "Mila's confession",
      narration: [
        'Mila cracks: "I opened your spellbook… I relit the old cellar oven to make the bread that rises by itself. It went wrong."',
        'She hands you a small pouch: "Blessed salt. Your grandmother used to say it calms the starters. And if we put out the oven, maybe the magic stops."',
        'She rummages under the counter and adds a pink vial: "A healing potion. Just in case."',
      ],
      clues: {
        sel: "Grandmother's blessed salt calms the starters.",
        four: 'Mila relit the old cellar oven: putting it out might stop the magic.',
      },
      label: 'Think about what comes next',
    },
    mila_muette: {
      chapter: CH_SHOP,
      title: 'Mila keeps quiet',
      narration: ['"I didn\'t do anything, I swear!" Mila runs off to hide behind the counter.', 'Beneath your feet, a rumble shakes the shelves.'],
      label: 'Think about what comes next',
    },
    reserve: {
      chapter: CH_SHOP,
      title: 'The storeroom',
      narration: [
        'Behind the shop, the storeroom overflows with sacks, jars and cake tins stacked up to the ceiling.',
        'It is dark, and all this clutter only stays up by some miracle. You feel your way along the shelves.',
      ],
      gmNotes: 'A random draw: a potion, the sack of rye flour (which calms the Mother Starter), or the shelf collapsing (2 HP, but the sack is underneath).',
      label: 'Search the shelves',
    },
    reserve_potion: {
      chapter: CH_SHOP,
      title: 'A forgotten vial',
      narration: [
        'Behind a jar of candied cherries, your fingers find a small, warm pink vial.',
        'A healing potion, made by your own hand. You had completely forgotten about it.',
      ],
      label: 'Back to the counter',
    },
    reserve_farine: {
      chapter: CH_SHOP,
      title: 'The sack of rye',
      clues: { farine: RYE_CLUE },
      narration: [
        'At the very back, an old sack of rye flour, the starters\' favourite. Your grandmother always kept one "for the days the dough sulks".',
        'You heave it onto your shoulder. It is heavy.',
      ],
      label: 'Back to the counter',
    },
    reserve_etagere: {
      chapter: CH_SHOP,
      title: 'Crash!',
      clues: { farine: RYE_CLUE },
      narration: [
        'You pull on a stuck sack… and the whole shelf comes down on you in a clatter of cake tins. You lose 2 HP.',
        'You get up, coughing. At least the sack is finally free: rye flour, a feast for the starters.',
      ],
      label: 'Back to the counter',
    },
    comptoir: {
      chapter: CH_SHOP,
      title: 'At the counter',
      narration: [
        'Another rumble rises from the cellar. The cups jingle on their hooks.',
        'Mila hugs her broom and looks at you, ready to follow you to the trapdoor.',
      ],
      prompt: 'What now?',
      options: {
        cave: 'Go down to the cellar',
        mila: 'Get Mila to talk',
        reserve: 'Search the storeroom',
      },
    },
    escalier: {
      chapter: CH_CELLAR,
      title: 'The sticky stairs',
      narration: [
        'You lift the trapdoor. The cellar stairs are covered in raw dough, sticky as honey.',
        'The steps creak and cling to your soles. Down below, a red glow dances at the far end.',
      ],
      prompt: 'Get down without slipping.',
      reason: 'Climb down the sticky stairs',
    },
    escalier_chute: {
      chapter: CH_CELLAR,
      title: 'The slip',
      narration: ['Your foot shoots forward. You slide down the last steps on your back and land in a cloud of flour. You lose 2 HP.'],
      label: 'Get back up',
    },
    cave: {
      chapter: CH_CELLAR,
      title: 'The flour cellar',
      narration: [
        'Down below, the flour cellar smells of burnt bread. Trails of dough lead toward the back.',
        'Two hungry starters crawl toward you, snapping their dough. They are very hungry.',
      ],
      gmNotes: "The starters aren't evil, just hungry. The blessed salt puts them back to sleep without a fight.",
      clues: { faim: 'The starters only bite because they are hungry.' },
      prompt: 'How do you get past the starters?',
      options: {
        attaque: 'Fight them',
        leurre: 'Lure them away with Tempting Scent',
        sel: "Throw Mila's blessed salt at them",
      },
      notes: {
        leurre: 'the starters are already sniffing in your direction',
      },
    },
    combat_levains: {
      chapter: CH_CELLAR,
      title: 'The starters attack',
      narration: ['Both starters puff up, rear and charge at you, snapping their dough.'],
      prompt: 'Fight the hungry starters.',
      foes: { 'levain-1': 'Hungry starter', 'levain-2': 'Greedy starter' },
    },
    leurre: {
      chapter: CH_CELLAR,
      title: 'Tempting Scent',
      narration: ['You snap your fingers: a delicious smell of warm croissant drifts toward the far corner of the cellar.'],
      gmNotes: 'Two successes: both starters run off. Only one: one follows the scent, the other attacks. None: they bite.',
      prompt: 'Send the scent to the right spot: you need two successes.',
      reason: 'Tempting Scent to lure the starters',
    },
    levain_seul: {
      chapter: CH_CELLAR,
      title: 'A stubborn starter',
      narration: ["The greedy starter runs toward the smell. But the other one isn't fooled: it swells, growls and blocks your way."],
      prompt: 'Get rid of the stubborn starter.',
      foes: { 'levain-1': 'Stubborn starter' },
    },
    sel_levains: {
      chapter: CH_CELLAR,
      title: 'The blessed salt',
      narration: [
        'A pinch of blessed salt, and the starters freeze. They yawn, curl up… and turn back into two well-behaved lumps of dough.',
        'You put them back in their jars and tuck them under your arm. At the back of the cellar, something rumbles.',
      ],
      label: 'Go deeper into the cellar',
    },
    levains_vaincus: {
      chapter: CH_CELLAR,
      title: 'Starters defeated',
      narration: [
        'The last starter collapses into a small lukewarm puddle. Nothing moves anymore.',
        'Between two flour sacks, you find a fire flask from your own supplies: it could come in handy.',
      ],
      label: 'Go deeper into the cellar',
    },
    levains_contournes: {
      chapter: CH_CELLAR,
      title: 'Starters distracted',
      narration: ['The starters scramble toward the smell, shoving each other. You tiptoe past behind them.'],
      label: 'Go deeper into the cellar',
    },
    levains_mordent: {
      chapter: CH_CELLAR,
      title: 'It bites',
      narration: [
        'Missed! A starter leaps at your ankle and bites down with all its doughy teeth. You lose 3 HP.',
        'You finally shake it off with a flick of your apron. They flee under the flour sacks.',
      ],
      label: 'Go deeper into the cellar',
    },
    levains_ko: {
      chapter: CH_CELLAR,
      title: 'Stuck in dough',
      narration: [
        'The starters knock you over and smother you in sticky dough. You end up on the floor in the flour, out of breath.',
        'Full at last, they fall asleep on top of you. You wriggle free, drink a sip of water and get a little strength back.',
      ],
      label: 'Go deeper into the cellar',
    },
    couloir: {
      chapter: CH_CELLAR,
      title: 'Between the sacks',
      narration: [
        'A narrow passage winds between walls of stacked flour sacks. The red glow grows, and so does the heat.',
        'Somewhere ahead, an enormous snore makes the white dust tremble.',
      ],
      gmNotes: "A random draw: falling sacks (2 HP), grandmother's pantry (a potion), or the sack of rye if it wasn't found upstairs.",
      label: 'Walk between the sacks',
    },
    couloir_sacs: {
      chapter: CH_CELLAR,
      title: 'Flour avalanche',
      narration: [
        'Your shoulder brushes a pile of sacks. It wobbles… and comes down on you in a white explosion. You lose 2 HP.',
        'You come out of it white as a ghost, sneezing.',
      ],
      label: 'Follow the snoring',
    },
    couloir_cellier: {
      chapter: CH_CELLAR,
      title: "Grandmother's pantry",
      narration: ["Behind a low door, you find your grandmother's little pantry: jams, dried herbs… and a neatly stored healing potion."],
      label: 'Follow the snoring',
    },
    couloir_farine: {
      chapter: CH_CELLAR,
      title: 'A sack of rye',
      clues: { farine: RYE_CLUE },
      narration: [
        'A torn sack spills flour darker than the others: rye, a feast for the starters.',
        'You close the sack and take it with you. It might come in handy.',
      ],
      label: 'Follow the snoring',
    },
    mere_levain: {
      chapter: CH_OVEN,
      title: 'The Mother Starter',
      narration: [
        'The passage opens onto a mass of dough as big as a cart, snoring as it swells and shrinks. The Mother Starter, the oldest dough in the house.',
        'She blocks the way to the oven. As you approach, she opens an eye made of bubbles and growls.',
      ],
      gmNotes:
        'The Mother Starter is a hundred years old: she protects her little ones and she is hungry. The sack of rye feeds her, the rescued little starters reassure her. Otherwise you have to fight, or sneak past. Once she is a friend, she helps against the Golem.',
      clues: { mere: 'The Mother Starter protects her little ones, and she is starving.' },
      show: 'The Mother Starter',
      prompt: 'How do you get past the Mother Starter?',
      options: {
        combat: 'Fight her',
        farine: 'Offer her the sack of rye',
        petits: 'Give her little starters back',
        passer: 'Sneak past while she dozes',
      },
      notes: {
        combat: 'she sometimes strikes twice',
      },
    },
    combat_mere: {
      chapter: CH_OVEN,
      title: "The Mother Starter's wrath",
      narration: ['The Mother Starter rises, huge, and brings two arms of sticky dough down on you.'],
      gmNotes: "She strikes once or twice per round. Losing doesn't end the game: you wake up and carry on.",
      prompt: 'Stand up to the Mother Starter.',
      foes: { mere: 'Mother Starter' },
    },
    mere_contourner: {
      chapter: CH_OVEN,
      title: 'On tiptoe',
      narration: ['You hold your breath and edge along the wall, one step away from the huge snoring dough.'],
      prompt: 'Get past without waking her.',
      reason: 'Sneak past the Mother Starter',
    },
    mere_nourrie: {
      chapter: CH_OVEN,
      title: 'A rye feast',
      narration: [
        'You rip the sack open in front of her. The Mother Starter gulps down the rye with a loud bubbling noise, then lets out a happy doughy sigh.',
        'Full, she shifts aside… and follows you with her eyes, like a big grateful dog.',
      ],
      label: 'Approach the oven',
    },
    mere_apaisee: {
      chapter: CH_OVEN,
      title: 'The family reunited',
      narration: [
        'You set the two jars down in front of her. The little starters climb out, chirping, and snuggle up against their mother.',
        'The Mother Starter purrs, all soft. She moves aside to let you pass, and watches you gratefully.',
      ],
      label: 'Approach the oven',
    },
    mere_vaincue: {
      chapter: CH_OVEN,
      title: 'The Mother Starter deflates',
      narration: [
        'The Mother Starter deflates all at once, like a brioche taken out of the oven too early, and falls asleep, snoring softly.',
        'You catch your breath against a flour sack before going on.',
      ],
      label: 'Approach the oven',
    },
    mere_ko: {
      chapter: CH_OVEN,
      title: 'Squashed under the dough',
      narration: [
        'The Mother Starter sits on you. Everything turns soft and warm… and you doze off for a moment under the dough.',
        'When you wriggle free, she is snoring, pleased with her win. You use the moment to slip past.',
      ],
      label: 'Approach the oven',
    },
    golem: {
      chapter: CH_OVEN,
      title: 'The Burnt Crumb Golem',
      narration: [
        'At the back of the cellar, the old oven stands wide open, red as an ember. A mountain of blackened crumb pulls itself out, rumbling.',
        "The Burnt Crumb Golem rises before you. It smells of charred crust, and it doesn't look happy.",
      ],
      gmNotes:
        "The Golem draws its strength from the lit oven. Putting it out undoes it without a fight. It isn't bad: it was born from a failed batch and it is scared. Talking to it kindly can make it a friend. If the Mother Starter became a friend, she can smother it in dough and weaken it.",
      clues: { peur: 'The Golem rumbles, but it backs away from the light: it is scared.' },
      show: 'Burnt Crumb Golem',
      prompt: 'What do you do against the Golem?',
      options: {
        combat: 'Attack it head-on',
        parler: 'Talk to it, baker to bread',
        four: 'Sneak to the oven and put it out',
        mere: 'Call the Mother Starter for help',
      },
      notes: {
        combat: 'it is tough, keep your potions at hand',
      },
    },
    golem_combat: {
      chapter: CH_OVEN,
      title: 'Fighting the Golem',
      narration: ['The Golem raises its fists of burnt crust. The cellar floor shakes with every step it takes.'],
      gmNotes: 'A boss fight: the potions and the fire flask come in handy here. Fleeing leads back to the shop.',
      prompt: 'Bring the Golem down.',
      foes: { golem: 'Burnt Crumb Golem' },
    },
    golem_englue: {
      chapter: CH_OVEN,
      title: 'The Mother Starter to the rescue',
      narration: [
        'You whistle. The Mother Starter bursts out behind you and throws herself onto the Golem, wrapping it in dough up to the shoulders.',
        "Stuck, the Golem struggles in slow motion. It's now or never!",
      ],
      prompt: 'Strike the Golem while it is stuck.',
      foes: { golem: 'Stuck Golem' },
    },
    golem_parler: {
      chapter: CH_OVEN,
      title: 'Talking to the Golem',
      narration: ['You put down your rolling pin and raise your hands. "Easy now… I\'ve botched a batch too."'],
      prompt: 'Find the words that calm it down.',
      reason: 'Calm the Golem',
    },
    four: {
      chapter: CH_OVEN,
      title: 'Putting out the oven',
      narration: ['You slip along the wall, between the flour sacks, all the way to the scorching oven door.'],
      prompt: 'Get there without being caught.',
      reason: 'Reach the oven without getting caught',
    },
    fin_victoire: {
      chapter: CH_MORNING,
      title: 'Victory!',
      narration: [
        'The Golem collapses in a shower of warm crumbs. The oven goes out with a sigh.',
        'At sunrise, the shop smells of fresh bread. Mila sweeps the cellar, promising never to touch the spellbook again.',
      ],
      end: 'The Golem is defeated',
    },
    fin_amitie: {
      chapter: CH_MORNING,
      title: 'A new shop hand',
      narration: [
        'The Golem lowers its head and lets out a long sigh of steam. It was only scared.',
        "The very next day, it kneads dough like no one else. Cake's bakery has a new shop hand: a little burnt, very kind.",
      ],
      end: 'The Golem becomes your friend',
    },
    fin_four: {
      chapter: CH_MORNING,
      title: 'The oven goes out',
      narration: [
        'You slam the oven door. The red glow fades, and the Golem turns back into… a huge loaf of bread, all golden.',
        'You share it with the whole neighbourhood. No one has ever eaten such good bread.',
      ],
      end: 'The magic is gone',
    },
    fin_fuite: {
      chapter: CH_MORNING,
      title: 'Strategic retreat',
      narration: [
        'You rush upstairs two steps at a time and barricade the cellar door with a sack of flour.',
        'Down below, the Golem is still rumbling. You will have to come back, better prepared… To be continued!',
      ],
      end: 'The Golem waits below',
    },
    fin_ko: {
      chapter: CH_MORNING,
      title: 'Saved by Mila',
      narration: [
        'Everything goes dark. When you open your eyes again, Mila is dragging you up the stairs by your apron, and she slams the cellar trapdoor shut.',
        'Down below, the Golem is still rumbling. Mila hands you a cup of hot chocolate: "We\'ll go back together." To be continued!',
      ],
      end: 'The Golem won… this time',
    },
  },
}
