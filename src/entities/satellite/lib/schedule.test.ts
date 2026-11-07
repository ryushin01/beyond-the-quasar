import { describe, expect, it } from 'vitest'

import { AEHF_FIXTURE, ISS_FIXTURE } from '../model/fixtures'
import { buildPassSchedule } from './schedule'

const DAEJEON = { latitude: 36.35, longitude: 127.38, elevationM: 70 }
const FROM = new Date('2026-11-05T12:00:00Z')

describe('buildPassSchedule', () => {
  it('24시간 안의 통과를 시간순으로 모은다', () => {
    const [row] = buildPassSchedule([ISS_FIXTURE], DAEJEON, FROM)
    expect(row!.passes.length).toBeGreaterThan(0)
    const starts = row!.passes.map((pass) => pass.aos.getTime())
    expect(starts).toEqual([...starts].sort((a, b) => a - b))
    expect(row!.next).toBe(row!.passes[0])
  })

  it('다음 통과가 없는 위성은 뒤로 보낸다', () => {
    const svalbard = { latitude: 78.23, longitude: 15.4, elevationM: 450 }
    const rows = buildPassSchedule([AEHF_FIXTURE, ISS_FIXTURE], svalbard, FROM)
    const withoutPass = rows.findIndex((row) => row.next === null)
    if (withoutPass !== -1) expect(rows.slice(withoutPass).every((row) => row.next === null)).toBe(true)
    expect(rows).toHaveLength(2)
  })

  it('이미 시작한 통과는 진행 중으로 표시한다', () => {
    const [row] = buildPassSchedule([ISS_FIXTURE], DAEJEON, FROM)
    const aos = row!.next!.aos
    const [during] = buildPassSchedule([ISS_FIXTURE], DAEJEON, new Date(aos.getTime() + 60_000))
    expect(during!.inProgress).toBe(true)
  })
})
