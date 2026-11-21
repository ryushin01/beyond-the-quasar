import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { findSpaceWeatherProblem } from './fetch-space-weather.mjs'

describe('우주 기상 스냅샷', () => {
  it('형식이 다른 응답은 저장하지 않는다', () => {
    expect(findSpaceWeatherProblem(null, [])).toMatch(/등급/)
    expect(findSpaceWeatherProblem({ '0': {} }, [])).toMatch(/Kp/)
    expect(findSpaceWeatherProblem({ '0': {} }, [{ time_tag: '2026-11-21T00:00:00', Kp: 1 }])).toBeNull()
  })

  it('저장소의 스냅샷이 앱이 읽는 형식이다', () => {
    const snapshot = JSON.parse(readFileSync(join(process.cwd(), 'public/data/space-weather-snapshot.json'), 'utf8'))
    expect(Number.isNaN(Date.parse(snapshot.fetchedAt))).toBe(false)
    expect(findSpaceWeatherProblem(snapshot.scales, snapshot.kp)).toBeNull()
  })
})
