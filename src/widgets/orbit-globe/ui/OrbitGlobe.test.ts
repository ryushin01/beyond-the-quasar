import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { FIXTURES } from '@/entities/satellite'
import { useSatelliteFilter } from '@/features/filter-satellites'

import OrbitGlobe from './OrbitGlobe.vue'

describe('OrbitGlobe', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('표시 중인 위성 수와 궤도별 수를 글로 요약한다', () => {
    const wrapper = mount(OrbitGlobe, { props: { satellites: FIXTURES } })
    const summary = wrapper.get('figcaption').text()
    expect(summary).toContain('2기')
    expect(summary).toContain('군사 1기')
    expect(summary).toContain('LEO 1')
    expect(summary).toContain('GEO 1')
    expect(wrapper.get('canvas').attributes('aria-label')).toBe(summary)
  })

  it('필터를 바꾸면 요약도 따라 바뀐다', async () => {
    const wrapper = mount(OrbitGlobe, { props: { satellites: FIXTURES } })
    useSatelliteFilter().toggleCategory('military')
    await wrapper.vm.$nextTick()
    expect(wrapper.get('figcaption').text()).toContain('1기')
  })

  it('WebGL을 쓸 수 없으면 다른 보기로 안내하고 조작 버튼을 끈다', async () => {
    const wrapper = mount(OrbitGlobe, { props: { satellites: FIXTURES } })
    // 장면 파일을 늦게 불러오므로 그 불러오기가 끝날 때까지 기다린다.
    await vi.dynamicImportSettled()
    await flushPromises()
    expect(wrapper.text()).toContain('3D 화면을 그릴 수 없습니다')
    const buttons = wrapper.findAll('button')
    expect(buttons).toHaveLength(4)
    for (const button of buttons) expect(button.attributes('disabled')).toBeDefined()
    expect(buttons.map((button) => button.attributes('aria-label'))).toEqual(['왼쪽으로 돌리기', '오른쪽으로 돌리기', '가까이', '멀리'])
  })
})
