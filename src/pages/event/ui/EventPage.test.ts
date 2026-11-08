import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils'
import { beforeAll, describe, expect, it } from 'vitest'

import EventPage from './EventPage.vue'

const render = () => mount(EventPage, { global: { stubs: { RouterLink: RouterLinkStub } } })

describe('EventPage', () => {
  beforeAll(() => {
    globalThis.IntersectionObserver ||= class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as never
  })

  it('구역을 순서 있는 목차로 제공한다', async () => {
    const wrapper = render()
    await flushPromises()
    expect(wrapper.get('nav').attributes('aria-label')).toBe('이벤트 구역')
    expect(wrapper.findAll('nav ol > li > a').map((link) => link.attributes('href'))).toEqual(['#event-signal', '#event-calendar', '#event-horizon', '#event-return'])
    wrapper.unmount()
  })

  it('제목은 h1 하나이고 구역은 h2로 이어진다', async () => {
    const wrapper = render()
    await flushPromises()
    expect(wrapper.findAll('h1')).toHaveLength(1)
    expect(wrapper.findAll('h2')).toHaveLength(3)
    wrapper.unmount()
  })

  it('다음 천문 현상 네 가지를 계산값이라고 밝히며 보여 준다', async () => {
    const wrapper = render()
    await flushPromises()
    expect(wrapper.findAll('.tile')).toHaveLength(4)
    expect(wrapper.get('.calendar__note').text()).toContain('실제 행사가 아니라')
    expect(wrapper.get('.tile time').attributes('datetime')).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    wrapper.unmount()
  })

  it('블랙홀 그림이 근사 렌더링임을 안내한다', async () => {
    const wrapper = render()
    await flushPromises()
    expect(wrapper.get('.facts__render').text()).toContain('연출')
    wrapper.unmount()
  })
})
