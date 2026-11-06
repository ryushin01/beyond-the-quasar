import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import TargetCursor from './TargetCursor.vue'

describe('TargetCursor', () => {
  it('장식이므로 보조 기술에서 숨긴다', () => {
    expect(mount(TargetCursor).get('.cursor').attributes('aria-hidden')).toBe('true')
  })
})
