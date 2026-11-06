import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ToggleChip from './ToggleChip.vue'

describe('ToggleChip', () => {
  it('선택 상태를 aria-pressed로 알린다', () => {
    const wrapper = mount(ToggleChip, { props: { label: '군사', pressed: true } })
    expect(wrapper.get('button').attributes('aria-pressed')).toBe('true')
  })

  it('누르면 toggle 이벤트를 보낸다', async () => {
    const wrapper = mount(ToggleChip, { props: { label: '군사', pressed: false, count: 3 } })
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('toggle')).toHaveLength(1)
    expect(wrapper.text()).toContain('3')
  })
})
