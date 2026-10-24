import type { Adventure, ScenePiece } from './types'

/**
 * La petite aventure de Cake, jouée dans la salle de démonstration.
 *
 * Une demi-heure environ, en trois chapitres, avec le set « Cake » du pack
 * n° 2 : Mila donne l'alerte, on fouille la boutique, on descend dans la cave
 * et ses levains affamés, on passe la Levain-mère, puis on affronte le Golem
 * de Mie Brûlée. Elle montre tout ce que sait faire le MJ automatique : votes
 * avec des choix qui se débloquent ou disparaissent, jets, tirages au sort,
 * une épreuve en plusieurs jets avec une issue à mi-chemin, pièges et soins,
 * trois combats au tour par tour, du butin utilisable en combat, des
 * rencontres montrées en grand, la musique de chaque lieu et assez d'XP pour
 * monter de niveau. Cinq fins, selon les choix et les dés.
 */

// Positions reprises de `scripts/install-demo-cake.mjs` : près du centre, le
// plateau change de forme selon l'écran.
const cake: ScenePiece = { id: 'auto-cake', category: 'pions', item: 'cake-patissier', x: 0.42, y: 0.58, width: 0.16, height: 0.16 }
const mila: ScenePiece = { id: 'auto-mila', category: 'rencontres', item: 'apprentie-patissiere', x: 0.68, y: 0.55, width: 0.2, height: 0.2 }
const levain1: ScenePiece = { id: 'auto-levain-1', category: 'ennemis', item: 'levain-affame', x: 0.225, y: 0.27, width: 0.14, height: 0.14 }
const levain2: ScenePiece = { id: 'auto-levain-2', category: 'ennemis', item: 'levain-affame', x: 0.635, y: 0.3, width: 0.14, height: 0.14 }
const mere: ScenePiece = { id: 'auto-mere', category: 'ennemis', item: 'levain-geant', x: 0.37, y: 0.1, width: 0.24, height: 0.24 }
const golem: ScenePiece = { id: 'auto-golem', category: 'ennemis', item: 'golem-mie-brulee', x: 0.38, y: 0.08, width: 0.24, height: 0.24 }

const BOUTIQUE = 'patisserie-cake'
const CAVE = 'cave-farine'

const CH_BOUTIQUE = 'La boutique'
const CH_CAVE = 'La cave'
const CH_FOUR = 'Le vieux four'
const CH_MATIN = 'Au lever du jour'

