import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'

import { useMissionClock } from '@/entities/clock'
import { FIXTURES, ISS_FIXTURE } from '@/entities/satellite'

import GroundTrackMap from './GroundTrackMap.vue'

describe('GroundTrackMap', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    useMissionClock().now = new Date('2026-11-05T12:00:00Z')
  })

  it('지도를 글로 요약해 보조 기술에 전한다', () => {
    const wrapper = mount(GroundTrackMap, { props: { satellites: FIXTURES, tracked: ISS_FIXTURE } })
    const label = wrapper.get('canvas').attributes('aria-label')!
    expect(wrapper.get('canvas').attributes('role')).toBe('img')
    expect(label).toContain('ISS (ZARYA)')
    expect(label).toContain('위성 2기')
  })

  it('포인터 없이 쓸 수 있는 지도 방식·확대 버튼이 있다', async () => {
    const wrapper = mount(GroundTrackMap, { props: { satellites: FIXTURES, tracked: ISS_FIXTURE } })
    expect(wrapper.find('button[aria-label="지도 확대"]').exists()).toBe(true)
    const globe = wrapper.findAll('button').find((button) => button.text() === '지구본')!
    await globe.trigger('click')
    expect(globe.attributes('aria-pressed')).toBe('true')
  })

  it('범례에 군사 위성을 글자로 표시한다', () => {
    const wrapper = mount(GroundTrackMap, { props: { satellites: FIXTURES, tracked: ISS_FIXTURE } })
    expect(wrapper.get('.map__legend').text()).toContain('군사 위성')
  })
})
