import { defineComponent, h } from 'vue'

import { useMotionPreference } from '@/shared/motion'

import EventStage from './EventStage.vue'

/** 무대는 부모 크기를 채우므로 높이를 준 틀 안에 띄웁니다. */
const Framed = defineComponent({
  props: { mix: { type: Number, default: 0 }, fall: { type: Number, default: 0 } },
  // CI 브라우저에는 GPU가 없으므로 소프트웨어 렌더링을 허용해 셰이더 컴파일을 확인합니다.
  setup: (props) => () => h('div', { style: 'position: relative; height: 480px' }, [h(EventStage, { mix: props.mix, fall: props.fall, allowSoftware: true })]),
})

const isLoop = (call: { args: unknown[] }): boolean => (call.args[0] as { name?: string }).name === 'loop'

// jsdom에는 WebGL이 없어 단위 테스트는 대체 화면만 봅니다. 여기서는 실제 셰이더가 컴파일되는지 확인합니다.
describe('EventStage (실제 브라우저)', () => {
  for (const [title, props] of [['입구 장면', { mix: 0 }], ['블랙홀 장면', { mix: 1 }], ['낙하 장면', { mix: 1, fall: 0.6 }]] as const) {
    it(`${title}을 대체 화면 없이 WebGL로 그린다`, () => {
      cy.mount(Framed, { props })
      // 무대는 한가할 때 켜지므로, 크기가 틀(480px)에 맞춰질 때까지 기다린 뒤 판정합니다.
      cy.get('.stage__canvas').should(($canvas) => {
        expect(($canvas[0] as HTMLCanvasElement).height, '셰이더 준비 후 크기 맞춤').to.be.greaterThan(300)
      })
      cy.get('.stage__fallback').should('not.exist')
      cy.get('.stage__canvas').should(($canvas) => {
        const gl = ($canvas[0] as HTMLCanvasElement).getContext('webgl')
        expect(gl, 'WebGL 맥락').not.to.equal(null)
        expect(gl!.isContextLost()).to.equal(false)
        expect(gl!.drawingBufferWidth).to.be.greaterThan(100)
      })
    })
  }

  it('화면을 닫으면 그리기를 멈춘다', () => {
    cy.mount(Framed, { props: { mix: 1 } }).then(({ wrapper }) => {
      cy.window().then((win) => {
        const frames = cy.spy(win, 'requestAnimationFrame')
        cy.wait(200).then(() => expect(frames.getCalls().some(isLoop)).to.equal(true))
        cy.wrap(null).then(() => wrapper.unmount())
        cy.wait(100).then(() => frames.resetHistory())
        cy.wait(300).then(() => expect(frames.getCalls().filter(isLoop)).to.have.length(0))
      })
    })
  })

  it('모션을 멈추면 연속 그리기를 하지 않는다', () => {
    // 헤더의 모션 정지 버튼과 같은 함수로 멈추고, 끝나면 되돌립니다.
    const motion = useMotionPreference()
    if (!motion.userPaused.value) motion.toggle()
    cy.mount(Framed, { props: { mix: 1 } })
    cy.window().then((win) => {
      const frames = cy.spy(win, 'requestAnimationFrame')
      cy.wait(400).then(() => expect(frames.getCalls().filter(isLoop)).to.have.length(0))
    })
    cy.wrap(null).then(() => {
      if (motion.userPaused.value) motion.toggle()
    })
  })
})
