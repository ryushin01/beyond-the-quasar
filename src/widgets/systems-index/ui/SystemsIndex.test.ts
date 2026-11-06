import { mount, RouterLinkStub } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import SystemsIndex from './SystemsIndex.vue'

describe('SystemsIndex', () => {
  it('세 시스템으로 가는 링크에 제목과 설명이 있다', () => {
    const wrapper = mount(SystemsIndex, { global: { stubs: { RouterLink: RouterLinkStub } } })
    const links = wrapper.findAllComponents(RouterLinkStub)
    expect(links.map((link) => link.props('to'))).toEqual(['/control', '/catalog', '/observatory'])
    expect(links[0]!.text()).toContain('위성 관제')
    expect(links[0]!.text()).toContain('지상 궤적')
  })
})
