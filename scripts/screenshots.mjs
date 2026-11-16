// README 화면(docs/images/*.jpg)을 다시 찍습니다.
// 먼저 사이트를 빌드해 띄워 두세요: bun run build:site && bun run preview
// 사용: BASE_URL=http://localhost:4173 bun run screenshots
import { chromium } from '@playwright/test'

const BASE = process.env.BASE_URL ?? 'http://localhost:4173'
const OUT = 'docs/images'
// WebGL(블랙홀·궤도 지구본)이 그려지도록 소프트웨어 렌더러를 켭니다.
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })

const DESKTOP = { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }
const MOBILE = { viewport: { width: 393, height: 800 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }

async function open(path, device = DESKTOP, site) {
  const context = await browser.newContext({ ...device, locale: 'ko-KR', colorScheme: 'dark' })
  const page = await context.newPage()
  await page.addInitScript((id) => {
    localStorage.setItem('btq:locale', JSON.stringify('ko'))
    if (id) localStorage.setItem('btq:site', JSON.stringify(id))
  }, site)
  await page.goto(BASE + path, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)
  return { page, context }
}

const shot = async (target, name) => {
  await target.screenshot({ path: `${OUT}/${name}.jpg`, type: 'jpeg', quality: 82 })
  console.log('저장', name)
}

/** 홈의 구역(#stop-*) 진행도(0~1)에 맞춰 스크롤합니다. */
async function stop(page, id, ratio) {
  await page.evaluate(
    ([sid, r]) => {
      const el = document.getElementById(sid)
      const top = el.getBoundingClientRect().top + window.scrollY
      window.scrollTo({ top: top + Math.max(0, el.offsetHeight - window.innerHeight) * r, behavior: 'instant' })
    },
    [id, ratio],
  )
  await page.waitForTimeout(2200)
}

/** 이벤트 화면의 장(#event-*)을 화면 맨 위에 둡니다. */
async function chapter(page, id) {
  await page.evaluate((cid) => {
    const el = document.getElementById(cid)
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY, behavior: 'instant' })
  }, id)
  await page.waitForTimeout(4000)
}

// 홈
{
  const { page, context } = await open('/')
  await shot(page, 'home-hero')
  await stop(page, 'stop-sky', 0)
  await shot(page, 'home-sky')
  await stop(page, 'stop-assets', 0.55)
  await shot(page, 'home-plates')
  await stop(page, 'stop-axes', 0.5)
  await shot(page, 'home-axes')
  // Histoire 바로가기: 워프 전환 중간
  await stop(page, 'stop-board', 1)
  await page.getByRole('link', { name: /Histoire/ }).click()
  await page.waitForTimeout(900)
  await shot(page, 'histoire-warp')
  await context.close()
}

// 이벤트: 입구와 사건의 지평선
{
  const { page, context } = await open('/event')
  await shot(page, 'event-entrance')
  await chapter(page, 'event-horizon')
  await shot(page, 'event-horizon')
  await context.close()
}

// 관측소: 하늘 지도, 일식·월식 망원경 시야
{
  const { page, context } = await open('/observatory')
  // 하늘 지도와 대상 목록이 화면을 채우게
  await page.evaluate(() => {
    const sky = document.querySelector('.observatory__sky')
    window.scrollTo({ top: sky.getBoundingClientRect().top + window.scrollY - 16, behavior: 'instant' })
  })
  await page.waitForTimeout(2000)
  await shot(page, 'observatory')
  await context.close()
}
// 관측소: 우주 위협 패널(NOAA 실시간 + JPL 주간 스냅샷)
{
  const { page, context } = await open('/observatory')
  const panel = page.locator('.observatory__hazards')
  await panel.scrollIntoViewIfNeeded()
  await page.waitForTimeout(4000)
  await shot(panel, 'hazards')
  await context.close()
}
for (const [name, query, site] of [
  ['eclipse-solar', 'event=solarEclipse&at=2027-02-06T16:00:00Z', 'atacama'],
  ['eclipse-lunar', 'event=lunarEclipse&at=2028-12-31T16:00:00Z', 'daejeon'],
]) {
  const { page, context } = await open(`/observatory?${query}`, DESKTOP, site)
  await shot(page.locator('.observatory__eclipse'), name)
  await context.close()
}

