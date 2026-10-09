import type { Adventure, Scene, SceneOption, ScenePiece, SceneStep } from './types'
import type { CheckStat } from '@/lib/checks'

/**
 * « La Flamme sous la montagne », la campagne du pack n° 2.
 *
 * Trois actes et un final, jouables sans MJ : le village de Brumeval et ses
 * gobelins, la ville royale où se cache le culte, les terres sauvages (trois
 * routes au choix), puis le château du vampire et le repaire du dragon.
 * Des tirages au hasard changent les rencontres d'une partie à l'autre.
 *
 * Les jets n'utilisent que Force, Dextérité, Constitution, Intelligence et
 * Charisme, communs à tous les systèmes de jeu.
 */

// ── Raccourcis d'écriture ────────────────────────────────────────────────

const piece = (id: string, item: string, x: number, y: number, size = 0.14, category = 'ennemis'): ScenePiece => ({
  id: `auto-${id}`,
  category,
  item,
  x,
  y,
  width: size,
  height: size,
})
const ally = (id: string, item: string, x: number, y: number, size = 0.15) => piece(id, item, x, y, size, 'pions')
const show = (item: string, label: string, category = 'rencontres') => ({ category, item, label })
/** Image d'ambiance (rangée avec les cartes) montrée en grand. */
const scenery = (item: string, label: string) => show(item, label, 'cartes')

const next = (to: string, label?: string): SceneStep => ({ kind: 'continue', next: to, label })
const vote = (prompt: string, options: SceneOption[]): SceneStep => ({ kind: 'vote', prompt, options })
const opt = (id: string, label: string, to: string, needs?: string): SceneOption => ({ id, label, next: to, needs })
const check = (prompt: string, stat: CheckStat, dc: number, reason: string, success: string, failure: string): SceneStep => ({
  kind: 'check',
  prompt,
  stat,
  dc,
  reason,
  success,
  failure,
})
const random = (outcomes: { next: string; weight?: number; needs?: string; unless?: string }[], label?: string): SceneStep => ({
  kind: 'random',
  outcomes,
  label,
})

const ACT1 = 'Acte I · Brumeval'
const ACT2 = 'Acte II · La ville royale'
const ACT3 = 'Acte III · Les terres sauvages'
const FINAL = 'Final · Cendrecime'

// ── Les scènes ───────────────────────────────────────────────────────────

