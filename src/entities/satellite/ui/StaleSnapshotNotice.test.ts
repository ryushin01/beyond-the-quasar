import { mount } from '@vue/test-utils'
import { expect, it } from 'vitest'

import StaleSnapshotNotice from './StaleSnapshotNotice.vue'

it('지난 날수를 상태 메시지로 알린다', () => {
  const wrapper = mount(StaleSnapshotNotice, { props: { days: 14 } })
  expect(wrapper.attributes('role')).toBe('status')
  expect(wrapper.text()).toContain('14일')
})
