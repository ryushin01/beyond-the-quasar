import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'

import { FIXTURES } from '@/entities/satellite'

import SkyDome from './SkyDome.vue'

const date = new Date('2026-11-06T13:00:00Z')

describe('SkyDome', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('하늘 지도를 글로 요약한다', () => {
    const svg = mount(SkyDome, { props: { date, selectedId: 'm45', satellites: FIXTURES } }).get('svg')
    expect(svg.attributes('role')).toBe('img')
    expect(svg.attributes('aria-label')).toContain('대전')
  })

  it('지평선 위 대상만 그리고 누르면 선택 이벤트를 보낸다', async () => {
    const wrapper = mount(SkyDome, { props: { date, selectedId: 'm45', satellites: [] } })
    const targets = wrapper.findAll('.dome__target')
    expect(targets.length).toBeGreaterThan(0)
    expect(targets.length).toBeLessThan(12)
    await targets[0]!.trigger('click')
    expect(wrapper.emitted('select')).toHaveLength(1)
  })
})
