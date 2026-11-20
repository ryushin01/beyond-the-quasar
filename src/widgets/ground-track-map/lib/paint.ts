import { geoCircle, geoGraticule10, geoPath, type GeoProjection } from 'd3-geo'
import { feature } from 'topojson-client'
import type { GeometryCollection, Topology } from 'topojson-specification'
import landTopology from 'world-atlas/land-110m.json'

import { footprintRadiusDeg, stateAt, toSatrec, type Satellite, type SatelliteState } from '@/entities/satellite'

import type { MapMode } from './projection'
import type { TrackGeometry } from './track'

const topology = landTopology as unknown as Topology<{ land: GeometryCollection }>
const land = feature(topology, topology.objects.land)
const graticule = geoGraticule10()

/** 지도 색. 화면 테마의 CSS 변수에서 읽습니다. */
export interface MapPalette {
  ink: string
  line: string
  lineStrong: string
  signal: string
  alert: string
  raised: string
  night: string
}

export function readPalette(element: Element): MapPalette {
  const style = getComputedStyle(element)
  const read = (name: string): string => style.getPropertyValue(name).trim()
  return { ink: read('--ink'), line: read('--line'), lineStrong: read('--line-strong'), signal: read('--signal'), alert: read('--alert'), raised: read('--raised'), night: read('--night') }
}

export interface MapScene {
  projection: GeoProjection
  mode: MapMode
  palette: MapPalette
  now: Date
  /** 태양 바로 아래 지점. 그 반대쪽 반구를 밤으로 칠합니다. */
  sun: { latitude: number; longitude: number }
  satellites: readonly Satellite[]
  /** 추적 위성 번호. 이 위성은 점 대신 DOM 표식으로 올립니다. */
  trackedId: number | undefined
  /** 추적 위성의 현재 상태와 궤적. 궤도 계산에 실패하면 null이라 궤적·가시 범위를 그리지 않습니다. */
  track: (TrackGeometry & { state: SatelliteState }) | null
  site: { latitude: number; longitude: number }
}

export interface PlacedSatellite {
  satellite: Satellite
  x: number
  y: number
}

export interface MapPaintResult {
  /** 화면에 보이는 위성 자리(포인터로 고를 때 씀) */
  positions: PlacedSatellite[]
  /** 추적 위성의 화면 자리. 지구본 뒤쪽이거나 궤도 계산에 실패하면 null */
  trackedPoint: [number, number] | null
}

/** 바다·땅·경위선·밤 → 추적 궤적과 가시 범위 → 위성(군사는 마름모, 나머지는 원) → 지상국 순서로 그립니다. */
export function paintMap(context: CanvasRenderingContext2D, scene: MapScene): MapPaintResult {
  const { projection, palette } = scene
  const path = geoPath(projection, context)

  context.beginPath()
  path({ type: 'Sphere' })
  context.fillStyle = palette.raised
  context.fill()

  context.beginPath()
  path(land)
  context.fillStyle = palette.lineStrong
  context.fill()

  context.beginPath()
  path(graticule)
  context.strokeStyle = palette.line
  context.lineWidth = 0.5
  context.stroke()

  // 밤 지역: 태양 반대쪽을 중심으로 한 원
  context.beginPath()
  path(geoCircle().center([scene.sun.longitude + 180, -scene.sun.latitude]).radius(90)())
  context.fillStyle = palette.night
  context.fill()

  context.beginPath()
  path({ type: 'Sphere' })
  context.strokeStyle = palette.lineStrong
  context.lineWidth = 1
  context.stroke()

  if (scene.track) paintTrack(context, path, scene.track, palette)

  // 지구본에서는 뒤쪽 반구의 점을 숨깁니다.
  const visible = (longitude: number, latitude: number): [number, number] | null => {
    if (scene.mode === 'globe') {
      const test = geoPath(projection)({ type: 'Point', coordinates: [longitude, latitude] })
      if (test === null) return null
    }
    return projection([longitude, latitude])
  }

  const positions: PlacedSatellite[] = []
  for (const satellite of scene.satellites) {
    const state = stateAt(toSatrec(satellite.line1, satellite.line2), scene.now)
    if (!state) continue
    const point = visible(state.longitude, state.latitude)
    if (!point) continue
    const [x, y] = point
    positions.push({ satellite, x, y })
    if (satellite.noradId === scene.trackedId) continue
    if (satellite.category === 'military') {
      context.fillStyle = palette.alert
      context.beginPath()
      context.moveTo(x, y - 4)
      context.lineTo(x + 4, y)
      context.lineTo(x, y + 4)
      context.lineTo(x - 4, y)
      context.closePath()
      context.fill()
    } else {
      context.fillStyle = palette.ink
      context.beginPath()
      context.arc(x, y, 2, 0, Math.PI * 2)
      context.fill()
    }
  }

  const sitePoint = visible(scene.site.longitude, scene.site.latitude)
  if (sitePoint) {
    context.strokeStyle = palette.ink
    context.lineWidth = 1.5
    context.strokeRect(sitePoint[0] - 4, sitePoint[1] - 4, 8, 8)
  }

  return { positions, trackedPoint: scene.track ? visible(scene.track.state.longitude, scene.track.state.latitude) : null }
}

/** 지난 궤적은 흐린 실선, 앞으로의 궤적은 점선, 가시 범위는 옅게 칠한 원 */
function paintTrack(context: CanvasRenderingContext2D, path: ReturnType<typeof geoPath>, track: NonNullable<MapScene['track']>, palette: MapPalette): void {
  context.beginPath()
  path(track.past)
  context.strokeStyle = palette.ink
  context.globalAlpha = 0.4
  context.lineWidth = 1
  context.setLineDash([])
  context.stroke()
  context.globalAlpha = 1

  context.beginPath()
  path(track.future)
  context.strokeStyle = palette.signal
  context.lineWidth = 1.5
  context.setLineDash([6, 4])
  context.stroke()
  context.setLineDash([])

  context.beginPath()
  path(geoCircle().center([track.state.longitude, track.state.latitude]).radius(footprintRadiusDeg(track.state.altitudeKm))())
  context.fillStyle = palette.signal
  context.globalAlpha = 0.14
  context.fill()
  context.globalAlpha = 1
  context.strokeStyle = palette.signal
  context.lineWidth = 1
  context.stroke()
}
