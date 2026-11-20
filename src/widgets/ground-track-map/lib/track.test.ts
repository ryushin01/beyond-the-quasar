import { describe, expect, it } from 'vitest'

import { FIXTURES, ISS_FIXTURE } from '@/entities/satellite'

import { createTrackGeometry } from './track'

const NOW = new Date('2026-11-05T12:00:00Z')

describe('createTrackGeometry', () => {
  it('지난 궤적과 앞으로의 궤적을 선으로 돌려주고, 같은 15초 안에서는 다시 계산하지 않는다', () => {
    const tracks = createTrackGeometry()
    const first = tracks.at(ISS_FIXTURE, NOW)
    expect(first.past).toMatchObject({ type: 'LineString' })
    expect(first.future).toMatchObject({ type: 'LineString' })
    expect(tracks.at(ISS_FIXTURE, new Date(NOW.getTime() + 14_000))).toBe(first)
    expect(tracks.at(ISS_FIXTURE, new Date(NOW.getTime() + 15_000))).not.toBe(first)
  })

  it('위성이 바뀌거나 비우면 다시 계산한다', () => {
    const tracks = createTrackGeometry()
    const first = tracks.at(ISS_FIXTURE, NOW)
    expect(tracks.at(FIXTURES[1]!, NOW)).not.toBe(first)
    const again = tracks.at(ISS_FIXTURE, NOW)
    tracks.clear()
    expect(tracks.at(ISS_FIXTURE, NOW)).not.toBe(again)
  })
})
