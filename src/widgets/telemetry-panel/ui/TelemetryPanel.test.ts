import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'

import { useMissionClock } from '@/entities/clock'
import { ISS_FIXTURE } from '@/entities/satellite'

import TelemetryPanel from './TelemetryPanel.vue'

describe('TelemetryPanel', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    useMissionClock().now = new Date('2026-11-05T12:00:00Z')
  })

  it('궤도 값을 정의 목록으로 보여 준다', () => {
    const wrapper = mount(TelemetryPanel, { props: { satellite: ISS_FIXTURE } })
    expect(wrapper.text()).toContain('ISS (ZARYA)')
    expect(wrapper.text()).toContain('km/s')
    expect(wrapper.findAll('dt').length).toBe(wrapper.findAll('dd').length)
  })

  it('교신 상태를 글자로 표시한다', () => {
    const text = mount(TelemetryPanel, { props: { satellite: ISS_FIXTURE } }).text()
    expect(text.includes('교신 가능') || text.includes('지평선 아래')).toBe(true)
  })

  it('고도 곡선을 그린다', () => {
    const wrapper = mount(TelemetryPanel, { props: { satellite: ISS_FIXTURE } })
    expect(wrapper.get('path').attributes('d')?.startsWith('M')).toBe(true)
  })
})
