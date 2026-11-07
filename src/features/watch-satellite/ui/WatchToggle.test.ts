import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'

import { ISS_FIXTURE, useWatchlist } from '@/entities/satellite'

import WatchToggle from './WatchToggle.vue'

describe('WatchToggle', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('위성 이름이 든 이름과 눌림 상태를 알리고 목록을 바꾼다', async () => {
    const wrapper = mount(WatchToggle, { props: { satellite: ISS_FIXTURE } })
    const button = wrapper.get('button')
    expect(button.attributes('aria-label')).toContain('ISS (ZARYA)')
    expect(button.attributes('aria-pressed')).toBe('false')
    await button.trigger('click')
    expect(useWatchlist().has(ISS_FIXTURE.noradId)).toBe(true)
    expect(button.attributes('aria-pressed')).toBe('true')
    expect(wrapper.get('path').attributes('fill')).toBe('currentColor')
  })
})
