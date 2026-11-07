import { describe, expect, it } from 'vitest'

import { AEHF_FIXTURE, FIXTURES, ISS_FIXTURE } from '@/entities/satellite'

import { searchCommands, type CommandSources } from './search'

const sources: CommandSources = {
  pages: [{ to: '/control', label: '위성 관제' }, { to: '/catalog', label: '위성 카탈로그' }],
  sites: [{ id: 'daejeon', label: '대전' }],
  satellites: FIXTURES,
  watched: [AEHF_FIXTURE.noradId],
}

describe('searchCommands', () => {
  it('검색어가 없으면 화면과 관심 위성을 보여 준다', () => {
    expect(searchCommands('', sources).map((item) => item.label)).toEqual(['위성 관제', '위성 카탈로그', AEHF_FIXTURE.name])
  })

  it('NORAD 번호와 국제 식별 번호로 위성을 찾는다', () => {
    expect(searchCommands('25544', sources)[0]?.label).toBe(ISS_FIXTURE.name)
    expect(searchCommands('2010-039', sources)[0]?.label).toBe(AEHF_FIXTURE.name)
  })

  it('화면과 지상국도 찾고 대소문자를 구분하지 않는다', () => {
    expect(searchCommands('카탈로그', sources).map((item) => item.kind)).toEqual(['page'])
    expect(searchCommands('대전', sources).map((item) => item.kind)).toEqual(['site'])
    expect(searchCommands('aehf', sources)[0]?.kind).toBe('satellite')
  })

  it('이름 앞부분이 맞는 위성을 먼저 보여 준다', () => {
    const satellites = [{ ...ISS_FIXTURE, noradId: 1, name: 'XX GPS' }, { ...ISS_FIXTURE, noradId: 2, name: 'GPS BIIF' }]
    expect(searchCommands('gps', { ...sources, satellites }).map((item) => item.label)).toEqual(['GPS BIIF', 'XX GPS'])
  })
})
