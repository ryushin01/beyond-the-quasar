import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'

import TargetList from './TargetList.vue'

describe('TargetList', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('종류로 거르고 퀘이사를 고를 수 있다', async () => {
    const wrapper = mount(TargetList, { props: { date: new Date('2026-11-06T13:00:00Z'), selectedId: 'm31' } })
    await wrapper.findAll('button').find((button) => button.text() === '퀘이사')!.trigger('click')
    expect(wrapper.findAll('li')).toHaveLength(3)
    await wrapper.findAll('li button').find((button) => button.text().includes('3C 273'))!.trigger('click')
    expect(wrapper.emitted('select')?.[0]).toEqual(['3c273'])
  })

  it('지평선 아래인 대상을 글자로 알린다', () => {
    // 대전에서 12시 UTC 근처 3C 273(RA 12h)은 지평선 아래
    const wrapper = mount(TargetList, { props: { date: new Date('2026-11-06T13:00:00Z'), selectedId: 'm31' } })
    expect(wrapper.findAll('li button').find((button) => button.text().includes('3C 273'))!.text()).toContain('지평선 아래')
  })
})
