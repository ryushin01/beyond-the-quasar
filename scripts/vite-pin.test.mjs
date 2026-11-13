import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'

import { expect, it } from 'vitest'

// Histoire 때문에 Vite를 overrides로 한 버전에 고정합니다(docs/development.md의 'Vite 버전').
// Dependabot은 devDependencies만 올리고 overrides는 그대로 두므로, 둘이 어긋나면 실제로는 예전 버전이 설치됩니다.
// 테스트 환경(jsdom)에서는 import.meta.url이 파일 주소가 아니라서 프로젝트 루트(vitest 실행 위치)를 기준으로 읽습니다.
const manifest = join(process.cwd(), 'package.json')
const pkg = JSON.parse(readFileSync(manifest, 'utf8'))
const require = createRequire(manifest)

it('overrides의 vite가 devDependencies와 같고, 실제로 그 버전이 설치되어 있다', () => {
  expect(pkg.overrides.vite).toBe(pkg.devDependencies.vite)
  expect(require('vite/package.json').version).toBe(pkg.devDependencies.vite)
})
