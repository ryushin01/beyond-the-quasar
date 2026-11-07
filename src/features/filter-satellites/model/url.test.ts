import { describe, expect, it } from 'vitest'

import { EMPTY_FILTER } from '@/entities/satellite'

import { filterToQuery, queryToFilter } from './url'

describe('필터와 주소 변환', () => {
  it('왕복해도 값이 같다', () => {
    const filter = { ...EMPTY_FILTER, query: 'gps', categories: ['military' as const], orbits: ['GEO' as const, 'LEO' as const], owners: ['US'], dualUseOnly: true }
    expect(queryToFilter(filterToQuery(filter))).toEqual(filter)
  })

  it('허용되지 않은 값은 버린다', () => {
    const filter = queryToFilter({ category: 'military,<script>', orbit: 'XXX', mission: 'isr,nope' })
    expect(filter.categories).toEqual(['military'])
    expect(filter.orbits).toEqual([])
    expect(filter.missions).toEqual(['isr'])
  })

  it('빈 필터는 주소에 아무것도 남기지 않고 관심 위성은 넣지 않는다', () => {
    expect(filterToQuery(EMPTY_FILTER)).toEqual({})
    expect(filterToQuery({ ...EMPTY_FILTER, watchedOnly: true })).toEqual({})
  })
})
