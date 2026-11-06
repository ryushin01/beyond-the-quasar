import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'

import type { Satellite } from '@/entities/satellite'

import { useSatelliteFilter } from '../model/filter'
import SatelliteFilterPanel from './SatelliteFilterPanel.vue'

const base = { line1: '', line2: '', launchSite: null, launchDate: null, opsStatus: '+', periodMin: null, inclinationDeg: null, rcsM2: null, epoch: new Date(), objectId: null, apogeeKm: null, perigeeKm: null, dualUse: false }
const satellites: Satellite[] = [
  { ...base, noradId: 1, name: 'AEHF-1', category: 'military', mission: 'milsatcom', orbit: 'GEO', owner: 'US' },
  { ...base, noradId: 2, name: 'SKYNET 5A', category: 'military', mission: 'milsatcom', orbit: 'GEO', owner: 'UK' },
]

describe('SatelliteFilterPanel', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('분류 칩에 개수를 보여 주고 누르면 필터가 바뀐다', async () => {
    const wrapper = mount(SatelliteFilterPanel, { props: { satellites } })
    const store = useSatelliteFilter()
    const chip = wrapper.findAll('button').find((button) => button.text().startsWith('군사'))!
    expect(chip.text()).toContain('2')
    await chip.trigger('click')
    expect(store.filter.categories).toEqual(['military'])
    expect(chip.attributes('aria-pressed')).toBe('true')
  })

  it('필터가 있을 때만 초기화 버튼이 나타나고 누르면 비운다', async () => {
    const wrapper = mount(SatelliteFilterPanel, { props: { satellites } })
    const store = useSatelliteFilter()
    expect(wrapper.text()).not.toContain('필터 초기화')
    store.toggleOrbit('GEO')
    await wrapper.vm.$nextTick()
    await wrapper.findAll('button').find((button) => button.text() === '필터 초기화')!.trigger('click')
    expect(store.isActive).toBe(false)
  })

  it('dense에서는 임무와 운영 주체를 숨긴다', () => {
    const text = mount(SatelliteFilterPanel, { props: { satellites, dense: true } }).text()
    expect(text).not.toContain('운영 주체')
  })
})
