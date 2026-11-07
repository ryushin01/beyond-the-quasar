import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'

import { FIXTURES, ISS_FIXTURE } from '@/entities/satellite'
import { useSatelliteFilter } from '@/features/filter-satellites'

import OrbitScatter from './OrbitScatter.vue'

describe('OrbitScatter', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('글 요약을 제공하고 군사 위성을 다른 모양으로 그린다', () => {
    const wrapper = mount(OrbitScatter, { props: { satellites: FIXTURES } })
    expect(wrapper.get('svg').attributes('role')).toBe('img')
    expect(wrapper.get('figcaption').text()).toContain('2기')
    expect(wrapper.findAll('.scatter__point')).toHaveLength(2)
    expect(wrapper.findAll('.scatter__point--mil')).toHaveLength(1)
  })

  it('필터에서 빠진 위성은 지우지 않고 흐리게 둔다', async () => {
    const wrapper = mount(OrbitScatter, { props: { satellites: FIXTURES } })
    useSatelliteFilter().toggleCategory('military')
    await wrapper.vm.$nextTick()
    expect(wrapper.findAll('.scatter__point')).toHaveLength(2)
    expect(wrapper.findAll('.scatter__point--dim')).toHaveLength(1)
    expect(wrapper.get('figcaption').text()).toContain('1기')
  })

  it('궤도 값이 없는 위성은 건너뛴다', () => {
    const wrapper = mount(OrbitScatter, { props: { satellites: [{ ...ISS_FIXTURE, apogeeKm: null }] } })
    expect(wrapper.findAll('.scatter__point')).toHaveLength(0)
  })

  it('누른 곳에서 가장 가까운 위성을 연다', async () => {
    const wrapper = mount(OrbitScatter, { props: { satellites: [ISS_FIXTURE] }, attachTo: document.body })
    const svg = wrapper.get('svg').element
    svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: 900, height: 480 }) as DOMRect
    const mark = wrapper.get('.scatter__mark').attributes('transform')!.match(/translate\((.+) (.+)\)/)!
    await wrapper.get('svg').trigger('click', { clientX: Number(mark[1]) + 5, clientY: Number(mark[2]) })
    expect(wrapper.emitted('open')?.[0]).toEqual([ISS_FIXTURE])
    await wrapper.get('svg').trigger('click', { clientX: 5, clientY: 5 })
    expect(wrapper.emitted('open')).toHaveLength(1)
    wrapper.unmount()
  })
})
