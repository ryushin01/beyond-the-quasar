import { describe, expect, it } from 'vitest'

import { kpToG, parseKp, parseScales } from './parse'

// 2026-11-16 NOAA SWPC 응답에서 줄인 표본
const scales = {
  '0': { DateStamp: '2026-11-16', TimeStamp: '02:19:00', R: { Scale: '0', Text: 'none', MinorProb: null, MajorProb: null }, S: { Scale: '0', Text: 'none', Prob: null }, G: { Scale: '0', Text: 'none' } },
  '1': { DateStamp: '2026-11-16', TimeStamp: '02:19:00', R: { Scale: null, Text: null, MinorProb: '25', MajorProb: '5' }, S: { Scale: null, Text: null, Prob: '5' }, G: { Scale: '0', Text: 'none' } },
  '2': { DateStamp: '2026-11-17', TimeStamp: '00:00:00', R: { Scale: null, Text: null, MinorProb: '25', MajorProb: '5' }, S: { Scale: null, Text: null, Prob: '5' }, G: { Scale: '1', Text: 'minor' } },
  '3': { DateStamp: '2026-11-18', TimeStamp: '00:00:00', R: { Scale: null, Text: null, MinorProb: '20', MajorProb: '1' }, S: { Scale: null, Text: null, Prob: '1' }, G: { Scale: '0', Text: 'none' } },
  '-1': { DateStamp: '2026-11-15', TimeStamp: '02:19:00', R: { Scale: '1', Text: 'minor' }, S: { Scale: '0', Text: 'none' }, G: { Scale: '0', Text: 'none' } },
}

describe('parseScales', () => {
  it('지금 등급, 지난 24시간 최대, 사흘 예보를 읽는다', () => {
    const parsed = parseScales(scales)
    expect(parsed.observedAt?.toISOString()).toBe('2026-11-16T02:19:00.000Z')
    expect(parsed.now).toEqual({ g: 0, s: 0, r: 0 })
    expect(parsed.past).toEqual({ g: 0, s: 0, r: 1 })
    expect(parsed.forecast).toEqual([
      { date: '2026-11-16', g: 0, rMinor: 25, rMajor: 5, s: 5 },
      { date: '2026-11-17', g: 1, rMinor: 25, rMajor: 5, s: 5 },
      { date: '2026-11-18', g: 0, rMinor: 20, rMajor: 1, s: 1 },
    ])
  })

  it('지금 등급이 없거나 형식이 다르면 예외를 던진다(화면은 오류 안내로 대신)', () => {
    expect(() => parseScales([])).toThrow()
    expect(() => parseScales({ '0': { G: { Scale: 'x' } } })).toThrow()
  })

  it('범위 밖 등급과 깨진 확률은 null로 둔다', () => {
    const parsed = parseScales({ ...scales, '1': { ...scales['1'], G: { Scale: '9' }, S: { Prob: 'abc' } } })
    expect(parsed.forecast[0]).toMatchObject({ g: null, s: null })
  })
})

describe('parseKp', () => {
  it('객체 배열(현재 형식)을 시간순으로 읽는다', () => {
    const samples = parseKp([
      { time_tag: '2026-11-15T21:00:00', Kp: 0.67, a_running: 3, station_count: 8 },
      { time_tag: '2026-11-15T18:00:00', Kp: 1.0, a_running: 4, station_count: 8 },
    ])
    expect(samples.map((sample) => [sample.time.toISOString(), sample.kp])).toEqual([
      ['2026-11-15T18:00:00.000Z', 1],
      ['2026-11-15T21:00:00.000Z', 0.67],
    ])
  })

  it('머리 행이 있는 배열의 배열(이전 형식)도 읽고, 깨진 행은 건너뛴다', () => {
    const samples = parseKp([
      ['time_tag', 'Kp', 'a_running', 'station_count'],
      ['2026-11-15 18:00:00.000', '1.00', '4', '8'],
      ['broken', 'x'],
    ])
    expect(samples).toHaveLength(1)
    expect(samples[0]!.time.toISOString()).toBe('2026-11-15T18:00:00.000Z')
  })

  it('배열이 아니면 예외를 던진다', () => {
    expect(() => parseKp({})).toThrow()
  })
})

it('Kp를 G 등급으로 바꾼다(Kp 5 = G1)', () => {
  expect([0, 4.67, 5, 6.33, 7, 8, 9].map(kpToG)).toEqual([0, 0, 1, 2, 3, 4, 5])
})
