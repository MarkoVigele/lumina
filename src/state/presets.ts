import type { ColorParams, CreativeParams, ExplosionParams, PhysicsParams, ShapeParams, SimParams, SwarmParams } from '../engine/types'
import { GradientMode, Intelligence, kiDrives, Mood, Shape, TimeMode } from '../engine/types'
import { DEFAULT_PARAMS, cloneParams } from '../engine/params'
import { SHAPE_LABEL } from '../engine/shapes'

export type ColorPreset = {
  id: string
  name: string
  note: string
  color: ColorParams
}

export type BehaviorPreset = {
  id: string
  name: string
  note: string
  patch: Partial<SimParams>
}

export type ExplosionPreset = {
  id: string
  name: string
  note: string
  explosion: ExplosionParams
}

export const EXPLOSION_PRESETS: ExplosionPreset[] = [
  {
    id: 'knistern',
    name: 'Knistern',
    note: 'Nur bei harten Treffern ein kurzes Zucken',
    explosion: {
      enabled: true,
      threshold: 72,
      force: 0.55,
      radius: 46,
      sparks: 0.28,
      shatter: 0.06,
      chain: 0,
      flash: 0.38,
    },
  },
  {
    id: 'funkenflug',
    name: 'Funkenflug',
    note: 'Viele Funken, wenig Druck',
    explosion: {
      enabled: true,
      threshold: 40,
      force: 0.85,
      radius: 88,
      sparks: 1.45,
      shatter: 0.12,
      chain: 0.08,
      flash: 0.55,
    },
  },
  {
    id: 'knall',
    name: 'Knall',
    note: 'Der ausgewogene Einschlag',
    explosion: { ...DEFAULT_PARAMS.explosion, enabled: true },
  },
  {
    id: 'salve',
    name: 'Salve',
    note: 'Ein Treffer zündet die Nachbarn',
    explosion: {
      enabled: true,
      threshold: 26,
      force: 1.15,
      radius: 132,
      sparks: 0.7,
      shatter: 0.22,
      chain: 0.72,
      flash: 0.7,
    },
  },
  {
    id: 'truemmerfeld',
    name: 'Trümmerfeld',
    note: 'Reißt auseinander, Funken nur am Rand',
    explosion: {
      enabled: true,
      threshold: 38,
      force: 1.85,
      radius: 150,
      sparks: 0.42,
      shatter: 0.82,
      chain: 0.12,
      flash: 0.62,
    },
  },
  {
    id: 'grossfeuer',
    name: 'Großfeuer',
    note: 'Weiter Radius, heller Blitz, viel Kraft',
    explosion: {
      enabled: true,
      threshold: 22,
      force: 2.2,
      radius: 210,
      sparks: 1.15,
      shatter: 0.4,
      chain: 0.34,
      flash: 1.05,
    },
  },
]

export type MixPreset = {
  id: string
  name: string
  note: string
  physics: Partial<PhysicsParams>
}

const MIX_OFF = {
  onSmoke: false,
  onEmbers: false,
  onSparks: false,
  onDust: false,
  onEnergy: false,
  onBlobs: false,
}

export const MIX_PRESETS: MixPreset[] = [
  {
    id: 'alles',
    name: 'Alles',
    note: 'Alle Arten an, ausgewogene Anteile',
    physics: {
      onSmoke: true,
      onEmbers: true,
      onSparks: true,
      onDust: true,
      onEnergy: true,
      onBlobs: true,
      mixSmoke: 0.28,
      mixEmbers: 0.14,
      mixSparks: 0.08,
      mixDust: 0.14,
      mixEnergy: 0.22,
      mixBlobs: 0.14,
    },
  },
  {
    id: 'rauch',
    name: 'Rauch',
    note: 'Nur Rauch',
    physics: { ...MIX_OFF, onSmoke: true, mixSmoke: 1 },
  },
  {
    id: 'glut',
    name: 'Glut',
    note: 'Nur Glut',
    physics: { ...MIX_OFF, onEmbers: true, mixEmbers: 1 },
  },
  {
    id: 'funken',
    name: 'Funken',
    note: 'Nur Funken',
    physics: { ...MIX_OFF, onSparks: true, mixSparks: 1 },
  },
  {
    id: 'staub',
    name: 'Staub',
    note: 'Nur Staub',
    physics: { ...MIX_OFF, onDust: true, mixDust: 1 },
  },
  {
    id: 'energie',
    name: 'Energie',
    note: 'Nur Energie',
    physics: { ...MIX_OFF, onEnergy: true, mixEnergy: 1 },
  },
  {
    id: 'blobs',
    name: 'Blobs',
    note: 'Nur weiche Blobs',
    physics: { ...MIX_OFF, onBlobs: true, mixBlobs: 1 },
  },
  {
    id: 'feuer',
    name: 'Feuer',
    note: 'Rauch, Glut und Funken',
    physics: {
      ...MIX_OFF,
      onSmoke: true,
      onEmbers: true,
      onSparks: true,
      mixSmoke: 0.45,
      mixEmbers: 0.4,
      mixSparks: 0.28,
    },
  },
  {
    id: 'licht',
    name: 'Licht',
    note: 'Energie und Funken',
    physics: {
      ...MIX_OFF,
      onEnergy: true,
      onSparks: true,
      mixEnergy: 0.7,
      mixSparks: 0.35,
    },
  },
  {
    id: 'asche',
    name: 'Asche',
    note: 'Rauch, Staub und Glut',
    physics: {
      ...MIX_OFF,
      onSmoke: true,
      onDust: true,
      onEmbers: true,
      mixSmoke: 0.5,
      mixDust: 0.4,
      mixEmbers: 0.22,
    },
  },
  {
    id: 'kontur',
    name: 'Kontur',
    note: 'Energie, Funken und Glut — gut fürs Gitter',
    physics: {
      ...MIX_OFF,
      onEnergy: true,
      onSparks: true,
      onEmbers: true,
      mixEnergy: 0.55,
      mixSparks: 0.28,
      mixEmbers: 0.22,
    },
  },
  {
    id: 'weich',
    name: 'Weich',
    note: 'Blobs und Rauch',
    physics: {
      ...MIX_OFF,
      onBlobs: true,
      onSmoke: true,
      mixBlobs: 0.65,
      mixSmoke: 0.4,
    },
  },
]

