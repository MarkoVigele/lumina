import { Kind, type KindId } from './types'

const SIZE = 96
const cache = new Map<string, HTMLCanvasElement>()

function makeCanvas(size: number): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = size
  c.height = size
  return c
}

function drawSoftDisc(
  ctx: CanvasRenderingContext2D,
  stops: Array<[number, string]>,
): void {
  const r = SIZE / 2
  const g = ctx.createRadialGradient(r, r, 0, r, r, r)
  for (const [t, color] of stops) g.addColorStop(t, color)
  ctx.clearRect(0, 0, SIZE, SIZE)
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(r, r, r, 0, Math.PI * 2)
  ctx.fill()
}

export function getSprite(kind: KindId, soft: boolean): HTMLCanvasElement {
  const key = `${kind}:${soft ? 's' : 'h'}`
  const hit = cache.get(key)
  if (hit) return hit
  const canvas = makeCanvas(SIZE)
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  if (!soft) {
    drawSoftDisc(ctx, [
      [0, 'rgba(255,255,255,0.95)'],
      [0.35, 'rgba(255,255,255,0.45)'],
      [1, 'rgba(255,255,255,0)'],
    ])
    cache.set(key, canvas)
    return canvas
  }

  if (kind === Kind.Smoke) {
    drawSoftDisc(ctx, [
      [0, 'rgba(255,255,255,0.22)'],
      [0.28, 'rgba(255,255,255,0.14)'],
      [0.62, 'rgba(255,255,255,0.05)'],
      [1, 'rgba(255,255,255,0)'],
    ])
  } else if (kind === Kind.Ember) {
    drawSoftDisc(ctx, [
      [0, 'rgba(255,255,255,1)'],
      [0.18, 'rgba(255,255,255,0.85)'],
      [0.45, 'rgba(255,255,255,0.28)'],
      [1, 'rgba(255,255,255,0)'],
    ])
  } else if (kind === Kind.Spark) {
    drawSoftDisc(ctx, [
      [0, 'rgba(255,255,255,1)'],
      [0.12, 'rgba(255,255,255,0.9)'],
      [0.32, 'rgba(255,255,255,0.2)'],
      [1, 'rgba(255,255,255,0)'],
    ])
  } else if (kind === Kind.Dust) {
    drawSoftDisc(ctx, [
      [0, 'rgba(255,255,255,0.55)'],
      [0.4, 'rgba(255,255,255,0.16)'],
      [1, 'rgba(255,255,255,0)'],
    ])
  } else if (kind === Kind.Energy) {
    drawSoftDisc(ctx, [
      [0, 'rgba(255,255,255,0.95)'],
      [0.22, 'rgba(255,255,255,0.55)'],
      [0.55, 'rgba(255,255,255,0.12)'],
      [1, 'rgba(255,255,255,0)'],
    ])
  } else {
    drawSoftDisc(ctx, [
      [0, 'rgba(255,255,255,0.7)'],
      [0.35, 'rgba(255,255,255,0.32)'],
      [0.7, 'rgba(255,255,255,0.08)'],
      [1, 'rgba(255,255,255,0)'],
    ])
  }

  cache.set(key, canvas)
  return canvas
}

export const SPRITE_SIZE = SIZE
