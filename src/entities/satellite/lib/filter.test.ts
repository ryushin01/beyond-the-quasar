import { describe, expect, it } from 'vitest'

import type { Satellite } from '../model/types'
import { countBy, EMPTY_FILTER, filterSatellites } from './filter'

const base = { line1: '', line2: '', objectId: null, launchDate: null, launchSite: null, opsStatus: '+', apogeeKm: null, perigeeKm: null, periodMin: null, inclinationDeg: null, rcsM2: null, epoch: new Date(), dualUse: false }
const list: Satellite[] = [
  { ...base, noradId: 1, name: 'AEHF-1', category: 'military', mission: 'milsatcom', orbit: 'GEO', owner: 'US' },
  { ...base, noradId: 2, name: 'COSMO-SKYMED 1', category: 'military', mission: 'isr', orbit: 'LEO', owner: 'IT', dualUse: true },
  { ...base, noradId: 3, name: 'ISS (ZARYA)', category: 'crewed', mission: 'crewed', orbit: 'LEO', owner: 'ISS' },
]

describe('filterSatellites', () => {
  it('조건이 없으면 모두 돌려준다', () => {
    expect(filterSatellites(list, EMPTY_FILTER)).toHaveLength(3)
  })

  it('분류·궤도·운영 주체 조건을 모두 만족해야 한다', () => {
    const result = filterSatellites(list, { ...EMPTY_FILTER, categories: ['military'], orbits: ['LEO'], owners: ['IT'] })
    expect(result.map((item) => item.noradId)).toEqual([2])
  })

  it('이름과 NORAD 번호로 검색하고 대소문자를 가리지 않는다', () => {
    expect(filterSatellites(list, { ...EMPTY_FILTER, query: 'zarya' })[0]?.noradId).toBe(3)
    expect(filterSatellites(list, { ...EMPTY_FILTER, query: '2' }).map((item) => item.noradId)).toEqual([2])
  })

  it('겸용 위성만 고를 수 있다', () => {
    expect(filterSatellites(list, { ...EMPTY_FILTER, dualUseOnly: true }).map((item) => item.noradId)).toEqual([2])
  })
})

describe('countBy', () => {
  it('키별 개수를 센다', () => {
    expect(countBy(list, (item) => item.category).get('military')).toBe(2)
  })
})
