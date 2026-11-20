import { geoNaturalEarth1, geoOrthographic, type GeoProjection } from 'd3-geo'

export type MapMode = 'flat' | 'globe'

export interface MapSize {
  width: number
  height: number
}

/** 지구본이 바라보는 경도(lambda)·위도(phi) 회전(도) */
export interface MapRotation {
  lambda: number
  phi: number
}

/** d3-zoom의 확대 배율(k)과 이동(x, y). ZoomTransform과 같은 모양입니다. */
export interface MapTransform {
  k: number
  x: number
  y: number
}

/** 평면 지도는 화면에 맞춘 뒤 확대·이동하고, 지구본은 회전한 정사영에 확대만 더합니다. */
export function buildProjection(mode: MapMode, size: MapSize, transform: MapTransform, rotation: MapRotation): GeoProjection {
  const { width, height } = size
  if (mode === 'globe') {
    const radius = (Math.min(width, height) / 2 - 12) * transform.k
    return geoOrthographic().translate([width / 2, height / 2]).scale(radius).rotate([rotation.lambda, rotation.phi, 0]).clipAngle(90)
  }
  const base = geoNaturalEarth1().fitExtent([[8, 8], [width - 8, height - 8]], { type: 'Sphere' })
  const [tx, ty] = base.translate()
  return base.scale(base.scale() * transform.k).translate([tx * transform.k + transform.x, ty * transform.k + transform.y])
}

/** 위성 쪽으로 지구본을 돌릴 회전. 경도는 가까운 쪽으로 돌고, 위도는 0.7배만 기울입니다. */
export function rotationToward(current: MapRotation, longitude: number, latitude: number): MapRotation {
  const lambda = -longitude
  const delta = ((lambda - current.lambda + 540) % 360) - 180
  return { lambda: current.lambda + delta, phi: -latitude * 0.7 }
}

/** 지구본을 끈 만큼 돌립니다. 확대할수록 덜 돌고, 위도는 ±85°에서 멈춥니다. */
export function dragRotation(current: MapRotation, dx: number, dy: number, k: number): MapRotation {
  return {
    lambda: current.lambda + (dx * 0.3) / k,
    phi: Math.max(-85, Math.min(85, current.phi - (dy * 0.3) / k)),
  }
}

/** 반경 안에서 화면 좌표에 가장 가까운 점 */
export function nearestPoint<T extends { x: number; y: number }>(points: readonly T[], x: number, y: number, radius = 14): T | null {
  let best: T | null = null
  let bestDistance = radius
  for (const point of points) {
    const distance = Math.hypot(point.x - x, point.y - y)
    if (distance < bestDistance) {
      best = point
      bestDistance = distance
    }
  }
  return best
}
