import type { SkyScene } from './sky-scene'
import { projectToView, viewScale, type Compass, type ViewFrame } from './sky-view'

/** 캔버스 좌표의 사각형. 이름표와 화면 위 글자가 차지한 자리입니다. */
export interface LabelBox {
  left: number
  right: number
  top: number
  bottom: number
}

export interface SkyPaintOptions {
  view: ViewFrame
  /** 반짝임 위상에 쓰는 시각(ms) */
  time: number
  /** 모션이 꺼져 있으면 반짝이지 않고 고른 밝기로 그립니다. */
  twinkle: boolean
  /** 별자리선을 그려 나간 정도(0~1). 1이 되어야 이름표를 답니다. */
  reveal: number
  /** 화면 위 글자가 차지해 이름표를 놓지 않을 자리 */
  reserved: readonly LabelBox[]
  /** 동서남북 글자 */
  compass: Record<Compass, string>
}

interface NameAnchor {
  text: string
  x: number
  y: number
}

// 캔버스라 CSS 변수를 못 써서 --signal(#1a3fe0) 값을 그대로 적습니다.
const LINE = 'rgb(26 63 224 / 0.62)'
const PLANET = '#1a3fe0'
const MONO = '"Roboto Mono Variable", "BTQ Coding", "Nanum Gothic Coding", monospace'
const DISPLAY = '"Oswald Variable", "Orbit", system-ui, sans-serif'
const COMPASS_POINTS: readonly (readonly [number, Compass])[] = [
  [0, 'north'],
  [90, 'east'],
  [180, 'south'],
  [270, 'west'],
]

/** 배경 별 → 별자리선 → 지평선 → 방위 → 달·행성 → 밝은 별 → 별자리 이름 순서로 그립니다. 이름표는 먼저 놓인 것과 겹치지 않을 때만 답니다. */
export function paintSky(ctx: CanvasRenderingContext2D, scene: SkyScene, options: SkyPaintOptions): void {
  const { view } = options
  ctx.clearRect(0, 0, view.width, view.height)
  paintField(ctx, scene, options)
  const names = paintConstellations(ctx, scene, view, options.reveal)
  paintHorizon(ctx, view)
  const taken = [...options.reserved]
  paintCompass(ctx, view, taken, options.compass)
  paintBodies(ctx, scene, view, taken, options.reveal)
  paintStars(ctx, scene, view, taken, options.reveal)
  paintConstellationNames(ctx, names, taken, view.width)
}

/** 이름표 자리가 화면 안이고 앞서 놓인 자리와 겹치지 않으면 차지하고 true를 돌려줍니다. */
export function placeLabel(taken: LabelBox[], x: number, y: number, labelWidth: number, width: number): boolean {
  const box = { left: x, right: x + labelWidth, top: y - 14, bottom: y + 4 }
  // 화면 밖으로 잘리는 이름표는 그리지 않습니다.
  if (box.left < 0 || box.right > width) return false
  if (taken.some((item) => box.left < item.right && box.right > item.left && box.top < item.bottom && box.bottom > item.top)) return false
  taken.push(box)
  return true
}

function paintField(ctx: CanvasRenderingContext2D, scene: SkyScene, { view, time, twinkle }: SkyPaintOptions): void {
  ctx.fillStyle = '#fff'
  for (const star of scene.field) {
    if (star.altitude < 0) continue
    const point = projectToView(star, view)
    if (!point || point.x < 0 || point.x > view.width || point.y < 0 || point.y > view.height) continue
    const brightness = twinkle ? 0.65 + 0.35 * Math.sin(time / 700 + star.phase) : 0.8
    ctx.globalAlpha = Math.min(1, 0.5 + star.size * 0.5) * brightness
    ctx.fillRect(point.x, point.y, star.size, star.size)
  }
  ctx.globalAlpha = 1
}

