import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'

import { i18n } from '@/shared/i18n'

import SitePreferences from './SitePreferences.vue'

describe('SitePreferences', () => {
  afterEach(() => {
    i18n.global.locale.value = 'ko'
    localStorage.clear()
  })

  it('언어를 전환하면 다음 전환 대상의 이름으로 바뀐다', async () => {
    const wrapper = mount(SitePreferences)
    const button = wrapper.get('button[lang="en"]')
    expect(button.attributes('aria-label')).toBe('EN, Switch to English')
    await button.trigger('click')
    expect(i18n.global.locale.value).toBe('en')
    expect(wrapper.get('button[lang="ko"]').attributes('aria-label')).toBe('KO, 한국어로 전환')
  })

  it('테마를 data-theme으로 반영하고 저장한다', async () => {
    const wrapper = mount(SitePreferences)
    expect(document.documentElement.dataset.theme).toBe('dark')
    await wrapper.get('button[aria-label="밝은 화면으로 전환"]').trigger('click')
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(localStorage.getItem('btq:theme')).toBe('"light"')
  })

  it('모션 정지 버튼이 상태를 알린다', async () => {
    const wrapper = mount(SitePreferences)
    const button = wrapper.get('button[aria-label="모션 정지"]')
    expect(button.attributes('aria-pressed')).toBe('false')
    await button.trigger('click')
    expect(document.documentElement.dataset.motion).toBe('off')
    await wrapper.get('button[aria-label="모션 재생"]').trigger('click')
  })
})
