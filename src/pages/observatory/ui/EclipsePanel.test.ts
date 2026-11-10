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
})