function paintConstellations(ctx: CanvasRenderingContext2D, scene: SkyScene, view: ViewFrame, reveal: number): NameAnchor[] {
  const names: NameAnchor[] = []
  const { constellations } = scene
  ctx.lineWidth = 1
  constellations.forEach((constellation, index) => {
    const start = (index / constellations.length) * 0.6
    const local = Math.min(1, Math.max(0, (reveal - start) / 0.4))
    if (local <= 0) return
    const placed = constellation.paths.map((path) => path.map((point) => ({ point, screen: point.altitude > -8 ? projectToView(point, view) : null })))

    ctx.strokeStyle = LINE
    ctx.beginPath()
    for (const path of placed) {
      const segments = path.length - 1
      const shown = segments * local
      for (let i = 0; i < segments && i < shown; i += 1) {
        const a = path[i]!.screen
        const b = path[i + 1]!.screen
        if (!a || !b) continue
        const ratio = Math.min(1, shown - i)
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(a.x + (b.x - a.x) * ratio, a.y + (b.y - a.y) * ratio)
      }
    }
    ctx.stroke()

    ctx.fillStyle = '#fff'
    let sumX = 0
    let sumY = 0
    let lowest = -Infinity
    let count = 0
    for (const { point, screen } of placed.flat()) {
      if (!screen || point.altitude < 0) continue
      ctx.beginPath()
      ctx.arc(screen.x, screen.y, 1.5, 0, Math.PI * 2)
      ctx.fill()
      sumX += screen.x
      sumY += screen.y
      lowest = Math.max(lowest, screen.y)
      count += 1
    }
    if (count >= 2 && local === 1) names.push({ text: constellation.name.toUpperCase(), x: sumX / count, y: Math.min(lowest + 20, sumY / count + 70) })
  })
  return names
}

function paintConstellationNames(ctx: CanvasRenderingContext2D, names: NameAnchor[], taken: LabelBox[], width: number): void {
  ctx.font = `500 11px ${MONO}`
  ctx.textAlign = 'left'
  ctx.fillStyle = 'rgb(213 213 213 / 0.74)'
  for (const name of names) {
    const labelWidth = ctx.measureText(name.text).width
    const left = name.x - labelWidth / 2
    if (placeLabel(taken, left, name.y, labelWidth, width)) ctx.fillText(name.text, left, name.y)
  }
}

function paintHorizon(ctx: CanvasRenderingContext2D, view: ViewFrame): void {
  const scale = viewScale(view.width, view.height)
  const samples: { x: number; y: number }[] = []
  for (let offset = -130; offset <= 130; offset += 4) {
    const point = projectToView({ altitude: 0, azimuth: view.heading + offset }, view)
    if (point) samples.push(point)
  }
  if (samples.length < 2) return
  ctx.beginPath()
  samples.forEach((point, index) => (index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y)))
  ctx.lineTo(samples[samples.length - 1]!.x, view.height + scale)
  ctx.lineTo(samples[0]!.x, view.height + scale)
  ctx.closePath()
  ctx.fillStyle = '#000'
  ctx.fill()

  ctx.beginPath()
  samples.forEach((point, index) => (index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y)))
  ctx.strokeStyle = 'rgb(255 255 255 / 0.34)'
  ctx.stroke()
}

function paintCompass(ctx: CanvasRenderingContext2D, view: ViewFrame, taken: LabelBox[], labels: Record<Compass, string>): void {
  ctx.fillStyle = '#fff'
  ctx.font = `500 12px ${MONO}`
  ctx.textAlign = 'left'
  for (const [azimuth, key] of COMPASS_POINTS) {
    const point = projectToView({ altitude: 0, azimuth }, view)
    if (!point) continue
    if (placeLabel(taken, point.x - 6, point.y - 8, 12, view.width)) ctx.fillText(labels[key], point.x - 6, point.y - 8)
  }
}

function paintStars(ctx: CanvasRenderingContext2D, scene: SkyScene, view: ViewFrame, taken: LabelBox[], reveal: number): void {
  ctx.textAlign = 'left'
  ctx.font = `600 15px ${DISPLAY}`
  const ordered = [...scene.stars].sort((a, b) => a.magnitude - b.magnitude)
  for (const star of ordered) {
    if (star.altitude < 0) continue
    const point = projectToView(star, view)
    if (!point) continue
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(point.x, point.y, Math.max(1.8, 3.4 - star.magnitude * 0.9), 0, Math.PI * 2)
    ctx.fill()
    if (reveal === 1 && placeLabel(taken, point.x + 7, point.y - 5, ctx.measureText(star.name).width, view.width)) {
      ctx.fillText(star.name, point.x + 7, point.y - 5)
    }
  }
}

function paintBodies(ctx: CanvasRenderingContext2D, scene: SkyScene, view: ViewFrame, taken: LabelBox[], reveal: number): void {
  ctx.font = `600 15px ${DISPLAY}`
  for (const body of scene.bodies) {
    if (body.altitude < 0) continue
    const point = projectToView(body, view)
    if (!point) continue
    const isMoon = body.name === 'Moon'
    const color = isMoon ? '#fff' : PLANET
    ctx.strokeStyle = color
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(point.x, point.y, isMoon ? 7 : 3, 0, Math.PI * 2)
    ctx.fill()
    if (reveal === 1 && placeLabel(taken, point.x + 11, point.y - 7, ctx.measureText(body.name).width, view.width)) {
      ctx.fillText(body.name, point.x + 11, point.y - 7)
    }
  }
}