export function applyMixPreset(params: SimParams, id: string): SimParams {
  const preset = MIX_PRESETS.find((p) => p.id === id)
  if (!preset) return params
  const next = cloneParams(params)
  next.physics = { ...next.physics, ...preset.physics }
  return next
}

export const COLOR_PRESETS: ColorPreset[] = [
  {
    id: 'moonmilk',
    name: 'Mondmilch',
    note: 'Kühles Elfenbein auf Nachtblau',
    color: {
      primary: '#f0e6d4',
      secondary: '#9aa7c2',
      accent: '#d8c4a8',
      glow: '#fff4e2',
      background: '#0b0e14',
      saturation: 0.38,
      brightness: 0.84,
      hueShift: 12,
      colorTurbulence: 0.12,
      gradientMode: GradientMode.Age,
    },
  },
  {
    id: 'amber-dusk',
    name: 'Bernsteindämmerung',
    note: 'Warmes Kupfer über Asche — Tempo färbt',
    color: {
      primary: '#e8b48a',
      secondary: '#7c8ca8',
      accent: '#ff9b7a',
      glow: '#ffd2a8',
      background: '#0b0d12',
      saturation: 0.62,
      brightness: 0.78,
      hueShift: 28,
      colorTurbulence: 0.22,
      gradientMode: GradientMode.Speed,
    },
  },
  {
    id: 'aurora',
    name: 'Aurora',
    note: 'Grün-Violett, leicht elektrisch',
    color: {
      primary: '#7de2c4',
      secondary: '#8b7cff',
      accent: '#f0a6ff',
      glow: '#b8fff0',
      background: '#080b12',
      saturation: 0.72,
      brightness: 0.76,
      hueShift: 64,
      colorTurbulence: 0.4,
      gradientMode: GradientMode.Noise,
    },
  },
  {
    id: 'rose-ash',
    name: 'Rosenasche',
    note: 'Puderrosa in warmem Grau',
    color: {
      primary: '#f0b8c4',
      secondary: '#b8a49a',
      accent: '#e07a8a',
      glow: '#ffd4dc',
      background: '#120e10',
      saturation: 0.48,
      brightness: 0.8,
      hueShift: 16,
      colorTurbulence: 0.16,
      gradientMode: GradientMode.Age,
    },
  },
  {
    id: 'deep-tide',
    name: 'Tiefengezeiten',
    note: 'Petrol und stilles Gold',
    color: {
      primary: '#6ec4c8',
      secondary: '#1c3a48',
      accent: '#e6c27a',
      glow: '#9ee8e0',
      background: '#071014',
      saturation: 0.55,
      brightness: 0.7,
      hueShift: 22,
      colorTurbulence: 0.2,
      gradientMode: GradientMode.Speed,
    },
  },
  {
    id: 'cinder',
    name: 'Glutkern',
    note: 'Kohlen und Funken',
    color: {
      primary: '#ff7a3c',
      secondary: '#3a241c',
      accent: '#ffd27a',
      glow: '#ffb070',
      background: '#100a08',
      saturation: 0.82,
      brightness: 0.74,
      hueShift: 18,
      colorTurbulence: 0.18,
      gradientMode: GradientMode.Energy,
    },
  },
  {
    id: 'sage-mist',
    name: 'Salbeinebel',
    note: 'Sanftes Oliv und Milchgrün',
    color: {
      primary: '#b8c9a8',
      secondary: '#6e7a68',
      accent: '#e8d8b0',
      glow: '#e4f0d4',
      background: '#0e110e',
      saturation: 0.36,
      brightness: 0.78,
      hueShift: 10,
      colorTurbulence: 0.14,
      gradientMode: GradientMode.Age,
    },
  },
  {
    id: 'violet-hour',
    name: 'Violette Stunde',
    note: 'Abendlila mit Kupferglanz',
    color: {
      primary: '#c89be8',
      secondary: '#4a3560',
      accent: '#f0b48a',
      glow: '#e8c8ff',
      background: '#100c16',
      saturation: 0.6,
      brightness: 0.76,
      hueShift: 36,
      colorTurbulence: 0.28,
      gradientMode: GradientMode.Noise,
    },
  },
  {
    id: 'icebloom',
    name: 'Eisblüte',
    note: 'Klares Cyan, fast durchsichtig',
    color: {
      primary: '#c8f0ff',
      secondary: '#7aa0c8',
      accent: '#ffffff',
      glow: '#e8f8ff',
      background: '#080c12',
      saturation: 0.32,
      brightness: 0.88,
      hueShift: 14,
      colorTurbulence: 0.1,
      gradientMode: GradientMode.Speed,
    },
  },
  {
    id: 'peach-smoke',
    name: 'Pfirsichrauch',
    note: 'Weiche Hauttöne, sehr beruhigend',
    color: {
      primary: '#f3c4a8',
      secondary: '#c8a090',
      accent: '#f0d8c0',
      glow: '#ffe8d4',
      background: '#120e0c',
      saturation: 0.44,
      brightness: 0.82,
      hueShift: 12,
      colorTurbulence: 0.12,
      gradientMode: GradientMode.Age,
    },
  },
  {
    id: 'noir-gold',
    name: 'Noirgold',
    note: 'Dunkles Kino, ein warmer Punkt',
    color: {
      primary: '#e8c878',
      secondary: '#2a2a2e',
      accent: '#f4e8c0',
      glow: '#ffe9a8',
      background: '#0a0a0c',
      saturation: 0.5,
      brightness: 0.68,
      hueShift: 8,
      colorTurbulence: 0.08,
      gradientMode: GradientMode.Collision,
    },
  },
  {
    id: 'coral-night',
    name: 'Korallennacht',
    note: 'Lebendiges Korall über Mitternacht',
    color: {
      primary: '#ff7a7a',
      secondary: '#3a4a78',
      accent: '#ffc8a0',
      glow: '#ffb0a8',
      background: '#0c0c14',
      saturation: 0.7,
      brightness: 0.76,
      hueShift: 24,
      colorTurbulence: 0.26,
      gradientMode: GradientMode.Energy,
    },
  },
  {
    id: 'neon-vein',
    name: 'Neonader',
    note: 'Scharfes Magenta gegen Giftgrün',
    color: {
      primary: '#ff2d8a',
      secondary: '#14f0c0',
      accent: '#ffe14a',
      glow: '#ff8ad4',
      background: '#09060e',
      saturation: 1.15,
      brightness: 0.86,
      hueShift: 110,
      colorTurbulence: 0.55,
      gradientMode: GradientMode.Speed,
    },
  },
  {
    id: 'solar-ink',
    name: 'Solarinte',
    note: 'Heißes Orange in tiefem Schwarz',
    color: {
      primary: '#ff6a1a',
      secondary: '#1a0c08',
      accent: '#ffd36a',
      glow: '#ff9a40',
      background: '#0c0704',
      saturation: 1.05,
      brightness: 0.8,
      hueShift: 36,
      colorTurbulence: 0.2,
      gradientMode: GradientMode.Energy,
    },
  },
  {
    id: 'mint-copper',
    name: 'Minzkupfer',
    note: 'Kühles Mint gegen warmes Metall',
    color: {
      primary: '#7ff0c8',
      secondary: '#c47848',
      accent: '#fff2d4',
      glow: '#b8ffe0',
      background: '#0c100e',
      saturation: 0.78,
      brightness: 0.84,
      hueShift: 48,
      colorTurbulence: 0.3,
      gradientMode: GradientMode.Age,
    },
  },
  {
    id: 'blood-moon',
    name: 'Blutmond',
    note: 'Tiefes Rot, fast schwarz am Rand',
    color: {
      primary: '#d4183a',
      secondary: '#2a0810',
      accent: '#ffb070',
      glow: '#ff5a6a',
      background: '#0c0608',
      saturation: 0.95,
      brightness: 0.72,
      hueShift: 18,
      colorTurbulence: 0.16,
      gradientMode: GradientMode.Collision,
    },
  },
  {
    id: 'electric-fog',
    name: 'Elektonebel',
    note: 'Violett-Cyan, starker Hue-Shift',
    color: {
      primary: '#8b6cff',
      secondary: '#3de6ff',
      accent: '#f4f0ff',
      glow: '#c4b0ff',
      background: '#070814',
      saturation: 1.08,
      brightness: 0.88,
      hueShift: 140,
      colorTurbulence: 0.62,
      gradientMode: GradientMode.Noise,
    },
  },
  {
    id: 'honey-void',
    name: 'Honigleere',
    note: 'Gold in leerem Nachtblau',
    color: {
      primary: '#f0c24a',
      secondary: '#142038',
      accent: '#fff6c8',
      glow: '#ffe08a',
      background: '#080a10',
      saturation: 0.72,
      brightness: 0.8,
      hueShift: 22,
      colorTurbulence: 0.14,
      gradientMode: GradientMode.Age,
    },
  },
  {
    id: 'prism-melt',
    name: 'Prismaschmelze',
    note: 'Drei harte Farben, Tempo färbt um',
    color: {
      primary: '#ff4d6d',
      secondary: '#3d8bff',
      accent: '#7cff6b',
      glow: '#ffe8f0',
      background: '#0a0a12',
      saturation: 1.2,
      brightness: 0.9,
      hueShift: 90,
      colorTurbulence: 0.48,
      gradientMode: GradientMode.Speed,
    },
  },
  {
    id: 'cold-ember',
    name: 'Kalte Glut',
    note: 'Eisblau mit einem warmen Kern',
    color: {
      primary: '#9ad8ff',
      secondary: '#ff7a4a',
      accent: '#ffffff',
      glow: '#c8ecff',
      background: '#070c12',
      saturation: 0.7,
      brightness: 0.86,
      hueShift: 54,
      colorTurbulence: 0.28,
      gradientMode: GradientMode.Energy,
    },
  },
]

