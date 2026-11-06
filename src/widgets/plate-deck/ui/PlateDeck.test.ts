import { mount, RouterLinkStub } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import { FIXTURES } from '@/entities/satellite'

import PlateDeck from './PlateDeck.vue'

describe('PlateDeck', () => {
  const wrapper = mount(PlateDeck, { props: { satellites: FIXTURES }, global: { stubs: { RouterLink: RouterLinkStub } } })

  it('일곱 분류를 카탈로그 필터 링크로 보여 준다', () => {
    const links = wrapper.findAllComponents(RouterLinkStub)
    expect(links).toHaveLength(7)
    expect(links[0]!.props('to')).toEqual({ path: '/catalog', query: { category: 'military' } })
  })

  it('분류별 위성 수를 보여 준다', () => {
    expect(wrapper.findAll('li')[0]!.text()).toContain('1기')
  })
})
