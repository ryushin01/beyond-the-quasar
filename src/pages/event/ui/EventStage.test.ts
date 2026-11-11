import { flushPromises, mount } from '@vue/test-utils'
import { beforeAll, describe, expect, it } from 'vitest'

import EventStage from './EventStage.vue'

describe('EventStage', () => {
  beforeAll(() => {
    globalThis.IntersectionObserver ||= class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as never
  })

  it('WebGL이 없으면 정적 대체 화면을 보여 준다', async () => {
    const wrapper = mount(EventStage)
    // 무대는 첫 화면이 그려진 뒤 한가할 때 켜집니다.
    await new Promise((resolve) => setTimeout(resolve, 120))
    await flushPromises()
    expect(wrapper.find('.stage__fallback').exists()).toBe(true)
    expect(wrapper.attributes('aria-hidden')).toBe('true')
  })
})
