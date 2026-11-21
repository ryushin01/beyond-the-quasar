# Beyond the Quasar — 에이전트 작업 안내

이 저장소의 규칙입니다. 자세한 내용은 `README.md`, `docs/development.md`, `CHANGELOG.md`에 있습니다.

## 1. 프로젝트 개요

- 군사·항법·기상·통신 위성을 추적하고 오늘 밤의 하늘을 관측하는 위성 관제·천체 관측 웹 앱입니다. 공개 데이터(TLE)로 동작하는 포트폴리오용 시뮬레이션이며 실제 위성과 연결되지 않습니다.
- 화면 축(웹 앱): 홈, 관제, 카탈로그, 관측, 이벤트
- 운영: https://beyond-the-quasar-ryushin01.vercel.app/ · Histoire: `/histoire/index.html`

## 2. 기술 스택과 구조

- Vue 3.5, Quasar 2, TypeScript 6, Vite 7, Vue Router 5, Pinia 4, TanStack Query 5, VueUse, UnoCSS, vue-i18n 11, satellite.js 7, Astronomy Engine, d3, three.js, GSAP·Lenis, Sentry(DSN이 있을 때만), Histoire
- Feature-Sliced Design: `src/app → pages → widgets → features → entities → shared` 순서로, 위 층은 아래 층만 가져옵니다(Steiger는 쓰지 않음).
- `public/data/`는 궤도·소행성·우주 기상 스냅샷(`tle-snapshot.json`, `neo-snapshot.json`, `space-weather-snapshot.json`)입니다. 궤도·소행성은 실행 중 외부로 요청하지 않고(CelesTrak 이용 규칙), 실행 중 외부 요청은 우주 기상(NOAA SWPC)뿐이며 실패하면 스냅샷으로 대신 보여 줍니다(`.env` 없이·오프라인에서도 모든 화면이 뜸). `scripts/`는 스냅샷·글꼴·화면별 HTML 생성 스크립트입니다.

## 3. 설치·개발 명령

