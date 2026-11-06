import { VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useCommandLog } from '../model/commands'
import UplinkForm from './UplinkForm.vue'

function mountForm(rangeKm: number | null = 800) {
  return mount(UplinkForm, {
    props: { noradId: 25544, satelliteName: 'ISS', rangeKm },
    global: { plugins: [VueQueryPlugin] },
  })
}

describe('UplinkForm', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
    setActivePinia(createPinia())
  })
  afterEach(() => vi.useRealTimers())

  it('시뮬레이션임을 안내한다', () => {
    expect(mountForm().text()).toContain('실제 위성으로 전송되지 않습니다')
  })

  it('전송 중에는 다시 제출해도 한 번만 처리한다', async () => {
    const wrapper = mountForm()
    const log = useCommandLog()
    const form = wrapper.getComponent({ name: 'QForm' })
    form.vm.$emit('submit', new Event('submit'))
    await flushPromises()
    form.vm.$emit('submit', new Event('submit'))
    await flushPromises()
    await vi.advanceTimersByTimeAsync(5000)
    await flushPromises()
    expect(log.entries).toHaveLength(1)
    expect(log.entries[0]?.state).toBe('ack')
  })

  it('교신 범위 밖이면 대기로 기록한다', async () => {
    const wrapper = mountForm(null)
    const log = useCommandLog()
    wrapper.getComponent({ name: 'QForm' }).vm.$emit('submit', new Event('submit'))
    await vi.advanceTimersByTimeAsync(1000)
    await flushPromises()
    expect(log.entries[0]?.state).toBe('queued')
  })
})
