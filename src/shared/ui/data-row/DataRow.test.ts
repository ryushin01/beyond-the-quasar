import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import DataRow from './DataRow.vue'

describe('DataRow', () => {
  it('값이 없으면 대시를 표시한다', () => {
    expect(mount(DataRow, { props: { label: '고도' } }).get('dd').text()).toBe('—')
  })

  it('레이블과 값을 dt, dd로 표시한다', () => {
    const wrapper = mount(DataRow, { props: { label: '고도', value: '418 km' } })
    expect(wrapper.get('dt').text()).toBe('고도')
    expect(wrapper.get('dd').text()).toBe('418 km')
  })
})
