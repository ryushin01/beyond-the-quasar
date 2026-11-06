import { mount, RouterLinkStub } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import SiteFooter from './SiteFooter.vue'

describe('SiteFooter', () => {
  const wrapper = mount(SiteFooter, { global: { stubs: { RouterLink: RouterLinkStub } } })

  it('데이터 출처와 시뮬레이션 안내를 보여 준다', () => {
    expect(wrapper.text()).toContain('CelesTrak')
    expect(wrapper.text()).toContain('시뮬레이션')
  })

  it('큰 글자 장식은 보조 기술에서 숨긴다', () => {
    expect(wrapper.get('.footer__giant').attributes('aria-hidden')).toBe('true')
    expect(wrapper.findAll('.footer__letter')).toHaveLength(6)
  })
})
