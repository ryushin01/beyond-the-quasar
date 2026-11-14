import { mount, RouterLinkStub } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import SiteFooter from './SiteFooter.vue'

describe('SiteFooter', () => {
  const wrapper = mount(SiteFooter, { global: { stubs: { RouterLink: RouterLinkStub } } })

  it('출처는 README로 안내하고 시뮬레이션 안내를 보여 준다', () => {
    const credits = wrapper.get('a.footer__credits')
    expect(credits.attributes('href')).toBe('https://github.com/ryushin01/beyond-the-quasar#출처')
    expect(credits.text()).toContain('출처')
    expect(wrapper.text()).not.toContain('CelesTrak')
    expect(wrapper.text()).toContain('시뮬레이션')
  })

  it('큰 글자 장식은 보조 기술에서 숨긴다', () => {
    expect(wrapper.get('.footer__giant').attributes('aria-hidden')).toBe('true')
    expect(wrapper.findAll('.footer__letter')).toHaveLength(6)
  })
})
