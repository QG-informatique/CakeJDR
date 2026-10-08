// Ce que la table utilise de @3d-dice/dice-box-threejs, livré sans types.
declare module '@3d-dice/dice-box-threejs' {
  type Projected = { x: number; y: number }
  type Vec = { x: number; y: number; z: number; set(x: number, y: number, z: number): void }
  type Quat = { x: number; y: number; z: number; w: number; set(x: number, y: number, z: number, w: number): void }

  /** Ce qui porte une pose : le dé affiché ou son corps physique. */
  export type DiceBoxPose = { position: Vec; quaternion: Quat }

  export type DiceBoxBody = DiceBoxPose & {
    mass: number
    diceShape?: string
    velocity: Vec & { length(): number }
    addEventListener(type: 'collide', fn: (e: DiceBoxCollide) => void): void
    removeEventListener(type: 'collide', fn: (e: DiceBoxCollide) => void): void
  }

  export type DiceBoxCollide = { body: DiceBoxBody; target: DiceBoxBody }

  export type DiceBoxDie = DiceBoxPose & {
    getLastValue(): { value: number | string } | undefined
    position: Vec & { clone(): { project(camera: unknown): Projected } }
    body: DiceBoxBody
  }

  export type DiceBoxColorset = {
    name: string
    foreground: string
    background: string
    outline: string
    edge?: string
    texture: string
    material: string
  }

  export type DiceBoxConfig = {
    assetPath?: string
    framerate?: number
    sounds?: boolean
    volume?: number
    shadows?: boolean
    theme_surface?: string
    theme_customColorset?: DiceBoxColorset | null
    gravity_multiplier?: number
    baseScale?: number
    strength?: number
    iterationLimit?: number
  }

  export default class DiceBox {
    constructor(selector: string, config?: DiceBoxConfig)
    initialize(): Promise<void>
    roll(notation: string): Promise<unknown>
    clearDice(): void
    setDimensions(size: { x: number; y: number }): void
    loadSounds(): Promise<void>
    simulateThrow(): void
    animateThrow(run: number, done?: (this: DiceBox, v: unknown) => void): void
    animateAfterThrow(run: number): void
    throwFinished(): boolean
    /** Joue le son d'un choc (seuls ces champs sont lus). */
    eventCollide(e: {
      body: { mass: number; diceShape?: string; velocity: { length(): number }; world: { stepnumber: number } }
      target: { velocity: { length(): number } }
    }): void
    framerate: number
    iteration: number
    rolling: boolean
    running: number | false
    animstate: string
    sounds: boolean
    notationVectors: unknown
    diceList: DiceBoxDie[]
    world: { step(dt: number): void }
    scene: unknown
    camera: unknown
    renderer: { dispose(): void; render(scene: unknown, camera: unknown): void; domElement: HTMLCanvasElement }
  }
}
