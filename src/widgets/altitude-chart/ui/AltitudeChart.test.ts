import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'

import { TARGETS } from '@/entities/sky'

import AltitudeChart from './AltitudeChart.vue'

describe('AltitudeChart', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('최고 고도를 글로 요약한다', () => {
    const wrapper = mount(AltitudeChart, { props: { target: TARGETS[10]!, from: new Date('2026-11-06T09:00:00Z') } })
    const summary = wrapper.get('figcaption').text()
    expect(summary).toContain('M45')
    // 대전(36.35°N)에서 플레이아데스(+24°)의 남중 고도는 약 78°
    expect(summary).toMatch(/최고 고도 7[5-9]도/)
    expect(wrapper.get('svg').attributes('aria-hidden')).toBe('true')
  })
})
