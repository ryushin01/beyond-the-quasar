import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { describe, expect, it } from 'vitest'

import { eclipseWindow } from '@/entities/sky'

import EclipsePanel from './EclipsePanel.vue'

const DAEJEON = { latitude: 36.35, longitude: 127.38, elevationM: 70 }

describe('EclipsePanel', () => {
  it('관측지 기준 보임 여부와 시작·절정·끝을 보여 준다', () => {
    const eclipse = eclipseWindow('solarEclipse', new Date('2027-02-06T15:59:32Z'), DAEJEON)!
    const wrapper = mount(EclipsePanel, { props: { eclipse, date: eclipse.peak, offset: 0 }, global: { plugins: [createPinia()] } })
    expect(wrapper.get('.eclipse__badge').text()).toBe('이 관측지에서 보이지 않음')
    expect(wrapper.findAll('.eclipse__row dt').map((item) => item.text())).toEqual(['시작', '절정', '끝', '절정 고도'])
    expect(wrapper.text()).toContain('절정 기준 시각 · 절정')
  })

  it('시각 막대는 시작과 끝 시각 안쪽에서만 움직인다', () => {
    const eclipse = eclipseWindow('lunarEclipse', new Date('2028-12-31T16:52:00Z'), DAEJEON)!
    const wrapper = mount(EclipsePanel, { props: { eclipse, date: eclipse.peak, offset: 0 }, global: { plugins: [createPinia()] } })
    const slider = wrapper.get('[role="slider"]')
    const min = Number(slider.attributes('aria-valuemin'))
    const max = Number(slider.attributes('aria-valuemax'))
    expect(Math.abs(min % 5)).toBe(0)
    expect(eclipse.peak.getTime() + min * 60_000).toBeGreaterThanOrEqual(eclipse.start.getTime())
    expect(eclipse.peak.getTime() + max * 60_000).toBeLessThanOrEqual(eclipse.end.getTime())
  })
})
