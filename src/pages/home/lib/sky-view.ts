const RAD = Math.PI / 180
const DEG = 180 / Math.PI

export interface AltAz {
  altitude: number
  azimuth: number
}

export interface ViewFrame {
  width: number
  height: number
  /** 화면 중심이 바라보는 방위(도) */
  heading: number
}

/** 화면 중심의 고도. 지평선이 화면 아래쪽에 걸리도록 위를 올려다봅니다. */
const VIEW_ALTITUDE = 40
const HALF_FOV_WIDE = 84
const HALF_FOV_TALL = 56
/** 지평선이 화면 안에 조금 들어오도록 중심을 위로 올립니다. */
const CENTER_Y_RATIO = 0.42

export const normalizeAzimuth = (azimuth: number): number => ((azimuth % 360) + 360) % 360

/**
 * 적도 좌표를 지평 좌표로 바꿉니다. 수백 개의 별을 한 번에 계산하기 위한 근사식이라
 * 세차와 대기 굴절은 빼서 지평선 근처에서 1도 안쪽의 차이가 납니다.
 */
export function toAltAz(ra: number, dec: number, siderealHours: number, latitude: number): AltAz {
  const hourAngle = (siderealHours - ra) * 15 * RAD
  const declination = dec * RAD
  const phi = latitude * RAD
  const altitude = Math.asin(Math.sin(phi) * Math.sin(declination) + Math.cos(phi) * Math.cos(declination) * Math.cos(hourAngle))
  const azimuth = Math.atan2(-Math.sin(hourAngle) * Math.cos(declination), Math.cos(phi) * Math.sin(declination) - Math.sin(phi) * Math.cos(declination) * Math.cos(hourAngle))
  return { altitude: altitude * DEG, azimuth: normalizeAzimuth(azimuth * DEG) }
}

/** 화면 폭과 높이 중 더 넓게 보여야 하는 쪽에 맞춘 1라디안당 픽셀 수 */
export function viewScale(width: number, height: number): number {
  const wide = width / 2 / (2 * Math.tan((HALF_FOV_WIDE * RAD) / 2))
  const tall = height / 2 / (2 * Math.tan((HALF_FOV_TALL * RAD) / 2))
  return Math.max(wide, tall)
}

/** 안쪽에서 올려다본 스테레오 투영. 화면 뒤쪽이면 null입니다. */
export function projectToView(position: AltAz, frame: ViewFrame): { x: number; y: number } | null {
  const altitude = position.altitude * RAD
  const delta = (position.azimuth - frame.heading) * RAD
  const center = VIEW_ALTITUDE * RAD
  const cosC = Math.sin(center) * Math.sin(altitude) + Math.cos(center) * Math.cos(altitude) * Math.cos(delta)
  if (cosC < -0.2) return null
  const k = 2 / (1 + cosC)
  const scale = viewScale(frame.width, frame.height)
  return {
    x: frame.width / 2 + scale * k * Math.cos(altitude) * Math.sin(delta),
    y: frame.height * CENTER_Y_RATIO - scale * k * (Math.cos(center) * Math.sin(altitude) - Math.sin(center) * Math.cos(altitude) * Math.cos(delta)),
  }
}

/** 지평선 위 점이 가장 많이 모인 방위를 찾아 첫 화면이 비어 보이지 않게 합니다. */
export function busiestHeading(points: readonly AltAz[], sectors = 12): number {
  const counts = Array.from({ length: sectors }, () => 0)
  const size = 360 / sectors
  for (const point of points) {
    if (point.altitude < 12) continue
    counts[Math.floor(normalizeAzimuth(point.azimuth) / size) % sectors]! += 1
  }
  const best = counts.reduce((top, count, index) => (count > counts[top]! ? index : top), 0)
  return best * size + size / 2
}

export type Compass = 'north' | 'east' | 'south' | 'west'

export function compassOf(azimuth: number): Compass {
  const names: Compass[] = ['north', 'east', 'south', 'west']
  return names[Math.round(normalizeAzimuth(azimuth) / 90) % 4]!
}

/** 재현 가능한 배경 별. 실제 별이 아니라 밤하늘의 밀도를 보여 주는 장식입니다. */
export function createFieldStars(count: number): { ra: number; dec: number; size: number; phase: number }[] {
  let seed = 271_828
  const random = (): number => {
    seed = (seed * 16_807) % 2_147_483_647
    return seed / 2_147_483_647
  }
  return Array.from({ length: count }, () => ({
    ra: random() * 24,
    dec: Math.asin(random() * 2 - 1) * DEG,
    size: 0.4 + random() * random() * 1.1,
    phase: random() * Math.PI * 2,
  }))
}