const scenes: Scene[] = [
  // ════ Acte I : le village de Brumeval ════
  {
    id: 'taverne',
    chapter: ACT1,
    title: 'Le Sanglier Doré',
    heal: true,
    setup: { map: 'taverne-interieur', show: scenery('ambiance-royaume', "Le royaume d'Aurélion") },
    narration: [
      "Le royaume d'Aurélion, bleu et or, dort sous la bannière du lion. À l'horizon, la montagne de Cendrecime fume doucement, comme elle fume depuis mille ans.",
      'Vous vous êtes retrouvés par hasard au Sanglier Doré, la taverne du village de Brumeval. Le feu crépite, la soupe est chaude… et la salle est étrangement vide.',
      "La porte s'ouvre à la volée. Le bourgmestre, essoufflé, cherche des yeux quelqu'un qui porte une arme. Il vous trouve.",
    ],
    gmNotes:
      "Fil rouge de la campagne : le culte de l'Œil dans la Flamme, caché jusqu'à la cour du roi, veut réveiller Pyraxis, le dragon rouge endormi sous Cendrecime, avec l'aide d'un seigneur vampire. Les gobelins et les bandits de l'acte I sont payés par le culte pour vider les routes.",
    step: next('place', 'Écouter le bourgmestre'),
  },
  {
    id: 'place',
    chapter: ACT1,
    title: 'La place du village',
    setup: {
      map: 'place-village',
      pieces: [ally('milicien', 'milicien-village', 0.7, 0.3)],
      show: show('bourgmestre', 'Le bourgmestre de Brumeval'),
    },
    narration: [
      "« Les gobelins ! » Le bourgmestre s'éponge le front. « Ils pillent les fermes la nuit, et sur la route du sud, des bandits attaquent toutes les charrettes. Plus aucun marchand n'ose venir. »",
      "Une paysanne s'avance, la voix tremblante : « Ceux qui ont brûlé ma grange portaient un drôle de signe peint sur leurs boucliers. Un œil… dans une flamme. »",
      'Le bourgmestre vous tend une bourse : « Aidez-nous. Par où voulez-vous commencer ? »',
    ],
    step: vote('Par où commencez-vous ?', [
      opt('foret', 'Suivre les traces des gobelins dans la forêt', 'foret'),
      opt('route', 'Escorter un marchand sur la route du sud', 'route'),
      opt('diseuse', "Interroger la diseuse de bonne aventure, au bout de la place", 'diseuse'),
    ]),
  },
  {
    id: 'diseuse',
    chapter: ACT1,
    title: 'Les cartes de la diseuse',
    setup: { map: 'place-village', show: show('diseuse-aventure', 'La diseuse de bonne aventure') },
    narration: [
      "Sous sa tente qui sent la cire et l'encens, la diseuse retourne trois cartes : une flamme, un œil, une couronne renversée.",
      "« Ce qui dort sous la montagne n'aime pas qu'on le réveille. Ceux qui portent l'œil le veulent pourtant. Et l'un d'eux s'assoit tout près du trône. »",
    ],
    gains: ['prophetie'],
    gmNotes: "La couronne renversée annonce la traîtresse de la cour (Dame Isolde, acte II). L'indice « prophetie » ouvre une option face au roi gobelin.",
    step: vote('Où allez-vous maintenant ?', [
      opt('foret', 'Partir dans la forêt, sur les traces des gobelins', 'foret'),
      opt('route', 'Prendre la route du sud, où rôdent les bandits', 'route'),
    ]),
  },

  // La route du sud : bandits ou loups, au hasard.
  {
    id: 'route',
    chapter: ACT1,
    title: 'La route du sud',
    setup: { map: 'route-embuscade', pieces: [ally('marchand', 'milicien-village', 0.5, 0.5, 0.13)] },
    narration: [
      'Un marchand ambulant, jovial et bavard, vous accompagne avec sa charrette pleine de babioles. La route serpente entre les collines.',
      "Au détour d'un virage, une charrette renversée barre le chemin. Le marchand se tait d'un coup.",
    ],
    step: random([{ next: 'route_bandits', weight: 2 }, { next: 'route_loups' }], 'Avancer prudemment'),
  },
  {
    id: 'route_bandits',
    chapter: ACT1,
    title: "L'embuscade",
    setup: {
      map: 'route-embuscade',
      pieces: [piece('bandit-1', 'bandit', 0.25, 0.25), piece('bandit-2', 'brute-bandit', 0.72, 0.28, 0.16), piece('arbaletriere', 'arbaletriere-bandit', 0.82, 0.62)],
      show: show('cheffe-bandits', 'La cheffe des bandits'),
    },
    narration: [
      'Des foulards rouges surgissent des fourrés. Une femme en long manteau, deux lames aux hanches, vous barre la route en souriant.',
      "« La route est fermée, ordre d'en haut. Laissez la charrette, et repartez sur vos deux jambes. »",
    ],
    gmNotes: "La cheffe est payée par le culte pour couper le village du reste du royaume. Elle n'aime pas ses commanditaires et peut parler.",
    step: vote('Que faites-vous ?', [
      opt('combat', 'Tirer les armes', 'bandits_combat'),
      opt('parler', "Lui demander qui donne les ordres « d'en haut »", 'bandits_parler'),
    ]),
  },
  {
    id: 'bandits_combat',
    chapter: ACT1,
    title: 'Bataille sur la route',
    narration: ['Le colosse au gourdin charge le premier, l\'arbalétrière épaule. Il faut frapper vite et fort.'],
    step: check('Mettez les bandits en déroute.', 'force', 12, 'Mettre les bandits en déroute', 'bandits_vaincus', 'bandits_blesses'),
  },
  {
    id: 'bandits_parler',
    chapter: ACT1,
    title: 'Négocier avec la cheffe',
    narration: ["Vous baissez vos armes. La cheffe hausse un sourcil : elle n'avait pas prévu qu'on lui pose des questions."],
    step: check('Faites-la parler.', 'charisme', 12, 'Faire parler la cheffe des bandits', 'bandits_parle', 'bandits_blesses'),
  },
  {
    id: 'bandits_vaincus',
    chapter: ACT1,
    title: 'Les foulards rouges en fuite',
    setup: { map: 'route-embuscade', pieces: [ally('marchand', 'milicien-village', 0.5, 0.5, 0.13)] },
    gains: ['lettre'],
    narration: [
      'Les bandits détalent dans les collines. Dans la sacoche abandonnée de la cheffe, une lettre cachetée de cire pourpre : un œil dans une flamme.',
      "« Bloquez la route jusqu'à la nouvelle lune. Le camp des gobelins recevra le reste de l'or. » Pas de signature.",
    ],
    step: next('camp', 'Marcher vers le camp des gobelins'),
  },
  {
    id: 'bandits_parle',
    chapter: ACT1,
    title: 'Ce que dit la cheffe',
    setup: { map: 'route-embuscade', pieces: [ally('marchand', 'milicien-village', 0.5, 0.5, 0.13)] },
    gains: ['lettre'],
    narration: [
      "La cheffe crache par terre. « Des robes pourpres, qui paient en or neuf de la ville royale. Ils paient aussi les gobelins. Je n'aime pas leurs yeux. »",
      'Elle vous jette leur lettre de commande, cachetée d\'un œil dans une flamme, et disparaît avec sa bande. La route est libre.',
    ],
    step: next('camp', 'Marcher vers le camp des gobelins'),
  },
  {
    id: 'bandits_blesses',
    chapter: ACT1,
    title: 'Carreaux et gourdins',
    damage: 3,
    setup: { map: 'route-embuscade', pieces: [ally('marchand', 'milicien-village', 0.5, 0.5, 0.13)] },
    narration: [
      'Un carreau d\'arbalète vous frôle, un coup de gourdin ne vous rate pas : chacun perd 3 PV.',
      'Les bandits finissent par filer avec deux sacs de babioles. Le marchand, lui, vous montre des traces de gobelins qui partent vers les bois.',
    ],
    step: next('camp', 'Suivre les traces'),
  },
  {
    id: 'route_loups',
    chapter: ACT1,
    title: 'Les loups sombres',
    setup: {
      map: 'route-embuscade',
      pieces: [piece('loup-1', 'loup-sombre', 0.2, 0.3), piece('loup-2', 'loup-sombre', 0.78, 0.25), piece('loup-3', 'loup-sombre', 0.8, 0.7)],
    },
    narration: [
      "Ce ne sont pas des bandits : trois grands loups noirs dévorent les provisions de la charrette renversée. Ils portent des harnais de cuir. Des montures de gobelins.",
      'Le plus gros relève la tête et grogne.',
    ],
    step: check('Faites fuir les loups avant qu\'ils ne chargent.', 'dexterite', 11, 'Repousser les loups sombres', 'loups_fuient', 'loups_mordent'),
  },
  {
    id: 'loups_fuient',
    chapter: ACT1,
    title: 'Les loups détalent',
    narration: ['Une torche agitée, un cri, une pierre bien lancée : les loups filent vers la forêt. Il suffit de les suivre.'],
    step: next('foret', 'Suivre les loups dans la forêt'),
  },
  {
    id: 'loups_mordent',
    chapter: ACT1,
    title: 'Crocs et griffes',
    damage: 3,
    narration: ['Les loups sautent avant vous. Crocs, griffes, une mêlée confuse : chacun perd 3 PV avant que la meute ne s\'enfuie vers la forêt.'],
    step: next('foret', 'Suivre les loups dans la forêt'),
  },

  // La forêt : une rencontre au hasard.
  {
    id: 'foret',
    chapter: ACT1,
    title: 'La forêt de brume',
    setup: { map: 'foret-clairiere', show: scenery('ambiance-foret-brume', 'La forêt de brume') },
    narration: [
      'La brume du matin colle aux troncs. Les traces des gobelins sont faciles à suivre : branches cassées, os rongés, une plume accrochée à une ronce.',
      'Près du ruisseau, quelque chose bouge.',
    ],
    step: random([{ next: 'foret_guide' }, { next: 'foret_herboriste' }, { next: 'foret_araignee' }], 'Approcher du ruisseau'),
  },
  {
    id: 'foret_guide',
    chapter: ACT1,
    title: 'Le guide elfe',
    setup: { map: 'foret-clairiere', pieces: [ally('guide', 'guide-elfe', 0.62, 0.4)], show: show('guide-elfe', 'Sylvaën, guide elfe') },
    gains: ['guide'],
    narration: [
      "Un elfe à l'arc long sort de la brume. « Sylvaën. Je suis ces gobelins depuis trois jours. Ils ont capturé une forgeronne naine, et je connais un sentier qui passe derrière leur palissade. »",
    ],
    step: next('camp', 'Suivre Sylvaën'),
  },
  {
    id: 'foret_herboriste',
    chapter: ACT1,
    title: "L'herboriste",
    setup: { map: 'foret-clairiere', show: show('herboriste', "La vieille herboriste") },
    heal: true,
    narration: [
      "Une vieille femme ramasse des herbes au bord de l'eau. Elle ne semble pas surprise de vous voir.",
      '« Vous allez au camp des gobelins ? Buvez ça d\'abord. » Son infusion amère vous rend toutes vos forces. « Et méfiez-vous du chaman : sa fumée endort. »',
    ],
    step: next('camp', 'Continuer vers le camp'),
  },
  {
    id: 'foret_araignee',
    chapter: ACT1,
    title: 'La toile',
    setup: { map: 'foret-clairiere', pieces: [piece('araignee', 'araignee-geante', 0.55, 0.2, 0.2)] },
    narration: ["Une toile énorme barre le sentier, et sa propriétaire descend lentement d'une branche : une araignée grosse comme un poney."],
    step: check('Passez sans finir emballés.', 'dexterite', 12, "Échapper à l'araignée géante", 'araignee_ok', 'araignee_ko'),
  },
  {
    id: 'araignee_ok',
    chapter: ACT1,
    title: 'Au large de la toile',
    narration: ["Un bond de côté, une roulade sous une racine : l'araignée ne mord que la brume. Le camp n'est plus très loin."],
    step: next('camp', 'Continuer vers le camp'),
  },
  {
    id: 'araignee_ko',
    chapter: ACT1,
    title: 'Pris dans la toile',
    damage: 2,
    narration: ["La toile vous colle aux bras et la morsure brûle : chacun perd 2 PV avant de se dégager à coups de lame."],
    step: next('camp', 'Continuer vers le camp'),
  },

  // Le camp des gobelins.
  {
    id: 'camp',
    chapter: ACT1,
    title: 'Le camp des gobelins',
    setup: {
      map: 'camp-gobelins',
      pieces: [
        piece('gob-1', 'gobelin-guerrier', 0.3, 0.2),
        piece('gob-2', 'gobelin-guerrier', 0.6, 0.18),
        piece('gob-archer', 'gobelin-archer', 0.78, 0.4),
        piece('gob-chaman', 'gobelin-chaman', 0.45, 0.35),
      ],
    },
    narration: [
      "Derrière une palissade de pieux, une douzaine de tentes en peaux, des feux qui fument, des rires aigus. Dans une cage au milieu du camp, une naine enchaînée injurie ses gardiens.",
      'Un chaman tourne autour du feu en agitant un bâton fumant. Personne ne monte la garde du côté des rochers.',
    ],
    gmNotes: 'La prisonnière est Brunhild, la forgeronne naine du village. Libérée, elle forgera plus tard des armes qui aident contre le dragon (indice « forge »).',
    step: vote('Comment entrez-vous dans le camp ?', [
      opt('assaut', 'Attaquer de front, en hurlant', 'camp_assaut'),
      opt('nuit', 'Attendre la nuit et vous glisser jusqu\'à la cage', 'camp_nuit'),
      opt('sentier', 'Prendre le sentier secret de Sylvaën', 'camp_libere', 'guide'),
    ]),
  },
  {
    id: 'camp_assaut',
    chapter: ACT1,
    title: "À l'assaut !",
    narration: ['Vous enfoncez la porte de la palissade. Les gobelins attrapent leurs lances en piaillant.'],
    step: check('Balayez les gobelins.', 'force', 12, "Prendre le camp d'assaut", 'camp_libere', 'camp_fumee'),
  },
  {
    id: 'camp_nuit',
    chapter: ACT1,
    title: 'À pas de loup',
    narration: ['La nuit tombe. Les feux baissent, les ronflements montent. Vous longez la palissade jusqu\'à la cage.'],
    step: check('Approchez sans un bruit.', 'dexterite', 12, 'Se glisser dans le camp endormi', 'camp_libere', 'camp_fumee'),
  },
  {
    id: 'camp_fumee',
    chapter: ACT1,
    title: 'La fumée du chaman',
    damage: 4,
    narration: [
      "Le chaman vous a vus. Il souffle dans son bâton : une fumée verte vous pique les yeux, et les lances pleuvent. Chacun perd 4 PV.",
      "Dans la confusion, vous brisez quand même la cage. La naine vous attrape par le bras : « Par ici, la grotte de leur roi ! »",
    ],
    gains: ['forge'],
    step: next('grotte', 'Courir vers la grotte'),
  },
  {
    id: 'camp_libere',
    chapter: ACT1,
    title: 'La forgeronne libérée',
    setup: { map: 'camp-gobelins', show: show('forgeronne-naine', 'Brunhild, la forgeronne') },
    gains: ['forge'],
    narration: [
      "La cage s'ouvre. La naine se frotte les poignets : « Brunhild, forgeronne de Brumeval. Merci. Ces avortons m'ont prise pour que je leur forge des chaînes. Des chaînes énormes, pour une bête énorme. »",
      '« Leur roi est dans la grotte, là-haut. Et il n\'est pas seul : un type en robe pourpre lui parle tous les soirs. »',
    ],
    step: next('grotte', 'Monter à la grotte'),
  },

  // La grotte du roi gobelin.
  {
    id: 'grotte',
    chapter: ACT1,
    title: 'Le trône d\'os',
    setup: {
      map: 'grotte-gobelins',
      pieces: [piece('roi-gobelin', 'roi-gobelin', 0.42, 0.12, 0.2), piece('cultiste', 'cultiste', 0.62, 0.18)],
      show: show('roi-gobelin', 'Le roi gobelin'),
    },
    narration: [
      "Au fond de la grotte, sur un trône d'os et de ferraille, un gobelin énorme porte une couronne tordue. À ses pieds, un tas de butin. À côté de lui, un homme en robe pourpre.",
      "« Tuez-les, Majesté, souffle le cultiste. Mes maîtres doubleront votre or. »",
    ],
    gmNotes: "Le roi gobelin se croit l'allié du culte, mais le culte compte le sacrifier au dragon. La lettre ou la prophétie peuvent le retourner.",
    step: vote('Que faites-vous ?', [
      opt('roi', 'Défier le roi gobelin', 'grotte_roi'),
      opt('cultiste', 'Bondir sur le cultiste avant qu\'il ne file', 'grotte_cultiste'),
      opt('lettre', 'Montrer au roi la lettre du culte : il sera sacrifié', 'grotte_trahi', 'lettre'),
      opt('prophetie', 'Répéter au roi la prophétie de la diseuse', 'grotte_trahi', 'prophetie'),
    ]),
  },
  {
    id: 'grotte_roi',
    chapter: ACT1,
    title: 'Duel au pied du trône',
    narration: ['Le roi gobelin descend de son trône en faisant tournoyer une masse hérissée de clous.'],
    step: check('Abattez le roi gobelin.', 'force', 13, 'Vaincre le roi gobelin', 'acte1_fin', 'grotte_dur'),
  },
  {
    id: 'grotte_cultiste',
    chapter: ACT1,
    title: 'Rattraper le cultiste',
    narration: ['Le cultiste recule vers une faille du rocher. Le roi gobelin, lui, hésite.'],
    step: check('Attrapez-le avant la faille.', 'dexterite', 12, 'Attraper le cultiste', 'acte1_fin', 'grotte_dur'),
  },
  {
    id: 'grotte_trahi',
    chapter: ACT1,
    title: 'Le roi trahi',
    narration: ["Le roi gobelin plisse les yeux, regarde le cultiste… et éclate d'un rire mauvais."],
    step: check('Convainquez-le pour de bon.', 'charisme', 11, 'Retourner le roi gobelin contre le culte', 'acte1_allie', 'grotte_dur'),
  },
  {
    id: 'grotte_dur',
    chapter: ACT1,
    title: 'La mêlée',
    damage: 5,
    narration: [
      'Tout part de travers : la masse du roi, les dagues du cultiste, les gobelins qui accourent. Chacun perd 5 PV.',
      "Vous finissez par l'emporter, à bout de souffle. Le roi gobelin s'enfuit dans les galeries ; le cultiste, lui, n'a pas eu cette chance.",
    ],
    step: next('acte1_fin', 'Fouiller le cultiste'),
  },
  {
    id: 'acte1_allie',
    chapter: ACT1,
    title: 'Une couronne pour deux',
    gains: ['gobelins'],
    narration: [
      "« Sacrifié ? Moi ? » Le roi gobelin attrape le cultiste par le col et le jette à vos pieds. « Gardez-le. Et si vous allez taper ces robes pourpres, mes gobelins viendront. Pour le butin. »",
    ],
    step: next('acte1_fin', 'Fouiller le cultiste'),
  },
  {
    id: 'acte1_fin',
    chapter: ACT1,
    title: 'Le médaillon',
    gains: ['medaillon'],
    setup: { map: 'place-village', pieces: [ally('milicien', 'milicien-village', 0.7, 0.3)] },
    heal: true,
    narration: [
      "Sur le cultiste, un médaillon d'or : un œil dans une flamme. Au dos, gravé : « Pour la Dame, au port d'Aurélia, quand la Vipère accostera. »",
      "Brumeval vous fête toute la nuit. Le bourgmestre vous confie une lettre pour le roi, et chacun dort enfin d'un vrai sommeil : vous voilà remis sur pied.",
      'Au matin, la route de la ville royale vous attend.',
    ],
    step: next('aurelia', 'Partir pour la ville royale'),
  },

  // ════ Acte II : Aurélia, la ville royale ════
  {
    id: 'aurelia',
    chapter: ACT2,
    title: 'Aurélia au crépuscule',
    setup: { map: 'rues-ville', show: scenery('ambiance-ville-royale', 'Aurélia, la ville royale') },
    narration: [
      "Trois jours de route, et voici Aurélia : ses remparts bleus, ses toits dorés, ses lanternes qui s'allument une à une. Au-dessus du palais, le lion d'or flotte au vent.",
      'La lettre du bourgmestre vous ouvre les portes du palais dès le lendemain matin.',
    ],
    step: next('audience', 'Se présenter au palais'),
  },
  {
    id: 'audience',
    chapter: ACT2,
    title: 'La salle du trône',
    setup: {
      map: 'salle-trone',
      pieces: [ally('roi', 'roi', 0.46, 0.12, 0.17), ally('capitaine', 'capitaine-garde', 0.3, 0.2), ally('mage-cour', 'mage-cour', 0.64, 0.2)],
      show: show('roi', "Le roi d'Aurélion"),
    },
    narration: [
      "Le roi vous écoute en silence, la main sur le pommeau de son épée. À sa droite, la capitaine de la garde. À sa gauche, le mage de la cour, plongé dans un livre.",
      "Près du trône, une dame à l'éventail sourit poliment. « Des gobelins, des bandits… Majesté, ce sont des histoires de campagne. »",
    ],
    gmNotes: "Dame Isolde, la dame à l'éventail, est la « Dame » du médaillon : elle dirige le culte à la cour. Montrer le médaillon devant elle l'alerte.",
    step: vote('Que faites-vous du médaillon ?', [
      opt('cour', 'Le montrer au roi, devant toute la cour', 'audience_cour'),
      opt('capitaine', 'Le montrer en secret à la capitaine de la garde', 'audience_capitaine'),
      opt('rien', 'Ne rien dire et enquêter seuls en ville', 'rues'),
    ]),
  },
  {
    id: 'audience_cour',
    chapter: ACT2,
    title: "L'éventail se ferme",
    setup: { map: 'salle-trone', show: show('noble-intrigante', "Dame Isolde") },
    gains: ['isolde'],
    narration: [
      "Le médaillon brille dans votre main. La salle murmure. Le roi fronce les sourcils… et l'éventail de la dame se ferme d'un coup sec.",
      "« Dame Isolde », souffle la capitaine à votre oreille. « Elle vient de pâlir. » Quand vous relevez les yeux, Isolde a déjà quitté la salle.",
    ],
    step: next('rues', 'Descendre en ville'),
  },
  {
    id: 'audience_capitaine',
    chapter: ACT2,
    title: 'Une alliée dans la garde',
    setup: { map: 'salle-trone', show: show('capitaine-garde', 'La capitaine de la garde') },
    gains: ['capitaine'],
    narration: [
      "Dans un couloir du palais, la capitaine examine le médaillon. « J'ai vu ce symbole sur des caisses au port. Je ne peux pas agir sans preuve… mais je peux vous envoyer mes gardes quand vous en aurez besoin. »",
    ],
    step: next('rues', 'Descendre en ville'),
  },

  // Les rues : une rencontre au hasard.
  {
    id: 'rues',
    chapter: ACT2,
    title: 'Les rues pavées',
    setup: { map: 'rues-ville' },
    narration: [
      "Les échoppes, les ruelles, la foule du marché : le culte peut se cacher partout. Vous tendez l'oreille, vous posez des questions.",
    ],
    step: random([{ next: 'rues_voleur' }, { next: 'rues_alchimiste' }, { next: 'rues_embuscade', weight: 1 }, { next: 'rues_embuscade', needs: 'isolde', weight: 2 }], 'Chercher une piste'),
  },
  {
    id: 'rues_voleur',
    chapter: ACT2,
    title: "L'informateur",
    setup: { map: 'rues-ville', show: show('informateur-voleur', "Fil, l'informateur") },
    gains: ['piste'],
    narration: [
      "Un jeune homme encapuchonné fait rouler une pièce entre ses doigts. « Fil, pour vous servir. Pour trois pièces d'or, je vous dis où vont les caisses de la Vipère. »",
      "« Elles arrivent au port la nuit, et descendent dans les égouts. Ça sent le soufre à vous retourner l'estomac. »",
    ],
    step: next('choix_ville', 'Réfléchir à la suite'),
  },
  {
    id: 'rues_alchimiste',
    chapter: ACT2,
    title: "L'alchimiste",
    setup: { map: 'rues-ville', show: show('alchimiste', "L'alchimiste") },
    gains: ['encens'],
    narration: [
      "Dans une boutique qui fume de partout, un alchimiste à lunettes vous reçoit. « De l'encens de braise ? On m'en a acheté trois tonneaux. Personne n'en achète ! Ça sert à… réveiller les grosses bêtes qui dorment. »",
      "Il vous glisse une fiole bleue : « De la poudre de givre. Jetée dans un brasero, elle étouffe l'encens. »",
    ],
    step: next('choix_ville', 'Réfléchir à la suite'),
  },
  {
    id: 'rues_embuscade',
    chapter: ACT2,
    title: 'Les masques',
    setup: { map: 'rues-ville', pieces: [piece('fanatique-1', 'fanatique', 0.25, 0.3), piece('fanatique-2', 'fanatique', 0.75, 0.35)] },
    narration: ["Une ruelle trop calme. Deux silhouettes masquées, dagues courbes à la main, vous tombent dessus depuis les toits. Quelqu'un sait que vous êtes là."],
    step: check('Retournez l\'embuscade.', 'dexterite', 12, "Déjouer l'embuscade des fanatiques", 'embuscade_ok', 'embuscade_ko'),
  },
  {
    id: 'embuscade_ok',
    chapter: ACT2,
    title: 'Un fanatique bavard',
    setup: { map: 'rues-ville', pieces: [piece('fanatique-1', 'fanatique', 0.25, 0.3)] },
    gains: ['piste'],
    narration: ['Vous désarmez le plus petit des deux. Sous la menace, il crache : « Le sanctuaire… sous la ville. Par le port ou par les égouts, vous arriverez trop tard ! »'],
    step: next('choix_ville', 'Réfléchir à la suite'),
  },
  {
    id: 'embuscade_ko',
    chapter: ACT2,
    title: 'Dagues courbes',
    damage: 4,
    narration: ['Les dagues sont rapides et empoisonnées : chacun perd 4 PV. Les fanatiques disparaissent par les toits, laissant derrière eux une forte odeur de soufre.'],
    step: next('choix_ville', 'Réfléchir à la suite'),
  },
  {
    id: 'choix_ville',
    chapter: ACT2,
    title: 'Le port ou les égouts',
    setup: { map: 'rues-ville' },
    narration: [
      'Toutes les pistes mènent sous la ville, là où le culte prépare quelque chose. Deux chemins pour y descendre.',
    ],
    step: vote('Par où descendez-vous ?', [
      opt('port', 'Par le port, où accoste la Vipère', 'port'),
      opt('egouts', 'Par les égouts, en suivant l\'odeur de soufre', 'egouts'),
      opt('gardes', 'Avec les gardes de la capitaine, par la grande porte des égouts', 'egouts_gardes', 'capitaine'),
      opt('piste', 'Par la porte dérobée dont on vous a parlé', 'egouts_ok', 'piste'),
    ]),
  },
  {
    id: 'port',
    chapter: ACT2,
    title: 'Les quais',
    setup: {
      map: 'port-quais',
      pieces: [ally('capitaine-port', 'capitaine-port', 0.2, 0.6), piece('cultiste-1', 'cultiste', 0.62, 0.32), piece('cultiste-2', 'cultiste', 0.72, 0.4)],
      show: show('capitaine-port', 'La capitaine Mara'),
    },
    narration: [
      "Au port, une capitaine en tricorne vous fait signe. « Mara. La Vipère, là, c'est mon ancien navire. Volé par des robes pourpres. Ils déchargent ce soir. »",
      'Des cultistes font rouler des tonneaux vers un entrepôt. Une trappe y mène sous terre.',
    ],
    step: check('Glissez-vous dans l\'entrepôt.', 'dexterite', 12, "Entrer dans l'entrepôt sans être vus", 'port_ok', 'port_ko'),
  },
  {
    id: 'port_ok',
    chapter: ACT2,
    title: 'La trappe',
    gains: ['encens'],
    narration: [
      "Entre deux tonneaux, vous filez jusqu'à la trappe. Mara vous suit : « Ces tonneaux sont pleins d'encens de braise. Si on en vide un dans le port, ce sera toujours ça de moins. »",
      'Sous la trappe, un escalier de pierre descend, chaud comme un four.',
    ],
    step: next('sanctuaire', 'Descendre'),
  },
  {
    id: 'port_ko',
    chapter: ACT2,
    title: 'Bagarre sur les quais',
    damage: 3,
    narration: [
      "Un tonneau roule, un cultiste crie. Bagarre sur les quais : chacun perd 3 PV, mais Mara et ses marins vous dégagent le passage.",
      'Vous plongez par la trappe avant que les renforts n\'arrivent.',
    ],
    step: next('sanctuaire', 'Descendre'),
  },
  {
    id: 'egouts',
    chapter: ACT2,
    title: 'Les égouts',
    setup: { map: 'egouts', pieces: [piece('diablotin-1', 'diablotin', 0.3, 0.3, 0.11), piece('diablotin-2', 'diablotin', 0.66, 0.24, 0.11)] },
    narration: [
      "L'eau sale clapote sous les voûtes. L'odeur de soufre devient insupportable. Des rires aigus résonnent : de petits démons ailés jouent avec des rats.",
    ],
    step: check('Trouvez le bon tunnel sans réveiller toute la nichée.', 'intelligence', 11, 'Suivre la piste du soufre', 'egouts_ok', 'egouts_ko'),
  },
  {
    id: 'egouts_gardes',
    chapter: ACT2,
    title: 'Les gardes du roi',
    setup: { map: 'egouts', pieces: [ally('garde-1', 'garde-ville', 0.3, 0.6), ally('garde-2', 'garde-ville', 0.42, 0.66), ally('capitaine', 'capitaine-garde', 0.5, 0.55)] },
    narration: [
      "La capitaine tient parole : six gardes en cape bleue vous ouvrent la grande porte des égouts. Les diablotins fuient devant les hallebardes.",
      'Vous avancez vite, et sans une égratignure.',
    ],
    step: next('sanctuaire', 'Avancer jusqu\'au sanctuaire'),
  },
  {
    id: 'egouts_ok',
    chapter: ACT2,
    title: 'Le bon tunnel',
    narration: ['Les traces de soufre, les marques de chariot, une porte trop neuve pour des égouts : vous y êtes, sans un bruit.'],
    step: next('sanctuaire', 'Pousser la porte'),
  },
  {
    id: 'egouts_ko',
    chapter: ACT2,
    title: 'La nichée',
    damage: 3,
    narration: ["Un faux pas dans l'eau, et toute la nichée de diablotins vous tombe dessus en mordant et en griffant. Chacun perd 3 PV avant de trouver la porte du sanctuaire."],
    step: next('sanctuaire', 'Pousser la porte'),
  },

  // Le sanctuaire du culte.
  {
    id: 'sanctuaire',
    chapter: ACT2,
    title: 'Le sanctuaire de l\'Œil',
    setup: {
      map: 'sanctuaire-culte',
      pieces: [
        piece('grand-pretre', 'grand-pretre', 0.45, 0.14, 0.18),
        piece('cultiste-1', 'cultiste', 0.26, 0.3),
        piece('cultiste-2', 'cultiste', 0.66, 0.3),
      ],
      show: show('grand-pretre', 'Le grand prêtre'),
    },
    narration: [
      "Une salle souterraine, des colonnes noires, un cercle d'invocation qui pulse de lumière pourpre. Des braseros brûlent un encens épais et rouge.",
      "Au centre, un homme au masque doré psalmodie. Dans le cercle, quelque chose de massif et de cornu commence à prendre forme.",
    ],
    gmNotes: "Le grand prêtre ouvre un passage vers Cendrecime et invoque un démon pour le garder. S'il finit son rituel, le démon apparaît. L'encens peut être étouffé avec la poudre de givre.",
    step: vote('Que faites-vous ?', [
      opt('rituel', "Briser le cercle d'invocation", 'rituel'),
      opt('pretre', 'Foncer sur le grand prêtre', 'pretre'),
      opt('encens', "Étouffer l'encens des braseros", 'rituel_brise', 'encens'),
    ]),
  },
  {
    id: 'rituel',
    chapter: ACT2,
    title: 'Le cercle pourpre',
    narration: ['Vous vous jetez sur les runes du cercle. Elles brûlent sous vos doigts.'],
    step: check('Effacez les bonnes runes.', 'intelligence', 13, "Briser le cercle d'invocation", 'rituel_brise', 'demon'),
  },
  {
    id: 'pretre',
    chapter: ACT2,
    title: 'Le masque doré',
    narration: ['Le grand prêtre vous voit venir et lève les mains. Il lui manque quelques mots pour finir.'],
    step: check('Frappez avant la dernière syllabe.', 'force', 13, 'Interrompre le grand prêtre', 'rituel_brise', 'demon'),
  },
  {
    id: 'demon',
    chapter: ACT2,
    title: 'Le démon cornu',
    damage: 5,
    setup: {
      map: 'sanctuaire-culte',
      pieces: [piece('demon', 'demon-cornu', 0.4, 0.2, 0.24)],
      show: show('demon-cornu', 'Le démon cornu'),
    },
    narration: [
      "Trop tard. Le cercle explose, et un démon cornu, haut comme deux hommes, sort des flammes en rugissant. Son premier coup vous envoie valser : chacun perd 5 PV.",
      "Le combat est terrible. Quand le démon retombe enfin en cendres, le grand prêtre a disparu par un passage de feu.",
    ],
    step: next('revelation', 'Fouiller le sanctuaire'),
  },
  {
    id: 'rituel_brise',
    chapter: ACT2,
    title: 'Le rituel brisé',
    setup: { map: 'sanctuaire-culte', pieces: [piece('grand-pretre', 'grand-pretre', 0.45, 0.14, 0.18)] },
    narration: [
      'Les braseros s\'éteignent en sifflant, le cercle se fend. Le démon à moitié formé se dissout en fumée.',
      "Le grand prêtre recule, furieux. « Trop tard, de toute façon. Les sceaux tomberont. » Il jette une poignée de braises et disparaît dans un passage de feu.",
    ],
    step: next('revelation', 'Fouiller le sanctuaire'),
  },
  {
    id: 'revelation',
    chapter: ACT2,
    title: 'Le plan du culte',
    setup: { map: 'sanctuaire-culte', show: show('noble-intrigante', 'Dame Isolde') },
    narration: [
      "Sur l'autel, une carte du royaume et des lettres signées « I. » : Dame Isolde. Le culte veut réveiller Pyraxis, le dragon rouge qui dort sous Cendrecime, et lui offrir le royaume.",
      "Le seul chemin vers le cœur de la montagne passe par le château de son allié, un seigneur vampire. Le grand prêtre y court. Isolde, elle, a fui la ville dans la nuit.",
    ],
    step: next('temple', 'Rapporter la nouvelle au palais'),
  },
  {
    id: 'temple',
    chapter: ACT2,
    title: 'La bénédiction',
    heal: true,
    setup: { map: 'temple', pieces: [ally('pretresse', 'pretresse-temple', 0.48, 0.16)], show: show('pretresse-temple', 'La grande prêtresse') },
    gains: ['benediction'],
    narration: [
      "Le roi vous reçoit en héros et vous envoie au temple de la lumière. Sous les vitraux, la grande prêtresse soigne vos blessures : vous voilà remis sur pied.",
      "Elle trace un symbole de lumière sur votre front. « Contre les morts et les buveurs de sang, cette bénédiction vous protégera. Une fois. »",
      "Le roi vous donne des chevaux. Cendrecime est à une semaine de route, et trois chemins y mènent.",
    ],
    step: next('terres', 'Partir vers Cendrecime'),
  },

  // ════ Acte III : les terres sauvages ════
  {
    id: 'terres',
    chapter: ACT3,
    title: 'Trois chemins',
    setup: { map: 'royaume-aurelion' },
    narration: [
      "La carte du royaume s'étale devant vous. Cendrecime fume au nord. Par le col, il faut traverser le territoire des orcs. Par le marais, celui d'une sorcière qui connaît, dit-on, les secrets des vampires. Par la vieille crypte royale, un passage sous la montagne… gardé par les morts.",
    ],
    gmNotes: 'Chaque chemin donne un allié ou une arme pour le final : les orcs (assaut du château), le pieu de la sorcière (contre le vampire), le chevalier spectre (contre le dragon).',
    step: vote('Quel chemin prenez-vous ?', [
      opt('col', 'Le col des orcs, dans la neige', 'col'),
      opt('marais', 'Le marais de la sorcière', 'marais'),
      opt('crypte', 'La crypte des anciens rois', 'crypte'),
    ]),
  },

  // Le col des orcs.
  {
    id: 'col',
    chapter: ACT3,
    title: 'Le col enneigé',
    setup: { map: 'col-montagne' },
    narration: ['Le vent hurle, la neige vous fouette le visage. Les chevaux renâclent. Plus haut, des tambours de guerre résonnent entre les pics.'],
    step: random([{ next: 'col_avalanche' }, { next: 'col_patrouille' }], 'Monter vers le col'),
  },
  {
    id: 'col_avalanche',
    chapter: ACT3,
    title: "L'avalanche",
    narration: ['Un grondement sourd, au-dessus. La pente entière se met à glisser vers vous.'],
    step: check("Tenez bon sous la neige.", 'constitution', 12, "Survivre à l'avalanche", 'camp_orc', 'col_ensevelis'),
  },
  {
    id: 'col_ensevelis',
    chapter: ACT3,
    title: 'Ensevelis',
    damage: 4,
    narration: ['La neige vous roule, vous écrase, vous glace jusqu\'aux os. Chacun perd 4 PV avant de creuser vers la lumière… juste devant les pieux d\'un camp orc.'],
    step: next('camp_orc', 'Se relever'),
  },
  {
    id: 'col_patrouille',
    chapter: ACT3,
    title: 'La patrouille',
    setup: { map: 'col-montagne', pieces: [piece('orc-1', 'orc-guerrier', 0.3, 0.25), piece('orc-2', 'orc-archer', 0.7, 0.2), piece('ogre', 'ogre', 0.5, 0.12, 0.2)] },
    narration: ['Des silhouettes dans la tempête : deux orcs peints de rouge et un ogre qui traîne un tronc d\'arbre comme gourdin.'],
    step: check('Tenez tête à la patrouille.', 'force', 12, 'Repousser la patrouille orc', 'camp_orc', 'col_ogre'),
  },
  {
    id: 'col_ogre',
    chapter: ACT3,
    title: "Le tronc de l'ogre",
    damage: 4,
    narration: ["Le tronc de l'ogre balaie tout sur son passage : chacun perd 4 PV. Les orcs vous ligotent et vous traînent jusqu'à leur chef."],
    step: next('camp_orc', 'Se laisser emmener'),
  },
  {
    id: 'camp_orc',
    chapter: ACT3,
    title: 'Le camp de guerre',
    setup: {
      map: 'camp-orc',
      pieces: [piece('chef-orc', 'chef-orc', 0.45, 0.14, 0.2), piece('orc-chaman', 'orc-chaman', 0.66, 0.2), piece('orc-1', 'orc-guerrier', 0.26, 0.24)],
      show: show('chef-orc', 'Grokh, chef de guerre'),
    },
    narration: [
      "Une palissade de pieux, des feux, des tentes de fourrure. Le chef de guerre, couvert de cicatrices, s'appuie sur une hache plus grande que vous. « Grokh. Les robes pourpres m'ont promis vos villages. Pourquoi je ne vous mangerais pas ? »",
    ],
    gmNotes: 'Grokh respecte la force et déteste être trompé. Le médaillon prouve que le culte veut aussi livrer les orcs au dragon.',
    step: vote('Que répondez-vous à Grokh ?', [
      opt('duel', "Le défier en duel d'honneur", 'orc_duel'),
      opt('parler', "Lui expliquer que le dragon brûlera aussi les orcs", 'orc_parler'),
      opt('medaillon', 'Lui jeter le médaillon du culte : la preuve de leur trahison', 'orc_allies', 'medaillon'),
    ]),
  },
  {
    id: 'orc_duel',
    chapter: ACT3,
    title: "Duel d'honneur",
    narration: ["Les orcs forment un cercle et frappent sur leurs boucliers. Grokh fait tourner sa hache en riant."],
    step: check('Tenez face à Grokh.', 'force', 14, 'Duel contre Grokh', 'orc_allies', 'orc_defaite'),
  },
  {
    id: 'orc_parler',
    chapter: ACT3,
    title: 'Parler aux orcs',
    narration: ["Vous parlez du dragon, des flammes, des villages qui brûleront, ceux des orcs comme les autres. Le chaman écoute, les yeux mi-clos."],
    step: check('Trouvez les mots qui portent.', 'charisme', 13, 'Convaincre Grokh', 'orc_allies', 'orc_defaite'),
  },
  {
    id: 'orc_allies',
    chapter: ACT3,
    title: 'La horde de Grokh',
    gains: ['orcs'],
    narration: [
      "Grokh plante sa hache dans le sol. « Les robes pourpres nous ont menti. Alors on ira leur casser les dents. » Toute la horde rugit avec lui.",
      'Les orcs vous ouvrent la route du nord, jusqu\'au pont de la gorge.',
    ],
    step: next('pont', 'Marcher vers le pont'),
  },
  {
    id: 'orc_defaite',
    chapter: ACT3,
    title: 'Chassés du camp',
    damage: 5,
    narration: ["Grokh n'est pas convaincu. Coups de poing, coups de manche de hache : chacun perd 5 PV. On vous jette hors du camp, sur la route du pont."],
    step: next('pont', 'Repartir, endoloris'),
  },
  {
    id: 'pont',
    chapter: ACT3,
    title: 'Le pont sur la gorge',
    setup: { map: 'pont-gorge', pieces: [piece('troll', 'troll', 0.48, 0.3, 0.22)] },
    narration: ['Un vieux pont de pierre au-dessus d\'un torrent furieux. Au milieu, un troll massif réclame un péage : « Un de vous. Le plus gras. »'],
    step: vote('Comment passez-vous le pont ?', [
      opt('force', 'Pousser le troll dans le torrent', 'pont_force'),
      opt('ruse', 'Lui proposer une énigme', 'pont_ruse'),
    ]),
  },
  {
    id: 'pont_force',
    chapter: ACT3,
    title: 'Corps à corps',
    narration: ['Vous chargez tous ensemble. Le troll écarte les bras et sourit de toutes ses dents moussues.'],
    step: check('Poussez !', 'force', 13, 'Pousser le troll dans le torrent', 'pont_passe', 'pont_coups'),
  },
  {
    id: 'pont_ruse',
    chapter: ACT3,
    title: "L'énigme",
    narration: ['« Une énigme ? » Le troll se gratte la tête. « D\'accord. Mais si je trouve, je mange. »'],
    step: check("Posez une énigme qu'il ne résoudra pas.", 'intelligence', 12, 'Embrouiller le troll', 'pont_passe', 'pont_coups'),
  },
  {
    id: 'pont_passe',
    chapter: ACT3,
    title: 'De l\'autre côté',
    narration: ["Le troll finit dans le torrent, ou assis à se gratter la tête : peu importe, le pont est à vous. Au-delà, sur un pic, le château du vampire se découpe sous l'orage."],
    step: next('approche', 'Marcher vers le château'),
  },
  {
    id: 'pont_coups',
    chapter: ACT3,
    title: 'La massue du troll',
    damage: 4,
    narration: ["La massue du troll fait trembler le pont : chacun perd 4 PV. Vous finissez par passer en courant pendant qu'il cherche ses dents dans le torrent."],
    step: next('approche', 'Marcher vers le château'),
  },

  // Le marais de la sorcière.
  {
    id: 'marais',
    chapter: ACT3,
    title: 'Le marais',
    setup: { map: 'marais' },
    narration: ["Des pontons pourris, une eau verte qui fait des bulles, des arbres couverts de mousse. Les chevaux refusent d'aller plus loin. La cabane de la sorcière est au cœur du marais."],
    step: random([{ next: 'marais_lezards' }, { next: 'marais_araignees' }], 'Avancer sur les pontons'),
  },
  {
    id: 'marais_lezards',
    chapter: ACT3,
    title: 'Les hommes-lézards',
    setup: { map: 'marais', pieces: [piece('lezard-1', 'homme-lezard', 0.3, 0.3), piece('lezard-2', 'homme-lezard', 0.68, 0.26)] },
    narration: ["Des hommes-lézards sortent de l'eau, lances levées. Ils sifflent quelque chose qui ressemble à « Intrus ! »"],
    step: vote('Que faites-vous ?', [
      opt('combat', 'Les repousser à coups de lame', 'lezards_combat'),
      opt('parler', 'Leur montrer que vous venez en paix', 'lezards_parler'),
    ]),
  },
  {
    id: 'lezards_combat',
    chapter: ACT3,
    title: 'Combat sur les pontons',
    narration: ['Les pontons tanguent sous vos pieds. Les lances visent vos jambes.'],
    step: check('Gardez l\'équilibre et frappez.', 'dexterite', 12, 'Repousser les hommes-lézards', 'cabane', 'marais_morsures'),
  },
  {
    id: 'lezards_parler',
    chapter: ACT3,
    title: 'Paroles de paix',
    narration: ['Vous rangez vos armes et levez les mains. Les hommes-lézards se regardent.'],
    step: check('Gagnez leur confiance.', 'charisme', 11, 'Parlementer avec les hommes-lézards', 'marais_guides', 'marais_morsures'),
  },
  {
    id: 'marais_guides',
    chapter: ACT3,
    title: 'Un chemin sûr',
    narration: ["« La vieille… elle nous fait peur aussi », siffle le plus grand. Ils vous guident par un chemin sec jusqu'à la cabane sur pilotis."],
    step: next('cabane', 'Frapper à la porte'),
  },
  {
    id: 'marais_araignees',
    chapter: ACT3,
    title: 'Les toiles du marais',
    setup: { map: 'marais', pieces: [piece('araignee-1', 'araignee-geante', 0.25, 0.2, 0.18), piece('araignee-2', 'araignee-geante', 0.72, 0.3, 0.18)] },
    narration: ['Entre les arbres, des toiles épaisses comme des voiles de bateau. Deux araignées géantes vous observent de leurs huit yeux.'],
    step: check('Traversez sans vous faire prendre.', 'dexterite', 12, 'Traverser le bois des araignées', 'cabane', 'marais_morsures'),
  },
  {
    id: 'marais_morsures',
    chapter: ACT3,
    title: 'Morsures et venin',
    damage: 4,
    narration: ['Morsures, venin, eau croupie : chacun perd 4 PV avant d\'arriver, trempé, devant la cabane de la sorcière.'],
    step: next('cabane', 'Frapper à la porte'),
  },
  {
    id: 'cabane',
    chapter: ACT3,
    title: 'La cabane sur pilotis',
    setup: { map: 'marais', pieces: [piece('sorciere', 'sorciere-marais', 0.5, 0.2, 0.17)], show: show('sorciere-marais', 'Mère Vase, la sorcière') },
    narration: [
      "La porte s'ouvre avant que vous ne frappiez. Une vieille femme ridée comme une pomme vous sourit de toutes ses trois dents. « Mère Vase. Vous voulez tuer le vampire. Je le sais. Moi aussi, je le veux. »",
      '« J\'ai le pieu de frêne qui lui percera le cœur. Mais rien n\'est gratuit, mes petits. »',
    ],
    gmNotes: "Mère Vase hait le vampire, qui lui a volé sa jeunesse. Elle veut un peu de la vie des héros en échange : de vrais PV. On peut aussi la duper ou la forcer.",
    step: vote('Comment obtenez-vous le pieu ?', [
      opt('payer', 'Accepter son prix, quel qu\'il soit', 'sorciere_prix'),
      opt('ruse', 'La duper avec une fausse promesse', 'sorciere_ruse'),
      opt('force', 'Prendre le pieu de force', 'sorciere_force'),
    ]),
  },
  {
    id: 'sorciere_prix',
    chapter: ACT3,
    title: 'Le prix',
    damage: 3,
    gains: ['pieu'],
    narration: [
      "Mère Vase vous touche le front un par un. Un froid vous traverse : chacun perd 3 PV, et elle rajeunit d'un an. « Marché conclu. »",
      'Elle vous tend un pieu de frêne gravé de runes, et vous montre un sentier vers le château du vampire.',
    ],
    step: next('approche', 'Prendre le sentier'),
  },
  {
    id: 'sorciere_ruse',
    chapter: ACT3,
    title: 'La fausse promesse',
    narration: ['« Quand le vampire sera mort, son château sera à vous », promettez-vous. Mère Vase plisse les yeux.'],
    step: check('Gardez votre sérieux.', 'charisme', 13, 'Duper Mère Vase', 'sorciere_dupee', 'sorciere_malediction'),
  },
  {
    id: 'sorciere_force',
    chapter: ACT3,
    title: 'Le pieu ou la vie',
    setup: { map: 'marais', pieces: [piece('sorciere', 'sorciere-marais', 0.5, 0.2, 0.17), piece('troll', 'troll', 0.25, 0.3, 0.2)] },
    narration: ['Vous tirez vos armes. Mère Vase siffle entre ses dents, et un troll couvert de mousse sort de sous la cabane.'],
    step: check('Passez le troll et attrapez le pieu.', 'force', 13, 'Prendre le pieu de force', 'sorciere_dupee', 'sorciere_malediction'),
  },
  {
    id: 'sorciere_dupee',
    chapter: ACT3,
    title: 'Le pieu de frêne',
    gains: ['pieu'],
    narration: ["Le pieu de frêne est à vous. Mère Vase grommelle des injures en vieux patois pendant que vous filez vers le nord. Le château du vampire n'est plus loin."],
    step: next('approche', 'Filer vers le château'),
  },
  {
    id: 'sorciere_malediction',
    chapter: ACT3,
    title: 'La malédiction',
    damage: 5,
    narration: ["Mère Vase éclate de rire et vous jette une poignée de vase maudite : chacun perd 5 PV. « Partez, et que le vampire vous croque ! » Sans pieu, vous reprenez la route du château."],
    step: next('approche', 'Reprendre la route'),
  },

  // La crypte des anciens rois.
  {
    id: 'crypte',
    chapter: ACT3,
    title: 'La crypte royale',
    setup: { map: 'crypte', pieces: [piece('squelette-1', 'squelette-soldat', 0.3, 0.25), piece('squelette-2', 'squelette-archer', 0.7, 0.2), piece('zombie', 'zombie', 0.55, 0.35)] },
    narration: [
      "Sous la colline des anciens rois, la crypte s'ouvre sur des sarcophages brisés. Une lueur verte flotte entre les piliers. Les morts ne dorment plus : ils se lèvent en grinçant.",
    ],
    step: vote('Que faites-vous ?', [
      opt('force', 'Vous frayer un chemin à travers les squelettes', 'crypte_combat'),
      opt('lumiere', 'Lever la bénédiction de la prêtresse', 'crypte_lumiere', 'benediction'),
    ]),
  },
  {
    id: 'crypte_combat',
    chapter: ACT3,
    title: 'Os et poussière',
    narration: ['Les squelettes avancent en rangs serrés, épées rouillées levées.'],
    step: check('Brisez leurs rangs.', 'force', 12, 'Passer les squelettes', 'crypte_salles', 'crypte_griffes'),
  },
  {
    id: 'crypte_lumiere',
    chapter: ACT3,
    title: 'La lumière du temple',
    narration: ['Le symbole sur votre front s\'allume comme un soleil. Les squelettes s\'effondrent en tas d\'os. La bénédiction est usée, mais le chemin est libre.'],
    step: next('crypte_salles', 'Descendre plus bas'),
  },
  {
    id: 'crypte_griffes',
    chapter: ACT3,
    title: 'Griffes de goule',
    damage: 4,
    setup: { map: 'crypte', pieces: [piece('goule', 'goule', 0.5, 0.3)] },
    narration: ["Une goule surgit d'un sarcophage pendant que vous combattez les squelettes. Ses griffes paralysent : chacun perd 4 PV avant de la renvoyer à sa tombe."],
    step: next('crypte_salles', 'Descendre plus bas'),
  },
  {
    id: 'crypte_salles',
    chapter: ACT3,
    title: 'Le chevalier spectre',
    setup: { map: 'donjon-salles', pieces: [piece('spectre', 'spectre', 0.48, 0.22, 0.18)], show: show('spectre', 'Sire Galvan, le chevalier spectre') },
    narration: [
      "Plus bas, devant une herse, un chevalier translucide vous barre le passage. « Je suis Galvan, dernier gardien du sceau de Cendrecime. Un nécromancien m'a lié à ces salles. Libérez-moi, ou affrontez-moi. »",
    ],
    gmNotes: "Galvan a scellé Pyraxis il y a mille ans. Libéré, il peut refaire le sceau dans le repaire du dragon (indice « galvan »).",
    step: check('Rompez le lien du nécromancien par la parole.', 'charisme', 12, 'Libérer Sire Galvan', 'galvan_libre', 'galvan_combat'),
  },
  {
    id: 'galvan_libre',
    chapter: ACT3,
    title: 'Le serment de Galvan',
    gains: ['galvan'],
    narration: ['Le chevalier pose un genou à terre. « Je vous suivrai jusqu\'au dragon. Mais d\'abord, il faut punir celui qui m\'a lié. »'],
    step: random([{ next: 'necromancien', weight: 2 }, { next: 'liche' }], 'Ouvrir la herse'),
  },
  {
    id: 'galvan_combat',
    chapter: ACT3,
    title: 'Le spectre attaque',
    damage: 4,
    narration: ["Le lien est trop fort. L'épée spectrale traverse armures et boucliers : chacun perd 4 PV avant que Galvan ne disparaisse en gémissant."],
    step: random([{ next: 'necromancien', weight: 2 }, { next: 'liche' }], 'Ouvrir la herse'),
  },
  {
    id: 'necromancien',
    chapter: ACT3,
    title: 'Le nécromancien',
    setup: { map: 'tour-mage', pieces: [piece('necromancien', 'necromancien', 0.48, 0.2, 0.17)], show: show('necromancien', 'Le nécromancien') },
    narration: ["Derrière la herse, un escalier monte jusqu'à une salle ronde pleine de livres. Un homme en robe noire lève un crâne lumineux. « Le culte m'avait promis que personne ne viendrait. »"],
    step: check('Arrachez-lui son crâne lumineux.', 'dexterite', 12, 'Désarmer le nécromancien', 'crypte_sortie', 'crypte_maudits'),
  },
  {
    id: 'liche',
    chapter: ACT3,
    title: 'La liche',
    setup: { map: 'tour-mage', pieces: [piece('liche', 'liche', 0.48, 0.18, 0.2)], show: show('liche', 'La liche couronnée') },
    narration: [
      "Ce n'est pas un nécromancien qui vous attend, mais son maître : une liche couronnée, aux yeux de flamme bleue. Elle n'a pas parlé depuis cent ans, et sa voix fait geler l'air.",
      '« Vous êtes venus mourir. Bien. »',
    ],
    step: check('Brisez son phylactère, la gemme de son sceptre.', 'intelligence', 14, 'Briser le phylactère de la liche', 'crypte_sortie', 'crypte_maudits'),
  },
  {
    id: 'crypte_maudits',
    chapter: ACT3,
    title: 'La magie des morts',
    damage: 5,
    narration: ["Un éclair vert vous glace le sang : chacun perd 5 PV. Le combat dure longtemps, mais votre adversaire finit par tomber en poussière."],
    step: next('crypte_sortie', 'Trouver la sortie'),
  },
  {
    id: 'crypte_sortie',
    chapter: ACT3,
    title: 'Sous la montagne',
    narration: ["Derrière la tour, un long tunnel remonte vers le nord. Quand vous en sortez, la nuit tombe, et le château du vampire se dresse sur son pic, juste devant vous."],
    step: next('approche', 'Marcher vers le château'),
  },

  // ════ Final : le château du vampire et le repaire du dragon ════
  {
    id: 'approche',
    chapter: FINAL,
    title: "Le château sous l'orage",
    setup: { map: 'chateau-vampire', show: scenery('ambiance-chateau-vampire', 'Le château du vampire') },
    narration: [
      "L'orage éclate au-dessus du pic. Le château du vampire, noir et rouge, garde la seule porte du cœur de Cendrecime. Des éclairs illuminent ses tours.",
    ],
    step: random([{ next: 'chauves_souris' }, { next: 'loup_garou' }, { next: 'porte_ouverte' }], 'Approcher du château'),
  },
  {
    id: 'chauves_souris',
    chapter: FINAL,
    title: 'Les ailes noires',
    setup: { map: 'chateau-vampire', pieces: [piece('chauve-souris-1', 'chauve-souris-geante', 0.3, 0.2), piece('chauve-souris-2', 'chauve-souris-geante', 0.7, 0.24)] },
    narration: ['Un nuage noir tombe des tours : des chauves-souris géantes, par dizaines, qui visent vos gorges.'],
    step: check('Protégez-vous jusqu\'à la porte.', 'constitution', 12, 'Traverser la nuée de chauves-souris', 'grande_salle', 'nuee'),
  },
  {
    id: 'nuee',
    chapter: FINAL,
    title: 'La nuée',
    damage: 3,
    narration: ['Ailes, crocs, griffes : chacun perd 3 PV avant de claquer la grande porte derrière vous.'],
    step: next('grande_salle', 'Entrer dans la grande salle'),
  },
  {
    id: 'loup_garou',
    chapter: FINAL,
    title: 'Le gardien de la porte',
    setup: { map: 'chateau-vampire', pieces: [piece('loup-garou', 'loup-garou', 0.48, 0.24, 0.2)], show: show('loup-garou', 'Le loup-garou') },
    narration: ['Devant la porte, une silhouette se tord sous la lune et devient une bête énorme, toute en crocs et en fourrure. Le loup-garou du vampire hurle à la mort.'],
    step: check('Abattez le loup-garou.', 'force', 13, 'Vaincre le loup-garou', 'grande_salle', 'loup_garou_ko'),
  },
  {
    id: 'loup_garou_ko',
    chapter: FINAL,
    title: 'Crocs de lune',
    damage: 4,
    narration: ["Le loup-garou vous lacère avant de tomber : chacun perd 4 PV. La porte du château grince et s'ouvre toute seule."],
    step: next('grande_salle', 'Entrer'),
  },
  {
    id: 'porte_ouverte',
    chapter: FINAL,
    title: 'On vous attend',
    narration: ["La grande porte est ouverte. Aucun garde, aucune bête. Juste un tapis rouge, des bougies allumées… et une voix douce : « Entrez donc. On vous attendait. »"],
    step: next('grande_salle', 'Entrer'),
  },
  {
    id: 'grande_salle',
    chapter: FINAL,
    title: 'Le seigneur vampire',
    setup: {
      map: 'chateau-vampire',
      pieces: [piece('vampire', 'seigneur-vampire', 0.46, 0.14, 0.18), piece('rejeton-1', 'rejeton-vampire', 0.28, 0.24), piece('rejeton-2', 'rejeton-vampire', 0.66, 0.24)],
      show: show('seigneur-vampire', 'Le seigneur vampire'),
    },
    narration: [
      "Sous les lustres, un homme pâle en habit noir et rouge lève une coupe vers vous. À ses côtés, Dame Isolde, son éventail à la main.",
      "« Le dragon s'éveille déjà, mes amis. Quand il aura brûlé le royaume, il me laissera les survivants. Un marché équitable. Voulez-vous en faire partie ? »",
    ],
    gmNotes: "Le vampire est dangereux en combat direct. Le pieu de la sorcière, la bénédiction ou la horde de Grokh changent tout.",
    step: vote('Que faites-vous ?', [
      opt('combat', 'Le combattre, ici et maintenant', 'vampire_combat'),
      opt('pieu', 'Lui planter le pieu de Mère Vase dans le cœur', 'vampire_vaincu', 'pieu'),
      opt('benediction', 'Lever la bénédiction de la prêtresse contre lui', 'vampire_lumiere', 'benediction'),
      opt('orcs', 'Sonner le cor : la horde de Grokh enfonce les portes', 'vampire_horde', 'orcs'),
    ]),
  },
  {
    id: 'vampire_combat',
    chapter: FINAL,
    title: 'Danse avec le vampire',
    narration: ['Le vampire pose sa coupe et disparaît dans un nuage de brume, pour réapparaître derrière vous.'],
    step: check('Touchez-le avant qu\'il ne vous vide de votre sang.', 'force', 14, 'Vaincre le seigneur vampire', 'vampire_vaincu', 'vampire_morsure'),
  },
  {
    id: 'vampire_lumiere',
    chapter: FINAL,
    title: 'La lumière du temple',
    narration: ['Le symbole de la prêtresse s\'embrase sur votre front. Le vampire recule en sifflant, les mains devant les yeux.'],
    step: check('Repoussez-le jusqu\'à la fenêtre, vers l\'aube.', 'charisme', 11, 'Repousser le vampire avec la bénédiction', 'vampire_vaincu', 'vampire_morsure'),
  },
  {
    id: 'vampire_horde',
    chapter: FINAL,
    title: 'La horde',
    narration: [
      "Le cor résonne. Les portes du château explosent sous les haches orcs, et Grokh entre en hurlant. Les rejetons fuient, le vampire recule.",
      'Dans la mêlée, la hache de Grokh trouve son chemin. Le seigneur vampire tombe en cendres.',
    ],
    step: next('vampire_vaincu', 'Chercher Isolde'),
  },
  {
    id: 'vampire_morsure',
    chapter: FINAL,
    title: 'La morsure',
    damage: 6,
    narration: [
      'Le vampire est trop rapide. Ses crocs trouvent une gorge, puis une autre : chacun perd 6 PV.',
      "Mais l'aube se lève, et un rayon de soleil traverse un vitrail brisé. Le vampire hurle, s'enflamme, et fuit dans les profondeurs du château.",
    ],
    step: next('vampire_vaincu', 'Chercher Isolde'),
  },
  {
    id: 'vampire_vaincu',
    chapter: FINAL,
    title: 'La fuite d\'Isolde',
    setup: { map: 'chateau-vampire' },
    narration: [
      "Le maître du château n'est plus. Dame Isolde, elle, a fui par un escalier qui s'enfonce dans la roche, vers le cœur de la montagne.",
      'Vous trouvez une chambre vide, des lits, des provisions. Une heure de repos avant la dernière descente.',
    ],
    step: next('veillee', 'Se reposer'),
  },
  {
    id: 'veillee',
    chapter: FINAL,
    title: 'La dernière veillée',
    heal: true,
    narration: [
      "Une heure de silence. On panse ses plaies, on aiguise ses armes, on pense à Brumeval, à Aurélia. Vous voilà remis sur pied.",
      "Sous vos pieds, la montagne gronde. Quelque chose d'immense respire.",
    ],
    step: next('repaire', 'Descendre vers le dragon'),
  },
  {
    id: 'repaire',
    chapter: FINAL,
    title: 'Le repaire de Pyraxis',
    setup: {
      map: 'repaire-dragon',
      pieces: [
        piece('dragon', 'dragon-rouge', 0.36, 0.06, 0.3),
        piece('grand-pretre', 'grand-pretre', 0.7, 0.3, 0.16),
        piece('kobold-1', 'kobold', 0.22, 0.4, 0.11),
        piece('drakeide', 'drakeide-garde', 0.82, 0.5),
      ],
      show: scenery('ambiance-montagne-dragon', 'Cendrecime'),
    },
    narration: [
      "Une caverne immense, rouge de lave. Une montagne d'or. Et couché dessus, un dragon rouge aussi grand qu'une cathédrale, les yeux encore mi-clos.",
      'Le grand prêtre et Dame Isolde psalmodient devant lui. À chaque mot, une écaille de plus s\'embrase. Kobolds et gardes drakéides montent la garde.',
    ],
    gmNotes: "Pyraxis n'est pas encore éveillé. Arrêter le rituel le rendort ; Galvan peut refaire le sceau. S'il s'éveille, il faut le vaincre ou négocier avec un dragon furieux.",
    step: vote('Il reste quelques instants. Que faites-vous ?', [
      opt('rituel', 'Interrompre le rituel', 'repaire_rituel'),
      opt('pretre', 'Abattre le grand prêtre', 'repaire_pretre'),
      opt('galvan', 'Laisser Sire Galvan refaire le sceau', 'fin_sceau', 'galvan'),
      opt('forge', 'Brandir les armes forgées par Brunhild contre le dragon', 'repaire_forge', 'forge'),
      opt('gobelins', 'Lâcher les gobelins du roi sur les kobolds, et foncer sur le prêtre', 'pretre_tombe', 'gobelins'),
    ]),
  },
  {
    id: 'repaire_rituel',
    chapter: FINAL,
    title: 'Les mots interdits',
    narration: ['Vous vous jetez entre les cultistes et le dragon, en couvrant leurs voix des vôtres.'],
    step: check('Brisez la litanie.', 'intelligence', 14, 'Interrompre le rituel du réveil', 'fin_sommeil', 'eveil'),
  },
  {
    id: 'repaire_pretre',
    chapter: FINAL,
    title: 'Le masque tombe',
    narration: ["Vous foncez sur le grand prêtre. Les kobolds s'interposent, les drakéides lèvent leurs lances."],
    step: check('Atteignez le grand prêtre.', 'force', 13, 'Abattre le grand prêtre', 'pretre_tombe', 'eveil'),
  },
  {
    id: 'pretre_tombe',
    chapter: FINAL,
    title: 'Le grand prêtre tombe',
    setup: { map: 'repaire-dragon', pieces: [piece('dragon', 'dragon-rouge', 0.36, 0.06, 0.3)] },
    narration: [
      "Le grand prêtre s'effondre, son masque doré roule sur l'or. Isolde hurle et s'enfuit. Mais le rituel était presque fini : le dragon ouvre un œil.",
      "« Qui… ose ? » La voix de Pyraxis fait trembler la montagne.",
    ],
    step: vote('Le dragon vous regarde. Que faites-vous ?', [
      opt('parler', 'Lui parler : le culte voulait faire de lui un esclave', 'dragon_parler'),
      opt('combat', 'Le combattre avant qu\'il ne soit tout à fait réveillé', 'dragon_combat'),
    ]),
  },
  {
    id: 'repaire_forge',
    chapter: FINAL,
    title: "L'acier de Brunhild",
    narration: [
      "Brunhild vous avait donné ses meilleures pièces, trempées dans le sang de dragon qu'elle gardait depuis l'enfance. Le métal chante au contact de la chaleur.",
    ],
    step: check('Frappez au défaut des écailles.', 'force', 12, "Frapper le dragon avec l'acier de Brunhild", 'fin_victoire', 'eveil'),
  },
  {
    id: 'eveil',
    chapter: FINAL,
    title: "L'éveil",
    damage: 6,
    setup: { map: 'repaire-dragon', pieces: [piece('dragon', 'dragon-rouge', 0.3, 0.06, 0.36)], show: show('dragon-rouge', 'Pyraxis, le dragon rouge') },
    narration: [
      "Trop tard. Pyraxis se dresse, et la caverne s'illumine. Un souffle de feu balaie tout : chacun perd 6 PV. Le grand prêtre et Isolde, eux, disparaissent dans les flammes de leur propre maître.",
      '« Mille ans de sommeil… et voici ce qu\'on m\'offre au réveil ? »',
    ],
    step: vote('Pyraxis est éveillé. Que faites-vous ?', [
      opt('parler', 'Lui parler, malgré tout', 'dragon_parler'),
      opt('combat', 'Le combattre jusqu\'au bout', 'dragon_combat'),
      opt('fuir', 'Fuir pour prévenir le royaume', 'fin_retraite'),
    ]),
  },
  {
    id: 'dragon_parler',
    chapter: FINAL,
    title: 'Parler au dragon',
    narration: ["Vous baissez vos armes. Le dragon penche sa tête immense vers vous. Son souffle sent le soufre et la braise."],
    step: check('Convainquez Pyraxis.', 'charisme', 15, 'Négocier avec Pyraxis', 'fin_pacte', 'dragon_combat'),
  },
  {
    id: 'dragon_combat',
    chapter: FINAL,
    title: 'Contre le dragon',
    narration: ['Pyraxis déploie ses ailes. La caverne entière devient un champ de bataille de lave et d\'or.'],
    step: check('Le coup qui décidera de tout.', 'force', 15, 'Vaincre Pyraxis', 'fin_victoire', 'fin_retraite'),
  },

  // Les fins.
  {
    id: 'fin_sceau',
    chapter: FINAL,
    title: 'Le sceau de Galvan',
    setup: { map: 'repaire-dragon', pieces: [piece('dragon', 'dragon-rouge', 0.36, 0.06, 0.3), piece('spectre', 'spectre', 0.5, 0.4, 0.16)] },
    narration: [
      "Sire Galvan s'avance, son épée spectrale levée. Il trace dans l'air le sceau qu'il avait tracé mille ans plus tôt. Les cultistes hurlent, la lave se fige, et le dragon referme son œil.",
      "« Mon serment est tenu », murmure le chevalier, et il s'efface dans la lumière. Le culte est brisé, Isolde est prise, et Pyraxis dormira encore mille ans.",
    ],
    step: { kind: 'end', title: 'Le sceau est refait' },
  },
  {
    id: 'fin_sommeil',
    chapter: FINAL,
    title: 'Dors, Pyraxis',
    setup: { map: 'repaire-dragon', pieces: [piece('dragon', 'dragon-rouge', 0.36, 0.06, 0.3)] },
    narration: [
      "La litanie se brise. Les écailles du dragon s'éteignent une à une, et Pyraxis pousse un long soupir de fumée avant de se rendormir sur son or.",
      'Le grand prêtre est pris, Isolde aussi. À Aurélia, le roi fait sonner toutes les cloches. Vos noms sont gravés sous le lion d\'or.',
    ],
    step: { kind: 'end', title: 'Le dragon dort encore' },
  },
  {
    id: 'fin_pacte',
    chapter: FINAL,
    title: 'Le pacte du dragon',
    setup: { map: 'ambiance-montagne-dragon' },
    narration: [
      "Pyraxis vous écoute longtemps. Puis il rit, d'un rire qui fait trembler la montagne. « Des esclaves ! Ils voulaient faire de moi leur chien de chasse. »",
      "Le dragon s'envole par le sommet de Cendrecime, emportant le culte dans ses griffes. Il ne reviendra pas, promet-il, tant que le royaume tiendra sa parole : ne jamais toucher à son or. Un drôle de traité, mais un traité.",
    ],
    step: { kind: 'end', title: 'Un pacte avec Pyraxis' },
  },
  {
    id: 'fin_victoire',
    chapter: FINAL,
    title: 'La chute du dragon',
    setup: { map: 'repaire-dragon' },
    narration: [
      "Le coup porte. Pyraxis rugit une dernière fois, et s'effondre sur son or dans un fracas de tonnerre. La lave se calme. Le silence revient sous la montagne.",
      "Les bardes chanteront longtemps l'histoire des tueurs de dragon. Avec un trésor pareil, Brumeval aura une nouvelle taverne, et le royaume des héros pour longtemps.",
    ],
    step: { kind: 'end', title: 'Pyraxis est vaincu' },
  },
  {
    id: 'fin_retraite',
    chapter: FINAL,
    title: 'Le ciel rouge',
    setup: { map: 'ambiance-montagne-dragon' },
    narration: [
      "Vous fuyez par les galeries, la chaleur dans le dos. Derrière vous, Pyraxis s'envole au-dessus de Cendrecime, et le ciel devient rouge.",
      "Vous avez survécu. Le royaume est prévenu, les armées se rassemblent sous le lion d'or. La guerre contre le dragon ne fait que commencer… À suivre !",
    ],
    step: { kind: 'end', title: 'Le dragon est libre' },
  },
]

export const DRAGON_CAMPAIGN: Adventure = {
  id: 'flamme-montagne',
  title: 'La Flamme sous la montagne',
  pitch:
    "Une campagne complète en trois actes et un final : des gobelins de Brumeval jusqu'au repaire du dragon rouge. Trois routes, des rencontres tirées au hasard, cinq fins possibles.",
  start: 'taverne',
  scenes: Object.fromEntries(scenes.map((s) => [s.id, s])),
}
