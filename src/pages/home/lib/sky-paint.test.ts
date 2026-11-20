import { describe, expect, it } from 'vitest'

import { createRecordingContext } from '@/shared/lib/test/recording-canvas'

import { paintSky, placeLabel, type LabelBox, type SkyPaintOptions } from './sky-paint'
import { EMPTY_SKY, type SkyScene } from './sky-scene'

const VIEW = { width: 1000, height: 600, heading: 180 }
const COMPASS = { north: 'N', east: 'E', south: 'S', west: 'W' }
const options = (extra: Partial<SkyPaintOptions> = {}): SkyPaintOptions => ({ view: VIEW, time: 0, twinkle: false, reveal: 1, reserved: [], compass: COMPASS, ...extra })

describe('placeLabel', () => {
  it('겹치지 않는 자리는 차지하고, 겹치거나 화면 밖으로 잘리면 거절한다', () => {
    const taken: LabelBox[] = []
    expect(placeLabel(taken, 100, 100, 50, 1000)).toBe(true)
    expect(taken).toEqual([{ left: 100, right: 150, top: 86, bottom: 104 }])
    expect(placeLabel(taken, 120, 110, 50, 1000)).toBe(false)
    expect(placeLabel(taken, 160, 100, 50, 1000)).toBe(true)
    expect(placeLabel(taken, -1, 300, 20, 1000)).toBe(false)
    expect(placeLabel(taken, 990, 300, 20, 1000)).toBe(false)
    expect(taken).toHaveLength(2)
  })
})

describe('paintSky', () => {
  const star: SkyScene = { ...EMPTY_SKY, stars: [{ altitude: 40, azimuth: 180, name: 'Rigel', magnitude: 0.1 }] }

  it('별자리선을 다 그린 뒤에만 별 이름을 단다', () => {
    const drawn = createRecordingContext()
    paintSky(drawn.context, star, options({ reveal: 1 }))
    expect(drawn.calls.some((call) => call.startsWith('fillText("Rigel"'))).toBe(true)

    const revealing = createRecordingContext()
    paintSky(revealing.context, star, options({ reveal: 0.5 }))
    expect(revealing.calls.some((call) => call.startsWith('fillText("Rigel"'))).toBe(false)
    expect(revealing.calls.filter((call) => call.startsWith('arc('))).toHaveLength(1)
  })

  it('화면 위 글자 자리와 겹치는 이름표는 달지 않는다', () => {
    const { context, calls } = createRecordingContext()
    paintSky(context, star, options({ reserved: [{ left: 0, right: VIEW.width, top: 0, bottom: VIEW.height }] }))
    expect(calls.some((call) => call.startsWith('fillText('))).toBe(false)
  })

  it('지평선 아래 별은 그리지 않는다', () => {
    const { context, calls } = createRecordingContext()
    paintSky(context, { ...star, stars: [{ ...star.stars[0]!, altitude: -5 }] }, options())
    expect(calls.some((call) => call.startsWith('arc('))).toBe(false)
  })

  it('모션이 꺼지면 배경 별을 고른 밝기로 그린다', () => {
    const field: SkyScene = { ...EMPTY_SKY, field: [{ altitude: 40, azimuth: 180, size: 1, phase: 0 }] }
    const still = createRecordingContext()
    paintSky(still.context, field, options({ twinkle: false, time: 350 }))
    expect(still.calls).toContain('globalAlpha=0.8')

    const twinkling = createRecordingContext()
    paintSky(twinkling.context, field, options({ twinkle: true, time: 350 }))
    expect(twinkling.calls).toContain(`globalAlpha=${Math.round((0.65 + 0.35 * Math.sin(0.5)) * 1000) / 1000}`)
  })
})
