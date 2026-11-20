import { describe, expect, it } from 'vitest'

import { FIXTURES, ISS_FIXTURE, stateAt, toSatrec } from '@/entities/satellite'
import { createRecordingContext } from '@/shared/lib/test/recording-canvas'

import { paintMap, readPalette, type MapScene } from './paint'
import { buildProjection } from './projection'

const NOW = new Date('2026-11-05T12:00:00Z')
const SIZE = { width: 960, height: 520 }
const PALETTE = { ink: 'ink', line: 'line', lineStrong: 'strong', signal: 'signal', alert: 'alert', raised: 'raised', night: 'night' }
const ISS = stateAt(toSatrec(ISS_FIXTURE.line1, ISS_FIXTURE.line2), NOW)!

const scene = (extra: Partial<MapScene> = {}): MapScene => ({
  projection: buildProjection('flat', SIZE, { k: 1, x: 0, y: 0 }, { lambda: 0, phi: 0 }),
  mode: 'flat',
  palette: PALETTE,
  now: NOW,
  sun: { latitude: -15, longitude: 0 },
  satellites: FIXTURES,
  trackedId: undefined,
  track: null,
  site: { latitude: 36.35, longitude: 127.38 },
  ...extra,
})

const dots = (calls: string[]) => calls.filter((call) => /^arc\([-\d.]+,[-\d.]+,2,/.test(call)).length
const diamonds = (calls: string[]) => calls.filter((call) => call === 'fillStyle="alert"').length

describe('paintMap', () => {
  it('군사 위성은 마름모, 나머지는 원으로 그리고 보이는 위성 자리를 돌려준다', () => {
    const { context, calls } = createRecordingContext()
    const result = paintMap(context, scene())
    expect(result.positions.map((item) => item.satellite.noradId)).toEqual(FIXTURES.map((item) => item.noradId))
    expect(dots(calls)).toBe(1)
    expect(diamonds(calls)).toBe(1)
    expect(result.trackedPoint).toBeNull()
  })

  it('추적 위성은 점 대신 표식 자리로 돌려주고, 궤적·가시 범위를 그린다', () => {
    const { context, calls } = createRecordingContext()
    const track = { state: ISS, past: { type: 'LineString' as const, coordinates: [[0, 0], [10, 10]] }, future: { type: 'LineString' as const, coordinates: [[10, 10], [20, 0]] } }
    const result = paintMap(context, scene({ trackedId: ISS_FIXTURE.noradId, track }))
    expect(dots(calls)).toBe(0)
    expect(calls).toContain('setLineDash([6,4])')
    expect(result.trackedPoint).toEqual(scene().projection([ISS.longitude, ISS.latitude]))
  })

  it('지구본에서는 뒤쪽 반구의 위성을 그리지도 고르지도 않는다', () => {
    const { context } = createRecordingContext()
    const away = buildProjection('globe', SIZE, { k: 1, x: 0, y: 0 }, { lambda: -(ISS.longitude + 180), phi: ISS.latitude })
    const result = paintMap(context, scene({ projection: away, mode: 'globe', satellites: [ISS_FIXTURE] }))
    expect(result.positions).toEqual([])
  })
})

describe('readPalette', () => {
  it('테마의 CSS 변수에서 지도 색을 읽는다', () => {
    const element = document.createElement('div')
    element.style.setProperty('--ink', ' #111 ')
    element.style.setProperty('--signal', '#1a3fe0')
    document.body.append(element)
    expect(readPalette(element)).toMatchObject({ ink: '#111', signal: '#1a3fe0', night: '' })
    element.remove()
  })
})
