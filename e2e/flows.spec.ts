import { expect, test } from '@playwright/test'

test.use({ reducedMotion: 'reduce', locale: 'ko-KR' })

test.describe('위성 관제', () => {
  test('군사 필터로 좁히고 위성을 추적하면 원격 측정이 바뀐다', async ({ page }) => {
    await page.goto('/control')
    const roster = page.getByRole('region', { name: '위성 목록' })
    await roster.getByRole('button', { name: /^군사/ }).click()
    await roster.getByLabel('위성 검색').fill('AEHF-1')
    // 입력 지연이 끝나 목록이 한 줄로 줄어든 뒤 누릅니다.
    await expect(roster.locator('.roster__item')).toHaveCount(1)
    const item = roster.locator('.roster__item')
    await item.click()
    await expect(item).toHaveAttribute('aria-pressed', 'true')
    const telemetry = page.getByRole('region', { name: '원격 측정' })
    await expect(telemetry).toContainText('AEHF-1 (USA 214)')
    await expect(telemetry).toContainText('군 위성통신')
  })

  test('지도는 글 요약을 제공하고 지구본으로 바꿀 수 있다', async ({ page }) => {
    await page.goto('/control')
    await expect(page.getByRole('img', { name: /위성 \d+기를 표시/ })).toBeVisible()
    const globe = page.getByRole('button', { name: '지구본' })
    await globe.click()
    await expect(globe).toHaveAttribute('aria-pressed', 'true')
  })

  test('명령을 두 번 눌러도 한 번만 기록하고 안전 모드는 확인을 거친다', async ({ page }) => {
    await page.goto('/control')
    await page.getByRole('tab', { name: '명령' }).click()
    await expect(page.getByText('실제 위성으로 전송되지 않습니다')).toBeVisible()
    const send = page.getByRole('button', { name: '명령 전송' })
    await send.dblclick()
    const log = page.locator('.uplink__entry')
    await expect(log).toHaveCount(1, { timeout: 5000 })
    await page.waitForTimeout(1500)
    await expect(log).toHaveCount(1)

    await page.getByRole('combobox', { name: '명령' }).click()
    await page.getByRole('option', { name: '안전 모드' }).click()
    await send.click()
    await expect(page.getByRole('dialog', { name: '안전 모드 명령을 전송할까요?' })).toBeVisible()
    await page.getByRole('button', { name: '취소' }).click()
    await expect(log).toHaveCount(1)
  })

  test('배속을 올리면 가상 시각으로 표시되고 실시간으로 돌아온다', async ({ page }) => {
    await page.goto('/control')
    await page.getByRole('button', { name: '배속 600×' }).click()
    await expect(page.getByText('가상 시각')).toBeVisible()
    await page.getByRole('button', { name: '실시간으로 복귀' }).click()
    await expect(page.getByText('실시간', { exact: true })).toBeVisible()
  })
})

test.describe('위성 카탈로그', () => {
  test('홈의 분류 링크로 들어오면 그 분류만 보이고 상세에서 관제로 이어진다', async ({ page }) => {
    await page.goto('/catalog?category=military')
    const count = page.getByRole('status').first()
    await expect(count).toHaveText(/\d+기 표시/)
    await page.getByRole('button', { name: /SBIRS GEO-1 .* 상세 정보/ }).click()
    const dialog = page.getByRole('dialog', { name: '위성 정보' })
    await expect(dialog).toContainText('미사일 조기경보')
    await expect(dialog).toContainText('NORAD 번호')
    await dialog.getByRole('button', { name: '관제 화면에서 추적' }).click()
    await expect(page).toHaveURL(/\/control/)
    await expect(page.getByRole('region', { name: '원격 측정' })).toContainText('SBIRS GEO-1')
  })

  test('조건에 맞는 위성이 없으면 안내하고 초기화할 수 있다', async ({ page }) => {
    await page.goto('/catalog')
    await page.getByLabel('위성 검색').fill('존재하지않는위성')
    await expect(page.getByText('조건에 맞는 위성이 없습니다')).toBeVisible()
    await page.getByRole('button', { name: '필터 초기화' }).click()
    await expect(page.getByRole('status').first()).toHaveText(/1\d\d기 표시/)
  })
})

