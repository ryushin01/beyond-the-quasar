import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import RouteShutter from './RouteShutter.vue'

describe('RouteShutter', () => {
  it('보조 기술에서 숨기고 포인터를 막지 않는다', () => {
    const wrapper = mount(RouteShutter)
    expect(wrapper.attributes('aria-hidden')).toBe('true')
    expect(wrapper.findAll('.shutter__col')).toHaveLength(8)
  })
})