// 관제: 군사 필터 + 추적 중인 위성, 지구본
{
  const { page, context } = await open('/control')
  const roster = page.getByRole('region', { name: '위성 목록' })
  await roster.getByRole('button', { name: /^군사/ }).click()
  await roster.locator('.roster__item').first().click()
  await page.waitForTimeout(2000)
  await shot(page, 'control-map')
  await page.getByRole('button', { name: '지구본' }).click()
  await page.waitForTimeout(3000)
  await shot(page, 'control-globe')
  // 검색 팔레트
  await page.getByRole('button', { name: /^검색/ }).click()
  await page.keyboard.type('GPS')
  await page.waitForTimeout(1200)
  await shot(page, 'palette')
  await context.close()
}

// 관제: 통과 예측(맨눈 표시와 달력 내보내기). 대전의 저녁(18시)으로 시계를 맞춰 맨눈으로 보이는 통과가 나오게 합니다.
{
  const context = await browser.newContext({ ...DESKTOP, viewport: { width: 1440, height: 1300 }, locale: 'ko-KR', colorScheme: 'dark' })
  const page = await context.newPage()
  await page.addInitScript(() => {
    localStorage.setItem('btq:locale', JSON.stringify('ko'))
    // 시계를 고정하면 첫 방문 프리로더가 끝나지 않으므로 건너뜁니다.
    sessionStorage.setItem('btq:intro-seen', '1')
  })
  const evening = new Date()
  evening.setUTCHours(9, 0, 0, 0)
  await page.clock.setFixedTime(evening)
  await page.goto(`${BASE}/control`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(3000)
  // 탭부터 내보내기 링크까지만 담습니다(아래 빈 칸 제외).
  const top = await page.locator('.panels').boundingBox()
  const bottom = await page.locator('.panels__actions').boundingBox()
  await page.screenshot({
    path: `${OUT}/control-passes.jpg`,
    type: 'jpeg',
    quality: 82,
    clip: { x: top.x, y: top.y, width: top.width, height: bottom.y + bottom.height + 8 - top.y },
  })
  console.log('저장', 'control-passes')
  await context.close()
}

// 카탈로그: 군사 위성 플레이트, 상세, 궤도 분포도, 3D 궤도
{
  const { page, context } = await open('/catalog?category=military')
  await shot(page, 'catalog')
  await page.getByRole('button', { name: 'SBIRS GEO-1 (USA 230) 상세 정보' }).click()
  await page.waitForTimeout(1500)
  await shot(page, 'catalog-detail')
  await context.close()
}
{
  const { page, context } = await open('/catalog?category=military&view=orbit')
  // 군사 위성 점 하나에 포인터를 올려 말풍선을 띄웁니다.
  const box = await page.locator('.scatter__point--mil').nth(8).boundingBox()
  if (box) await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.waitForTimeout(1000)
  await shot(page, 'orbit-map')
  await context.close()
}
{
  const { page, context } = await open('/catalog?category=military&view=globe')
  await page.waitForTimeout(3000)
  await shot(page, 'orbit-globe')
  await context.close()
}

// 모바일
{
  const { page, context } = await open('/', MOBILE)
  await shot(page, 'mobile-home')
  await stop(page, 'stop-sky', 0)
  await shot(page, 'mobile-sky')
  await context.close()
}
{
  const { page, context } = await open('/control', MOBILE)
  // 지상 궤적 지도가 위에 오게
  await page.getByText('지상 궤적 지도').first().evaluate((el) => {
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: 'instant' })
  })
  await page.waitForTimeout(1500)
  await shot(page, 'mobile-control')
  await context.close()
}
{
  const { page, context } = await open('/event', MOBILE)
  await chapter(page, 'event-horizon')
  await shot(page, 'mobile-event')
  await context.close()
}

await browser.close()
