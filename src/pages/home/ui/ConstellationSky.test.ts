import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { beforeAll, describe, expect, it } from 'vitest'

import ConstellationSky from './ConstellationSky.vue'

const render = () => mount(ConstellationSky, { global: { plugins: [createPinia()], stubs: { RouterLink: RouterLinkStub } } })

describe('ConstellationSky', () => {
  beforeAll(() => {
    globalThis.IntersectionObserver ||= class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as never
  })

  it('캔버스의 내용을 글로도 제공한다', async () => {
    const wrapper = render()
    await flushPromises()
    expect(wrapper.get('canvas').attributes('role')).toBe('img')
    expect(wrapper.get('canvas').attributes('aria-label')).toContain('대전')
    wrapper.unmount()
  })

  it('설명 패널을 버튼으로 열고 닫는다', async () => {
    const wrapper = render()
    await flushPromises()
    const chip = wrapper.get('.sky__chip')
    expect(chip.attributes('aria-expanded')).toBe('false')
    await chip.trigger('click')
    expect(chip.attributes('aria-expanded')).toBe('true')
    expect(wrapper.findAll('.sky__names li').length).toBeGreaterThan(0)
    wrapper.unmount()
  })

  it('끌지 않아도 버튼으로 방향을 돌릴 수 있다', async () => {
    const wrapper = render()
    await flushPromises()
    expect(wrapper.findAll('.sky__turn-button')).toHaveLength(2)
    expect(wrapper.get('.sky__turn-button').attributes('aria-label')).toBe('왼쪽으로 돌리기')
    wrapper.unmount()
  })

  it('다음 천문 현상을 이벤트 화면으로 연결한다', async () => {
    const wrapper = render()
    await flushPromises()
    expect(wrapper.findComponent(RouterLinkStub).props('to')).toBe('/event')
    wrapper.unmount()
  })
})