test.describe('천체 관측', () => {
  test('대상을 고르면 차트가 바뀌고 일지를 저장한다', async ({ page }) => {
    await page.goto('/observatory')
    await page.getByRole('button', { name: /M45 Pleiades/ }).click()
    await expect(page.getByRole('heading', { name: /고도 곡선 · M45/ })).toBeVisible()

    await page.getByRole('button', { name: '일지 저장' }).click()
    await expect(page.getByText('기록을 입력해 주세요.')).toBeVisible()
    await page.getByLabel('기록').fill('구름 없음')
    await page.getByRole('button', { name: '일지 저장' }).click()
    await expect(page.locator('.log__entry')).toContainText('구름 없음')
    await page.reload()
    await expect(page.locator('.log__entry')).toContainText('구름 없음')
  })

  test('관측지를 바꾸면 브리핑이 다시 계산된다', async ({ page }) => {
    await page.goto('/observatory')
    const before = await page.locator('.brief__time').first().textContent()
    await page.getByRole('combobox', { name: '관측지' }).click()
    await page.getByRole('option', { name: '아타카마' }).click()
    await expect(page.locator('.brief__time').first()).not.toHaveText(before ?? '')
  })
})

test.describe('화면 이동', () => {
  test.use({ reducedMotion: 'no-preference' })

  test('격자 전환을 지나 새 화면에 도착하면 본문으로 초점이 옮겨진다', async ({ page, isMobile }) => {
    test.skip(isMobile, '모바일은 메뉴 시험에서 다룹니다')
    await page.goto('/catalog')
    await page.getByRole('navigation', { name: '주요 메뉴' }).getByRole('link', { name: '천체 관측' }).click()
    await expect(page).toHaveURL(/observatory/)
    await expect(page.getByRole('heading', { level: 1, name: '천체 관측' })).toBeVisible()
    await expect(page.locator('main')).toBeFocused()
  })

  test('전환 막이 걷혀 새 화면을 누를 수 있고, 뒤로 가면 이전 스크롤 위치로 돌아온다', async ({ page, isMobile }) => {
    test.skip(isMobile, '모바일은 메뉴 시험에서 다룹니다')
    await page.goto('/catalog')
    await page.getByRole('button', { name: /AEHF-1 .* 상세 정보/ }).waitFor()
    await page.evaluate(() => window.scrollTo(0, 900))
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(800)
    const savedTop = await page.evaluate(() => window.scrollY)
    await page.getByRole('navigation', { name: '주요 메뉴' }).getByRole('link', { name: '위성 관제' }).click()
    await expect(page).toHaveURL(/control/)
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
    // 초점은 막이 걷히기 직전에 옮겨지므로, 그 뒤 모든 기둥이 접혔는지 확인합니다.
    await expect(page.locator('main')).toBeFocused()
    await expect
      .poll(
        () =>
          page.evaluate(() =>
            Math.max(...[...document.querySelectorAll('.shutter__col')].map((column) => new DOMMatrix(getComputedStyle(column).transform).d)),
          ),
        { timeout: 8000 },
      )
      .toBeLessThan(0.01)
    await page.goBack()
    await expect(page).toHaveURL(/catalog/)
    await expect.poll(async () => Math.abs((await page.evaluate(() => window.scrollY)) - savedTop), { timeout: 8000 }).toBeLessThanOrEqual(5)
  })

  test('모바일 메뉴는 대화상자로 열리고 링크로 이동한다', async ({ page, isMobile }) => {
    test.skip(!isMobile, '모바일 전용')
    await page.goto('/catalog')
    await page.getByRole('button', { name: '메뉴 열기' }).click()
    await page.getByRole('dialog', { name: '주요 메뉴' }).getByRole('link', { name: '위성 관제' }).click()
    await expect(page).toHaveURL(/control/)
  })
})

