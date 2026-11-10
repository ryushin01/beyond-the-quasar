import { describe, expect, it } from 'vitest'

import { describePeakOffset } from './peak-offset'

const translate = (key: string, values?: Record<string, unknown>): string => `${key.split('.').pop()}${values ? ` ${String(values.span)}` : ''}`

describe('describePeakOffset', () => {
  it('절정과 전·후를 시:분으로 나눈다', () => {
    expect(describePeakOffset(0, translate)).toBe('atPeak')
    expect(describePeakOffset(-65, translate)).toBe('beforePeak 1:05')
    expect(describePeakOffset(5, translate)).toBe('afterPeak 0:05')
  })
})
