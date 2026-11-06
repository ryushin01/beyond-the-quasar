import { mount } from '@vue/test-utils'
import { beforeAll, describe, expect, it } from 'vitest'

import HomeHero from './HomeHero.vue'

describe('HomeHero', () => {
  beforeAll(() => {
    globalThis.IntersectionObserver ||= class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as never
  })

  it('h1은 온전한 문장을 읽어 주고 글자 조각은 숨긴다', () => {
    const wrapper = mount(HomeHero)
    expect(wrapper.get('h1 .sr-only').text()).toBe('Beyond The Quasar')
    expect(wrapper.findAll('h1 .hero__line').every((line) => line.attributes('aria-hidden') === 'true')).toBe(true)
  })

  it('다음 구역으로 가는 링크가 있다', () => {
    expect(mount(HomeHero).get('a').attributes('href')).toBe('#manifesto')
  })
})
