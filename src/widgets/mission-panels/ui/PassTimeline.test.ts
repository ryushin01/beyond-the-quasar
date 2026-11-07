import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'

import { useMissionClock } from '@/entities/clock'
import { AEHF_FIXTURE, FIXTURES, ISS_FIXTURE, useTracking, useWatchlist } from '@/entities/satellite'

import PassTimeline from './PassTimeline.vue'

describe('PassTimeline', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    useMissionClock().now = new Date('2026-11-05T12:00:00Z')
  })

  it('관심 위성이 없으면 추적 위성만 보여 주고 안내한다', () => {
    const wrapper = mount(PassTimeline, { props: { satellite: ISS_FIXTURE, satellites: FIXTURES } })
    expect(wrapper.findAll('.schedule__row')).toHaveLength(1)
    expect(wrapper.get('.schedule__hint').text()).toContain('별')
  })

  it('관심 위성을 함께 보여 주고 이름을 누르면 추적을 바꾼다', async () => {
    useWatchlist().toggle(AEHF_FIXTURE.noradId)
    const wrapper = mount(PassTimeline, { props: { satellite: ISS_FIXTURE, satellites: FIXTURES } })
    expect(wrapper.findAll('.schedule__row')).toHaveLength(2)
    await wrapper.findAll('.schedule__name').find((button) => button.text().includes('AEHF'))!.trigger('click')
    expect(useTracking().trackedId).toBe(AEHF_FIXTURE.noradId)
  })

  it('막대가 없어도 다음 통과를 글로 알린다', () => {
    const wrapper = mount(PassTimeline, { props: { satellite: ISS_FIXTURE, satellites: FIXTURES } })
    expect(wrapper.get('.schedule__next').text()).toMatch(/다음|통과 중|없음/)
    expect(wrapper.get('.schedule__track').attributes('aria-hidden')).toBe('true')
  })
})