test.describe('임무 도구', () => {
  test('검색 팔레트를 단축키로 열어 위성을 찾으면 추적하고 주소에 남는다', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('Control+k')
    const input = page.getByRole('combobox', { name: '위성과 화면 검색' })
    await expect(input).toBeFocused()
    await input.fill('AEHF-1')
    await expect(page.getByRole('option', { name: /AEHF-1/ })).toHaveAttribute('aria-selected', 'true')
    await input.press('Enter')
    await expect(page).toHaveURL(/\/control\?sat=36868/)
    await expect(page.getByRole('region', { name: '원격 측정' })).toContainText('AEHF-1 (USA 214)')
  })

  test('관제 주소의 위성 번호로 바로 추적하고 없는 번호는 고친다', async ({ page }) => {
    await page.goto('/control?sat=36868')
    await expect(page.getByRole('region', { name: '원격 측정' })).toContainText('AEHF-1 (USA 214)')
    await page.goto('/control?sat=1')
    await expect(page).toHaveURL(/sat=36868/)
  })

  test('카탈로그 필터가 주소에 남고 새로고침해도 유지되며 상세도 링크로 열린다', async ({ page }) => {
    await page.goto('/catalog')
    await page.getByRole('button', { name: /^군사/ }).first().click()
    await expect(page).toHaveURL(/category=military/)
    const count = await page.locator('.gallery__item').count()
    await page.reload()
    await expect(page.getByRole('button', { name: /^군사/ }).first()).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('.gallery__item')).toHaveCount(count)
    await page.goto('/catalog?sat=25544')
    await expect(page.getByRole('dialog').getByRole('heading', { name: /ISS/ })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page).not.toHaveURL(/sat=/)
  })

  test('관심 위성은 새로고침 뒤에도 남고 일정 탭에 함께 나온다', async ({ page }) => {
    await page.goto('/control?sat=25544')
    await page.getByRole('button', { name: 'AEHF-1 (USA 214) 관심 위성 표시' }).click()
    await page.reload()
    await expect(page.getByRole('button', { name: 'AEHF-1 (USA 214) 관심 위성 표시' })).toHaveAttribute('aria-pressed', 'true')
    await page.getByRole('tab', { name: '일정' }).click()
    await expect(page.locator('.schedule__row')).toHaveCount(2)
  })

  test('궤도 분포도는 글 요약을 제공하고 점을 누르면 상세를 연다', async ({ page }) => {
    await page.goto('/catalog?view=orbit')
    const chart = page.getByRole('img', { name: /궤도 분포도/ })
    await expect(chart).toBeVisible()
    await expect(page.locator('.gallery')).toHaveCount(0)
    const mark = page.locator('.scatter__mark').first()
    await mark.click({ force: true })
    await expect(page).toHaveURL(/sat=\d+/)
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('3D 궤도는 WebGL로 지구와 궤도를 그리고, 버튼으로 돌리고 확대한다', async ({ page }) => {
    await page.goto('/catalog?view=globe')
    const canvas = page.getByRole('img', { name: /3D 궤도/ })
    await expect(canvas).toBeVisible()
    await expect(page.locator('.gallery')).toHaveCount(0)
    const zoomIn = page.getByRole('button', { name: '가까이' })
    await expect(zoomIn).toBeEnabled()
    // 그려진 화면에 바탕색이 아닌 화소(눈금선과 궤도)가 있는지 확인합니다.
    const before = await canvas.screenshot()
    await zoomIn.click()
    await page.getByRole('button', { name: '오른쪽으로 돌리기' }).click()
    // 큰 WebGL 화면은 한 장을 찍는 데 몇 초가 걸릴 수 있어 넉넉히 기다린다.
    await expect.poll(async () => Buffer.compare(before, await canvas.screenshot()), { timeout: 20_000 }).not.toBe(0)
    // 플레이트 보기로 돌아가면 주소에서 view가 빠진다.
    await page.getByRole('button', { name: '플레이트' }).click()
    await expect(page).not.toHaveURL(/view=/)
  })
})

test.describe('홈 진행 바', () => {
  test.use({ reducedMotion: 'reduce', locale: 'ko-KR' })

  test('첫 화면에서는 숨어 있고, 구역에 들어오면 현재 위치를 표시하며 링크로 이동한다', async ({ page }) => {
    await page.goto('/')
    const nav = page.getByRole('navigation', { name: '홈 구역 진행' })
    await expect(nav).not.toHaveClass(/progress--shown/)

    await page.locator('#stop-assets').scrollIntoViewIfNeeded()
    await expect(nav).toHaveClass(/progress--shown/)
    await expect(nav.locator('[aria-current="location"]')).toHaveCount(1)

    await nav.getByRole('link', { name: '상황판' }).click()
    await expect(page.locator('#stop-board')).toBeFocused()
    await expect.poll(() => page.locator('#stop-board').evaluate((node) => Math.abs(node.getBoundingClientRect().top))).toBeLessThan(5)
    await expect(nav.getByRole('link', { name: '상황판' })).toHaveAttribute('aria-current', 'location')
  })

  test('키보드로 들어오면 첫 화면에서도 보인다', async ({ page }) => {
    await page.goto('/')
    const link = page.getByRole('navigation', { name: '홈 구역 진행' }).getByRole('link').first()
    await link.focus()
    await expect(link).toBeVisible()
    await expect.poll(() => page.locator('.progress').evaluate((node) => getComputedStyle(node).opacity)).toBe('1')
  })
})

test.describe('홈 진행 바와 모션', () => {
  test.use({ reducedMotion: 'no-preference', locale: 'ko-KR' })

  test('화면을 붙잡는 구역으로도 정확히 이동한다', async ({ page }) => {
    await page.goto('/')
    const nav = page.getByRole('navigation', { name: '홈 구역 진행' })
    await page.locator('#stop-systems').evaluate((node) => window.scrollTo(0, node.getBoundingClientRect().top + window.scrollY))
    await expect(nav).toHaveClass(/progress--shown/)

    await nav.getByRole('link', { name: '궤도 자산' }).click()
    await expect(page.locator('#stop-assets')).toBeFocused()
    await expect.poll(() => page.locator('#stop-assets').evaluate((node) => Math.abs(node.getBoundingClientRect().top)), { timeout: 5000 }).toBeLessThan(5)
    await expect(nav.getByRole('link', { name: '궤도 자산' })).toHaveAttribute('aria-current', 'location')
  })
})

