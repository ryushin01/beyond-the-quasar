import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import EventPage from './EventPage.vue'

describe('EventPage 구조', () => {
  beforeAll(() => {
    globalThis.IntersectionObserver ||= class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as never
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // 장(章)을 컴포넌트로 나누거나 정리해도 같은 문서를 그리는지 지킵니다. 범위 지정 속성(data-v-*)은 비교에서 뺍니다.
  it('같은 날에는 같은 문서 구조와 글을 그린다', async () => {
    vi.useFakeTimers({ now: new Date('2026-11-20T12:00:00Z'), toFake: ['Date'] })
    const wrapper = mount(EventPage, { global: { stubs: { RouterLink: RouterLinkStub } } })
    await flushPromises()
    expect(wrapper.html().replace(/ data-v-[0-9a-f]{8}=""/g, '')).toMatchSnapshot()
    wrapper.unmount()
  })
})
