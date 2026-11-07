import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed } from 'vue'

import { FIXTURES, useTracking } from '@/entities/satellite'

import CommandPalette from './CommandPalette.vue'

const push = vi.fn()
vi.mock('vue-router', async (original) => ({ ...(await original<object>()), useRouter: () => ({ push }) }))
vi.mock('@/entities/satellite', async (original) => ({
  ...(await original<object>()),
  useSatelliteCatalog: () => ({ satellites: computed(() => FIXTURES) }),
}))

async function openPalette() {
  const wrapper = mount(CommandPalette, { attachTo: document.body })
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))
  await flushPromises()
  return { wrapper, input: document.querySelector<HTMLInputElement>('[role="combobox"]')! }
}

describe('CommandPalette', () => {
  beforeEach(() => {
    localStorage.clear()
    push.mockClear()
    setActivePinia(createPinia())
  })

  it('수정 키 없는 k에는 열리지 않는다', async () => {
    const wrapper = mount(CommandPalette, { attachTo: document.body })
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k' }))
    await flushPromises()
    expect(wrapper.get('button').attributes('aria-expanded')).toBe('false')
    wrapper.unmount()
  })

  it('화살표로 옵션을 옮기고 aria-activedescendant로 알린다', async () => {
    const { wrapper, input } = await openPalette()
    const first = input.getAttribute('aria-activedescendant')
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    await flushPromises()
    expect(input.getAttribute('aria-activedescendant')).not.toBe(first)
    expect(document.querySelectorAll('[aria-selected="true"]')).toHaveLength(1)
    wrapper.unmount()
  })

  it('위성을 찾아 Enter를 누르면 추적하고 관제로 이동한다', async () => {
    const { wrapper, input } = await openPalette()
    input.value = 'AEHF'
    input.dispatchEvent(new Event('input'))
    await flushPromises()
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    await flushPromises()
    expect(useTracking().trackedId).toBe(36868)
    expect(push).toHaveBeenCalledWith({ path: '/control', query: { sat: 36868 } })
    wrapper.unmount()
  })

  it('결과가 없으면 상태 영역으로 알린다', async () => {
    const { wrapper, input } = await openPalette()
    input.value = 'zzzz'
    input.dispatchEvent(new Event('input'))
    await flushPromises()
    expect(document.querySelector('.palette__foot')?.textContent).toContain('결과가 없습니다')
    wrapper.unmount()
  })
})
