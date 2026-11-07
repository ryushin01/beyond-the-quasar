import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'

import { useMissionClock } from '@/entities/clock'
import { FIXTURES } from '@/entities/satellite'

import OrbitAxes from './OrbitAxes.vue'

describe('OrbitAxes', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    useMissionClock().now = new Date('2026-11-05T12:00:00Z')
  })

  it('두 축과 제목을 글로 제공한다', () => {
    const wrapper = mount(OrbitAxes, { props: { satellites: FIXTURES } })
    expect(wrapper.get('h2').text()).toBe('관제와 관측, 두 개의 축')
    expect(wrapper.findAll('.axes__word').map((word) => word.text())).toEqual(['관제', '관측'])
    wrapper.unmount()
  })

  it('지구본의 내용을 글로 요약하고 색이 아닌 범례 글자로도 구분한다', () => {
    const wrapper = mount(OrbitAxes, { props: { satellites: FIXTURES } })
    const globe = wrapper.get('canvas')
    expect(globe.attributes('role')).toBe('img')
    expect(globe.attributes('aria-label')).toContain('위성 2기')
    expect(globe.attributes('aria-label')).toContain('군사 위성은 1기')
    expect(wrapper.get('.axes__legend').text()).toContain('군사 1기')
    expect(wrapper.get('.axes__legend').text()).toContain('기타 1기')
    wrapper.unmount()
  })
})
