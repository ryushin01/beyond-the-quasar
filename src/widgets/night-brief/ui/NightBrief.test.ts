import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'

import NightBrief from './NightBrief.vue'

describe('NightBrief', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('달의 위상과 조명률을 글자로 보여 준다', () => {
    const text = mount(NightBrief, { props: { date: new Date('2026-08-28T04:00:00Z') } }).text()
    expect(text).toContain('보름달')
    expect(text).toMatch(/조명률 (9\d|100)%/)
  })

  it('여섯 가지 시각을 보여 준다', () => {
    const wrapper = mount(NightBrief, { props: { date: new Date('2026-11-06T00:00:00Z') } })
    expect(wrapper.findAll('li')).toHaveLength(6)
    expect(wrapper.text()).toContain('일몰')
  })
})
