import { describe, expect, it } from 'vitest'

import { toCsv } from './csv'
import { foldLine, icsDate, icsText, toIcs } from './ics'

describe('iCalendar', () => {
  it('날짜를 UTC 기본 형식으로 쓴다', () => {
    expect(icsDate(new Date('2026-11-16T05:26:07.123Z'))).toBe('20261116T052607Z')
  })

  it('특수 문자를 이스케이프한다', () => {
    expect(icsText('ISS (ZARYA), 최대 52°; 대전\n북서→남동 \\')).toBe('ISS (ZARYA)\\, 최대 52°\\; 대전\\n북서→남동 \\\\')
  })

  it('75바이트를 넘는 줄은 한글을 자르지 않고 접는다', () => {
    const folded = foldLine(`SUMMARY:${'관'.repeat(40)}`)
    const lines = folded.split('\r\n')
    expect(lines.length).toBeGreaterThan(1)
    for (const [index, line] of lines.entries()) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75)
      if (index > 0) expect(line.startsWith(' ')).toBe(true)
    }
    expect(lines.map((line, index) => (index ? line.slice(1) : line)).join('')).toBe(`SUMMARY:${'관'.repeat(40)}`)
  })

  it('일정 문서를 CRLF로 만든다', () => {
    const ics = toIcs(
      [{ uid: 'pass-25544-20261116T0526Z@btq', start: new Date('2026-11-16T05:26:00Z'), end: new Date('2026-11-16T05:32:00Z'), title: 'ISS 통과', description: '최대 52°', location: '대전' }],
      { productId: '-//Beyond the Quasar//Passes//KO', now: new Date('2026-11-16T00:00:00Z') },
    )
    expect(ics.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\n')).toBe(true)
    expect(ics).toContain('\r\nDTSTART:20261116T052600Z\r\nDTEND:20261116T053200Z\r\nSUMMARY:ISS 통과\r\n')
    expect(ics).toContain('LOCATION:대전')
    expect(ics.endsWith('END:VEVENT\r\nEND:VCALENDAR\r\n')).toBe(true)
    expect(ics).not.toMatch(/[^\r]\n/)
  })
})

it('길이가 0인 일정은 DTEND 없이 순간 일정으로 둔다', () => {
  const at = new Date('2026-11-16T05:26:00Z')
  const ics = toIcs([{ uid: 'x', start: at, end: at, title: 't' }], { productId: 'p', now: at })
  expect(ics).toContain('DTSTART:20261116T052600Z')
  expect(ics).not.toContain('DTEND')
})

describe('CSV', () => {
  it('BOM을 붙이고 쉼표·따옴표·줄바꿈이 든 칸만 감싼다', () => {
    expect(toCsv([['대상', '메모'], ['M42', '맑음, "투명도" 좋음\n바람']])).toBe('\uFEFF대상,메모\r\nM42,"맑음, ""투명도"" 좋음\n바람"\r\n')
  })

  it('수식처럼 보이는 글은 작은따옴표를 붙여 글자로 둔다(수식 주입 방지), 숫자 값은 그대로', () => {
    expect(toCsv([['=1+2', '+SUM(A1)', '-x', '@cmd', '보통 글', -3, 4]])).toBe("\uFEFF'=1+2,'+SUM(A1),'-x,'@cmd,보통 글,-3,4\r\n")
  })
})
