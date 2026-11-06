import { mount, RouterLinkStub } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import SiteHeader from './SiteHeader.vue'

describe('SiteHeader', () => {
  const wrapper = mount(SiteHeader, { global: { stubs: { RouterLink: RouterLinkStub } } })

  it('주요 메뉴 세 개와 로고 링크가 있다', () => {
    expect(wrapper.get('nav').attributes('aria-label')).toBe('주요 메뉴')
    expect(wrapper.findAll('nav li')).toHaveLength(3)
    expect(wrapper.text()).toContain('위성 관제')
  })

  it('시뮬레이션임을 항상 안내한다', () => {
    expect(wrapper.get('.banner').text()).toContain('실제 위성과 연결되지 않습니다')
  })

  it('메뉴 버튼이 대화상자를 연다고 알린다', () => {
    const burger = wrapper.get('.burger')
    expect(burger.attributes('aria-haspopup')).toBe('dialog')
    expect(burger.attributes('aria-expanded')).toBe('false')
  })
})