const swarmPatch = (partial: Partial<SwarmParams>): Partial<SimParams> => ({
  swarm: { ...DEFAULT_PARAMS.swarm, ...partial },
})

const formOf = (partial: Partial<ShapeParams> = {}): { shape: ShapeParams } => ({
  shape: { ...DEFAULT_PARAMS.shape, enabled: true, ...partial },
})

const boomOf = (id: string | null): { explosion: ExplosionParams } => ({
  explosion: id
    ? { ...(EXPLOSION_PRESETS.find((p) => p.id === id)?.explosion ?? DEFAULT_PARAMS.explosion) }
    : { ...DEFAULT_PARAMS.explosion, enabled: false },
})

const climate = (partial: Partial<CreativeParams> = {}): { creative: CreativeParams } => ({
  creative: {
    ...DEFAULT_PARAMS.creative,
    timeMode: TimeMode.Play,
    timeScale: 1,
    ...partial,
  },
})

export const BEHAVIOR_PRESETS: BehaviorPreset[] = [
  {
    id: 'still-pond',
    name: 'Stiller Teich',
    note: 'Rauch zieht über das Feld — Form aus, Explosion aus',
    patch: {
      physics: {
        ...DEFAULT_PARAMS.physics,
        gravity: 10,
        windX: 22,
        windY: -12,
        buoyancy: 36,
        turbulence: 38,
        turbulenceScale: 0.0018,
        spawnRate: 78,
        mixSmoke: 0.54,
        mixEmbers: 0.08,
        mixSparks: 0.02,
        mixDust: 0.16,
        mixEnergy: 0.12,
        mixBlobs: 0.08,
        lifetime: 6.2,
      },
      ...swarmPatch({ intelligence: Intelligence.Off, personality: 'gentle' }),
      ...climate({ mood: Mood.Calm, timeMode: TimeMode.Play, timeScale: 0.78 }),
      ...formOf({ enabled: false }),
      ...boomOf(null),
    },
  },
  {
    id: 'ember-garden',
    name: 'Glutgarten',
    note: 'Form hält die Glut — Feldregler ruhen, KI auf Physik',
    patch: {
      physics: {
        ...DEFAULT_PARAMS.physics,
        gravity: 12,
        buoyancy: 78,
        turbulence: 28,
        mixSmoke: 0.28,
        mixEmbers: 0.48,
        mixSparks: 0.12,
        mixDust: 0.06,
        mixEnergy: 0.04,
        mixBlobs: 0.02,
        lifetime: 3.6,
      },
      ...swarmPatch({ intelligence: Intelligence.Off, personality: 'explorer' }),
      ...climate({ mood: Mood.Calm, timeScale: 0.85 }),
      ...formOf({ shape: Shape.Pyramid, ghost: 0.16 }),
      ...boomOf('knistern'),
    },
  },
  {
    id: 'storm-drift',
    name: 'Sturmdrift',
    note: 'Freies Feld, Salven bei harten Treffern — Form aus, Wind wirkt',
    patch: {
      physics: {
        ...DEFAULT_PARAMS.physics,
        gravity: 36,
        windX: 88,
        windY: -20,
        turbulence: 92,
        turbulenceScale: 0.0016,
        mixSmoke: 0.5,
        mixDust: 0.28,
        mixEmbers: 0.08,
        mixEnergy: 0.08,
        mixBlobs: 0.04,
        mixSparks: 0.02,
      },
      ...swarmPatch({ intelligence: Intelligence.Off, personality: 'guarded' }),
      ...climate({ mood: Mood.Tense, timeScale: 1.3 }),
      ...formOf({ enabled: false }),
      ...boomOf('salve'),
    },
  },
  {
    id: 'flock-dawn',
    name: 'Schwarmdämmerung',
    note: 'Boids an einer weichen Kugel — Feld und KI bleiben spürbar',
    patch: {
      physics: {
        ...DEFAULT_PARAMS.physics,
        gravity: 6,
        buoyancy: 8,
        mixEnergy: 0.46,
        mixBlobs: 0.22,
        mixSmoke: 0.16,
        mixDust: 0.12,
        mixEmbers: 0.02,
        mixSparks: 0.02,
        spawnRate: 70,
      },
      ...swarmPatch({
        intelligence: Intelligence.Swarm,
        personality: 'hive',
        separation: 0.7,
        alignment: 0.78,
        cohesion: 0.82,
        predatorPrey: false,
        multiSwarm: false,
      }),
      ...climate({ mood: Mood.Calm, timeScale: 0.9 }),
      ...formOf({ shape: Shape.Sphere, orbit: 0.2, ghost: 0.12, fold: 0.4, attract: 1.4 }),
      ...boomOf('knistern'),
    },
  },
  {
    id: 'predator-night',
    name: 'Jägernacht',
    note: 'Jagd um ein lockeres Ikosaeder, mit Explosion',
    patch: {
      physics: {
        ...DEFAULT_PARAMS.physics,
        gravity: 4,
        mixEnergy: 0.5,
        mixBlobs: 0.22,
        mixSmoke: 0.12,
        mixDust: 0.1,
        mixEmbers: 0.04,
        mixSparks: 0.02,
      },
      ...swarmPatch({
        intelligence: Intelligence.Swarm,
        personality: 'hunter',
        predatorPrey: true,
        multiSwarm: true,
        seek: 0.7,
        separation: 0.85,
        maxSpeed: 110,
      }),
      ...climate({ mood: Mood.Tense, timeScale: 1.15 }),
      ...formOf({ shape: Shape.Icosa, fold: 0.42, attract: 1.4, ghost: 0.14 }),
      ...boomOf('knall'),
    },
  },
  {
    id: 'dual-swarms',
    name: 'Zwillingschwärme',
    note: 'Zwei Schwärme an einem lockeren Torus',
    patch: {
      physics: {
        ...DEFAULT_PARAMS.physics,
        gravity: 10,
        mixEnergy: 0.36,
        mixBlobs: 0.28,
        mixSmoke: 0.18,
        mixDust: 0.12,
        mixEmbers: 0.04,
        mixSparks: 0.02,
      },
      ...swarmPatch({
        intelligence: Intelligence.Swarm,
        personality: 'gentle',
        multiSwarm: true,
        predatorPrey: false,
        cohesion: 0.62,
        alignment: 0.55,
      }),
      ...climate({ mood: Mood.Curious }),
      ...formOf({ shape: Shape.Torus, orbit: 0.7, fold: 0.4 }),
      ...boomOf('knistern'),
    },
  },
  {
    id: 'collision-bloom',
    name: 'Kollisionsblüte',
    note: 'Freies Gedränge, Salve und Trümmer — Form aus, Feld und Explosion wach',
    patch: {
      physics: {
        ...DEFAULT_PARAMS.physics,
        gravity: 40,
        collisionRadius: 16,
        collisionRestitution: 0.72,
        secondarySparks: 1,
        mixSparks: 0.22,
        mixEnergy: 0.22,
        mixBlobs: 0.14,
        mixSmoke: 0.22,
        mixEmbers: 0.12,
        mixDust: 0.08,
        spawnRate: 120,
      },
      ...swarmPatch({ intelligence: Intelligence.Off, personality: 'guarded' }),
      ...climate({ mood: Mood.Tense, timeScale: 1.2 }),
      ...formOf({ enabled: false }),
      ...boomOf('salve'),
    },
  },
  {
    id: 'ink-water',
    name: 'Tinte im Wasser',
    note: 'Dichter Rauch, frei — Form aus, Explosion aus, Feldregler wach',
    patch: {
      physics: {
        ...DEFAULT_PARAMS.physics,
        gravity: 2,
        buoyancy: 6,
        damping: 0.972,
        turbulence: 36,
        lifetime: 9,
        size: 22,
        mixSmoke: 0.78,
        mixDust: 0.14,
        mixEnergy: 0.04,
        mixBlobs: 0.02,
        mixEmbers: 0.01,
        mixSparks: 0.01,
        spawnRate: 64,
      },
      graphics: { ...DEFAULT_PARAMS.graphics, trailFade: 0.18, glow: true },
      ...swarmPatch({ intelligence: Intelligence.Off }),
      ...climate({ mood: Mood.Melancholic, timeMode: TimeMode.Slow, timeScale: 0.4 }),
      ...formOf({ enabled: false }),
      ...boomOf(null),
    },
  },
  {
    id: 'energy-weave',
    name: 'Energieflecht',
    note: 'Agenten ziehen Lichtfäden an einer Helix — Falte niedrig genug für KI',
    patch: {
      physics: {
        ...DEFAULT_PARAMS.physics,
        gravity: 0,
        buoyancy: 0,
        mixEnergy: 0.62,
        mixBlobs: 0.18,
        mixSmoke: 0.08,
        mixSparks: 0.08,
        mixDust: 0.02,
        mixEmbers: 0.02,
      },
      ...swarmPatch({
        intelligence: Intelligence.Creative,
        personality: 'explorer',
        seek: 0.8,
        alignment: 0.36,
        cohesion: 0.28,
      }),
      ...climate({ mood: Mood.Curious, reactiveEnv: true, timeScale: 1.05 }),
      ...formOf({ shape: Shape.Helix, spinY: 0.2, ghost: 0.18, fold: 0.45, attract: 1.6 }),
      ...boomOf('knistern'),
    },
  },
  {
    id: 'dust-memory',
    name: 'Staubgedächtnis',
    note: 'Staub sitzt am Würfel — Form verwaltet das Feld, KI auf Physik',
    patch: {
      physics: {
        ...DEFAULT_PARAMS.physics,
        gravity: 14,
        buoyancy: 10,
        lifetime: 12,
        size: 8,
        spawnRate: 36,
        mixDust: 0.7,
        mixSmoke: 0.22,
        mixEnergy: 0.04,
        mixBlobs: 0.02,
        mixEmbers: 0.01,
        mixSparks: 0.01,
      },
      graphics: { ...DEFAULT_PARAMS.graphics, trailFade: 0.16, glow: true },
      ...climate({ mood: Mood.Melancholic, timeMode: TimeMode.Slow, timeScale: 0.35 }),
      ...swarmPatch({ intelligence: Intelligence.Off, personality: 'gentle' }),
      ...formOf({ shape: Shape.Cube, spinY: 0.06, ghost: 0.22, attract: 2.2, fold: 0.92 }),
      ...boomOf(null),
    },
  },
  {
    id: 'firefly-grove',
    name: 'Glühwürmchenhain',
    note: 'Weiche Blobs an einer lockeren Kugel — Agenten bleiben wach',
    patch: {
      physics: {
        ...DEFAULT_PARAMS.physics,
        gravity: 4,
        buoyancy: 12,
        mixBlobs: 0.48,
        mixEnergy: 0.22,
        mixSmoke: 0.12,
        mixDust: 0.1,
        mixEmbers: 0.06,
        mixSparks: 0.02,
        size: 16,
      },
      ...swarmPatch({
        intelligence: Intelligence.Creative,
        personality: 'poet',
        cohesion: 0.5,
        seek: 0.45,
      }),
      ...climate({ mood: Mood.Joyful, mutationRate: 0.16, timeScale: 0.85 }),
      ...formOf({ shape: Shape.Sphere, orbit: 0.35, fold: 0.4, ghost: 0.1 }),
      ...boomOf('knistern'),
    },
  },
  {
    id: 'reverse-tide',
    name: 'Gegenstrom',
    note: 'Zeit läuft zurück — Form aus, Feldregler wach',
    patch: {
      physics: { ...DEFAULT_PARAMS.physics, gravity: 20, mixSmoke: 0.4, mixEnergy: 0.22, mixDust: 0.2, mixBlobs: 0.1, mixEmbers: 0.05, mixSparks: 0.03 },
      ...climate({ timeMode: TimeMode.Reverse, timeScale: -0.7, mood: Mood.Melancholic }),
      ...formOf({ enabled: false }),
      ...boomOf(null),
    },
  },
  {
    id: 'kaleidoscope-garden',
    name: 'Kaleidoskopgarten',
    note: 'Stern, sechsfach gespiegelt — lockere Falte, Schwarm bleibt wach',
    patch: {
      physics: {
        ...DEFAULT_PARAMS.physics,
        gravity: 8,
        mixEnergy: 0.28,
        mixBlobs: 0.2,
        mixSmoke: 0.26,
        mixEmbers: 0.12,
        mixDust: 0.1,
        mixSparks: 0.04,
      },
      ...climate({ kaleidoscope: true, symmetry: 6, mood: Mood.Joyful }),
      ...swarmPatch({ intelligence: Intelligence.Swarm, personality: 'hive' }),
      ...formOf({ shape: Shape.Star, spinY: 0.1, ghost: 0.2, fold: 0.38, attract: 1.5 }),
      ...boomOf('knistern'),
    },
  },
  {
    id: 'evolve-chamber',
    name: 'Evolutionskammer',
    note: 'Körper wechselt von selbst — Falte mittel, damit KI und Feld mitspielen',
    patch: {
      physics: {
        ...DEFAULT_PARAMS.physics,
        collisionRadius: 14,
        secondarySparks: 0.4,
        mixEnergy: 0.3,
        mixBlobs: 0.24,
        mixSmoke: 0.2,
        mixDust: 0.14,
        mixEmbers: 0.08,
        mixSparks: 0.04,
      },
      ...swarmPatch({ intelligence: Intelligence.Creative, personality: 'poet' }),
      ...climate({
        mutationRate: 0.34,
        inheritOnCollision: true,
        mood: Mood.Curious,
        evolvePulse: 1,
      }),
      ...formOf({ autoCycle: true, randomOrder: true, switchHold: 4.5, switchSpeed: 2.4, fold: 0.5, attract: 1.6 }),
      ...boomOf('knall'),
    },
  },
  {
    id: 'magnetic-heart',
    name: 'Magnetherz',
    note: 'Sitzt fest am Würfel — Form verwaltet das Feld, KI auf Physik',
    patch: {
      physics: {
        ...DEFAULT_PARAMS.physics,
        gravity: 6,
        buoyancy: 10,
        mixEnergy: 0.34,
        mixBlobs: 0.2,
        mixSmoke: 0.22,
        mixEmbers: 0.1,
        mixDust: 0.1,
        mixSparks: 0.04,
      },
      ...swarmPatch({
        intelligence: Intelligence.Off,
        personality: 'hive',
        seek: 1,
        cohesion: 0.9,
        maxSpeed: 70,
      }),
      ...climate({ reactiveEnv: true, mood: Mood.Calm, timeScale: 0.75 }),
      ...formOf({ shape: Shape.Cube, attract: 2.3, fold: 0.95, ghost: 0.24 }),
      ...boomOf('knistern'),
    },
  },
  {
    id: 'vortex-ballet',
    name: 'Wirbelballett',
    note: 'Torus, Kanten werden umkreist — lockere Falte, Wirbel-KI bleibt wach',
    patch: {
      physics: {
        ...DEFAULT_PARAMS.physics,
        gravity: 4,
        mixEnergy: 0.4,
        mixBlobs: 0.28,
        mixSmoke: 0.12,
        mixDust: 0.1,
        mixEmbers: 0.06,
        mixSparks: 0.04,
      },
      ...swarmPatch({
        intelligence: Intelligence.Swarm,
        personality: 'vortex',
        cohesion: 1.1,
        alignment: 1,
        seek: 0.4,
        maxSpeed: 160,
      }),
      ...climate({ mood: Mood.Joyful, timeScale: 1.1 }),
      ...formOf({ shape: Shape.Torus, orbit: 1.2, fold: 0.42, spinY: 0.2 }),
      ...boomOf('knistern'),
    },
  },
  {
    id: 'pulse-choir',
    name: 'Pulschor',
    note: 'Ikosaeder atmet — lockere Falte, Tänzer-KI bleibt wach',
    patch: {
      physics: {
        ...DEFAULT_PARAMS.physics,
        gravity: 8,
        mixEnergy: 0.36,
        mixBlobs: 0.3,
        mixSmoke: 0.14,
        mixDust: 0.1,
        mixEmbers: 0.06,
        mixSparks: 0.04,
      },
      ...swarmPatch({
        intelligence: Intelligence.Creative,
        personality: 'dancer',
        alignment: 1.2,
        cohesion: 1,
        maxSpeed: 140,
      }),
      ...climate({ mood: Mood.Joyful }),
      ...formOf({ shape: Shape.Icosa, pulse: 0.55, fold: 0.4 }),
      ...boomOf('knistern'),
    },
  },
  {
    id: 'storm-cells',
    name: 'Sturmzellen',
    note: 'Stern wechselt, Salven bei Stößen — lockere Falte, Sturm-KI bleibt wach',
    patch: {
      physics: {
        ...DEFAULT_PARAMS.physics,
        gravity: 16,
        windX: 40,
        turbulence: 70,
        mixEnergy: 0.3,
        mixBlobs: 0.22,
        mixSmoke: 0.22,
        mixDust: 0.14,
        mixEmbers: 0.08,
        mixSparks: 0.04,
      },
      ...swarmPatch({
        intelligence: Intelligence.Swarm,
        personality: 'storm',
        separation: 1.6,
        multiSwarm: true,
        maxSpeed: 190,
      }),
      ...climate({ mood: Mood.Tense, timeScale: 1.35 }),
      ...formOf({
        shape: Shape.Star,
        autoCycle: true,
        switchHold: 3.5,
        wander: 0.4,
        fold: 0.4,
        attract: 1.5,
      }),
      ...boomOf('salve'),
    },
  },
  {
    id: 'pair-dance',
    name: 'Paartanz',
    note: 'Zwei Schwärme an einem lockeren Torus',
    patch: {
      physics: {
        ...DEFAULT_PARAMS.physics,
        gravity: 2,
        mixEnergy: 0.38,
        mixBlobs: 0.32,
        mixSmoke: 0.1,
        mixDust: 0.1,
        mixEmbers: 0.06,
        mixSparks: 0.04,
      },
      ...swarmPatch({
        intelligence: Intelligence.Creative,
        personality: 'poet',
        multiSwarm: true,
        cohesion: 0.85,
        avoidance: 1.1,
        seek: 0.7,
      }),
      ...climate({ mood: Mood.Curious, timeScale: 0.95 }),
      ...formOf({ shape: Shape.Torus, orbit: 0.85, fold: 0.4 }),
      ...boomOf('knistern'),
    },
  },
  {
    id: 'orbit-garden',
    name: 'Orbitgarten',
    note: 'Langsame Bahnen um einen Torus — lockere Falte, Agenten bleiben wach',
    patch: {
      physics: {
        ...DEFAULT_PARAMS.physics,
        gravity: 0,
        buoyancy: 6,
        mixEnergy: 0.34,
        mixBlobs: 0.26,
        mixSmoke: 0.18,
        mixDust: 0.12,
        mixEmbers: 0.06,
        mixSparks: 0.04,
      },
      ...swarmPatch({
        intelligence: Intelligence.Creative,
        personality: 'vortex',
        seek: 1.1,
        cohesion: 0.7,
        maxSpeed: 90,
      }),
      ...climate({ mood: Mood.Calm, reactiveEnv: true, timeMode: TimeMode.Slow, timeScale: 0.55 }),
      ...formOf({ shape: Shape.Torus, orbit: 1.05, spinY: 0.1, fold: 0.45 }),
      ...boomOf(null),
    },
  },
  {
    id: 'flash-flock',
    name: 'Blitzschwarm',
    note: 'Dicht am Ikosaeder, dann Salve — lockere Falte, damit der Schwarm zuckt',
    patch: {
      physics: {
        ...DEFAULT_PARAMS.physics,
        gravity: 10,
        collisionRadius: 12,
        secondarySparks: 0.85,
        mixEnergy: 0.42,
        mixBlobs: 0.2,
        mixSparks: 0.14,
        mixSmoke: 0.1,
        mixDust: 0.08,
        mixEmbers: 0.06,
      },
      ...swarmPatch({
        intelligence: Intelligence.Creative,
        personality: 'hive',
        cohesion: 1.3,
        alignment: 1.1,
        maxSpeed: 170,
      }),
      ...climate({ mood: Mood.Tense, inheritOnCollision: true, timeScale: 1.25 }),
      ...formOf({ shape: Shape.Icosa, fold: 0.48, attract: 1.8 }),
      ...boomOf('salve'),
    },
  },
  {
    id: 'drift-hunt',
    name: 'Treibjagd',
    note: 'Freie Jagd, Explosion bei Zusammenstoß — Form aus, Schwarm-KI wach',
    patch: {
      physics: {
        ...DEFAULT_PARAMS.physics,
        gravity: 2,
        mixEnergy: 0.48,
        mixBlobs: 0.24,
        mixSmoke: 0.1,
        mixDust: 0.1,
        mixEmbers: 0.04,
        mixSparks: 0.04,
      },
      ...swarmPatch({
        intelligence: Intelligence.Swarm,
        personality: 'hunter',
        predatorPrey: true,
        multiSwarm: true,
        seek: 1.2,
        maxSpeed: 200,
        perception: 130,
      }),
      ...climate({ mood: Mood.Tense, timeScale: 1.3 }),
      ...formOf({ enabled: false }),
      ...boomOf('knall'),
    },
  },
  {
    id: 'soft-chaos',
    name: 'Weiches Chaos',
    note: 'Formen wechseln, leises Knistern — lockere Falte, Chaos-KI bleibt wach',
    patch: {
      physics: {
        ...DEFAULT_PARAMS.physics,
        gravity: 12,
        turbulence: 50,
        mixEnergy: 0.28,
        mixBlobs: 0.22,
        mixSmoke: 0.2,
        mixDust: 0.16,
        mixEmbers: 0.08,
        mixSparks: 0.06,
      },
      ...swarmPatch({
        intelligence: Intelligence.Creative,
        personality: 'storm',
        separation: 1.2,
        alignment: 0.3,
        cohesion: 0.25,
        maxSpeed: 150,
      }),
      ...climate({ mood: Mood.Curious, mutationRate: 0.22, timeScale: 1.05 }),
      ...formOf({ autoCycle: true, randomOrder: true, switchHold: 3.8, fold: 0.48, attract: 1.6 }),
      ...boomOf('knistern'),
    },
  },
]

