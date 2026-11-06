import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'

import { FIXTURES, useTracking } from '@/entities/satellite'
import { useSatelliteFilter } from '@/features/filter-satellites'

import SatelliteRoster from './SatelliteRoster.vue'

describe('SatelliteRoster', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('추적 위성을 aria-pressed로 표시하고 누르면 바꾼다', async () => {
    const wrapper = mount(SatelliteRoster, { props: { satellites: FIXTURES } })
    const aehf = wrapper.findAll('li button').find((button) => button.text().includes('AEHF-1'))!
    expect(aehf.attributes('aria-pressed')).toBe('false')
    await aehf.trigger('click')
    expect(useTracking().trackedId).toBe(36868)
    expect(aehf.attributes('aria-pressed')).toBe('true')
  })

  it('필터 결과와 빈 상태를 보여 준다', async () => {
    const wrapper = mount(SatelliteRoster, { props: { satellites: FIXTURES } })
    useSatelliteFilter().toggleCategory('military')
    await wrapper.vm.$nextTick()
    expect(wrapper.findAll('li button')).toHaveLength(1)
    useSatelliteFilter().filter.query = 'nothing'
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('조건에 맞는 위성이 없습니다')
  })
})
