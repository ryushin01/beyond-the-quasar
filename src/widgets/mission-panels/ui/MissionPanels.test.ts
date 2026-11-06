import { VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'

import { useMissionClock } from '@/entities/clock'
import { AEHF_FIXTURE, FIXTURES, ISS_FIXTURE } from '@/entities/satellite'

import MissionPanels from './MissionPanels.vue'

function mountPanels(satellite = ISS_FIXTURE) {
  return mount(MissionPanels, { props: { satellite, satellites: FIXTURES }, global: { plugins: [VueQueryPlugin] } })
}

async function openTab(wrapper: ReturnType<typeof mountPanels>, label: string): Promise<void> {
  await wrapper.findAll('[role="tab"]').find((tab) => tab.text() === label)!.trigger('click')
  await flushPromises()
}

describe('MissionPanels', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    useMissionClock().now = new Date('2026-11-05T12:00:00Z')
  })

  it('통과 예측을 캡션과 머리글이 있는 표로 보여 준다', () => {
    const wrapper = mountPanels()
    expect(wrapper.get('caption').text()).toContain('대전')
    expect(wrapper.findAll('thead th[scope="col"]')).toHaveLength(4)
    expect(wrapper.findAll('tbody tr').length).toBeGreaterThan(0)
  })

  it('정지궤도 위성은 통과 대신 안내를 보여 준다', () => {
    expect(mountPanels(AEHF_FIXTURE).text()).toContain('정지궤도 위성은')
  })

  it('명령 탭에서 전송 양식을 연다', async () => {
    const wrapper = mountPanels()
    await openTab(wrapper, '명령')
    expect(wrapper.text()).toContain('실제 위성으로 전송되지 않습니다')
  })

  it('근접 탭은 자신을 빼고 거리를 계산하며 한계를 안내한다', async () => {
    const wrapper = mountPanels()
    await openTab(wrapper, '근접')
    expect(wrapper.findAll('tbody tr')).toHaveLength(1)
    expect(wrapper.get('tbody th').text()).toContain('AEHF-1')
    expect(wrapper.text()).toContain('충돌 판단에 쓸 수 없습니다')
  })

  it('상공 탭은 군사 위성 수를 따로 보여 준다', async () => {
    const wrapper = mountPanels()
    await openTab(wrapper, '상공 현황')
    expect(wrapper.text()).toMatch(/군사 \d+기/)
  })
})
