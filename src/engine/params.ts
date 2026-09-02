import type { SimParams } from './types'
import { EdgeMode, GradientMode, Intelligence, Mood, Quality, Shape, TimeMode, Tool } from './types'

export const DEFAULT_PARAMS: SimParams = {
  physics: {
    gravity: 10,
    damping: 0.986,
    turbulence: 38,
    turbulenceScale: 0.0018,
    windX: 22,
    windY: -12,
    buoyancy: 36,
    lifetime: 6.2,
    size: 14,
    sizeJitter: 0.5,
    spawnRate: 78,
    collisionRestitution: 0.42,
    collisionRadius: 10,
    wallBounce: 0.35,
    edgeMode: EdgeMode.Wrap,
    secondarySparks: 0.55,
    mixSmoke: 0.54,
    mixEmbers: 0.08,
    mixSparks: 0.02,
    mixDust: 0.16,
    mixEnergy: 0.12,
    mixBlobs: 0.08,
    onSmoke: true,
    onEmbers: true,
    onSparks: true,
    onDust: true,
    onEnergy: true,
    onBlobs: true,
  },
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
  swarm: {
    intelligence: Intelligence.Off,
    separation: 1.05,
    alignment: 0.92,
    cohesion: 0.88,
    avoidance: 0.7,
    seek: 0.55,
    perception: 102,
    maxSpeed: 148,
    strength: 1,
    orbit: 0.55,
    pulse: 0.4,
    predatorPrey: false,
    multiSwarm: true,
    personality: 'gentle',
  },
  creative: {
    mutationRate: 0.08,
    inheritOnCollision: true,
    mood: Mood.Calm,
    timeScale: 0.78,
    timeMode: TimeMode.Play,
    symmetry: 1,
    kaleidoscope: false,
    evolvePulse: 0,
    reactiveEnv: true,
  },
  explosion: {
    enabled: false,
    threshold: 34,
    force: 1.45,
    radius: 118,
    sparks: 0.78,
    shatter: 0.32,
    chain: 0.18,
    flash: 1.08,
  },
  shape: {
    enabled: false,
    shape: Shape.Cube,
    autoCycle: false,
    randomOrder: false,
    switchSpeed: 2.2,
    switchHold: 6,
    scale: 360,
    perspective: 0.55,
    attract: 2,
    fold: 0.9,
    orbit: 0,
    spinX: 0,
    spinY: 0.14,
    spinZ: 0,
    wander: 0,
    pulse: 0,
    drift: 0,
    ghost: 0.2,
    depthFade: 0.45,
  },
  emitters: {
    items: [],
  },
  interaction: {
    tool: Tool.Attract,
    rightTool: Tool.Explode,
    brushSize: 140,
    brushStrength: 1.75,
    followEvents: false,
  },
  graphics: {
    quality: Quality.High,
    glow: true,
    postEffects: true,
    softParticles: true,
    chromaticAberration: false,
    resolutionScale: 0.85,
    vsync: false,
    fpsLimit: 60,
    particleCap: 3200,
    trails: true,
    trailFade: 0.42,
    showPerf: true,
  },
  camera: {
    x: 0,
    y: 0,
    zoom: 1,
  },
}

export function cloneParams(params: SimParams): SimParams {
  return structuredClone(params)
}

export function mergeParams(base: SimParams, patch: Partial<SimParams>): SimParams {
  const next = cloneParams(base)
  for (const key of Object.keys(patch) as (keyof SimParams)[]) {
    const value = patch[key]
    if (value) Object.assign(next[key], value)
  }
  return next
}

export const QUALITY_CAPS: Record<SimParams['graphics']['quality'], number> = {
  low: 1000,
  medium: 2000,
  high: 3200,
  ultra: 4800,
}

export const QUALITY_SCALE: Record<SimParams['graphics']['quality'], number> = {
  low: 0.6,
  medium: 0.75,
  high: 0.85,
  ultra: 1,
}

export function applyQuality(params: SimParams): SimParams {
  const next = cloneParams(params)
  const q = next.graphics.quality
  next.graphics.particleCap = QUALITY_CAPS[q]
  next.graphics.resolutionScale = QUALITY_SCALE[q]
  if (q === 'low') {
    next.graphics.glow = false
    next.graphics.postEffects = false
    next.graphics.chromaticAberration = false
    next.graphics.softParticles = false
  } else if (q === 'medium') {
    next.graphics.glow = true
    next.graphics.postEffects = false
    next.graphics.chromaticAberration = false
    next.graphics.softParticles = true
  } else if (q === 'high') {
    next.graphics.glow = true
    next.graphics.postEffects = true
    next.graphics.softParticles = true
  } else {
    next.graphics.glow = true
    next.graphics.postEffects = true
    next.graphics.softParticles = true
  }
  return next
}
