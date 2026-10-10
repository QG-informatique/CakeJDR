import type { AdventureText } from '../types'

/** « La fournée maudite » en anglais (`lib/autoGm/cakeDemo.ts`). */
export const CAKE_DEMO_EN: AdventureText = {
  title: 'The Cursed Batch',
  pitch: 'A short ten-minute adventure with Cake, the baker mage. The automatic GM tells the story, you choose and you roll the dice.',
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
      ],
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
      prompt: 'How do you get past the starters?',
      options: {
        attaque: 'Attack them with Blazing Batch',
        leurre: 'Lure them away with Tempting Scent',
        sel: "Throw Mila's blessed salt at them",
      },
    },
    combat_levains: {
      title: 'Blazing Batch',
      narration: ['You conjure a scorching brioche between your hands and aim at the first starter.'],
      prompt: 'Hit the starters with your spell.',
      reason: 'Blazing Batch on the starters',
    },
    leurre: {
      title: 'Tempting Scent',
      narration: ['You snap your fingers: a delicious smell of warm croissant drifts toward the far corner of the cellar.'],
      prompt: 'Send the scent to the right spot.',
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
      narration: ['The brioche bursts into golden sparks. Both starters melt into small lukewarm puddles.'],
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
    golem: {
      title: 'The Burnt Crumb Golem',
      narration: [
        'At the back of the cellar, the old oven stands wide open, red as an ember. A mountain of blackened crumb pulls itself out, rumbling.',
        "The Burnt Crumb Golem rises before you. It smells of charred crust, and it doesn't look happy.",
      ],
      gmNotes:
        "The Golem draws its strength from the lit oven. Putting it out undoes it without a fight. It isn't bad: it was born from a failed batch and it is scared. Talking to it kindly can make it a friend.",
      show: 'Burnt Crumb Golem',
      prompt: 'What do you do against the Golem?',
      options: {
        combat: 'Attack it with your rolling pin',
        parler: 'Talk to it, baker to bread',
        four: 'Sneak to the oven and put it out',
      },
    },
    golem_combat: {
      title: 'Rolling pin strike',
      narration: ['You grab your rolling pin and charge at the Golem.'],
      prompt: 'Hit the Golem in the right spot.',
      reason: 'Rolling pin strike on the Golem',
    },
    golem_riposte: {
      title: 'The Golem strikes back',
      narration: ['The rolling pin bounces off the crust. The Golem sweeps you aside with a backhand of burning crumb: you lose 4 HP.'],
      prompt: "It's coming at you again!",
      options: {
        glacage: 'Cover yourself in a Protective Glaze and strike again',
        fuite: 'Run back upstairs',
      },
    },
    golem_glacage: {
      title: 'Protective Glaze',
      narration: ['A shell of icing sugar hardens on your shoulders. You raise your rolling pin one last time.'],
      prompt: 'The decisive blow.',
      reason: 'Last strike under the Protective Glaze',
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
  },
}