export const CAKE_DEMO: Adventure = {
  id: 'cake-demo',
  title: 'La fournée maudite',
  pitch: "Une aventure d'une demi-heure avec Cake, le pâtissier mage : trois combats, des pièges, des trouvailles et cinq fins. Le MJ automatique raconte, tu choisis, tu lances les dés et tu te bats.",
  start: 'alerte',
  scenes: {
    // ——— Chapitre 1 : la boutique ———

    alerte: {
      id: 'alerte',
      chapter: CH_BOUTIQUE,
      title: "L'alerte",
      heal: true,
      setup: { map: BOUTIQUE, pieces: [cake, mila] },
      narration: [
        "Cinq heures du matin, dans la pâtisserie de Cake. Le four dort, la boutique sent encore la brioche d'hier.",
        "Mila, ton apprentie, déboule en chemise de nuit, de la farine plein les cheveux : « Cake ! Il y a du bruit dans la cave… et les levains ont disparu de leurs pots ! »",
      ],
      gmNotes:
        "Secret : cette nuit, Mila a ouvert le vieux grimoire de Cake et rallumé le four de la cave pour essayer une recette interdite, le « pain qui se lève tout seul ». La chaleur a réveillé les levains, la vieille Levain-mère avec eux, et la fournée ratée est devenue le Golem de Mie Brûlée. Si on la fait parler, elle avoue et donne deux indices utiles. La réserve cache de quoi se soigner et un sac de farine de seigle, le régal des levains.",
      step: {
        kind: 'vote',
        prompt: 'Que fais-tu ?',
        options: [
          { id: 'cave', label: 'Descendre tout de suite à la cave', next: 'escalier', note: 'une odeur de pain brûlé monte par la trappe' },
          { id: 'mila', label: "Faire parler Mila d'abord", next: 'mila', note: 'Mila a de la farine jusque dans les cheveux' },
          { id: 'reserve', label: 'Fouiller la réserve avant de descendre', next: 'reserve', note: 'on ne sait jamais ce qui attend en bas' },
        ],
      },
    },

    mila: {
      id: 'mila',
      chapter: CH_BOUTIQUE,
      title: 'Mila cache quelque chose',
      setup: { map: BOUTIQUE, pieces: [cake, mila] },
      narration: [
        "Mila se tortille les doigts et évite ton regard. Elle sait quelque chose, c'est sûr.",
      ],
      gmNotes: "Réussite : Mila avoue et donne le sel bénit, l'idée du four et une potion. Échec : elle se tait.",
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
      chapter: CH_BOUTIQUE,
      title: 'Les aveux de Mila',
      gains: ['sel', 'four', 'mila_parle'],
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
      step: { kind: 'continue', next: 'comptoir', label: 'Réfléchir à la suite' },
    },

    mila_muette: {
      id: 'mila_muette',
      chapter: CH_BOUTIQUE,
      title: 'Mila se tait',
      gains: ['mila_parle'],
      narration: [
        "« Je n'ai rien fait, je le jure ! » Mila file se cacher derrière le comptoir.",
        'Sous tes pieds, un grondement fait trembler les étagères.',
      ],
      step: { kind: 'continue', next: 'comptoir', label: 'Réfléchir à la suite' },
    },

    reserve: {
      id: 'reserve',
      chapter: CH_BOUTIQUE,
      title: 'La réserve',
      setup: { map: BOUTIQUE, pieces: [{ ...cake, x: 0.14, y: 0.42 }, mila] },
      narration: [
        "Derrière la boutique, la réserve déborde de sacs, de bocaux et de moules empilés jusqu'au plafond.",
        "Il fait noir, et tout ce bazar ne tient debout que par miracle. Tu tâtonnes sur les étagères.",
      ],
      gmNotes: "Un tirage : une potion, le sac de farine de seigle (qui calme la Levain-mère), ou l'étagère qui s'effondre (2 PV, mais le sac est dessous).",
      step: {
        kind: 'random',
        label: 'Fouiller les étagères',
        outcomes: [
          { next: 'reserve_potion', weight: 2 },
          { next: 'reserve_farine', weight: 2 },
          { next: 'reserve_etagere', weight: 1 },
        ],
      },
    },

    reserve_potion: {
      id: 'reserve_potion',
      chapter: CH_BOUTIQUE,
      title: 'Une fiole oubliée',
      gains: ['reserve_fouillee'],
      loot: [{ fr: 'Potion de soin', en: 'Healing potion' }],
      narration: [
        "Derrière un bocal de cerises confites, tes doigts trouvent une petite fiole rose et tiède.",
        "Une potion de soin, de ta propre main. Tu l'avais complètement oubliée.",
      ],
      step: { kind: 'continue', next: 'comptoir', label: 'Revenir au comptoir' },
    },

    reserve_farine: {
      id: 'reserve_farine',
      chapter: CH_BOUTIQUE,
      title: 'Le sac de seigle',
      gains: ['reserve_fouillee', 'farine'],
      clues: [{ id: 'farine', text: 'La farine de seigle est le régal des levains : un sac entier calmerait le plus gros.' }],
      narration: [
        "Tout au fond, un vieux sac de farine de seigle, la préférée des levains. Ta grand-mère en gardait toujours un « pour les jours où la pâte boude ».",
        'Tu le hisses sur ton épaule. Il pèse son poids.',
      ],
      step: { kind: 'continue', next: 'comptoir', label: 'Revenir au comptoir' },
    },

    reserve_etagere: {
      id: 'reserve_etagere',
      chapter: CH_BOUTIQUE,
      title: "Patatras !",
      gains: ['reserve_fouillee', 'farine'],
      damage: 2,
      clues: [{ id: 'farine', text: 'La farine de seigle est le régal des levains : un sac entier calmerait le plus gros.' }],
      narration: [
        "Tu tires sur un sac coincé… et toute l'étagère te tombe dessus dans un fracas de moules à gâteaux. Tu perds 2 PV.",
        "Tu te relèves en toussant. Au moins, le sac est enfin libre : de la farine de seigle, le régal des levains.",
      ],
      step: { kind: 'continue', next: 'comptoir', label: 'Revenir au comptoir' },
    },

    comptoir: {
      id: 'comptoir',
      chapter: CH_BOUTIQUE,
      title: 'Au comptoir',
      setup: { map: BOUTIQUE, pieces: [cake, mila] },
      narration: [
        'Un nouveau grondement monte de la cave. Les tasses tintent sur leurs crochets.',
        'Mila serre son balai contre elle et te regarde, prête à te suivre jusqu\'à la trappe.',
      ],
      step: {
        kind: 'vote',
        prompt: 'Et maintenant ?',
        options: [
          { id: 'cave', label: 'Descendre à la cave', next: 'escalier' },
          { id: 'mila', label: 'Faire parler Mila', next: 'mila', unless: 'mila_parle' },
          { id: 'reserve', label: 'Fouiller la réserve', next: 'reserve', unless: 'reserve_fouillee' },
        ],
      },
    },

    // ——— Chapitre 2 : la cave ———

    escalier: {
      id: 'escalier',
      chapter: CH_CAVE,
      title: "L'escalier collant",
      setup: { map: CAVE, pieces: [{ ...cake, x: 0.42, y: 0.74 }] },
      narration: [
        "Tu soulèves la trappe. L'escalier de la cave est couvert de pâte crue, gluante comme du miel.",
        'Les marches craquent et collent à tes semelles. En bas, une lueur rouge danse au fond.',
      ],
      step: {
        kind: 'check',
        prompt: 'Descends sans glisser.',
        stat: 'dexterite',
        dc: 10,
        reason: "Descendre l'escalier gluant",
        action: 'effort',
        success: 'cave',
        failure: 'escalier_chute',
      },
    },

    escalier_chute: {
      id: 'escalier_chute',
      chapter: CH_CAVE,
      title: 'La glissade',
      damage: 2,
      narration: [
        "Ton pied part en avant. Tu dévales les dernières marches sur le dos et atterris dans un nuage de farine. Tu perds 2 PV.",
      ],
      step: { kind: 'continue', next: 'cave', label: 'Se relever' },
    },

    cave: {
      id: 'cave',
      chapter: CH_CAVE,
      title: 'La cave à farine',
      setup: { map: CAVE, pieces: [cake, levain1, levain2] },
      narration: [
        "En bas, la cave à farine sent le pain brûlé. Des traînées de pâte mènent vers le fond.",
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
      chapter: CH_CAVE,
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
      chapter: CH_CAVE,
      title: 'Odeur alléchante',
      narration: ["Tu claques des doigts : une délicieuse odeur de croissant chaud flotte vers le coin opposé de la cave."],
      gmNotes: "Deux réussites : les deux levains filent. Une seule : l'un suit l'odeur, l'autre attaque. Aucune : ils mordent.",
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
        middle: 'levain_seul',
        middleAt: 1,
        fail: 'levains_mordent',
      },
    },

    levain_seul: {
      id: 'levain_seul',
      chapter: CH_CAVE,
      title: 'Un levain têtu',
      setup: { map: CAVE, pieces: [cake, { ...levain2, x: 0.06, y: 0.7 }, levain1] },
      narration: [
        "Le levain glouton file vers l'odeur. Mais l'autre ne se laisse pas berner : il gonfle, gronde, et te barre le chemin.",
      ],
      step: {
        kind: 'combat',
        prompt: 'Débarrasse-toi du levain têtu.',
        foes: [{ id: 'levain-1', name: 'Levain têtu', hp: 5, defense: 10, attack: 2, damage: '1d4', piece: levain1.id }],
        victory: 'levains_vaincus',
        defeat: 'levains_ko',
      },
    },

    sel_levains: {
      id: 'sel_levains',
      chapter: CH_CAVE,
      title: 'Le sel bénit',
      setup: { map: CAVE, pieces: [cake] },
      gains: ['levains_sauves'],
      narration: [
        'Une pincée de sel bénit, et les levains se figent. Ils bâillent, se roulent en boule… et redeviennent deux pâtes bien sages.',
        'Tu les ranges dans leurs pots, que tu cales sous ton bras. Au fond de la cave, quelque chose gronde.',
      ],
      step: { kind: 'continue', next: 'couloir', label: 'Avancer dans la cave' },
    },

    levains_vaincus: {
      id: 'levains_vaincus',
      chapter: CH_CAVE,
      title: 'Levains vaincus',
      setup: { map: CAVE, pieces: [cake] },
      loot: [{ fr: 'Fiole de feu', en: 'Fire flask' }],
      narration: [
        'Le dernier levain s\'effondre en une petite flaque tiède. Plus rien ne bouge.',
        'Entre deux sacs de farine, tu retrouves une fiole de feu de ta réserve : elle pourrait servir.',
      ],
      step: { kind: 'continue', next: 'couloir', label: 'Avancer dans la cave' },
    },

    levains_contournes: {
      id: 'levains_contournes',
      chapter: CH_CAVE,
      title: 'Levains distraits',
      setup: { map: CAVE, pieces: [cake, { ...levain1, x: 0.06, y: 0.7 }, { ...levain2, x: 0.18, y: 0.74 }] },
      narration: ["Les levains filent vers l'odeur en se bousculant. Tu passes derrière eux sur la pointe des pieds."],
      step: { kind: 'continue', next: 'couloir', label: 'Avancer dans la cave' },
    },

    levains_mordent: {
      id: 'levains_mordent',
      chapter: CH_CAVE,
      title: 'Ça mord',
      setup: { map: CAVE, pieces: [cake] },
      damage: 3,
      narration: [
        "Raté ! Un levain te saute à la cheville et mord à pleines dents de pâte. Tu perds 3 PV.",
        "Tu finis par t'en débarrasser d'un coup de tablier. Ils s'enfuient sous les sacs de farine.",
      ],
      step: { kind: 'continue', next: 'couloir', label: 'Avancer dans la cave' },
    },

    levains_ko: {
      id: 'levains_ko',
      chapter: CH_CAVE,
      title: 'Englué',
      setup: { map: CAVE, pieces: [cake] },
      heal: 4,
      narration: [
        "Les levains te renversent et t'engluent de pâte collante. Te voilà par terre dans la farine, à bout de souffle.",
        "Repus, ils finissent par s'endormir sur toi. Tu te dégages, tu bois une gorgée d'eau et tu reprends un peu de forces.",
      ],
      step: { kind: 'continue', next: 'couloir', label: 'Avancer dans la cave' },
    },

    couloir: {
      id: 'couloir',
      chapter: CH_CAVE,
      title: 'Entre les sacs',
      setup: { map: CAVE, pieces: [{ ...cake, x: 0.3, y: 0.44 }] },
      narration: [
        'Un étroit passage serpente entre des murs de sacs de farine empilés. La lueur rouge grandit, la chaleur aussi.',
        "Quelque part devant, un énorme ronflement fait trembler la poussière blanche.",
      ],
      gmNotes: "Un tirage : des sacs qui tombent (2 PV), le cellier de la grand-mère (une potion), ou le sac de seigle s'il n'a pas été trouvé là-haut.",
      step: {
        kind: 'random',
        label: 'Avancer entre les sacs',
        outcomes: [
          { next: 'couloir_sacs', weight: 2 },
          { next: 'couloir_cellier', weight: 2 },
          { next: 'couloir_farine', weight: 2, unless: 'farine' },
        ],
      },
    },

    couloir_sacs: {
      id: 'couloir_sacs',
      chapter: CH_CAVE,
      title: 'Avalanche de farine',
      damage: 2,
      narration: [
        "Ton épaule frôle une pile de sacs. Elle vacille… et s'écroule sur toi dans une explosion blanche. Tu perds 2 PV.",
        'Tu ressors de là blanc comme un fantôme, en éternuant.',
      ],
      step: { kind: 'continue', next: 'mere_levain', label: 'Suivre le ronflement' },
    },

    couloir_cellier: {
      id: 'couloir_cellier',
      chapter: CH_CAVE,
      title: 'Le cellier de la grand-mère',
      loot: [{ fr: 'Potion de soin', en: 'Healing potion' }],
      narration: [
        "Derrière une porte basse, tu retrouves le petit cellier de ta grand-mère : des confitures, des herbes séchées… et une potion de soin bien rangée.",
      ],
      step: { kind: 'continue', next: 'mere_levain', label: 'Suivre le ronflement' },
    },

    couloir_farine: {
      id: 'couloir_farine',
      chapter: CH_CAVE,
      title: 'Un sac de seigle',
      gains: ['farine'],
      clues: [{ id: 'farine', text: 'La farine de seigle est le régal des levains : un sac entier calmerait le plus gros.' }],
      narration: [
        "Un sac éventré laisse couler une farine plus sombre que les autres : du seigle, le régal des levains.",
        'Tu refermes le sac et tu le prends avec toi. Ça peut servir.',
      ],
      step: { kind: 'continue', next: 'mere_levain', label: 'Suivre le ronflement' },
    },

    // ——— Chapitre 3 : le vieux four ———

    mere_levain: {
      id: 'mere_levain',
      chapter: CH_FOUR,
      title: 'La Levain-mère',
      setup: {
        map: CAVE,
        pieces: [cake, mere],
        show: { category: 'ennemis', item: 'levain-geant', label: 'La Levain-mère' },
      },
      narration: [
        "Le passage s'ouvre sur une masse de pâte grosse comme une charrette, qui ronfle en gonflant et en dégonflant. La Levain-mère, la plus vieille pâte de la maison.",
        "Elle bouche le chemin du four. À ton approche, elle ouvre un œil de bulles et gronde.",
      ],
      gmNotes:
        "La Levain-mère a cent ans : elle protège ses petits et elle a faim. Le sac de seigle la nourrit, les petits levains sauvés la rassurent. Sinon il faut se battre, ou passer en douce. Une fois amie, elle aide contre le Golem.",
      clues: [{ id: 'mere', text: 'La Levain-mère protège ses petits, et elle meurt de faim.' }],
      step: {
        kind: 'vote',
        prompt: 'Comment passes-tu la Levain-mère ?',
        options: [
          { id: 'combat', label: 'La combattre', next: 'combat_mere', note: 'elle frappe parfois deux fois' },
          { id: 'farine', label: 'Lui offrir le sac de seigle', next: 'mere_nourrie', needs: 'farine' },
          { id: 'petits', label: 'Lui rendre ses petits levains', next: 'mere_apaisee', needs: 'levains_sauves' },
          { id: 'passer', label: 'Te faufiler pendant qu\'elle somnole', next: 'mere_contourner' },
        ],
      },
    },

    combat_mere: {
      id: 'combat_mere',
      chapter: CH_FOUR,
      title: 'La colère de la Levain-mère',
      setup: { map: CAVE, pieces: [{ ...cake, x: 0.42, y: 0.4 }, mere], music: 'combat' },
      narration: ["La Levain-mère se dresse, énorme, et abat sur toi deux bras de pâte collante."],
      gmNotes: 'Elle frappe une ou deux fois par tour. Perdre ne finit pas la partie : on se réveille et on continue.',
      step: {
        kind: 'combat',
        prompt: 'Tiens tête à la Levain-mère.',
        foes: [{ id: 'mere', name: 'Levain-mère', hp: 9, defense: 11, attack: 2, damage: '1d4', attacks: 1.5, piece: mere.id }],
        victory: 'mere_vaincue',
        defeat: 'mere_ko',
      },
    },

    mere_contourner: {
      id: 'mere_contourner',
      chapter: CH_FOUR,
      title: 'Sur la pointe des pieds',
      narration: ["Tu retiens ton souffle et tu longes le mur, à un pas de l'énorme pâte qui ronfle."],
      step: {
        kind: 'check',
        prompt: 'Passe sans la réveiller.',
        stat: 'dexterite',
        dc: 12,
        reason: 'Passer la Levain-mère sans bruit',
        action: 'discretion',
        success: 'golem',
        failure: 'combat_mere',
      },
    },

    mere_nourrie: {
      id: 'mere_nourrie',
      chapter: CH_FOUR,
      title: 'Un festin de seigle',
      setup: { map: CAVE, pieces: [cake, { ...mere, x: 0.1, y: 0.3 }] },
      gains: ['mere_amie'],
      narration: [
        "Tu éventres le sac devant elle. La Levain-mère engloutit le seigle avec un gros bruit de bulles, puis pousse un soupir de pâte contente.",
        'Repue, elle se pousse sur le côté… et te suit des yeux, comme un gros chien reconnaissant.',
      ],
      step: { kind: 'continue', next: 'golem', label: "Approcher du four" },
    },

    mere_apaisee: {
      id: 'mere_apaisee',
      chapter: CH_FOUR,
      title: 'La famille réunie',
      setup: { map: CAVE, pieces: [cake, { ...mere, x: 0.1, y: 0.3 }] },
      gains: ['mere_amie'],
      narration: [
        'Tu poses les deux pots devant elle. Les petits levains en sortent en piaillant et se blottissent contre leur mère.',
        "La Levain-mère ronronne, toute molle. Elle s'écarte pour te laisser passer, et te suit des yeux avec gratitude.",
      ],
      step: { kind: 'continue', next: 'golem', label: "Approcher du four" },
    },

    mere_vaincue: {
      id: 'mere_vaincue',
      chapter: CH_FOUR,
      title: 'La Levain-mère dégonfle',
      setup: { map: CAVE, pieces: [cake] },
      heal: 3,
      narration: [
        "La Levain-mère se dégonfle d'un coup, comme une brioche sortie trop tôt du four, et s'endort en ronflant doucement.",
        'Tu reprends ton souffle contre un sac de farine avant la suite.',
      ],
      step: { kind: 'continue', next: 'golem', label: "Approcher du four" },
    },

    mere_ko: {
      id: 'mere_ko',
      chapter: CH_FOUR,
      title: 'Écrasé sous la pâte',
      setup: { map: CAVE, pieces: [cake] },
      heal: 4,
      narration: [
        "La Levain-mère s'assoit sur toi. Tout devient mou et chaud… et tu t'endors un instant sous la pâte.",
        "Quand tu te dégages, elle ronfle, satisfaite d'avoir gagné. Tu en profites pour passer.",
      ],
      step: { kind: 'continue', next: 'golem', label: "Approcher du four" },
    },

    golem: {
      id: 'golem',
      chapter: CH_FOUR,
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
        "Le Golem tient sa force du four allumé. L'éteindre le défait sans combat. Il n'est pas mauvais : il est né d'une fournée ratée et il a peur. Bien lui parler peut en faire un ami. Si la Levain-mère est devenue amie, elle peut l'engluer et l'affaiblir.",
      clues: [{ id: 'peur', text: 'Le Golem gronde, mais il recule devant la lumière : il a peur.' }],
      step: {
        kind: 'vote',
        prompt: 'Que fais-tu face au Golem ?',
        options: [
          { id: 'combat', label: "L'attaquer de front", next: 'golem_combat', note: 'il est coriace, garde tes potions sous la main' },
          { id: 'parler', label: 'Lui parler, de pâtissier à pâtisserie', next: 'golem_parler' },
          { id: 'four', label: 'Te glisser jusqu\'au four pour l\'éteindre', next: 'four', needs: 'four' },
          { id: 'mere', label: "Appeler la Levain-mère à l'aide", next: 'golem_englue', needs: 'mere_amie' },
        ],
      },
    },

    golem_combat: {
      id: 'golem_combat',
      chapter: CH_FOUR,
      title: 'Le combat contre le Golem',
      setup: { map: CAVE, pieces: [{ ...cake, x: 0.42, y: 0.36 }, golem] },
      narration: ['Le Golem lève ses poings de croûte brûlée. Le sol de la cave tremble à chacun de ses pas.'],
      gmNotes: 'Un combat de chef : les potions et la fiole de feu servent ici. Fuir ramène à la boutique.',
      step: {
        kind: 'combat',
        prompt: 'Mets le Golem à terre.',
        foes: [{ id: 'golem', name: 'Golem de Mie Brûlée', hp: 18, defense: 12, attack: 3, damage: '1d6+1', piece: golem.id }],
        victory: 'fin_victoire',
        defeat: 'fin_ko',
        flee: { next: 'fin_fuite', stat: 'dexterite', dc: 11 },
      },
    },

    golem_englue: {
      id: 'golem_englue',
      chapter: CH_FOUR,
      title: 'La Levain-mère à la rescousse',
      setup: { map: CAVE, pieces: [{ ...cake, x: 0.42, y: 0.36 }, golem, { ...mere, x: 0.1, y: 0.18 }], music: 'boss' },
      narration: [
        "Tu siffles. La Levain-mère surgit derrière toi et se jette sur le Golem : la voilà qui l'enrobe de pâte jusqu'aux épaules.",
        "Englué, le Golem se débat au ralenti. C'est le moment ou jamais !",
      ],
      step: {
        kind: 'combat',
        prompt: 'Frappe le Golem pendant qu\'il est englué.',
        foes: [{ id: 'golem', name: 'Golem englué', hp: 11, defense: 10, attack: 2, damage: '1d6', piece: golem.id }],
        victory: 'fin_victoire',
        defeat: 'fin_ko',
      },
    },

    golem_parler: {
      id: 'golem_parler',
      chapter: CH_FOUR,
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
      chapter: CH_FOUR,
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

    // ——— Les fins ———

    fin_victoire: {
      id: 'fin_victoire',
      chapter: CH_MATIN,
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
      chapter: CH_MATIN,
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
      chapter: CH_MATIN,
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
      chapter: CH_MATIN,
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
      chapter: CH_MATIN,
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
