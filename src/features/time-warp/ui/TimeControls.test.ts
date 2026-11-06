import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'

import { useMissionClock } from '@/entities/clock'

import TimeControls from './TimeControls.vue'

describe('TimeControls', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('배속 버튼이 상태를 aria-pressed로 알리고 가상 시각으로 표시한다', async () => {
    const wrapper = mount(TimeControls)
    const clock = useMissionClock()
    const fast = wrapper.get('button[aria-label="배속 60×"]')
    await fast.trigger('click')
    expect(clock.rate).toBe(60)
    expect(fast.attributes('aria-pressed')).toBe('true')
    expect(wrapper.text()).toContain('가상 시각')
  })

  it('실시간일 때 복귀 버튼은 비활성이다', () => {
    const wrapper = mount(TimeControls)
    const live = wrapper.findAll('button').find((button) => button.text() === '실시간으로 복귀')!
    expect(live.attributes('disabled')).toBeDefined()
  })
})