/** Each scene brings its own palette. Farbe tab can still override. */
export const SCENE_PALETTES: Record<string, string> = {
  'still-pond': 'moonmilk',
  'ember-garden': 'cinder',
  'storm-drift': 'electric-fog',
  'flock-dawn': 'amber-dusk',
  'predator-night': 'blood-moon',
  'dual-swarms': 'mint-copper',
  'collision-bloom': 'prism-melt',
  'ink-water': 'deep-tide',
  'energy-weave': 'aurora',
  'dust-memory': 'sage-mist',
  'firefly-grove': 'honey-void',
  'reverse-tide': 'rose-ash',
  'kaleidoscope-garden': 'prism-melt',
  'evolve-chamber': 'violet-hour',
  'magnetic-heart': 'noir-gold',
  'vortex-ballet': 'coral-night',
  'pulse-choir': 'cold-ember',
  'storm-cells': 'solar-ink',
  'pair-dance': 'peach-smoke',
  'orbit-garden': 'icebloom',
  'flash-flock': 'neon-vein',
  'drift-hunt': 'blood-moon',
  'soft-chaos': 'electric-fog',
}

export function paletteIdOfScene(id: string): string {
  return SCENE_PALETTES[id] ?? 'moonmilk'
}

export const SCENE_GROUPS = [
  {
    id: 'field',
    title: 'Nur das Feld',
    blurb: 'Form aus, Explosion aus. Schwerkraft, Wind und Turbulenz sind wach.',
  },
  {
    id: 'field-boom',
    title: 'Feld und Explosion',
    blurb: 'Kein Gitter. Wind und Einschläge bestimmen das Bild.',
  },
  {
    id: 'form-hold',
    title: 'Form hält',
    blurb: 'Hohe Falte. Feldregler ruhen. KI ist aus.',
  },
  {
    id: 'form-ai',
    title: 'Form und KI',
    blurb: 'Lockere Falte. Feld und Schwarm bleiben spürbar.',
  },
] as const

