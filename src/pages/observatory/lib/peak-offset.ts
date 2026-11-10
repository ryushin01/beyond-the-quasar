type Translate = (key: string, values?: Record<string, unknown>) => string

/** 절정에서 몇 시간 몇 분 전·후인지 글로 바꿉니다. */
export function describePeakOffset(minutes: number, translate: Translate): string {
  if (minutes === 0) return translate('observatory.eclipse.atPeak')
  const absolute = Math.abs(minutes)
  const span = `${Math.floor(absolute / 60)}:${String(absolute % 60).padStart(2, '0')}`
  return translate(minutes < 0 ? 'observatory.eclipse.beforePeak' : 'observatory.eclipse.afterPeak', { span })
}
