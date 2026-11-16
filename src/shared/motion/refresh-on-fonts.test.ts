import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'

import { ScrollTrigger } from './gsap'
import { useRefreshOnFontsLoaded } from './refresh-on-fonts'

describe('useRefreshOnFontsLoaded', () => {
  const fonts = new EventTarget()
  beforeEach(() => {
    vi.useFakeTimers()
    Object.defineProperty(document, 'fonts', { configurable: true, value: fonts })
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    Reflect.deleteProperty(document, 'fonts')
  })

  it('글꼴 묶음을 다 받으면(여러 번 와도 한 번) 스크롤 연출 위치를 다시 계산한다', () => {
    const refresh = vi.spyOn(ScrollTrigger, 'refresh').mockImplementation(() => {})
    const wrapper = mount(defineComponent({ setup: () => (useRefreshOnFontsLoaded(), () => h('div')) }))
    for (let i = 0; i < 3; i++) fonts.dispatchEvent(new Event('loadingdone'))
    expect(refresh).not.toHaveBeenCalled()
    vi.advanceTimersByTime(200)
    expect(refresh).toHaveBeenCalledOnce()
    // 컴포넌트가 사라지면 더 듣지 않습니다.
    wrapper.unmount()
    fonts.dispatchEvent(new Event('loadingdone'))
    vi.advanceTimersByTime(200)
    expect(refresh).toHaveBeenCalledOnce()
  })
})
