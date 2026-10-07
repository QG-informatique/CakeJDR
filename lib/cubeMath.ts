/**
 * Calcul d'orientation d'un dé cubique, partagé par le dé de la page d'accueil
 * (`components/ui/HeroDie.tsx`) et les dés lancés sur la table
 * (`components/dice/TableDice.tsx`).
 *
 * L'orientation est une matrice 3×3. Chaque bascule par-dessus une arête est
 * un quart de tour dans le repère de la table, appliqué à gauche de la
 * matrice. La table est l'écran vu de dessus : la face visible est celle dont
 * la normale pointe vers l'écran (+z).
 */

/** Matrice de rotation 3×3, rangée ligne par ligne. */
export type Mat = [number, number, number, number, number, number, number, number, number]
export type Axis = 'x' | 'y'

export const IDENTITY: Mat = [1, 0, 0, 0, 1, 0, 0, 0, 1]

/** Faces opposées dont la somme fait 7, comme sur un vrai dé. */
export const FACES = [
  { value: 1, rx: 0, ry: 0 },
  { value: 6, rx: 0, ry: 180 },
  { value: 3, rx: 0, ry: 90 },
  { value: 4, rx: 0, ry: -90 },
  { value: 2, rx: 90, ry: 0 },
  { value: 5, rx: -90, ry: 0 },
] as const

/** Position des points sur une grille 3×3, en [ligne, colonne]. */
export const PIPS: Record<number, ReadonlyArray<readonly [number, number]>> = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [0, 2], [2, 0], [2, 2]],
  5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  6: [[0, 0], [1, 0], [2, 0], [0, 2], [1, 2], [2, 2]],
}

export function mul(a: Mat, b: Mat): Mat {
  return [
    a[0] * b[0] + a[1] * b[3] + a[2] * b[6],
    a[0] * b[1] + a[1] * b[4] + a[2] * b[7],
    a[0] * b[2] + a[1] * b[5] + a[2] * b[8],
    a[3] * b[0] + a[4] * b[3] + a[5] * b[6],
    a[3] * b[1] + a[4] * b[4] + a[5] * b[7],
    a[3] * b[2] + a[4] * b[5] + a[5] * b[8],
    a[6] * b[0] + a[7] * b[3] + a[8] * b[6],
    a[6] * b[1] + a[7] * b[4] + a[8] * b[7],
    a[6] * b[2] + a[7] * b[5] + a[8] * b[8],
  ]
}

/** Même convention que `rotateX()` / `rotateY()` en CSS. */
export function rotation(axis: Axis, deg: number): Mat {
  const r = (deg * Math.PI) / 180
  const c = Math.cos(r)
  const s = Math.sin(r)
  return axis === 'x' ? [1, 0, 0, 0, c, -s, 0, s, c] : [c, 0, s, 0, 1, 0, -s, 0, c]
}

/** Après une bascule complète, la matrice ne contient que -1, 0 et 1 : on arrondit
 *  pour que les erreurs d'arrondi ne s'accumulent pas de lancer en lancer. */
export const snap = (m: Mat): Mat => m.map((v) => Math.round(v)) as Mat

/** `matrix3d()` attend les colonnes, pas les lignes. */
export const toCss = (m: Mat) =>
  `matrix3d(${m[0]},${m[3]},${m[6]},0,${m[1]},${m[4]},${m[7]},0,${m[2]},${m[5]},${m[8]},0,0,0,0,1)`

/**
 * Axe et sens de la bascule qui accompagne un déplacement : le dé bascule sur
 * l'arête qui fait face au mouvement, selon la composante dominante.
 */
export const tipFromVelocity = (vx: number, vy: number): { axis: Axis; sign: number } =>
  Math.abs(vx) >= Math.abs(vy)
    ? { axis: 'y', sign: Math.sign(vx) || 1 }
    : { axis: 'x', sign: -(Math.sign(vy) || 1) }

type Vec3 = [number, number, number]

const apply = (m: Mat, v: Vec3): Vec3 => [
  Math.round(m[0] * v[0] + m[1] * v[1] + m[2] * v[2]),
  Math.round(m[3] * v[0] + m[4] * v[1] + m[5] * v[2]),
  Math.round(m[6] * v[0] + m[7] * v[1] + m[8] * v[2]),
]

/** Normale d'une face de `FACES`, dans le repère du dé. */
export const faceNormal = (i: number): Vec3 => {
  const f = FACES[i] ?? FACES[0]
  return apply(snap(mul(rotation('x', f.rx), rotation('y', f.ry))), [0, 0, 1])
}

/** Face tournée vers l'écran pour une orientation à plat. */
export const topFace = (m: Mat): number =>
  FACES.findIndex((_, i) => apply(m, faceNormal(i))[2] === 1)

/** Les 24 orientations à plat d'un cube. */
export const CUBE_ROTATIONS: Mat[] = (() => {
  const found = new Map<string, Mat>([[IDENTITY.join(), IDENTITY]])
  const queue: Mat[] = [IDENTITY]
  const steps = [snap(rotation('x', 90)), snap(rotation('y', 90))]
  while (queue.length) {
    const m = queue.shift() as Mat
    for (const s of steps) {
      const next = snap(mul(s, m))
      const key = next.join()
      if (!found.has(key)) {
        found.set(key, next)
        queue.push(next)
      }
    }
  }
  return [...found.values()]
})()

/** Orientations qui amènent la face `from` à la place de la face `to`. */
export const rotationsBetween = (from: number, to: number): Mat[] => {
  const target = faceNormal(to).join()
  return CUBE_ROTATIONS.filter((q) => apply(q, faceNormal(from)).join() === target)
}
