import { useMissionClock } from '@/entities/clock'
import { FIXTURES, ISS_FIXTURE } from '@/entities/satellite'

import { canvasPrint } from '../../../../cypress/support/canvas'
import GroundTrackMap from './GroundTrackMap.vue'

// jsdom에는 2D 캔버스가 없어 단위 테스트는 글 요약과 버튼만 봅니다. 여기서는 실제로 그려지는지 확인합니다.
describe('GroundTrackMap (실제 브라우저)', () => {
  beforeEach(() => {
    cy.mount(GroundTrackMap, { props: { satellites: FIXTURES, tracked: ISS_FIXTURE } }).then(() => {
      // 시각을 멈춰, 확대·전환 말고는 그림이 바뀌지 않게 합니다.
      const clock = useMissionClock()
      clock.now = new Date('2026-11-05T12:00:00Z')
      clock.paused = true
    })
  })

  it('대륙, 궤적, 위성을 캔버스에 그린다', () => {
    cy.get('canvas[role="img"]').should(($canvas) => {
      expect(canvasPrint($canvas[0] as HTMLCanvasElement).painted).to.be.greaterThan(5000)
    })
  })

  it('확대 버튼과 지도 방식 버튼이 그림을 바꾼다', () => {
    let before = 0
    cy.get('canvas[role="img"]')
      .should(($canvas) => expect(canvasPrint($canvas[0] as HTMLCanvasElement).painted).to.be.greaterThan(5000))
      .then(($canvas) => {
        before = canvasPrint($canvas[0] as HTMLCanvasElement).hash
      })
    cy.get('button[aria-label="지도 확대"]').click()
    cy.get('canvas[role="img"]').should(($canvas) => expect(canvasPrint($canvas[0] as HTMLCanvasElement).hash).not.to.equal(before))

    cy.get('canvas[role="img"]').then(($canvas) => {
      before = canvasPrint($canvas[0] as HTMLCanvasElement).hash
    })
    cy.contains('button', '지구본').click().should('have.attr', 'aria-pressed', 'true')
    cy.get('canvas[role="img"]').should(($canvas) => expect(canvasPrint($canvas[0] as HTMLCanvasElement).hash).not.to.equal(before))
  })
})
