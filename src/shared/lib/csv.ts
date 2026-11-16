/**
 * 쉼표·따옴표·줄바꿈이 든 칸은 따옴표로 감싸고 안의 따옴표는 두 번 씁니다.
 * `=`·`+`·`-`·`@`·탭·CR로 시작하는 글은 표 프로그램이 수식으로 실행할 수 있어 앞에 작은따옴표를 붙여 글자로 둡니다(CSV 수식 주입 방지).
 * 숫자 값은 그대로 둡니다.
 */
const cell = (value: string | number): string => {
  const text = typeof value === 'string' && /^[=+\-@\t\r]/.test(value) ? `'${value}` : String(value)
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/** 표를 CSV로. 엑셀에서 한글이 깨지지 않도록 BOM을 붙이고 줄 끝은 CRLF입니다. */
export function toCsv(rows: (string | number)[][]): string {
  return `\uFEFF${rows.map((row) => row.map(cell).join(',')).join('\r\n')}\r\n`
}
