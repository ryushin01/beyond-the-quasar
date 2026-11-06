import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { FIXTURES, useTracking } from '@/entities/satellite'
import { useSatelliteFilter } from '@/features/filter-satellites'

import SatelliteGallery from './SatelliteGallery.vue'

const push = vi.fn()
vi.mock('vue-router', async (original) => ({ ...(await original<object>()), useRouter: () => ({ push }) }))

describe('SatelliteGallery', () => {
  beforeEach(() => {
    localStorage.clear()
    push.mockClear()
    setActivePinia(createPinia())
  })

  it('필터에 맞는 플레이트만 보여 주고 개수를 알린다', async () => {
    const wrapper = mount(SatelliteGallery, { props: { satellites: FIXTURES }, global: { stubs: { transition: false } } })
    expect(wrapper.get('[role="status"]').text()).toBe('2기 표시')
    useSatelliteFilter().toggleCategory('military')
    await wrapper.vm.$nextTick()
    expect(wrapper.get('[role="status"]').text()).toBe('1기 표시')
  })

  it('상세에서 추적을 누르면 추적 위성을 바꾸고 관제로 이동한다', async () => {
    const wrapper = mount(SatelliteGallery, { props: { satellites: FIXTURES }, attachTo: document.body })
    await wrapper.get('button[aria-label="AEHF-1 (USA 214) 상세 정보"]').trigger('click')
    await flushPromises()
    const track = [...document.querySelectorAll('button')].find((button) => button.textContent?.includes('관제 화면에서 추적'))!
    expect(document.body.textContent).toContain('군 위성통신')
    track.click()
    expect(useTracking().trackedId).toBe(36868)
    expect(push).toHaveBeenCalledWith('/control')
    wrapper.unmount()
  })
})
