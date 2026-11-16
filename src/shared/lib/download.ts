/** 글을 파일로 내려받습니다. 서버를 거치지 않고 브라우저에서 바로 만듭니다. */
export function downloadText(filename: string, content: string, type: string): void {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  document.body.append(link)
  link.click()
  link.remove()
  // 내려받기가 시작된 뒤에 주소를 풉니다.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
