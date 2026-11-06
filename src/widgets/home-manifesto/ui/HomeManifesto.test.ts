import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import HomeManifesto from './HomeManifesto.vue'

describe('HomeManifesto', () => {
  it('글자를 단어 단위로 나눠도 문장이 그대로 읽힌다', () => {
    const wrapper = mount(HomeManifesto)
    expect(wrapper.get('p').text().replace(/\s+/g, ' ')).toContain('오늘 밤 3C 273에서 도착한 빛은')
    expect(wrapper.findAll('.manifesto__word').length).toBeGreaterThan(10)
  })
})
