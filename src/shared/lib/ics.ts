export interface CalendarEvent {
  uid: string
  start: Date
  end: Date
  title: string
  description?: string
  location?: string
}

/** iCalendar 날짜(UTC): 20261116T052600Z */
export const icsDate = (date: Date): string => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

/** 글 값의 역슬래시·쉼표·세미콜론·줄바꿈을 RFC 5545 방식으로 이스케이프합니다. */
export const icsText = (text: string): string => text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')

/** 한 줄이 75바이트(UTF-8)를 넘으면 접습니다. 이어지는 줄은 공백 하나로 시작합니다(멀티바이트 글자는 자르지 않음). */
export function foldLine(line: string): string {
  const encoder = new TextEncoder()
  const parts: string[] = []
  let current = ''
  let bytes = 0
  for (const char of line) {
    const size = encoder.encode(char).length
    const limit = parts.length === 0 ? 75 : 74
    if (bytes + size > limit) {
      parts.push(current)
      current = ''
      bytes = 0
    }
    current += char
    bytes += size
  }
  parts.push(current)
  return parts.join('\r\n ')
}

/** 일정 목록을 .ics 문서로 만듭니다(줄 끝은 CRLF). */
export function toIcs(events: CalendarEvent[], { productId, now = new Date() }: { productId: string; now?: Date }): string {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', `PRODID:${productId}`, 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH']
  for (const event of events) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${event.uid}`,
      `DTSTAMP:${icsDate(now)}`,
      `DTSTART:${icsDate(event.start)}`,
      `DTEND:${icsDate(event.end)}`,
      `SUMMARY:${icsText(event.title)}`,
    )
    if (event.description) lines.push(`DESCRIPTION:${icsText(event.description)}`)
    if (event.location) lines.push(`LOCATION:${icsText(event.location)}`)
    lines.push('END:VEVENT')
  }
  lines.push('END:VCALENDAR')
  return `${lines.map(foldLine).join('\r\n')}\r\n`
}
