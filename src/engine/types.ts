export const Kind = {
  Smoke: 0,
  Ember: 1,
  Spark: 2,
  Dust: 3,
  Energy: 4,
  Blob: 5,
} as const

export type KindId = (typeof Kind)[keyof typeof Kind]

export const Intelligence = {
  Physics: 0,
  Swarm: 1,
  Creative: 2,
  Off: 3,
} as const

export type IntelligenceId = (typeof Intelligence)[keyof typeof Intelligence]

export const INTELLIGENCE_CYCLE = [
  Intelligence.Off,
  Intelligence.Swarm,
  Intelligence.Creative,
] as const

/** Physics was the old rest state — same as Off. */
export function visibleIntelligence(current: IntelligenceId): IntelligenceId {
  return current === Intelligence.Physics ? Intelligence.Off : current
}

export function cycleIntelligence(current: IntelligenceId): IntelligenceId {
  const now = visibleIntelligence(current)
  const i = INTELLIGENCE_CYCLE.indexOf(now as (typeof INTELLIGENCE_CYCLE)[number])
  return INTELLIGENCE_CYCLE[i < 0 ? 0 : (i + 1) % INTELLIGENCE_CYCLE.length]
}

export function kiDrives(intel: IntelligenceId): boolean {
  return intel === Intelligence.Swarm || intel === Intelligence.Creative
}

export const GradientMode = {
  Age: 'age',
  Speed: 'speed',
  Energy: 'energy',
  Collision: 'collision',
  Noise: 'noise',
} as const

export type GradientModeId = (typeof GradientMode)[keyof typeof GradientMode]

export const TimeMode = {
  Play: 'play',
  Slow: 'slow',
  Reverse: 'reverse',
  Freeze: 'freeze',
  Lapse: 'lapse',
} as const

export type TimeModeId = (typeof TimeMode)[keyof typeof TimeMode]

export const Mood = {
  Calm: 'calm',
  Curious: 'curious',
  Tense: 'tense',
  Joyful: 'joyful',
  Melancholic: 'melancholic',
} as const

export type MoodId = (typeof Mood)[keyof typeof Mood]

export const Tool = {
  Attract: 'attract',
  Repel: 'repel',
  Throw: 'throw',
  Cut: 'cut',
  Explode: 'explode',
  Heal: 'heal',
  Paint: 'paint',
} as const

export type ToolId = (typeof Tool)[keyof typeof Tool]

export const Quality = {
  Low: 'low',
  Medium: 'medium',
  High: 'high',
  Ultra: 'ultra',
} as const

export const EdgeMode = {
  Bounce: 'bounce',
  Wrap: 'wrap',
  Leave: 'leave',
  Fade: 'fade',
} as const

export type EdgeModeId = (typeof EdgeMode)[keyof typeof EdgeMode]

export const Shape = {
  Cube: 'cube',
  Tetra: 'tetra',
  Octa: 'octa',
  Pyramid: 'pyramid',
  Diamond: 'diamond',
  Icosa: 'icosa',
  Sphere: 'sphere',
  Torus: 'torus',
  Star: 'star',
  Helix: 'helix',
  Prism: 'prism',
} as const

export type ShapeId = (typeof Shape)[keyof typeof Shape]

export type QualityId = (typeof Quality)[keyof typeof Quality]

export type PointerForce = {
  id: number
  x: number
  y: number
  px: number
  py: number
  active: boolean
  strength: number
  tool: ToolId
}

export type InterestingEvent = {
  x: number
  y: number
  energy: number
  age: number
  kind?: 'boom'
}

export type PerfStats = {
  fps: number
  particles: number
  frameMs: number
}

export type PhysicsParams = {
  gravity: number
  damping: number
  turbulence: number
  turbulenceScale: number
  windX: number
  windY: number
  buoyancy: number
  lifetime: number
  size: number
  sizeJitter: number
  spawnRate: number
  collisionRestitution: number
  collisionRadius: number
  wallBounce: number
  edgeMode: EdgeModeId
  secondarySparks: number
  mixSmoke: number
  mixEmbers: number
  mixSparks: number
  mixDust: number
  mixEnergy: number
  mixBlobs: number
  onSmoke: boolean
  onEmbers: boolean
  onSparks: boolean
  onDust: boolean
  onEnergy: boolean
  onBlobs: boolean
}

export type ColorParams = {
  primary: string
  secondary: string
  accent: string
  glow: string
  background: string
  saturation: number
  brightness: number
  hueShift: number
  colorTurbulence: number
  gradientMode: GradientModeId
}

export type SwarmParams = {
  intelligence: IntelligenceId
  separation: number
  alignment: number
  cohesion: number
  avoidance: number
  seek: number
  perception: number
  maxSpeed: number
  strength: number
  orbit: number
  pulse: number
  predatorPrey: boolean
  multiSwarm: boolean
  personality: string
}

export type CreativeParams = {
  mutationRate: number
  inheritOnCollision: boolean
  mood: MoodId
  timeScale: number
  timeMode: TimeModeId
  symmetry: number
  kaleidoscope: boolean
  evolvePulse: number
  reactiveEnv: boolean
}

export type ExplosionParams = {
  enabled: boolean
  threshold: number
  force: number
  radius: number
  sparks: number
  shatter: number
  chain: number
  flash: number
}

export type ShapeParams = {
  enabled: boolean
  shape: ShapeId
  autoCycle: boolean
  randomOrder: boolean
  switchSpeed: number
  switchHold: number
  scale: number
  perspective: number
  attract: number
  fold: number
  orbit: number
  spinX: number
  spinY: number
  spinZ: number
  wander: number
  pulse: number
  drift: number
  ghost: number
  depthFade: number
}

export type InteractionParams = {
  tool: ToolId
  rightTool: ToolId
  brushSize: number
  brushStrength: number
  followEvents: boolean
}

export type GraphicsParams = {
  quality: QualityId
  glow: boolean
  postEffects: boolean
  softParticles: boolean
  chromaticAberration: boolean
  resolutionScale: number
  vsync: boolean
  fpsLimit: number
  particleCap: number
  trails: boolean
  trailFade: number
  showPerf: boolean
}

export type CameraParams = {
  x: number
  y: number
  zoom: number
}

export const EmitterMix = {
  Field: 'field',
  Smoke: 'smoke',
  Embers: 'embers',
  Sparks: 'sparks',
  Dust: 'dust',
  Energy: 'energy',
  Blobs: 'blobs',
} as const

export type EmitterMixId = (typeof EmitterMix)[keyof typeof EmitterMix]

export type Emitter = {
  id: string
  nx: number
  ny: number
  enabled: boolean
  rate: number
  heading: number
  cone: number
  speed: number
  spread: number
  size: number
  life: number
  mix: EmitterMixId
}

export type EmittersParams = {
  items: Emitter[]
}

export type SimParams = {
  physics: PhysicsParams
  color: ColorParams
  swarm: SwarmParams
  creative: CreativeParams
  explosion: ExplosionParams
  shape: ShapeParams
  emitters: EmittersParams
  interaction: InteractionParams
  graphics: GraphicsParams
  camera: CameraParams
}

export type SectionKey = keyof SimParams

export type FullSnapshot = {
  version: 1
  name: string
  favorite: boolean
  savedAt: string
  params: SimParams
  behaviorPresetId: string | null
  colorPresetId: string | null
}
