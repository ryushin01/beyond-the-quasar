import { describe, expect, it } from 'vitest'

import { findSnapshotProblem } from './snapshot-guard.mjs'

const enough = Array.from({ length: 120 }, (_, index) => ({ category: index === 0 ? 'military' : 'science' }))

describe('findSnapshotProblem', () => {
  it('요청이 하나라도 실패하면 위성 수가 충분해도 막는다', () => {
    expect(findSnapshotProblem(enough, ['500 gp.php?NAME=AEHF'])).toContain('요청 실패 1건')
  })

  it('위성이 너무 적거나 군사 위성이 없으면 막는다', () => {
    expect(findSnapshotProblem(enough.slice(0, 50), [])).toContain('너무 적습니다')
    expect(findSnapshotProblem(enough.slice(1), [])).toContain('군사 위성')
  })

  it('문제가 없으면 null이다', () => {
    expect(findSnapshotProblem(enough, [])).toBeNull()
  })
})
