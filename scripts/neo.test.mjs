import { describe, expect, it } from 'vitest'

import { findNeoProblem, toApproaches, TT_MINUS_UTC_S } from './fetch-neo.mjs'

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
  it('율리우스일(TDB)을 UTC로(TT−UTC 69.184초를 빼고 초 단위 반올림), 숫자 문자열을 숫자로, 이름의 앞뒤 공백을 지운다', () => {
    const [first, apophis] = toApproaches(response)
    expect(first).toEqual({
      designation: '2026 VW15',
      name: '(2026 VW15)',
      // JD 2461360.726327889 TDB = 05:25:54.729 TDB → 05:24:45.545 UTC
      date: '2026-11-16T05:24:46.000Z',
      distanceAu: 0.0131392541619584,
      velocityKmS: 6.06068543422993,
      absoluteMagnitude: 27.073,
    })
    expect(apophis.name).toBe('99942 Apophis (2004 MN4)')
    expect(apophis.date).toBe(new Date(Date.UTC(2029, 3, 13, 21, 46, 0) - Math.round(TT_MINUS_UTC_S) * 1000).toISOString())
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
  it('count가 비어 있으면(null) 0건으로 받지 않아 기존 스냅샷을 지킨다', () => {
    const broken = { signature: response.signature, count: null }
    expect(() => toApproaches(broken)).toThrow()
    expect(findNeoProblem(broken, [])).toMatch(/건수/)
  })

  it('0건이면 API가 fields·data 없이 보내는 응답도 받는다', () => {
    const empty = { signature: response.signature, count: 0 }
    expect(toApproaches(empty)).toEqual([])
    expect(findNeoProblem(empty, toApproaches(empty))).toBeNull()
  })
})