export type SceneGroupId = (typeof SCENE_GROUPS)[number]['id']

export type SceneCard = {
  id: string
  name: string
  note: string
  group: SceneGroupId
  form: boolean
  formName: string | null
  field: boolean
  knall: boolean
  intel: 'Schwarm' | 'Agenten' | 'Aus'
  time: string
  colorId: string
  colorName: string
  swatch: [string, string, string]
}

export function sceneCardOf(preset: BehaviorPreset): SceneCard {
  const merged = applyBehaviorPreset(DEFAULT_PARAMS, preset.id)
  const form = merged.shape.enabled
  const field = !(form && merged.shape.attract > 0.02 && merged.shape.fold > 0.55)
  const knall = merged.explosion.enabled
  const intel = !kiDrives(merged.swarm.intelligence)
    ? 'Aus'
    : merged.swarm.intelligence === Intelligence.Swarm
      ? 'Schwarm'
      : 'Agenten'
  const group: SceneGroupId = !form && !knall ? 'field' : !form ? 'field-boom' : !field ? 'form-hold' : 'form-ai'
  const colorId = paletteIdOfScene(preset.id)
  const palette = COLOR_PRESETS.find((p) => p.id === colorId)
  return {
    id: preset.id,
    name: preset.name,
    note: preset.note,
    group,
    form,
    formName: form ? SHAPE_LABEL[merged.shape.shape] : null,
    field,
    knall,
    intel,
    time: timeLabelOf(merged.creative),
    colorId,
    colorName: palette?.name ?? 'Farbe',
    swatch: palette
      ? [palette.color.primary, palette.color.secondary, palette.color.accent]
      : ['#888888', '#666666', '#444444'],
  }
}