- 패키지 매니저: Bun(`packageManager` `bun@1.4.4`), CI의 Node.js는 `.nvmrc`(26)
- `bun install` → `bun run dev`(http://localhost:5173) / `bun run preview`(`:4173`) / `bun run story:dev`(Histoire)
- 환경 변수(이름만): `VITE_SENTRY_DSN`, `VITE_HISTOIRE_URL`(선택), 빌드용 `HISTOIRE_BASE`
- 데이터·자산: `bun run data:tle`, `bun run data:neo`, `bun run data:space-weather`, `bun run fonts`(화면 글자를 바꾼 뒤), `bun run screenshots`(먼저 `build:site` 뒤 `preview`)

## 4. 검사·테스트 명령

| 명령                              | 내용                                                         |
| --------------------------------- | ------------------------------------------------------------ |
| `bun run lint`                    | oxlint(`src`, `e2e`) + ESLint(Vue 템플릿 접근성)             |
| `bun run typecheck`               | vue-tsc(앱, Cypress)                                         |
| `bun run test`                    | 단위·컴포넌트·그리기 지문(Vitest)                            |
| `bun run build` / `build:site`    | 타입 검사 후 빌드와 화면별 HTML / Histoire를 `/histoire/`에 합침 |
| `bun run story:build`             | Histoire 빌드                                                |
| `bun run test:e2e`                | 프로덕션 빌드 E2E(넘침, 흐름, axe, CSP, 오프라인) (먼저 `build`) |
| `bun run test:offline`            | 오프라인 E2E만(`e2e/offline.spec.ts`, localhost 밖 요청을 모두 막음) |
| `bun run size` / `lhci` / `lhci:mobile` | 번들 예산(JS 540 kB, CSS 140 kB) / Lighthouse 데스크톱 / 모바일(경고만) |
| `bun run test:component`          | Cypress 컴포넌트(캔버스·WebGL 실제 브라우저)                 |

- CI(`.github/workflows/ci.yml`) 순서: install → lint → typecheck → test → build → story:build → Playwright 설치 → test:e2e → size → lhci → lhci:mobile → `bunx cypress install` → test:component
- 그림을 일부러 바꿨다면 그리기 지문 스냅샷을 `bunx vitest -u`로 갱신합니다.
- 테스트 원칙: 구현 세부가 아니라 사용자가 보는 동작을 검사하고, 요소는 되도록 역할·이름으로 찾습니다(Playwright `getByRole`). 표준과 다른 점: 컴포넌트 단위 테스트는 Testing Library가 아니라 Vue Test Utils(`@vue/test-utils`) + Vitest(jsdom)를 쓰고, 캔버스·WebGL은 Cypress 컴포넌트 테스트로 봅니다. 화면 흐름은 Playwright E2E, 접근성은 axe(`@axe-core/playwright`)로 검사합니다. 버그를 고치면 고치기 전에 실패하는 테스트를 함께 넣습니다.

## 5. 코드 스타일

- 모션: GSAP 코드는 `gsap.context` 안에 두고 언마운트 때 되돌립니다(`useGsapContext`). `useMotionPreference().enabled`가 거짓이면 연출을 만들지 않고, 기본 CSS는 연출 없이도 완성된 화면이어야 합니다. 이징은 `shared/motion`의 `EASE`, CSS는 `--ease-out`. 매 프레임 그리는 캔버스는 `useVisibleFrameLoop`, WebGL은 context lost/restored를 처리합니다.
- i18n: 템플릿에서 `$t`·`i18n-t`를 쓰지 않고 `useI18n()`의 `t`를 씁니다. 새 Quasar 컴포넌트를 쓰면 `src/app/styles/quasar.sass`에 그 `.sass`를 더하고, 글꼴은 `src/app/styles/fonts.css`에 넣습니다.
- `localStorage`는 `readStorage`·`readStorageList`로 읽고, 저장 형식을 바꾸면 검사 함수도 함께 바꿉니다. 주소 상태는 허용 목록으로 걸러 `router.replace`로 씁니다.
- 접근성 표준은 WCAG 2.2·KWCAG 2.2, 자동 검사는 `eslint-plugin-vuejs-accessibility`(Vue 템플릿)와 axe(E2E)입니다. 다만 **2026-11-10부터 이 프로젝트는 접근성을 기준에서 뺍니다**(사용자 결정, 공통 규칙보다 우선). 참고 디자인과 부딪히는 접근성 보정은 하지 않고, 디자인과 충돌하는 axe 규칙은 끕니다(1.2.0에서 `color-contrast`를 axe·Lighthouse 데스크톱에서 끔). 기존 구현(본문 바로가기, 키보드 대안, 모션 정지, 화면 전환 뒤 `main` 초점, `html[lang]` 등)은 유지하고 남은 axe 검사는 통과시킵니다.
- TypeScript strict(`tsconfig.json`의 `"strict": true`, `noUncheckedIndexedAccess`)를 유지하고 `any`·`as` 단언·`@ts-ignore`를 피합니다. 외부 입력(주소 값, `localStorage`, 받은 스냅샷)은 허용 목록·검사 함수로 걸러 받습니다.
- 린트·서식: oxlint + ESLint(`eslint.config.js`)만 있고 Prettier·Biome 설정은 없습니다(표준과 다른 점). 주변 코드 서식을 따릅니다.

## 6. Git·PR

- 흐름: GitHub Flow. `main`에 직접 커밋·푸시하지 않고(주간 스냅샷 갱신 워크플로 `refresh-tle.yml`의 커밋 `궤도·소행성·우주 기상 스냅샷 갱신`만 예외), 최신 `main`에서 브랜치를 만들어 PR로만 병합합니다. PR은 목적 하나로 작게 만들고 본문에 무엇·왜·검사 결과를 적습니다.
- 브랜치 이름: `feat/…`, `fix/…`, `refactor/…`, `docs/…`, `test/…`, `chore/…`, `release/…`(예: `release/1.0.0`)
- 커밋 메시지: Conventional Commits `<타입>: <한국어 요약>`, 타입은 `feat`, `fix`, `refactor`, `perf`, `docs`, `test`, `style`, `chore`, `ci`, `build`. 버전을 올린 커밋은 끝에 `(x.y.z)`를 붙입니다. 호환이 깨지면 본문에 `BREAKING CHANGE:`를 적습니다.
  - 실제 예) `feat: 강조색을 코발트 #1a3fe0 한 가지로 (1.2.0)`, `fix: 공유 미리보기 이미지의 옛 로고를 쿼사르 사진으로 (1.0.1)`
  - 본문에 무엇을 왜 바꿨는지와 확인 결과를 적습니다.
- 기여자는 ryushin01만 남깁니다(2026-11-21 사용자 결정). 커밋 작성자는 항상 `ryushin0 <141554987+ryushin01@users.noreply.github.com>`이고, 이 저장소는 백엔드 코드가 없어 `Co-Authored-By` 줄을 넣지 않습니다.
  - GitHub Actions가 커밋하는 워크플로(`refresh-tle.yml`)는 작성자를 ryushin01로 설정합니다(`github-actions[bot]` 금지).
  - Dependabot PR은 그대로 병합하지 않습니다. 변경 내역을 확인하고 같은 변경을 ryushin01 커밋으로 다시 만들어 병합합니다(병합 커밋 작성자가 dependabot이 되지 않게).
