import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

// 포트폴리오 화면은 외부 서비스가 끊겨도 내용과 함께 떠야 합니다.
// localhost 밖으로 나가는 요청을 모두 끊고(오프라인·차단과 같은 상황), .env 없이 만든 빌드로 모든 화면을 돌아봅니다.
const isLocal = (url: URL) => url.hostname === 'localhost' || url.hostname === '127.0.0.1'
// 색 대비는 프로젝트 방침(디자인 우선)으로 accessibility.spec.ts와 같이 뺍니다.
const axe = (page: Page) => new AxeBuilder({ page }).disableRules(['color-contrast'])
const violations = async (page: Page) => (await axe(page).analyze()).violations.map((item) => `${item.id}: ${item.nodes[0]?.target}`)

test.use({ reducedMotion: 'reduce', locale: 'ko-KR' })

let blocked: string[]
let pageErrors: string[]

test.beforeEach(async ({ context, page }) => {
  blocked = []
  pageErrors = []
  await context.route((url) => !isLocal(url), (route) => {
    blocked.push(route.request().url())
    return route.abort('internetdisconnected')
  })
  page.on('pageerror', (error) => pageErrors.push(error.message))
})

test.afterEach(() => {
  expect(pageErrors, '처리하지 못한 오류').toEqual([])
})

const SCREENS = [
  { path: '/', heading: /Beyond the Quasar|쿼사르/ },
  { path: '/control?sat=25544', heading: /위성 관제/ },
  { path: '/catalog', heading: /위성 카탈로그/ },
  { path: '/observatory', heading: /천체 관측/ },
  { path: '/event', heading: /사건의 지평선/ },
]

for (const { path, heading } of SCREENS) {
  test(`오프라인 ${path}: 내용과 함께 뜨고 axe 위반이 없다`, async ({ page }) => {
    await page.goto(path)
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page).toHaveTitle(heading)
    await page.waitForLoadState('networkidle')
    // 오류 안내 없이 본문이 채워져 있어야 합니다.
    await expect(page.locator('main [role="alert"]')).toHaveCount(0)
    expect((await page.locator('main').innerText()).trim().length).toBeGreaterThan(100)
    expect(await violations(page)).toEqual([])
  })
}

test('오프라인 관제: 궤도 스냅샷으로 위성을 추적한다', async ({ page }) => {
  await page.goto('/control?sat=25544')
  await expect(page.getByText(/ISS/).first()).toBeVisible()
})

test('오프라인 카탈로그: 스냅샷의 위성 상세가 열린다', async ({ page }) => {
  await page.goto('/catalog?sat=25544')
  await expect(page.getByRole('dialog').getByRole('heading', { name: /ISS/ })).toBeVisible()
})

test('오프라인 관측: 우주 기상은 NOAA 대신 스냅샷으로 보이고 그렇다고 알린다', async ({ page }) => {
  await page.goto('/observatory')
  const hazards = page.locator('.observatory__hazards')
  await hazards.scrollIntoViewIfNeeded()
  await expect(hazards.getByRole('status').filter({ hasText: '오프라인 데이터로 표시 중' })).toBeVisible()
  await expect(hazards.locator('.hazards__value').first()).toBeVisible()
  await expect(hazards.getByRole('alert')).toHaveCount(0)
  // 소행성 접근은 저장소 스냅샷이라 표나 '접근 없음' 안내가 보입니다.
  await expect(hazards.locator('.hazards__neo table, .hazards__neo .hazards__state')).not.toHaveCount(0)
  expect(blocked.some((url) => url.includes('services.swpc.noaa.gov')), 'NOAA 요청을 실제로 막았는지').toBe(true)
  expect(await violations(page)).toEqual([])
})
