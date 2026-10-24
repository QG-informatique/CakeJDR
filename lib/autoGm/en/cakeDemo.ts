import type { AdventureText } from '../types'

/** « La fournée maudite » en anglais (`lib/autoGm/cakeDemo.ts`). */
export const CAKE_DEMO_EN: AdventureText = {
  title: 'The Cursed Batch',
  pitch: 'A short fifteen-minute adventure with Cake, the baker mage. The automatic GM tells the story, you choose, you roll the dice and you fight.',
  scenes: {
    alerte: {
      title: 'The alarm',
      narration: [
        "Five in the morning, in Cake's bakery. The oven is asleep, and the shop still smells of yesterday's brioche.",
        'Mila, your apprentice, bursts in wearing her nightgown, flour all over her hair: "Cake! There\'s noise in the cellar… and the sourdough starters have vanished from their jars!"',
      ],
      gmNotes:
        'Secret: last night, Mila opened Cake\'s old spellbook and relit the cellar oven to try a forbidden recipe, the "bread that rises all by itself". The heat woke the starters, and the failed batch became the Burnt Crumb Golem. If someone gets her talking, she confesses and gives two useful clues.',
      prompt: 'What do you do?',
      options: {
        cave: 'Go down to the cellar right away',
        mila: 'Get Mila to talk first',
      },
      notes: {
        cave: 'a smell of burnt bread rises through the trapdoor',
        mila: 'Mila has flour all the way up in her hair',
      },
    },
    mila: {
      title: 'Mila is hiding something',
      narration: ['Mila twists her fingers and avoids your eyes. She knows something, that much is certain.'],
      gmNotes: 'Success: Mila confesses and gives the blessed salt and the idea about the oven. Failure: she keeps quiet, and you go down without a clue.',
      prompt: 'Convince Mila to tell you everything.',
      reason: 'Get Mila to talk',
    },
    mila_aveu: {
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
      label: 'Go down to the cellar',
    },
    mila_muette: {
      title: 'Mila keeps quiet',
      narration: ['"I didn\'t do anything, I swear!" Mila runs off to hide behind the counter.', 'Beneath your feet, a rumble shakes the shelves.'],
      label: 'Go down to the cellar',
    },
    cave: {
      title: 'The flour cellar',
      narration: [
        'The stairs creak. Down below, the flour cellar smells of burnt bread, and a red glow dances at the far end.',
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
      title: 'The starters attack',
      narration: ['Both starters puff up, rear and charge at you, snapping their dough.'],
      prompt: 'Fight the hungry starters.',
      foes: { 'levain-1': 'Hungry starter', 'levain-2': 'Greedy starter' },
    },
    leurre: {
      title: 'Tempting Scent',
      narration: ['You snap your fingers: a delicious smell of warm croissant drifts toward the far corner of the cellar.'],
      prompt: 'Send the scent to the right spot: you need two successes.',
      reason: 'Tempting Scent to lure the starters',
    },
    sel_levains: {
      title: 'The blessed salt',
      narration: [
        'A pinch of blessed salt, and the starters freeze. They yawn, curl up… and turn back into two well-behaved lumps of dough.',
        'You put them back in their jars. At the back of the cellar, something rumbles.',
      ],
      label: 'Head toward the glow',
    },
    levains_vaincus: {
      title: 'Starters defeated',
      narration: [
        'The last starter collapses into a small lukewarm puddle. Nothing moves anymore.',
        'Between two flour sacks, you find a fire flask from your own supplies: it could come in handy.',
      ],
      label: 'Head toward the glow',
    },
    levains_contournes: {
      title: 'Starters distracted',
      narration: ['The starters scramble toward the smell, shoving each other. You tiptoe past behind them.'],
      label: 'Head toward the glow',
    },
    levains_mordent: {
      title: 'It bites',
      narration: [
        'Missed! A starter leaps at your ankle and bites down with all its doughy teeth. You lose 3 HP.',
        'You finally shake it off with a flick of your apron. They flee under the flour sacks.',
      ],
      label: 'Head toward the glow',
    },
    levains_ko: {
      title: 'Stuck in dough',
      narration: [
        'The starters knock you over and smother you in sticky dough. You end up on the floor in the flour, out of breath.',
        'Full at last, they fall asleep on top of you. You wriggle free, drink a sip of water and get a little strength back.',
      ],
      label: 'Head toward the glow',
    },
    golem: {
      title: 'The Burnt Crumb Golem',
      narration: [
        'At the back of the cellar, the old oven stands wide open, red as an ember. A mountain of blackened crumb pulls itself out, rumbling.',
        "The Burnt Crumb Golem rises before you. It smells of charred crust, and it doesn't look happy.",
      ],
      gmNotes:
        "The Golem draws its strength from the lit oven. Putting it out undoes it without a fight. It isn't bad: it was born from a failed batch and it is scared. Talking to it kindly can make it a friend.",
      clues: { peur: 'The Golem rumbles, but it backs away from the light: it is scared.' },
      show: 'Burnt Crumb Golem',
      prompt: 'What do you do against the Golem?',
      options: {
        combat: 'Attack it head-on',
        parler: 'Talk to it, baker to bread',
        four: 'Sneak to the oven and put it out',
      },
    },
    golem_combat: {
      title: 'Fighting the Golem',
      narration: ['The Golem raises its fists of burnt crust. The cellar floor shakes with every step it takes.'],
      gmNotes: "A boss fight: Mila's potion and the starters' fire flask come in handy here. Fleeing leads back to the shop.",
      prompt: 'Bring the Golem down.',
      foes: { golem: 'Burnt Crumb Golem' },
    },
    golem_parler: {
      title: 'Talking to the Golem',
      narration: ['You put down your rolling pin and raise your hands. "Easy now… I\'ve botched a batch too."'],
      prompt: 'Find the words that calm it down.',
      reason: 'Calm the Golem',
    },
    four: {
      title: 'Putting out the oven',
      narration: ['You slip along the wall, between the flour sacks, all the way to the scorching oven door.'],
      prompt: 'Get there without being caught.',
      reason: 'Reach the oven without getting caught',
    },
    fin_victoire: {
      title: 'Victory!',
      narration: [
        'The Golem collapses in a shower of warm crumbs. The oven goes out with a sigh.',
        'At sunrise, the shop smells of fresh bread. Mila sweeps the cellar, promising never to touch the spellbook again.',
      ],
      end: 'The Golem is defeated',
    },
    fin_amitie: {
      title: 'A new shop hand',
      narration: [
        'The Golem lowers its head and lets out a long sigh of steam. It was only scared.',
        "The very next day, it kneads dough like no one else. Cake's bakery has a new shop hand: a little burnt, very kind.",
      ],
      end: 'The Golem becomes your friend',
    },
    fin_four: {
      title: 'The oven goes out',
      narration: [
        'You slam the oven door. The red glow fades, and the Golem turns back into… a huge loaf of bread, all golden.',
        'You share it with the whole neighbourhood. No one has ever eaten such good bread.',
      ],
      end: 'The magic is gone',
    },
    fin_fuite: {
      title: 'Strategic retreat',
      narration: [
        'You rush upstairs two steps at a time and barricade the cellar door with a sack of flour.',
        'Down below, the Golem is still rumbling. You will have to come back, better prepared… To be continued!',
      ],
      end: 'The Golem waits below',
    },
    fin_ko: {
      title: 'Saved by Mila',
      narration: [
        'Everything goes dark. When you open your eyes again, Mila is dragging you up the stairs by your apron, and she slams the cellar trapdoor shut.',
        'Down below, the Golem is still rumbling. Mila hands you a cup of hot chocolate: "We\'ll go back together." To be continued!',
      ],
      end: 'The Golem won… this time',
    },
  },
}
