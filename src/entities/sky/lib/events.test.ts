import { describe, expect, it } from 'vitest'

import { daysUntil, upcomingSkyEvents } from './events'

const NOW = new Date('2026-11-08T00:00:00Z')

describe('upcomingSkyEvents', () => {
  const events = upcomingSkyEvents(NOW)
  const find = (id: string) => events.find((event) => event.id === id)!

  it('네 종류의 사건을 빠른 순서로 돌려준다', () => {
    expect(events.map((event) => event.id).sort()).toEqual(['fullMoon', 'lunarEclipse', 'season', 'solarEclipse'])
    const times = events.map((event) => event.date.getTime())
    expect(times).toEqual([...times].sort((a, b) => a - b))
    expect(times.every((time) => time > NOW.getTime())).toBe(true)
  })

  it('공개된 천문력과 같은 날짜를 찾는다', () => {
    expect(find('fullMoon').date.toISOString().slice(0, 10)).toBe('2026-11-24')
    expect(find('season').kind).toBe('decemberSolstice')
    expect(find('season').date.toISOString().slice(0, 10)).toBe('2026-12-21')
    expect(find('solarEclipse').date.toISOString().slice(0, 10)).toBe('2027-02-06')
    expect(find('solarEclipse').kind).toBe('annular')
    expect(find('lunarEclipse').date.toISOString().slice(0, 10)).toBe('2027-02-20')
    expect(find('lunarEclipse').kind).toBe('penumbral')
  })
})

describe('daysUntil', () => {
  it('시각과 상관없이 달력 날짜 차이를 센다', () => {
    expect(daysUntil(new Date('2026-11-09T00:10:00Z'), new Date('2026-11-08T23:50:00Z'))).toBe(1)
    expect(daysUntil(new Date('2026-11-08T23:00:00Z'), new Date('2026-11-08T01:00:00Z'))).toBe(0)
  })
})
