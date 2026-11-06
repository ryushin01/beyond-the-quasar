import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'

import SiteSelect from './SiteSelect.vue'

describe('SiteSelect', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('레이블과 선택된 관측지를 보여 준다', () => {
    const wrapper = mount(SiteSelect, { props: { label: '지상국' } })
    expect(wrapper.text()).toContain('지상국')
    expect(wrapper.text()).toContain('대전')
  })
})
