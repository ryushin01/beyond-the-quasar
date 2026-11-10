interface WarpStar {
  x: number
  y: number
  z: number
  hue: number
}

export interface WarpState {
  /** 한 프레임에 줄어드는 깊이 */
  speed: number
  /** 가운데 빛의 세기(0~1) */
  glow: number
}

const STAR_COUNT = 520
const NEAR = 0.02
const TRAIL = 2.4

function createStar(random: () => number, spread = 1): WarpStar {
  const angle = random() * Math.PI * 2
  const radius = 0.08 + random() * spread
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius, z: 0.15 + random() * 0.85, hue: random() }
}

/** 원근에 맞춰 늘어나는 빛줄기를 그리는 2D 워프 필드 */
export function createWarpField(canvas: HTMLCanvasElement, random: () => number = Math.random): (state: WarpState) => void {
  const context = canvas.getContext('2d')
  if (!context) return () => {}
  const ratio = Math.min(window.devicePixelRatio || 1, 1.5)
  const width = window.innerWidth
  const height = window.innerHeight
  canvas.width = Math.round(width * ratio)
  canvas.height = Math.round(height * ratio)
  context.setTransform(ratio, 0, 0, ratio, 0, 0)
  context.lineCap = 'round'
  const stars = Array.from({ length: STAR_COUNT }, () => createStar(random))
  const centerX = width / 2
  const centerY = height / 2
  const reach = Math.max(width, height) * 0.5

  return ({ speed, glow }) => {
    context.fillStyle = 'rgb(0 2 12 / 0.34)'
    context.fillRect(0, 0, width, height)
    context.globalCompositeOperation = 'lighter'
    for (const star of stars) {
      const previousZ = star.z + speed * TRAIL
      star.z -= speed
      if (star.z < NEAR) Object.assign(star, createStar(random), { z: 1 })
      const x = centerX + (star.x / star.z) * reach
      const y = centerY + (star.y / star.z) * reach
      const fromX = centerX + (star.x / previousZ) * reach
      const fromY = centerY + (star.y / previousZ) * reach
      const nearness = 1 - star.z
      context.strokeStyle = star.hue > 0.72 ? `rgb(255 255 255 / ${0.4 + nearness * 0.6})` : `rgb(${90 + star.hue * 90} ${130 + star.hue * 90} 255 / ${0.3 + nearness * 0.7})`
      context.lineWidth = 0.5 + nearness * nearness * 3.2
      context.beginPath()
      context.moveTo(fromX, fromY)
      context.lineTo(x, y)
      context.stroke()
    }
    if (glow > 0) {
      const radius = reach * (0.2 + glow * 1.6)
      const gradient = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius)
      gradient.addColorStop(0, `rgb(235 241 255 / ${glow})`)
      gradient.addColorStop(0.35, `rgb(74 120 255 / ${glow * 0.7})`)
      gradient.addColorStop(1, 'rgb(0 0 0 / 0)')
      context.fillStyle = gradient
      context.fillRect(0, 0, width, height)
    }
    context.globalCompositeOperation = 'source-over'
  }
}

/** 새 탭 열기처럼 브라우저 기본 동작에 맡겨야 하는 클릭인지 판단합니다. */
export const isPlainClick = (event: MouseEvent): boolean => event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey
