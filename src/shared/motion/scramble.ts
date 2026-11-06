const GLYPHS = '01/\\<>[]+×—ABCDEFGHJKLMNPQRSTUVXYZ'

/**
 * 글자를 무작위 기호에서 원래 글자로 차례로 되돌립니다. 호버 효과용이며 표시 전용 요소에만 씁니다.
 * 반환값을 호출하면 즉시 중단합니다.
 */
export function scramble(element: HTMLElement, text: string, durationMs = 450): () => void {
  const start = performance.now()
  let frame = 0
  const step = (now: number): void => {
    const progress = Math.min(1, (now - start) / durationMs)
    const revealed = Math.floor(progress * text.length)
    let output = text.slice(0, revealed)
    for (let i = revealed; i < text.length; i += 1) {
      output += text[i] === ' ' ? ' ' : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
    }
    element.textContent = output
    if (progress < 1) frame = requestAnimationFrame(step)
  }
  frame = requestAnimationFrame(step)
  return () => {
    cancelAnimationFrame(frame)
    element.textContent = text
  }
}
