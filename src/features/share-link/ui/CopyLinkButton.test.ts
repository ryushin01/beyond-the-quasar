import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import CopyLinkButton from './CopyLinkButton.vue'

function stubClipboard(writeText: (text: string) => Promise<void>): void {
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
}

describe('CopyLinkButton', () => {
  afterEach(() => vi.restoreAllMocks())

  it('현재 주소를 복사하고 결과를 상태 영역으로 알린다', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    stubClipboard(writeText)
    const wrapper = mount(CopyLinkButton)
    await wrapper.get('button').trigger('click')
    await flushPromises()
    expect(writeText).toHaveBeenCalledWith(window.location.href)
    expect(wrapper.get('[role="status"]').text()).toBe('링크를 복사했습니다')
  })

  it('복사에 실패하면 실패를 알린다', async () => {
    stubClipboard(vi.fn().mockRejectedValue(new Error('denied')))
    const wrapper = mount(CopyLinkButton)
    await wrapper.get('button').trigger('click')
    await flushPromises()
    expect(wrapper.get('[role="status"]').text()).toContain('복사하지 못했습니다')
  })
})
