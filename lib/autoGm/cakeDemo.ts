import type { Adventure, ScenePiece } from './types'

/**
 * La petite aventure de Cake, jouée dans la salle de démonstration.
 *
 * Un quart d'heure environ, avec le set « Cake » du pack n° 2 : Mila donne
 * l'alerte, la cave et ses levains affamés, puis le Golem de Mie Brûlée. Elle
 * montre ce que sait faire le MJ automatique : votes, jets, une épreuve en
 * plusieurs jets, deux combats au tour par tour, du butin utilisable en
 * combat, la musique de chaque lieu et assez d'XP pour monter de niveau.
 * Cinq fins, selon les choix et les dés.
 */

// Positions reprises de `scripts/install-demo-cake.mjs` : près du centre, le
// plateau change de forme selon l'écran.
const cake: ScenePiece = { id: 'auto-cake', category: 'pions', item: 'cake-patissier', x: 0.42, y: 0.58, width: 0.16, height: 0.16 }
const mila: ScenePiece = { id: 'auto-mila', category: 'rencontres', item: 'apprentie-patissiere', x: 0.68, y: 0.55, width: 0.2, height: 0.2 }
const levain1: ScenePiece = { id: 'auto-levain-1', category: 'ennemis', item: 'levain-affame', x: 0.225, y: 0.27, width: 0.14, height: 0.14 }
const levain2: ScenePiece = { id: 'auto-levain-2', category: 'ennemis', item: 'levain-affame', x: 0.635, y: 0.3, width: 0.14, height: 0.14 }
const golem: ScenePiece = { id: 'auto-golem', category: 'ennemis', item: 'golem-mie-brulee', x: 0.38, y: 0.08, width: 0.24, height: 0.24 }

const BOUTIQUE = 'patisserie-cake'
const CAVE = 'cave-farine'

