import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'

import { useObservationLog } from '../model/log'
import ObservationLog from './ObservationLog.vue'

describe('ObservationLog', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('기록을 저장하고 삭제한다', async () => {
    const wrapper = mount(ObservationLog, { props: { targetName: '3C 273' } })
    const log = useObservationLog()
    await wrapper.get('textarea').setValue('맑음')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(log.entries[0]?.note).toBe('맑음')
    expect(wrapper.text()).toContain('3/5')
    await wrapper.get('button[aria-label="3C 273 기록 삭제"]').trigger('click')
    expect(log.entries).toHaveLength(0)
  })

  it('기록이 비어 있으면 저장하지 않고 오류를 보여 준다', async () => {
    const wrapper = mount(ObservationLog, { props: { targetName: '3C 273' } })
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(useObservationLog().entries).toHaveLength(0)
    expect(wrapper.text()).toContain('기록을 입력해 주세요.')
  })
})
