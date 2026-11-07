/** 2D 캔버스에 그려진 화소의 지문과, 바탕이 아닌(불투명한) 화소 수를 구합니다. */
export function canvasPrint(canvas: HTMLCanvasElement): { hash: number; painted: number } {
  const context = canvas.getContext('2d')
  if (!context) throw new Error('2D 캔버스가 아닙니다')
  const { data } = context.getImageData(0, 0, canvas.width, canvas.height)
  let hash = 2166136261
  let painted = 0
  for (let index = 0; index < data.length; index += 4) {
    if ((data[index + 3] as number) > 0) painted += 1
    // 모든 화소를 섞으면 느리므로 7번째마다 지문에 넣습니다.
    if (index % 28 === 0) hash = Math.imul(hash ^ ((data[index] as number) + ((data[index + 1] as number) << 8) + ((data[index + 3] as number) << 16)), 16777619)
  }
  return { hash: hash >>> 0, painted }
}
