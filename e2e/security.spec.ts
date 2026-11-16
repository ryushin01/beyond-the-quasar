import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { expect, test } from '@playwright/test'

// 운영(Vercel)과 같은 보안 헤더를 로컬 미리보기 응답에 입혀, 화면을 돌며 CSP 위반이 없는지 확인합니다.
// 헤더는 vercel.json에서 읽으므로 규칙을 바꾸면 이 테스트가 바로 그 규칙으로 검사합니다.
const vercel = JSON.parse(readFileSync(join(process.cwd(), 'vercel.json'), 'utf8')) as {
  headers: { source: string; headers: { key: string; value: string }[] }[]
}
const appHeaders = vercel.headers.find((rule) => rule.headers.some((header) => header.key === 'Content-Security-Policy'))!
const csp = appHeaders.headers.find((header) => header.key === 'Content-Security-Policy')!.value

test.use({ locale: 'ko-KR' })

test.beforeEach(async ({ page }) => {
  // HTML 응답에만 헤더를 붙입니다(브라우저는 문서의 CSP를 적용).
  await page.route('**/*', async (route) => {
    if (route.request().resourceType() !== 'document') return route.continue()
    const response = await route.fetch()
    await route.fulfill({ response, headers: { ...response.headers(), 'content-security-policy': csp } })
  })
  await page.addInitScript(() => {
    const store: string[] = []
    ;(window as unknown as { __cspViolations: string[] }).__cspViolations = store
    document.addEventListener('securitypolicyviolation', (event) => store.push(`${event.violatedDirective} ${event.blockedURI}`))
  })
})

const violations = (page: import('@playwright/test').Page) => page.evaluate(() => (window as unknown as { __cspViolations: string[] }).__cspViolations)

test('운영 CSP에서 화면과 주요 조작이 위반 없이 동작한다', async ({ page }) => {
  test.setTimeout(90_000)
  for (const path of ['/', '/control', '/catalog?view=globe', '/observatory', '/event', '/missing']) {
    await page.goto(path)
    await page.waitForLoadState('networkidle')
    expect(await violations(page), path).toEqual([])
  }
  // 우주 위협 패널: 브라우저가 NOAA로 직접 요청합니다(CSP connect-src 확인, 응답은 고정 값).
  await page.route('https://services.swpc.noaa.gov/**', (route) =>
    route.fulfill({
      json: route.request().url().includes('scales')
        ? { '0': { DateStamp: '2026-11-16', TimeStamp: '00:00:00', R: { Scale: '0' }, S: { Scale: '0' }, G: { Scale: '0' } } }
        : [{ time_tag: '2026-11-16T00:00:00', Kp: 1 }],
    }),
  )
  await page.goto('/observatory')
  await page.locator('.observatory__hazards').scrollIntoViewIfNeeded()
  await expect(page.locator('.hazards__value').first()).toBeVisible()
  expect(await violations(page)).toEqual([])
  // 검색 팔레트(대화상자)·알림·셀렉트
  await page.goto('/control')
  await page.getByRole('button', { name: /검색/ }).first().click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await page.getByRole('tab', { name: '명령' }).click()
  await page.getByRole('button', { name: '명령 전송' }).click()
  await expect(page.locator('.q-notification')).toBeVisible()
  expect(await violations(page)).toEqual([])
})

test('보안 헤더 규칙: 앱에는 CSP·Permissions-Policy, Histoire 문서는 제외', () => {
  expect(appHeaders.source).toBe('/((?!histoire/).*)')
  expect(csp).toContain("script-src 'self'")
  expect(csp).toContain("frame-ancestors 'none'")
  expect(appHeaders.headers.find((header) => header.key === 'Permissions-Policy')?.value).toContain('geolocation=(self)')
})
