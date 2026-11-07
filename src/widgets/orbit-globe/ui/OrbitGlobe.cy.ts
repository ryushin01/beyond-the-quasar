import { FIXTURES } from '@/entities/satellite'

import OrbitGlobe from './OrbitGlobe.vue'

// jsdom에는 WebGL이 없어 단위 테스트는 대체 안내만 봅니다. 여기서는 실제 WebGL 장면이 만들어지는지 확인합니다.
describe('OrbitGlobe (실제 브라우저)', () => {
  it('WebGL 장면을 만들고, 대체 안내 없이 조작 버튼을 켠다', () => {
    cy.mount(OrbitGlobe, { props: { satellites: FIXTURES } })
    cy.get('button[aria-label="가까이"]').should('be.enabled')
    cy.contains('3D 화면을 그릴 수 없습니다').should('not.exist')
    cy.get('canvas[role="img"]').should(($canvas) => {
      const canvas = $canvas[0] as HTMLCanvasElement
      // 이미 만든 맥락을 돌려받으므로, 렌더러가 WebGL2로 그리는 중인지 알 수 있습니다.
      const gl = canvas.getContext('webgl2')
      expect(gl, 'WebGL2 맥락').not.to.equal(null)
      expect(gl!.isContextLost()).to.equal(false)
      expect(gl!.drawingBufferWidth).to.be.greaterThan(300)
    })
  })

  it('돌리기·확대 버튼과 밝은·어두운 화면 전환에서 오류 없이 동작한다', () => {
    cy.mount(OrbitGlobe, { props: { satellites: FIXTURES } })
    for (const name of ['왼쪽으로 돌리기', '오른쪽으로 돌리기', '가까이', '멀리']) {
      cy.get(`button[aria-label="${name}"]`).should('be.enabled').click()
    }
    cy.document().then((document) => {
      document.documentElement.dataset.theme = 'light'
    })
    cy.get('button[aria-label="가까이"]').click()
    cy.document().then((document) => {
      document.documentElement.dataset.theme = 'dark'
    })
  })

  it('화면을 닫으면 그리기를 멈춘다', () => {
    cy.mount(OrbitGlobe, { props: { satellites: FIXTURES } }).then(({ wrapper }) => {
      cy.get('button[aria-label="가까이"]').should('be.enabled')
      cy.window().then((win) => {
        const frames = cy.spy(win, 'requestAnimationFrame')
        // 닫기 전에는 장면이 프레임을 계속 예약합니다(비교 기준).
        cy.wait(200).then(() => {
          expect(frames.getCalls().some((call) => (call.args[0] as { name?: string }).name === 'render')).to.equal(true)
        })
        cy.wrap(null).then(() => wrapper.unmount())
        cy.wait(100).then(() => frames.resetHistory())
        // 닫은 뒤에는 장면이 새 프레임을 예약하지 않습니다. 다른 라이브러리의 프레임은 세지 않습니다.
        cy.wait(300).then(() => {
          const sceneFrames = frames.getCalls().filter((call) => (call.args[0] as { name?: string }).name === 'render')
          expect(sceneFrames).to.have.length(0)
        })
      })
    })
  })
})