- 버전: Semantic Versioning(주.부.수). 기능·수정 PR은 `package.json`의 `version`과 README의 version 배지를 함께 맞춥니다. 문서만 바뀐 PR은 버전을 올리지 않습니다.
- 변경 기록: `CHANGELOG.md`(제목 "버전 기록"), 최신 버전을 위에 두고 `## x.y.z (YYYY-MM-DD)` 아래 한 줄 요약과 `-` 목록으로 적습니다. 표준(Keep a Changelog)과 다른 점: 날짜를 괄호로 쓰고, `[Unreleased]` 절과 추가·변경·수정·제거 소제목이 없습니다.
- 병합은 merge commit(`Merge pull request #N from ...`). CI가 통과하면 바로 병합하고 CodeRabbit 리뷰는 기다리지 않습니다.

## 7. 배포·릴리스

- Vercel 프로젝트 `beyond-the-quasar`. `main`에 병합하면 `bun run build:site`로 자동 배포되고, PR 미리보기는 끕니다(`vercel.json`의 `git.deploymentEnabled`). 주간 궤도 스냅샷 커밋(`refresh-tle.yml`, 월요일)도 같은 경로로 배포됩니다.
- 화면을 더하면 `scripts/route-html.mjs`의 `PAGES`와 `vercel.json` rewrite에 넣습니다. 외부 주소를 더하면 `vercel.json`의 CSP에도 넣습니다(E2E `security.spec.ts`가 확인).
- 데모 모드 없음: 로그인·서버가 없는 공개 데이터 앱이라 운영 주소가 곧 데모입니다.
- 릴리스: 태그·GitHub 릴리스 `vX.Y.Z`(제목도 같음), 대상은 병합 커밋 전체 SHA, 본문은 CHANGELOG의 해당 절.
- 릴리스 뒤 백업 `bash ~/Documents/Archive/Backup/backup.sh`, 보관함 `Beyond the Quasar v1.0.0 고도화 계획.md`에 진행 기록, 소개가 바뀌면 프로필 `ryushin01/ryushin01` README 표 갱신.

## 8. 보안·주의사항

- 절대 금지: 비밀값을 `VITE_*`에 넣기(클라이언트 번들에 들어감), `.env*` 실제 값·유료 키 커밋, `eslint-disable`·`--no-verify`로 검사 우회, `main` 직접 푸시.
- 먼저 묻기: 새 런타임 의존성 추가, 빌드 설정(`vite.config.ts`·`vercel.json`·CI) 변경.
- CI·배포·릴리스 상태는 명령 결과(`gh run`, `gh release`, `curl`)로 확인한 뒤에만 말합니다.
- 버전 고정: Histoire 1.0 beta가 Vite 7만 지원해 `vite` 7.3(`overrides`와 같은 버전, `scripts/vite-pin.test.mjs`가 확인), `@quasar/vite-plugin` 1.x, Cypress 15, `typescript` 6, `three`·`@types/three` 0.187.0에 둡니다.
- `satellite.js` 7의 WASM 모듈은 `vite.config.ts`의 `satelliteJsWithoutWasm`이 빼므로 그 플러그인을 지우지 않습니다.
- 정찰 임무는 "공개 자료 기준"으로 표시하고 비공개 위성의 궤도 추정치는 쓰지 않습니다. 통과 예측·근접 거리는 참고 값입니다.
- 한글 글꼴 라이선스: 나눔고딕코딩을 줄인 파일은 OFL 예약 이름 때문에 'BTQ Coding'으로 이름을 바꾸고, 저작권·라이선스 이름표는 남깁니다.

## 9. 공통 규칙

공통 규칙은 `~/Documents/GitHub/CLAUDE.md`에 있으며, 이 파일과 충돌하면 이 파일이 우선합니다.

- 답변·커밋·PR·문서는 한국어로 씁니다.
- 허락을 묻지 않고 끝까지 진행한 뒤 결과를 한 번에 보고합니다(비용·비밀값·디자인 결정·되돌릴 수 없는 공개 행동은 보고만).
- 사용자의 진행 중인 작업을 보호합니다. 로컬에 커밋하지 않은 변경이 있으면 `git worktree add`로 따로 작업하고 끝나면 지웁니다.
- 다른 세션에 보내는 공지는 ryushin01 그룹 세션에만 보냅니다.
