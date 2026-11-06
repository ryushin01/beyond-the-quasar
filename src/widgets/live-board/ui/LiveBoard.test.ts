import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'

import { useMissionClock } from '@/entities/clock'
import { FIXTURES } from '@/entities/satellite'

import LiveBoard from './LiveBoard.vue'

describe('LiveBoard', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    useMissionClock().now = new Date('2026-11-05T12:00:00Z')
  })

  it('군사 위성 수와 전체 수를 표시한다', () => {
    const wrapper = mount(LiveBoard, { props: { satellites: FIXTURES } })
    const pairs = wrapper.findAll('.board__tile').map((tile) => [tile.get('dt').text(), tile.get('dd').text()])
    expect(Object.fromEntries(pairs)).toMatchObject({ '추적 위성': '2', '군사 위성': '1' })
    wrapper.unmount()
  })

  it('ISS가 없으면 대시를 보여 준다', () => {
    const wrapper = mount(LiveBoard, { props: { satellites: [FIXTURES[1]!] } })
    const alt = wrapper.findAll('.board__tile').find((tile) => tile.get('dt').text() === 'ISS 고도')!
    expect(alt.get('dd').text()).toContain('—')
    wrapper.unmount()
  })
})
