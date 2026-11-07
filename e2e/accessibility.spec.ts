import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const PAGES = [
  { path: '/', title: /Beyond the Quasar/ },
  { path: '/control', title: /위성 관제/ },
  { path: '/catalog', title: /위성 카탈로그/ },
  { path: '/observatory', title: /천체 관측/ },
  { path: '/missing', title: /찾을 수 없음/ },
]

test.use({ reducedMotion: 'reduce', locale: 'ko-KR' })

for (const { path, title } of PAGES) {
  test(`${path}: 제목, 언어, axe 검사`, async ({ page }) => {
    await page.goto(path)
    await expect(page).toHaveTitle(title)
    await expect(page.locator('html')).toHaveAttribute('lang', 'ko')
    await expect(page.locator('h1')).toHaveCount(1)
    await page.waitForLoadState('networkidle')
    const results = await new AxeBuilder({ page }).analyze()
    expect(results.violations.map((item) => `${item.id}: ${item.nodes[0]?.target}`)).toEqual([])
  })

  test(`${path}: 밝은 화면 axe 검사`, async ({ page }) => {
    await page.goto(path)
    await page.getByRole('button', { name: '밝은 화면으로 전환' }).click()
    await page.waitForLoadState('networkidle')
    const results = await new AxeBuilder({ page }).analyze()
    expect(results.violations.map((item) => `${item.id}: ${item.nodes[0]?.target}`)).toEqual([])
  })
}

test('본문 바로가기는 첫 탭에서 보이고 본문으로 초점을 옮긴다', async ({ page }) => {
  await page.goto('/catalog')
  await page.keyboard.press('Tab')
  const skip = page.getByRole('link', { name: '본문 바로가기' })
  await expect(skip).toBeFocused()
  await expect(skip).toBeInViewport()
  await page.keyboard.press('Enter')
  await expect(page.locator('main')).toBeFocused()
})

test('언어를 바꾸면 lang과 제목이 함께 바뀐다', async ({ page }) => {
  await page.goto('/control')
  await page.getByRole('button', { name: 'Switch to English' }).click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page).toHaveTitle(/Control/)
})

test('/catalog?view=orbit: 궤도 분포도 axe 검사', async ({ page }) => {
  await page.goto('/catalog?view=orbit')
  await page.waitForLoadState('networkidle')
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations.map((item) => `${item.id}: ${item.nodes[0]?.target}`)).toEqual([])
})

test('/catalog?view=globe: 3D 궤도 axe 검사', async ({ page }) => {
  await page.goto('/catalog?view=globe')
  await expect(page.getByRole('button', { name: '가까이' })).toBeEnabled()
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations.map((item) => `${item.id}: ${item.nodes[0]?.target}`)).toEqual([])
})

test('검색 팔레트 axe 검사', async ({ page }) => {
  await page.goto('/control')
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: '검색', exact: true }).click()
  await expect(page.getByRole('combobox', { name: '위성과 화면 검색' })).toBeFocused()
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations.map((item) => `${item.id}: ${item.nodes[0]?.target}`)).toEqual([])
})

test('일정 탭 axe 검사', async ({ page }) => {
  await page.goto('/control')
  await page.getByRole('tab', { name: '일정' }).click()
  await expect(page.locator('.schedule__row').first()).toBeVisible()
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations.map((item) => `${item.id}: ${item.nodes[0]?.target}`)).toEqual([])
})

for (const theme of ['어두운', '밝은']) {
  test(`홈 진행 바와 관제·관측 구역 ${theme} 화면 axe 검사`, async ({ page }) => {
    await page.goto('/')
    if (theme === '밝은') await page.getByRole('button', { name: '밝은 화면으로 전환' }).click()
    await page.locator('#stop-axes').scrollIntoViewIfNeeded()
    await page.locator('#stop-axes').evaluate((node) => window.scrollTo(0, node.getBoundingClientRect().top + window.scrollY))
    await expect(page.locator('.progress')).toHaveClass(/progress--shown/)
    await expect.poll(() => page.locator('.progress').evaluate((node) => getComputedStyle(node).opacity)).toBe('1')
    const results = await new AxeBuilder({ page }).include('.progress').include('#stop-axes').analyze()
    expect(results.violations.map((item) => `${item.id}: ${item.nodes[0]?.target}`)).toEqual([])
  })
}

test('위성 상세의 임무 도식 axe 검사', async ({ page }) => {
  await page.goto('/catalog')
  await page.getByRole('button', { name: /AEHF-1 .* 상세 정보/ }).click()
  await page.getByRole('dialog').getByText('실제 형상 아님').waitFor()
  const results = await new AxeBuilder({ page }).include('[role="dialog"]').analyze()
  expect(results.violations.map((item) => `${item.id}: ${item.nodes[0]?.target}`)).toEqual([])
})
