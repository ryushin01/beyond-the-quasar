import { describe, expect, it } from 'vitest'

import { findNeoProblem, toApproaches } from './fetch-neo.mjs'

const response = {
  signature: { source: 'NASA/JPL SBDB Close Approach Data API', version: '1.5' },
  count: '2',
  fields: ['des', 'orbit_id', 'jd', 'cd', 'dist', 'dist_min', 'dist_max', 'v_rel', 'v_inf', 't_sigma_f', 'h', 'fullname'],
  data: [
    ['2026 VW15', '2', '2461360.726327889', '2026-Nov-16 05:26', '0.0131392541619584', '0.013', '0.0131', '6.06068543422993', '6.02', '< 00:01', '27.073', '       (2026 VW15)'],
    ['99942', '199', '2462240.406944444', '2029-Apr-13 21:46', '0.000254', '0.00025', '0.00026', '7.42', '5.84', '< 00:01', '19.09', '  99942 Apophis (2004 MN4)'],
  ],
}

describe('toApproaches', () => {
  it('율리우스일을 UTC로, 숫자 문자열을 숫자로, 이름의 앞뒤 공백을 지운다', () => {
    const [first, apophis] = toApproaches(response)
    expect(first).toEqual({
      designation: '2026 VW15',
      name: '(2026 VW15)',
      date: '2026-11-16T05:25:55.000Z',
      distanceAu: 0.0131392541619584,
      velocityKmS: 6.06068543422993,
      absoluteMagnitude: 27.073,
    })
    expect(apophis.name).toBe('99942 Apophis (2004 MN4)')
    expect(apophis.date).toBe('2029-04-13T21:46:00.000Z')
  })

  it('필드 순서가 바뀌어도 이름으로 찾는다', () => {
    const reordered = { ...response, fields: [...response.fields].reverse(), data: response.data.map((row) => [...row].reverse()) }
    expect(toApproaches(reordered)).toEqual(toApproaches(response))
  })

  it('형식이 다르면 예외를 던진다', () => {
    expect(() => toApproaches({ error: 'bad request' })).toThrow()
    expect(() => toApproaches({ fields: ['des'], data: [] })).toThrow(/jd/)
  })
})

describe('findNeoProblem', () => {
  it('정상 응답은 null', () => {
    expect(findNeoProblem(response, toApproaches(response))).toBeNull()
  })
  it('서명이 다르거나 건수가 맞지 않으면 저장하지 않는다', () => {
    expect(findNeoProblem({ ...response, signature: { source: 'other' } }, toApproaches(response))).toMatch(/서명/)
    expect(findNeoProblem({ ...response, count: '3' }, toApproaches(response))).toMatch(/건수/)
  })
  it('가까이 오는 천체가 없는 기간(0건)도 저장할 수 있다', () => {
    const empty = { ...response, count: '0', data: [] }
    expect(findNeoProblem(empty, toApproaches(empty))).toBeNull()
  })
})