function timeLabelOf(creative: CreativeParams): string {
  switch (creative.timeMode) {
    case TimeMode.Slow:
      return 'Zeitlupe'
    case TimeMode.Reverse:
      return 'Rückwärts'
    case TimeMode.Freeze:
      return 'Halt'
    case TimeMode.Lapse:
      return 'Raffer'
    default:
      return creative.timeScale >= 1.2 ? 'Schnell' : creative.timeScale <= 0.85 ? 'Ruhig' : 'Spiel'
  }
}

export const SCENE_CARDS = BEHAVIOR_PRESETS.map(sceneCardOf)

export function applyBehaviorPreset(params: SimParams, id: string): SimParams {
  const preset = BEHAVIOR_PRESETS.find((p) => p.id === id)
  if (!preset) return params
  const next = cloneParams(params)
  if (preset.patch.physics) next.physics = { ...next.physics, ...preset.patch.physics }
  if (preset.patch.swarm) next.swarm = { ...next.swarm, ...preset.patch.swarm }
  next.creative = {
    ...DEFAULT_PARAMS.creative,
    timeMode: TimeMode.Play,
    timeScale: 1,
    ...preset.patch.creative,
  }
  if (preset.patch.explosion) next.explosion = { ...next.explosion, ...preset.patch.explosion }
  if (preset.patch.shape) next.shape = { ...next.shape, ...preset.patch.shape }
  if (preset.patch.interaction) next.interaction = { ...next.interaction, ...preset.patch.interaction }
  if (preset.patch.graphics) next.graphics = { ...next.graphics, ...preset.patch.graphics }
  if (preset.patch.camera) next.camera = { ...next.camera, ...preset.patch.camera }
  return next
}

