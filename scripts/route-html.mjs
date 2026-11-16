// 빌드한 index.html을 바탕으로 화면마다 제목·설명·공유 미리보기(OG)가 다른 HTML을 만듭니다.
// 자바스크립트를 실행하지 않는 검색 로봇과 링크 미리보기(카카오톡·슬랙 등)도 화면별 정보를 읽게 합니다.
// 사용: vite build 뒤에 `node scripts/route-html.mjs` (bun run build가 함께 실행)
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const SITE_URL = 'https://beyond-the-quasar-ryushin01.vercel.app'

/** 화면 주소와 i18n 키(titles·descriptions). src/shared/config/routes.ts의 ROUTES와 같아야 합니다(테스트로 확인). */
export const PAGES = [
  { path: '/control', key: 'control' },
  { path: '/catalog', key: 'catalog' },
  { path: '/observatory', key: 'observatory' },
  { path: '/event', key: 'event' },
]

const escapeHtml = (text) => text.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')

/** 바꿀 태그가 하나라도 없으면 조용히 넘어가지 않고 실패합니다(index.html 구조가 바뀐 것을 알리기 위해). */
function replaceOnce(html, pattern, replacement, label) {
  if (!pattern.test(html)) throw new Error(`index.html에서 ${label}을(를) 찾지 못했습니다`)
  return html.replace(pattern, replacement)
}

/** index.html의 제목·설명·OG 값을 바꾼 HTML */
export function routeHtml(html, { title, description, url, noindex = false }) {
  const t = escapeHtml(title)
  const d = escapeHtml(description)
  let out = html
  out = replaceOnce(out, /<title>[^<]*<\/title>/, `<title>${t}</title>`, '<title>')
  out = replaceOnce(out, /<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${d}" />`, 'description')
  out = replaceOnce(out, /<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${t}" />`, 'og:title')
  out = replaceOnce(out, /<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${d}" />`, 'og:description')
  out = replaceOnce(out, /<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${escapeHtml(url)}" />`, 'og:url')
  if (noindex) out = out.replace('</head>', '    <meta name="robots" content="noindex" />\n  </head>')
  return out
}

async function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
  const dist = path.join(root, 'dist')
  const html = await readFile(path.join(dist, 'index.html'), 'utf8')
  const ko = JSON.parse(await readFile(path.join(root, 'src/shared/i18n/locales/ko.json'), 'utf8'))

  for (const page of PAGES) {
    const out = routeHtml(html, { title: ko.titles[page.key], description: ko.descriptions[page.key], url: `${SITE_URL}${page.path}` })
    await mkdir(path.join(dist, page.path), { recursive: true })
    await writeFile(path.join(dist, page.path, 'index.html'), out)
  }
  // 없는 주소는 Vercel이 404.html을 404 상태로 돌려줍니다. 앱은 그대로 떠서 '페이지를 찾을 수 없음' 화면을 그립니다.
  await writeFile(
    path.join(dist, '404.html'),
    routeHtml(html, { title: ko.titles.notFound, description: ko.descriptions.notFound, url: SITE_URL, noindex: true }),
  )
  console.log(`화면별 HTML ${PAGES.length}개와 404.html을 만들었습니다.`)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) await main()
