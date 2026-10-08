import type { Adventure, ScenePiece } from './types'

/**
 * La petite aventure de Cake, jouée dans la salle de démonstration.
 *
 * Dix à quinze minutes, avec le set « Cake » du pack n° 2 : Mila donne
 * l'alerte, la cave et ses levains affamés, puis le Golem de Mie Brûlée.
 * Quatre fins, selon les choix et les dés.
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
  pitch: "Une petite aventure de dix minutes avec Cake, le pâtissier mage. Le MJ automatique raconte, tu choisis et tu lances les dés.",
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
          { id: 'cave', label: 'Descendre tout de suite à la cave', next: 'cave' },
          { id: 'mila', label: "Faire parler Mila d'abord", next: 'mila' },
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
        success: 'mila_aveu',
        failure: 'mila_muette',
      },
    },

    mila_aveu: {
      id: 'mila_aveu',
      title: 'Les aveux de Mila',
      gains: ['sel', 'four'],
      narration: [
        "Mila craque : « J'ai ouvert ton grimoire… J'ai rallumé le vieux four de la cave pour faire le pain qui se lève tout seul. Ça a raté. »",
        "Elle te tend un petit sachet : « Du sel bénit. Ta grand-mère disait que ça calme les levains. Et si on éteint le four, la magie s'arrête peut-être. »",
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
      step: {
        kind: 'vote',
        prompt: 'Comment passes-tu les levains ?',
        options: [
          { id: 'attaque', label: 'Les attaquer avec Fournée ardente', next: 'combat_levains' },
          { id: 'leurre', label: 'Les attirer ailleurs avec Odeur alléchante', next: 'leurre' },
          { id: 'sel', label: 'Leur jeter le sel bénit de Mila', next: 'sel_levains', needs: 'sel' },
        ],
      },
    },

    combat_levains: {
      id: 'combat_levains',
      title: 'Fournée ardente',
      narration: ['Tu fais naître une brioche brûlante entre tes mains et tu vises le premier levain.'],
      step: {
        kind: 'check',
        prompt: 'Touche les levains avec ton sort.',
        stat: 'intelligence',
        dc: 11,
        reason: 'Fournée ardente sur les levains',
        success: 'levains_vaincus',
        failure: 'levains_mordent',
      },
    },

    leurre: {
      id: 'leurre',
      title: 'Odeur alléchante',
      narration: ["Tu claques des doigts : une délicieuse odeur de croissant chaud flotte vers le coin opposé de la cave."],
      step: {
        kind: 'check',
        prompt: "Dirige l'odeur au bon endroit.",
        stat: 'sagesse',
        dc: 10,
        reason: 'Odeur alléchante pour attirer les levains',
        success: 'levains_contournes',
        failure: 'levains_mordent',
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
      narration: ['La brioche explose en étincelles dorées. Les deux levains fondent en petites flaques tièdes.'],
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
      step: {
        kind: 'vote',
        prompt: 'Que fais-tu face au Golem ?',
        options: [
          { id: 'combat', label: "L'attaquer avec ton rouleau", next: 'golem_combat' },
          { id: 'parler', label: 'Lui parler, de pâtissier à pâtisserie', next: 'golem_parler' },
          { id: 'four', label: 'Te glisser jusqu\'au four pour l\'éteindre', next: 'four', needs: 'four' },
        ],
      },
    },

    golem_combat: {
      id: 'golem_combat',
      title: 'Coup de rouleau',
      setup: { map: CAVE, pieces: [{ ...cake, x: 0.42, y: 0.36 }, golem] },
      narration: ['Tu empoignes ton rouleau à pâtisserie et tu fonces sur le Golem.'],
      step: {
        kind: 'check',
        prompt: 'Frappe le Golem au bon endroit.',
        stat: 'dexterite',
        dc: 12,
        reason: 'Coup de rouleau contre le Golem',
        success: 'fin_victoire',
        failure: 'golem_riposte',
      },
    },

    golem_riposte: {
      id: 'golem_riposte',
      title: 'Le Golem riposte',
      damage: 4,
      narration: [
        'Le rouleau rebondit sur la croûte. Le Golem te balaie d\'un revers de mie brûlante : tu perds 4 PV.',
      ],
      step: {
        kind: 'vote',
        prompt: 'Il revient à la charge !',
        options: [
          { id: 'glacage', label: "Te couvrir d'un Glaçage protecteur et frapper encore", next: 'golem_glacage' },
          { id: 'fuite', label: 'Remonter en courant', next: 'fin_fuite' },
        ],
      },
    },

    golem_glacage: {
      id: 'golem_glacage',
      title: 'Glaçage protecteur',
      narration: ['Une coque de sucre glace durcit sur tes épaules. Tu lèves ton rouleau une dernière fois.'],
      step: {
        kind: 'check',
        prompt: 'Le coup décisif.',
        stat: 'intelligence',
        dc: 11,
        reason: 'Dernier coup sous le Glaçage protecteur',
        success: 'fin_victoire',
        failure: 'fin_fuite',
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
      setup: { map: BOUTIQUE, pieces: [cake, mila] },
      narration: [
        'Tu remontes quatre à quatre et tu barricades la porte de la cave avec un sac de farine.',
        'En bas, le Golem gronde encore. Il faudra revenir, mieux préparé… À suivre !',
      ],
      step: { kind: 'end', title: 'Le Golem attend en bas' },
    },
  },
}
