import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ScrambleText from './ScrambleText.vue'

describe('ScrambleText', () => {
  it('스크린리더용 원문과 표시 전용 사본을 나눈다', () => {
    const wrapper = mount(ScrambleText, { props: { text: 'CONTROL' } })
    expect(wrapper.find('.sr-only').text()).toBe('CONTROL')
    expect(wrapper.find('[aria-hidden="true"]').text()).toBe('CONTROL')
  })

  it('문구가 바뀌면 표시도 바뀐다', async () => {
    const wrapper = mount(ScrambleText, { props: { text: 'A' } })
    await wrapper.setProps({ text: 'B' })
    expect(wrapper.find('[aria-hidden="true"]').text()).toBe('B')
  })
})
