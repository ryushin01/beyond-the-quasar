import { expect, test } from '@playwright/test'

const PATHS = ['/', '/control', '/catalog', '/observatory', '/missing']

for (const mode of ['reduce', 'no-preference'] as const) {
  test.describe(`모션 ${mode}`, () => {
    test.use({ reducedMotion: mode, locale: 'ko-KR' })

    for (const path of PATHS) {
      test(`${path}: 가로로 넘치지 않는다`, async ({ page }) => {
        await page.goto(path)
        await page.waitForTimeout(mode === 'reduce' ? 300 : 2800)
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
        expect(overflow).toBeLessThanOrEqual(0)
      })
    }
  })
}

test.describe('첫 화면', () => {
  test.use({ reducedMotion: 'no-preference', locale: 'ko-KR' })

  test('프리로더가 끝나면 제목이 보이고 다음 방문에는 생략한다', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.loader')).toBeAttached()
    await expect(page.locator('.loader')).toHaveCount(0, { timeout: 6000 })
    await expect(page.locator('.hero__char').first()).toBeInViewport()
    await page.reload()
    await expect(page.locator('.loader')).toHaveCount(0)
  })

  test('모션 정지를 누르면 장식 움직임을 멈추고 설정이 유지된다', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: '모션 정지' }).click()
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'off')
    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'off')
    await expect(page.getByRole('button', { name: '모션 재생' })).toBeVisible()
  })
})

test.describe('헤더', () => {
  test.use({ reducedMotion: 'no-preference', locale: 'ko-KR' })

  test('스크롤해도 문서 높이와 위치가 밀리지 않는다', async ({ page }) => {
    await page.goto('/catalog')
    await page.getByRole('button', { name: /AEHF-1 .* 상세 정보/ }).waitFor()
    const height = await page.evaluate(() => document.documentElement.scrollHeight)
    await page.evaluate(() => window.scrollTo(0, 900))
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(900)
    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(height)
  })
})

test.describe('동작 줄이기', () => {
  test.use({ reducedMotion: 'reduce', locale: 'ko-KR' })

  test('프리로더 없이 내용이 바로 보이고 선언문이 읽힌다', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.loader')).toHaveCount(0)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Beyond The Quasar')
    const opacity = await page.locator('.manifesto__word').first().evaluate((node) => getComputedStyle(node).opacity)
    expect(opacity).toBe('1')
  })
})