export const CAKE_DEMO: Adventure = {
  id: 'cake-demo',
  title: 'La fournée maudite',
  pitch: "Une petite aventure d'un quart d'heure avec Cake, le pâtissier mage. Le MJ automatique raconte, tu choisis, tu lances les dés et tu te bats.",
  start: 'alerte',
  scenes: {
    alerte: {
      id: 'alerte',
      title: "L'alerte",
      heal: true,
      setup: { map: BOUTIQUE, pieces: [cake, mila] },
      narration: [
        "Cinq heures du matin, dans la pâtisserie de Cake. Le four dort, la boutique sent encore la brioche d'hier.",
        "Mila, ton apprentie, déboule en chemise de nuit, de la farine plein les cheveux : « Cake ! Il y a du bruit dans la cave… et les levains ont disparu de leurs pots ! »",
      ],
      gmNotes:
        "Secret : cette nuit, Mila a ouvert le vieux grimoire de Cake et rallumé le four de la cave pour essayer une recette interdite, le « pain qui se lève tout seul ». La chaleur a réveillé les levains, et la fournée ratée est devenue le Golem de Mie Brûlée. Si on la fait parler, elle avoue et donne deux indices utiles.",
      step: {
        kind: 'vote',
        prompt: 'Que fais-tu ?',
        options: [
          { id: 'cave', label: 'Descendre tout de suite à la cave', next: 'cave', note: 'une odeur de pain brûlé monte par la trappe' },
          { id: 'mila', label: "Faire parler Mila d'abord", next: 'mila', note: 'Mila a de la farine jusque dans les cheveux' },
        ],
      },
    },

    mila: {
      id: 'mila',
      title: 'Mila cache quelque chose',
      setup: { map: BOUTIQUE, pieces: [cake, mila] },
      narration: [
        "Mila se tortille les doigts et évite ton regard. Elle sait quelque chose, c'est sûr.",
      ],
      gmNotes: 'Réussite : Mila avoue et donne le sel bénit et l\'idée du four. Échec : elle se tait, et on descend sans indice.',
      step: {
        kind: 'check',
        prompt: 'Convaincs Mila de tout te dire.',
        stat: 'charisme',
        dc: 10,
        reason: 'Convaincre Mila de parler',
        action: 'parole',
        success: 'mila_aveu',
        failure: 'mila_muette',
      },
    },

    mila_aveu: {
      id: 'mila_aveu',
      title: 'Les aveux de Mila',
      gains: ['sel', 'four'],
      loot: [{ fr: 'Potion de soin', en: 'Healing potion' }],
      clues: [
        { id: 'sel', text: 'Le sel bénit de la grand-mère calme les levains.' },
        { id: 'four', text: "Mila a rallumé le vieux four de la cave : l'éteindre arrêterait peut-être la magie." },
      ],
      narration: [
        "Mila craque : « J'ai ouvert ton grimoire… J'ai rallumé le vieux four de la cave pour faire le pain qui se lève tout seul. Ça a raté. »",
        "Elle te tend un petit sachet : « Du sel bénit. Ta grand-mère disait que ça calme les levains. Et si on éteint le four, la magie s'arrête peut-être. »",
        'Elle fouille sous le comptoir et ajoute une fiole rose : « Une potion de soin. Au cas où. »',
      ],
      step: { kind: 'continue', next: 'cave', label: 'Descendre à la cave' },
    },

    mila_muette: {
      id: 'mila_muette',
      title: 'Mila se tait',
      narration: [
        "« Je n'ai rien fait, je le jure ! » Mila file se cacher derrière le comptoir.",
        'Sous tes pieds, un grondement fait trembler les étagères.',
      ],
      step: { kind: 'continue', next: 'cave', label: 'Descendre à la cave' },
    },

    cave: {
      id: 'cave',
      title: 'La cave à farine',
      setup: { map: CAVE, pieces: [cake, levain1, levain2] },
      narration: [
        "L'escalier craque. En bas, la cave à farine sent le pain brûlé, et une lueur rouge danse au fond.",
        'Deux levains affamés rampent vers toi en claquant de la pâte. Ils ont très faim.',
      ],
      gmNotes: 'Les levains ne sont pas méchants, juste affamés. Le sel bénit les rendort sans combat.',
      clues: [{ id: 'faim', text: 'Les levains ne mordent que parce qu’ils ont faim.' }],
      step: {
        kind: 'vote',
        prompt: 'Comment passes-tu les levains ?',
        options: [
          { id: 'attaque', label: 'Les combattre', next: 'combat_levains' },
          { id: 'leurre', label: 'Les attirer ailleurs avec Odeur alléchante', next: 'leurre', note: 'les levains reniflent déjà dans ta direction' },
          { id: 'sel', label: 'Leur jeter le sel bénit de Mila', next: 'sel_levains', needs: 'sel' },
        ],
      },
    },

    combat_levains: {
      id: 'combat_levains',
      title: 'Les levains attaquent',
      narration: ['Les deux levains se gonflent, se dressent et foncent sur toi en claquant de la pâte.'],
      step: {
        kind: 'combat',
        prompt: 'Combats les levains affamés.',
        foes: [
          { id: 'levain-1', name: 'Levain affamé', hp: 4, defense: 10, attack: 2, damage: '1d4', piece: levain1.id },
          { id: 'levain-2', name: 'Levain glouton', hp: 3, defense: 10, attack: 2, damage: '1d4', piece: levain2.id },
        ],
        victory: 'levains_vaincus',
        defeat: 'levains_ko',
      },
    },

    leurre: {
      id: 'leurre',
      title: 'Odeur alléchante',
      narration: ["Tu claques des doigts : une délicieuse odeur de croissant chaud flotte vers le coin opposé de la cave."],
      step: {
        kind: 'trial',
        prompt: "Dirige l'odeur au bon endroit : il faut deux réussites.",
        stat: 'sagesse',
        dc: 10,
        reason: 'Odeur alléchante pour attirer les levains',
        action: 'ruse',
        need: 2,
        tries: 3,
        best: 'levains_contournes',
        fail: 'levains_mordent',
      },
    },

    sel_levains: {
      id: 'sel_levains',
      title: 'Le sel bénit',
      setup: { map: CAVE, pieces: [cake] },
      gains: ['levains_sauves'],
      narration: [
        'Une pincée de sel bénit, et les levains se figent. Ils bâillent, se roulent en boule… et redeviennent deux pâtes bien sages.',
        'Tu les ranges dans leurs pots. Au fond de la cave, quelque chose gronde.',
      ],
      step: { kind: 'continue', next: 'golem', label: 'Avancer vers la lueur' },
    },

    levains_vaincus: {
      id: 'levains_vaincus',
      title: 'Levains vaincus',
      setup: { map: CAVE, pieces: [cake] },
      loot: [{ fr: 'Fiole de feu', en: 'Fire flask' }],
      narration: [
        'Le dernier levain s\'effondre en une petite flaque tiède. Plus rien ne bouge.',
        'Entre deux sacs de farine, tu retrouves une fiole de feu de ta réserve : elle pourrait servir.',
      ],
      step: { kind: 'continue', next: 'golem', label: 'Avancer vers la lueur' },
    },

    levains_contournes: {
      id: 'levains_contournes',
      title: 'Levains distraits',
      setup: { map: CAVE, pieces: [cake, { ...levain1, x: 0.06, y: 0.7 }, { ...levain2, x: 0.18, y: 0.74 }] },
      narration: ["Les levains filent vers l'odeur en se bousculant. Tu passes derrière eux sur la pointe des pieds."],
      step: { kind: 'continue', next: 'golem', label: 'Avancer vers la lueur' },
    },

    levains_mordent: {
      id: 'levains_mordent',
      title: 'Ça mord',
      setup: { map: CAVE, pieces: [cake] },
      damage: 3,
      narration: [
        "Raté ! Un levain te saute à la cheville et mord à pleines dents de pâte. Tu perds 3 PV.",
        "Tu finis par t'en débarrasser d'un coup de tablier. Ils s'enfuient sous les sacs de farine.",
      ],
      step: { kind: 'continue', next: 'golem', label: 'Avancer vers la lueur' },
    },

    levains_ko: {
      id: 'levains_ko',
      title: 'Englué',
      setup: { map: CAVE, pieces: [cake] },
      heal: 4,
      narration: [
        "Les levains te renversent et t'engluent de pâte collante. Te voilà par terre dans la farine, à bout de souffle.",
        "Repus, ils finissent par s'endormir sur toi. Tu te dégages, tu bois une gorgée d'eau et tu reprends un peu de forces.",
      ],
      step: { kind: 'continue', next: 'golem', label: 'Avancer vers la lueur' },
    },

    golem: {
      id: 'golem',
      title: 'Le Golem de Mie Brûlée',
      setup: {
        map: CAVE,
        pieces: [cake, golem],
        show: { category: 'rencontres', item: 'golem-mie-brulee', label: 'Golem de Mie Brûlée' },
      },
      narration: [
        "Au fond de la cave, le vieux four est grand ouvert, rouge comme une braise. Une montagne de mie noircie s'en extrait en grondant.",
        "Le Golem de Mie Brûlée se dresse devant toi. Il sent la croûte carbonisée, et il n'a pas l'air content.",
      ],
      gmNotes:
        "Le Golem tient sa force du four allumé. L'éteindre le défait sans combat. Il n'est pas mauvais : il est né d'une fournée ratée et il a peur. Bien lui parler peut en faire un ami.",
      clues: [{ id: 'peur', text: 'Le Golem gronde, mais il recule devant la lumière : il a peur.' }],
      step: {
        kind: 'vote',
        prompt: 'Que fais-tu face au Golem ?',
        options: [
          { id: 'combat', label: "L'attaquer de front", next: 'golem_combat' },
          { id: 'parler', label: 'Lui parler, de pâtissier à pâtisserie', next: 'golem_parler' },
          { id: 'four', label: 'Te glisser jusqu\'au four pour l\'éteindre', next: 'four', needs: 'four' },
        ],
      },
    },

    golem_combat: {
      id: 'golem_combat',
      title: 'Le combat contre le Golem',
      setup: { map: CAVE, pieces: [{ ...cake, x: 0.42, y: 0.36 }, golem] },
      narration: ['Le Golem lève ses poings de croûte brûlée. Le sol de la cave tremble à chacun de ses pas.'],
      gmNotes: 'Un combat de chef : la potion de Mila et la fiole de feu des levains servent ici. Fuir ramène à la boutique.',
      step: {
        kind: 'combat',
        prompt: 'Mets le Golem à terre.',
        foes: [{ id: 'golem', name: 'Golem de Mie Brûlée', hp: 18, defense: 12, attack: 3, damage: '1d6+1', piece: golem.id }],
        victory: 'fin_victoire',
        defeat: 'fin_ko',
        flee: { next: 'fin_fuite', stat: 'dexterite', dc: 11 },
      },
    },

    golem_parler: {
      id: 'golem_parler',
      title: 'Parler au Golem',
      narration: [
        "Tu poses ton rouleau et tu lèves les mains. « Doucement… Moi aussi, j'ai déjà raté une fournée. »",
      ],
      step: {
        kind: 'check',
        prompt: 'Trouve les mots qui le calment.',
        stat: 'charisme',
        dc: 13,
        reason: 'Calmer le Golem',
        action: 'parole',
        success: 'fin_amitie',
        failure: 'golem_combat',
      },
    },

    four: {
      id: 'four',
      title: 'Éteindre le four',
      narration: ["Tu te faufiles le long du mur, entre les sacs de farine, jusqu'à la porte brûlante du four."],
      step: {
        kind: 'check',
        prompt: 'Passe sans te faire attraper.',
        stat: 'dexterite',
        dc: 11,
        reason: 'Atteindre le four sans se faire prendre',
        action: 'discretion',
        success: 'fin_four',
        failure: 'golem_combat',
      },
    },

    fin_victoire: {
      id: 'fin_victoire',
      title: 'Victoire !',
      setup: { map: BOUTIQUE, pieces: [cake, mila] },
      narration: [
        "Le Golem s'effondre en une pluie de miettes tièdes. Le four s'éteint dans un soupir.",
        "Au lever du soleil, la boutique sent le pain chaud. Mila balaie la cave en promettant de ne plus jamais toucher au grimoire.",
      ],
      step: { kind: 'end', title: 'Le Golem est vaincu' },
    },

    fin_amitie: {
      id: 'fin_amitie',
      title: 'Un nouveau commis',
      setup: { map: BOUTIQUE, pieces: [cake, mila, { ...golem, x: 0.12, y: 0.3, width: 0.22, height: 0.22 }] },
      narration: [
        'Le Golem baisse la tête et pousse un long soupir de vapeur. Il avait juste peur.',
        'Dès le lendemain, il pétrit la pâte comme personne. La pâtisserie de Cake a un nouveau commis, un peu brûlé, très gentil.',
      ],
      step: { kind: 'end', title: 'Le Golem devient ton ami' },
    },

    fin_four: {
      id: 'fin_four',
      title: 'Le four éteint',
      setup: { map: BOUTIQUE, pieces: [cake, mila] },
      narration: [
        "Tu claques la porte du four. La lueur rouge s'éteint, et le Golem redevient… une énorme miche de pain, toute dorée.",
        'Vous la partagez avec tout le quartier. Personne n\'a jamais mangé un pain aussi bon.',
      ],
      step: { kind: 'end', title: 'La magie est éteinte' },
    },

    fin_fuite: {
      id: 'fin_fuite',
      title: 'Repli stratégique',
      setup: { map: BOUTIQUE, pieces: [cake, mila], music: 'triste' },
      narration: [
        'Tu remontes quatre à quatre et tu barricades la porte de la cave avec un sac de farine.',
        'En bas, le Golem gronde encore. Il faudra revenir, mieux préparé… À suivre !',
      ],
      step: { kind: 'end', title: 'Le Golem attend en bas' },
    },

    fin_ko: {
      id: 'fin_ko',
      title: 'Sauvé par Mila',
      setup: { map: BOUTIQUE, pieces: [cake, mila], music: 'triste' },
      narration: [
        "Tout devient noir. Quand tu rouvres les yeux, Mila te tire par le tablier en haut de l'escalier et claque la trappe de la cave.",
        'En bas, le Golem gronde encore. Mila te tend une tasse de chocolat chaud : « On y retournera ensemble. » À suivre !',
      ],
      step: { kind: 'end', title: 'Le Golem a gagné… cette fois' },
    },
  },
}