export function applyColorPreset(params: SimParams, id: string): SimParams {
  const preset = COLOR_PRESETS.find((p) => p.id === id)
  if (!preset) return params
  const next = cloneParams(params)
  next.color = { ...preset.color }
  return next
}

export function applyScenePreset(params: SimParams, id: string): SimParams {
  return applyColorPreset(applyBehaviorPreset(params, id), paletteIdOfScene(id))
}

export function applyExplosionPreset(params: SimParams, id: string): SimParams {
  const preset = EXPLOSION_PRESETS.find((p) => p.id === id)
  if (!preset) return params
  const next = cloneParams(params)
  next.explosion = { ...preset.explosion, enabled: true }
  return next
}

export type ShapePreset = {
  id: string
  name: string
  note: string
  shape: ShapeParams
}

export const SHAPE_PRESETS: ShapePreset[] = [
  {
    id: 'wuerfel',
    name: 'Würfel',
    note: 'Ruhiges Skelett — hohe Falte, Feldregler ruhen',
    shape: { ...DEFAULT_PARAMS.shape },
  },
  {
    id: 'kristall',
    name: 'Kristall',
    note: 'Diamant, kippt und glänzt',
    shape: {
      ...DEFAULT_PARAMS.shape,
      shape: Shape.Diamond,
      spinX: 0.28,
      spinY: 0.16,
      ghost: 0.28,
    },
  },
  {
    id: 'orbit',
    name: 'Orbit',
    note: 'Torus, Teilchen kreisen — Falte hoch, Feldregler ruhen',
    shape: {
      ...DEFAULT_PARAMS.shape,
      shape: Shape.Torus,
      orbit: 1.15,
      attract: 1.7,
      fold: 0.62,
      spinY: 0.22,
    },
  },
  {
    id: 'morph',
    name: 'Morph',
    note: 'Wechselt die Körper von selbst',
    shape: {
      ...DEFAULT_PARAMS.shape,
      autoCycle: true,
      randomOrder: true,
      switchSpeed: 2.8,
      switchHold: 5,
      ghost: 0.16,
    },
  },
  {
    id: 'holo',
    name: 'Holo',
    note: 'Sitzt fest am Gitter — Form verwaltet das Feld',
    shape: {
      ...DEFAULT_PARAMS.shape,
      shape: Shape.Icosa,
      attract: 2.4,
      fold: 0.96,
      orbit: 0,
      ghost: 0.34,
      spinY: 0.1,
    },
  },
  {
    id: 'unruhig',
    name: 'Unruhig',
    note: 'Schwimmt, pulst, dreht sich schnell',
    shape: {
      ...DEFAULT_PARAMS.shape,
      shape: Shape.Star,
      autoCycle: true,
      switchSpeed: 1.4,
      switchHold: 3.2,
      wander: 0.7,
      drift: 0.55,
      pulse: 0.55,
      spinX: 0.4,
      spinY: 0.7,
      spinZ: 0.25,
      ghost: 0.12,
      fold: 0.78,
    },
  },
]

export function applyShapePreset(params: SimParams, id: string): SimParams {
  const preset = SHAPE_PRESETS.find((p) => p.id === id)
  if (!preset) return params
  const next = cloneParams(params)
  next.shape = { ...preset.shape, enabled: true }
  return next
}

export function randomizeParams(params: SimParams): SimParams {
  const behavior = BEHAVIOR_PRESETS[Math.floor(Math.random() * BEHAVIOR_PRESETS.length)]
  const color = COLOR_PRESETS[Math.floor(Math.random() * COLOR_PRESETS.length)]
  return applyColorPreset(applyBehaviorPreset(params, behavior.id), color.id)
}
