import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { stateAt, toSatrec } from '../lib/orbit'
import { CATEGORIES, MISSIONS, type Snapshot } from './types'

const snapshot = JSON.parse(readFileSync(resolve(process.cwd(), 'public/data/tle-snapshot.json'), 'utf8')) as Snapshot
const fetchedAt = new Date(snapshot.fetchedAt)

describe('궤도 스냅샷', () => {
  it('위성 번호가 겹치지 않고 분류와 임무가 알려진 값이다', () => {
    const ids = snapshot.satellites.map((item) => item.noradId)
    expect(new Set(ids).size).toBe(ids.length)
    for (const item of snapshot.satellites) {
      expect(CATEGORIES).toContain(item.category)
      expect(MISSIONS).toContain(item.mission)
    }
  })

  it('모든 위성을 받은 시각 기준으로 전파할 수 있고 고도가 지구 밖이다', () => {
    for (const item of snapshot.satellites) {
      const state = stateAt(toSatrec(item.line1, item.line2), fetchedAt)
      expect(state, item.name).not.toBeNull()
      expect(state!.altitudeKm, item.name).toBeGreaterThan(100)
    }
  })

  it('화면이 쓰는 위성과 군사 위성이 들어 있다', () => {
    expect(snapshot.satellites.some((item) => item.noradId === 25544)).toBe(true)
    expect(snapshot.satellites.some((item) => item.category === 'military')).toBe(true)
  })
})
