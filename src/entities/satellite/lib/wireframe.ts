import type { Mission } from '../model/types'

type Point = [number, number, number]
type Segment = [Point, Point]

export type WireframeForm = 'optical' | 'dish' | 'navigation' | 'weather' | 'telescope' | 'station' | 'bus'

/** 임무별 형상. 실제 위성의 모습이 아니라 임무 유형을 나타내는 도식입니다. */
const FORM_BY_MISSION: Record<Mission, WireframeForm> = {
  milsatcom: 'dish',
  satcom: 'dish',
  'missile-warning': 'optical',
  isr: 'optical',
  imaging: 'optical',
  pnt: 'navigation',
  weather: 'weather',
  science: 'telescope',
  crewed: 'station',
  ssa: 'bus',
  unspecified: 'bus',
}

export const wireframeFormOf = (mission: Mission): WireframeForm => FORM_BY_MISSION[mission]

function box(cx: number, cy: number, cz: number, w: number, h: number, d: number): Segment[] {
  const corner = (i: number): Point => [cx + (i & 1 ? w : -w) / 2, cy + (i & 2 ? h : -h) / 2, cz + (i & 4 ? d : -d) / 2]
  const edges = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]] as const
  return edges.map(([a, b]) => [corner(a), corner(b)])
}

/** X축으로 뻗은 태양 전지판 */
function panel(fromX: number, toX: number, height: number, cells: number, y = 0, z = 0): Segment[] {
  const segments: Segment[] = []
  for (let i = 0; i <= cells; i += 1) {
    const x = fromX + ((toX - fromX) * i) / cells
    segments.push([[x, y - height / 2, z], [x, y + height / 2, z]])
  }
  for (const offset of [-0.5, 0, 0.5]) {
    segments.push([[fromX, y + height * offset, z], [toX, y + height * offset, z]])
  }
  return segments
}

function ring(cx: number, cy: number, z: number, radius: number, sides = 20): Segment[] {
  const at = (i: number): Point => {
    const angle = (i / sides) * Math.PI * 2
    return [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius, z]
  }
  return Array.from({ length: sides }, (_, i) => [at(i), at(i + 1)] as Segment)
}

/** Z축으로 뻗은 원통 */
function cylinder(cx: number, cy: number, fromZ: number, toZ: number, radius: number, ribs = 8): Segment[] {
  const lines = Array.from({ length: ribs }, (_, i): Segment => {
    const angle = (i / ribs) * Math.PI * 2
    const x = cx + Math.cos(angle) * radius
    const y = cy + Math.sin(angle) * radius
    return [[x, y, fromZ], [x, y, toZ]]
  })
  return [...ring(cx, cy, fromZ, radius), ...ring(cx, cy, toZ, radius), ...lines]
}

function dish(z: number, radius: number): Segment[] {
  const depth = (r: number): number => z + radius * 0.45 * (r / radius) ** 2
  const rings = [0.35, 0.7, 1].flatMap((share) => ring(0, 0, depth(radius * share), radius * share, 24))
  const spokes = Array.from({ length: 12 }, (_, i): Segment => {
    const angle = (i / 12) * Math.PI * 2
    const [c, s] = [Math.cos(angle), Math.sin(angle)]
    return [[c * radius * 0.35, s * radius * 0.35, depth(radius * 0.35)], [c * radius, s * radius, depth(radius)]]
  })
  return [...rings, ...spokes, [[0, 0, z], [0, 0, z + radius * 0.9]]]
}

const BUS = box(0, 0, 0, 0.5, 0.5, 0.5)
const WINGS = [...panel(-1.5, -0.3, 0.5, 4), ...panel(0.3, 1.5, 0.5, 4)]

const FORMS: Record<WireframeForm, Segment[]> = {
  optical: [...BUS, ...WINGS, ...cylinder(0, 0, 0.25, 1, 0.22), ...ring(0, 0, 0.85, 0.15)],
  dish: [...BUS, ...WINGS, ...dish(0.3, 0.62)],
  navigation: [
    ...BUS,
    ...WINGS,
    ...[[-0.14, -0.14], [0.14, -0.14], [-0.14, 0.14], [0.14, 0.14]].flatMap(([x, y]) => cylinder(x!, y!, 0.25, 0.65, 0.09, 4)),
  ],
  weather: [...BUS, ...panel(0.3, 1.6, 0.6, 4), ...cylinder(0, 0.1, 0.25, 0.6, 0.14), ...box(-0.05, -0.12, 0.38, 0.22, 0.14, 0.26)],
  telescope: [...cylinder(0, 0, -0.9, 0.9, 0.34, 12), ...ring(0, 0, 0.45, 0.34), ...ring(0, 0, -0.45, 0.34), ...panel(-1.05, -0.34, 0.5, 2), ...panel(0.34, 1.05, 0.5, 2)],
  station: [
    ...box(0, 0, 0, 2.6, 0.1, 0.1),
    ...cylinder(0, 0, -0.75, 0.75, 0.15),
    ...box(0, 0, 0.95, 0.3, 0.3, 0.3),
    ...[-1.25, -0.8, 0.8, 1.25].flatMap((x) => [
      ...panel(x - 0.16, x + 0.16, 0.9, 1, 0.5),
      ...panel(x - 0.16, x + 0.16, 0.9, 1, -0.5),
    ]),
  ],
  bus: [...BUS, ...WINGS, [[0, 0, 0.25], [0, 0, 0.75]], ...ring(0, 0, 0.75, 0.08, 10)],
}

export const wireframeSegments = (form: WireframeForm): Segment[] => FORMS[form]

/** 선분을 회전해 SVG 경로로 만듭니다. 좌표는 바라보는 면 기준으로 x는 오른쪽, y는 아래쪽입니다. */
export function wireframePath(segments: Segment[], yawDeg: number, pitchDeg: number, scale = 100): string {
  const yaw = (yawDeg * Math.PI) / 180
  const pitch = (pitchDeg * Math.PI) / 180
  const [cosYaw, sinYaw, cosPitch, sinPitch] = [Math.cos(yaw), Math.sin(yaw), Math.cos(pitch), Math.sin(pitch)]
  const point = ([x, y, z]: Point): string => {
    const rotatedX = x * cosYaw + z * sinYaw
    const rotatedZ = -x * sinYaw + z * cosYaw
    const rotatedY = y * cosPitch - rotatedZ * sinPitch
    return `${(rotatedX * scale).toFixed(1)} ${(-rotatedY * scale).toFixed(1)}`
  }
  return segments.map(([from, to]) => `M${point(from)}L${point(to)}`).join('')
}
