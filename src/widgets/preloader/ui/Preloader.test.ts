import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'

import { introDone } from '@/shared/motion'

import Preloader from './Preloader.vue'

describe('Preloader', () => {
  beforeEach(() => {
    introDone.value = false
    sessionStorage.clear()
  })

  it('이미 본 세션에서는 바로 끝낸다', () => {
    sessionStorage.setItem('btq:intro-seen', '1')
    const wrapper = mount(Preloader)
    expect(wrapper.find('.loader').exists()).toBe(false)
    expect(introDone.value).toBe(true)
  })

  it('처음이면 보조 기술에서 숨긴 막을 보여 준다', async () => {
    const wrapper = mount(Preloader)
    await wrapper.vm.$nextTick()
    expect(wrapper.get('.loader').attributes('aria-hidden')).toBe('true')
    expect(wrapper.findAll('.loader__cell')).toHaveLength(84)
  })
})
