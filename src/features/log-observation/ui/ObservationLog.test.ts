import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { downloadText } from '@/shared/lib'

import { useObservationLog } from '../model/log'
import ObservationLog from './ObservationLog.vue'

vi.mock('@/shared/lib', async (original) => ({ ...(await original<typeof import('@/shared/lib')>()), downloadText: vi.fn() }))

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

  it('기록을 CSV로 내보낸다(머리말, 관측지 이름, 쉼표가 든 메모)', async () => {
    const log = useObservationLog()
    log.add({ targetName: 'M42', siteId: 'daejeon', seeing: 4, note: '맑음, 바람 약함' })
    const wrapper = mount(ObservationLog, { props: { targetName: 'M42' } })
    await wrapper.get('button.log__export').trigger('click')
    const [filename, content, type] = vi.mocked(downloadText).mock.calls[0]!
    expect(filename).toMatch(/^observation-log-\d{4}-\d{2}-\d{2}\.csv$/)
    expect(type).toContain('text/csv')
    const lines = content.replace('\uFEFF', '').trim().split('\r\n')
    expect(lines[0]).toBe('기록 시각 (UTC),대상,관측지,시상 (1~5),메모')
    expect(lines[1]).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}Z,M42,대전,4,"맑음, 바람 약함"$/)
  })
})
