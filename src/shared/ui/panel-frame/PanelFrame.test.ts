import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import PanelFrame from './PanelFrame.vue'

describe('PanelFrame', () => {
  it('제목으로 구역 이름을 정한다', () => {
    const wrapper = mount(PanelFrame, { props: { title: '원격 측정' }, slots: { default: '<p>내용</p>' } })
    expect(wrapper.get('section').attributes('aria-labelledby')).toBe(wrapper.get('h2').attributes('id'))
    expect(wrapper.text()).toContain('내용')
  })
})
