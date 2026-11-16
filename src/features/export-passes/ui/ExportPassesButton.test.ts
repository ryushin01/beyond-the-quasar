import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { downloadText } from '@/shared/lib'

import ExportPassesButton from './ExportPassesButton.vue'

vi.mock('@/shared/lib', async (original) => ({ ...(await original<typeof import('@/shared/lib')>()), downloadText: vi.fn() }))

const pass = {
  aos: new Date('2026-11-16T10:02:00Z'),
  los: new Date('2026-11-16T10:09:00Z'),
  maxAt: new Date('2026-11-16T10:05:30Z'),
  maxElevation: 52.4,
  aosAzimuth: 312,
  losAzimuth: 145,
}

describe('ExportPassesButton', () => {
  afterEach(() => vi.mocked(downloadText).mockClear())

  it('통과마다 일정을 만들어 .ics로 내려받는다(맨눈 통과는 제목에 표시)', async () => {
    const download = vi.mocked(downloadText)
    const wrapper = mount(ExportPassesButton, {
      props: { items: [{ noradId: 25544, name: 'ISS (ZARYA)', passes: [pass, { ...pass, aos: new Date('2026-11-16T11:40:00Z'), visible: true }] }], siteName: '대전', filename: 'iss-passes.ics' },
    })
    expect(wrapper.text()).toContain('2회')
    await wrapper.trigger('click')
    const [filename, content, type] = download.mock.calls[0]!
    expect(filename).toBe('iss-passes.ics')
    expect(type).toContain('text/calendar')
    expect(content.match(/BEGIN:VEVENT/g)).toHaveLength(2)
    expect(content).toContain('UID:pass-25544-20261116T100200Z@beyond-the-quasar')
    expect(content).toContain('SUMMARY:ISS (ZARYA) 통과 · 최대 52°\r\n')
    expect(content).toContain('SUMMARY:ISS (ZARYA) 통과 · 최대 52° · 맨눈')
    expect(content).toContain('LOCATION:대전')
  })

  it('통과가 없으면 누를 수 없다', () => {
    const wrapper = mount(ExportPassesButton, { props: { items: [{ noradId: 1, name: 'X', passes: [] }], siteName: '대전', filename: 'x.ics' } })
    expect(wrapper.attributes('disabled')).toBeDefined()
  })
})