test.describe('카탈로그 임무 도식', () => {
  test.use({ reducedMotion: 'reduce', locale: 'ko-KR' })

  test('상세에 도식과 설명이 나오고 대화상자 안에 들어온다', async ({ page }) => {
    await page.goto('/catalog')
    await page.getByRole('button', { name: /AEHF-1 .* 상세 정보/ }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByText('실제 형상 아님')).toBeVisible()
    await expect(dialog.locator('figure svg path')).toHaveAttribute('d', /^M/)
  })
})

test.describe('실시간 별자리', () => {
  test.use({ reducedMotion: 'reduce', locale: 'ko-KR' })

  test('설명을 열어 보이는 별자리 목록을 본다', async ({ page }) => {
    await page.goto('/')
    const sky = page.locator('#stop-sky')
    await sky.scrollIntoViewIfNeeded()
    await sky.getByRole('button', { name: '무엇이 보이나요?' }).click()
    await expect(sky.locator('#sky-panel')).toBeVisible()
    await expect(sky.locator('#sky-panel li').first()).toBeVisible()
  })

  test('다음 천문 현상에서 이벤트 화면으로 이동한다', async ({ page }) => {
    await page.goto('/')
    await page.locator('#stop-sky').getByRole('link', { name: /다음 천문 현상/ }).click()
    await expect(page).toHaveURL(/\/event$/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('사건의 지평선')
  })
})

test.describe('이벤트 화면', () => {
  test.use({ reducedMotion: 'reduce', locale: 'ko-KR' })

  test('일정 네 칸을 보여 주고 목차로 구역을 옮긴다', async ({ page, isMobile }) => {
    await page.goto('/event')
    await expect(page.locator('.tile')).toHaveCount(4)
    test.skip(isMobile, '좁은 화면에서는 목차를 숨깁니다')
    await page.getByRole('navigation', { name: '이벤트 구역' }).getByRole('link', { name: '지평선' }).click()
    await expect(page.locator('#event-horizon')).toBeFocused()
    await expect(page.getByRole('link', { name: '지평선' })).toHaveAttribute('aria-current', 'location')
  })

  test('가로로 넘치지 않는다', async ({ page }) => {
    await page.goto('/event')
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0)
  })
})

test.describe('Histoire 바로가기', () => {
  test.use({ reducedMotion: 'no-preference', locale: 'ko-KR' })

  const stubDocs = async (page: import('@playwright/test').Page): Promise<void> => {
    await page.route('**/histoire/index.html', (route) => route.fulfill({ contentType: 'text/html', body: '<title>docs</title>' }))
  }

  test('누르면 전환 연출을 보여 준 뒤 문서로 이동한다', async ({ page }) => {
    await stubDocs(page)
    await page.goto('/catalog')
    await page.getByRole('link', { name: 'Histoire 컴포넌트 문서로 이동' }).click()
    await expect(page.locator('.warp')).toBeVisible()
    await page.waitForURL('**/histoire/index.html')
  })

  test('동작 줄이기에서는 연출 없이 바로 이동한다', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce', locale: 'ko-KR', baseURL: 'http://localhost:4173' })
    const page = await context.newPage()
    await stubDocs(page)
    await page.goto('/catalog')
    await page.getByRole('link', { name: 'Histoire 컴포넌트 문서로 이동' }).click()
    await page.waitForURL('**/histoire/index.html')
    await context.close()
  })
})

test.describe('일식·월식 망원경 시야', () => {
  test.use({ reducedMotion: 'reduce', locale: 'ko-KR' })

  test('이벤트 일정의 일식에서 관측 화면의 망원경 시야로 이어진다', async ({ page }) => {
    await page.goto('/event')
    const tile = page.locator('.tile').filter({ hasText: '일식' })
    await tile.getByRole('link', { name: /그날 하늘 보기/ }).click()
    await expect(page).toHaveURL(/\/observatory\?at=.*&event=solarEclipse/)
    const panel = page.locator('.observatory__eclipse')
    await expect(panel.getByRole('img', { name: /해 앞을 지나는 달/ })).toBeVisible()
    await expect(panel.locator('.eclipse__badge')).toContainText('이 관측지에서')
  })

  test('시각 막대를 움직이면 절정 기준 시각이 바뀐다', async ({ page }) => {
    await page.goto('/observatory?at=2028-12-31T16:52:00.000Z&event=lunarEclipse')
    const slider = page.locator('.observatory__eclipse').getByRole('slider')
    await expect(slider).toHaveAttribute('aria-valuetext', '절정')
    await slider.focus()
    await page.keyboard.press('ArrowRight')
    await expect(slider).toHaveAttribute('aria-valuetext', /절정 0:\d\d 후/)
  })
})
