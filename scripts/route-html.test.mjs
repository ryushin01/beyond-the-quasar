import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { PAGES, routeHtml } from './route-html.mjs'

// 테스트 환경(jsdom)에서는 import.meta.url이 파일 주소가 아니라서 프로젝트 루트(vitest 실행 위치)를 기준으로 읽습니다.
const read = (file) => readFileSync(join(process.cwd(), file), 'utf8')
const html = read('index.html')

describe('routeHtml', () => {
  it('제목·설명·OG 값을 바꾸고 따옴표·꺾쇠는 이스케이프한다', () => {
    const out = routeHtml(html, { title: '위성 "관제" <1>', description: '설명 & 요약', url: 'https://example.com/control' })
    expect(out).toContain('<title>위성 &quot;관제&quot; &lt;1&gt;</title>')
    expect(out).toContain('<meta name="description" content="설명 &amp; 요약" />')
    expect(out).toContain('<meta property="og:title" content="위성 &quot;관제&quot; &lt;1&gt;" />')
    expect(out).toContain('<meta property="og:url" content="https://example.com/control" />')
    expect(out).not.toContain('noindex')
  })

  it('404용은 검색에서 빼도록 noindex를 넣는다', () => {
    expect(routeHtml(html, { title: 'x', description: 'y', url: 'z', noindex: true })).toContain('<meta name="robots" content="noindex" />')
  })

  it('궤도 스냅샷을 쓰지 않는 화면은 미리 받기를 뺀다', () => {
    expect(html).toContain('href="/data/tle-snapshot.json"')
    expect(routeHtml(html, { title: 'x', description: 'y', url: 'z' })).toContain('href="/data/tle-snapshot.json"')
    const out = routeHtml(html, { title: 'x', description: 'y', url: 'z', usesSnapshot: false })
    expect(out).not.toContain('tle-snapshot.json')
  })

  it('index.html 구조가 바뀌어 바꿀 태그가 없으면 실패한다', () => {
    expect(() => routeHtml('<html><head></head></html>', { title: 'x', description: 'y', url: 'z' })).toThrow()
  })
})

it('화면 목록이 라우터의 ROUTES(홈 제외)와 같고, 모든 화면에 한국어 제목·설명이 있다', () => {
  const routes = [...read('src/shared/config/routes.ts').matchAll(/^\s+(\w+): '(\/[^']*)'/gm)].map(([, key, path]) => ({ key, path }))
  expect(PAGES.map(({ key, path }) => ({ key, path }))).toEqual(routes.filter((route) => route.path !== '/'))
  const ko = JSON.parse(read('src/shared/i18n/locales/ko.json'))
  for (const page of PAGES) {
    expect(ko.titles[page.key]).toBeTruthy()
    expect(ko.descriptions[page.key]).toBeTruthy()
  }
})
