# Beyond the Quasar — 에이전트 작업 안내

이 저장소의 규칙입니다. 자세한 내용은 `README.md`, `docs/development.md`, `CHANGELOG.md`에 있습니다.

## 1. 프로젝트 개요

- 군사·항법·기상·통신 위성을 추적하고 오늘 밤의 하늘을 관측하는 위성 관제·천체 관측 웹 앱입니다. 공개 데이터(TLE)로 동작하는 포트폴리오용 시뮬레이션이며 실제 위성과 연결되지 않습니다.
- 화면 축 1개(웹 앱): 홈, 관제, 카탈로그, 관측, 이벤트
- 운영: https://beyond-the-quasar-ryushin01.vercel.app/ · Histoire: `/histoire/index.html`

## 2. 기술 스택과 구조

- Vue 3.5, Quasar 2, TypeScript 6, Vite 7, Vue Router 5, Pinia 4, TanStack Query 5, VueUse, UnoCSS, vue-i18n 11, satellite.js 7, Astronomy Engine, d3, three.js, GSAP·Lenis, Sentry(DSN이 있을 때만), Histoire
- Feature-Sliced Design: `src/app → pages → widgets → features → entities → shared` 순서로, 위 층은 아래 층만 가져옵니다(Steiger는 쓰지 않음).
- `public/data/`는 궤도·소행성 스냅샷(`tle-snapshot.json`, `neo-snapshot.json`)이고, 앱은 궤도 때문에 실행 중 외부로 요청하지 않습니다(CelesTrak 이용 규칙). `scripts/`는 스냅샷·글꼴·화면별 HTML 생성 스크립트입니다.

## 3. 설치·개발 명령

- 패키지 매니저: Bun(`packageManager` `bun@1.4.4`), CI의 Node.js는 `.nvmrc`(26)
- `bun install` → `bun run dev`(http://localhost:5173) / `bun run preview`(`:4173`) / `bun run story:dev`(Histoire)
- 환경 변수(이름만): `VITE_SENTRY_DSN`, `VITE_HISTOIRE_URL`(선택), 빌드용 `HISTOIRE_BASE`
- 데이터·자산: `bun run data:tle`, `bun run data:neo`, `bun run fonts`(화면 글자를 바꾼 뒤), `bun run screenshots`(먼저 `build:site` 뒤 `preview`)

## 4. 검사·테스트 명령

| 명령                              | 내용                                                         |
| --------------------------------- | ------------------------------------------------------------ |
| `bun run lint`                    | oxlint(`src`, `e2e`) + ESLint(Vue 템플릿 접근성)             |
| `bun run typecheck`               | vue-tsc(앱, Cypress)                                         |
| `bun run test`                    | 단위·컴포넌트·그리기 지문(Vitest)                            |
| `bun run build` / `build:site`    | 타입 검사 후 빌드와 화면별 HTML / Histoire를 `/histoire/`에 합침 |
| `bun run story:build`             | Histoire 빌드                                                |
| `bun run test:e2e`                | 프로덕션 빌드 E2E(넘침, 흐름, axe, CSP) (먼저 `build`)       |
| `bun run size` / `lhci` / `lhci:mobile` | 번들 예산(JS 540 kB, CSS 140 kB) / Lighthouse 데스크톱 / 모바일(경고만) |
| `bun run test:component`          | Cypress 컴포넌트(캔버스·WebGL 실제 브라우저)                 |

- CI(`.github/workflows/ci.yml`) 순서: install → lint → typecheck → test → build → story:build → Playwright 설치 → test:e2e → size → lhci → lhci:mobile → `bunx cypress install` → test:component
- 그림을 일부러 바꿨다면 그리기 지문 스냅샷을 `bunx vitest -u`로 갱신합니다.

## 5. 코드 스타일

- oxlint + `eslint-plugin-vuejs-accessibility`(`eslint.config.js`). 별도 포매터 스크립트는 없으니 주변 코드 서식을 따릅니다.
- 모션: GSAP 코드는 `gsap.context` 안에 두고 언마운트 때 되돌립니다(`useGsapContext`). `useMotionPreference().enabled`가 거짓이면 연출을 만들지 않고, 기본 CSS는 연출 없이도 완성된 화면이어야 합니다. 이징은 `shared/motion`의 `EASE`, CSS는 `--ease-out`. 매 프레임 그리는 캔버스는 `useVisibleFrameLoop`, WebGL은 context lost/restored를 처리합니다.
- i18n: 템플릿에서 `$t`·`i18n-t`를 쓰지 않고 `useI18n()`의 `t`를 씁니다. 새 Quasar 컴포넌트를 쓰면 `src/app/styles/quasar.sass`에 그 `.sass`를 더하고, 글꼴은 `src/app/styles/fonts.css`에 넣습니다.
- `localStorage`는 `readStorage`·`readStorageList`로 읽고, 저장 형식을 바꾸면 검사 함수도 함께 바꿉니다. 주소 상태는 허용 목록으로 걸러 `router.replace`로 씁니다.
- 접근성: **2026-11-10부터 이 프로젝트는 접근성을 기준에서 뺍니다**(사용자 결정, 공통 규칙보다 우선). 참고 디자인과 부딪히는 접근성 보정은 하지 않고, 디자인과 충돌하는 axe 규칙은 끕니다(1.2.0에서 `color-contrast`를 axe·Lighthouse 데스크톱에서 끔). 기존 구현(본문 바로가기, 키보드 대안, 모션 정지, 화면 전환 뒤 `main` 초점, `html[lang]` 등)은 유지하고 남은 axe 검사는 통과시킵니다.

## 6. Git·PR

- `main`에 직접 커밋·푸시하지 않습니다(주간 스냅샷 갱신 워크플로의 봇 커밋만 예외). 최신 `main`에서 `feat/...`, `fix/...`, `docs/...`, `chore/...`, `refactor/...`, `test/...` 브랜치를 만듭니다.
- 커밋 메시지: `<type>: <한국어 요약> (x.y.z)` 예) `feat: 강조색을 코발트 #1a3fe0 한 가지로 (1.2.0)`. 버전이 바뀌지 않는 커밋은 괄호 없이 씁니다. 본문에 무엇을 왜 바꿨는지와 확인 결과를 적고, 끝에 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`를 붙입니다.
- 기능·수정 PR은 `package.json` 버전, README 배지, `CHANGELOG.md`(`## x.y.z (YYYY-MM-DD)`, 한 줄 요약 + `-` 목록)를 함께 올립니다. 문서만 바뀐 PR은 버전을 올리지 않습니다.
- 병합은 merge commit(`Merge pull request #N from ...`). CI가 통과하면 바로 병합하고 CodeRabbit 리뷰는 기다리지 않습니다. Dependabot 주 버전 PR은 변경 내역을 확인하고 CI가 통과할 때만 병합합니다.

## 7. 배포·릴리스

- Vercel 프로젝트 `beyond-the-quasar`. `main`에 병합하면 `bun run build:site`로 자동 배포되고, PR 미리보기는 끕니다(`vercel.json`의 `git.deploymentEnabled`). 주간 궤도 스냅샷 커밋(`refresh-tle.yml`, 월요일)도 같은 경로로 배포됩니다.
- 화면을 더하면 `scripts/route-html.mjs`의 `PAGES`와 `vercel.json` rewrite에 넣습니다. 외부 주소를 더하면 `vercel.json`의 CSP에도 넣습니다(E2E `security.spec.ts`가 확인).
- 데모 모드 없음: 로그인·서버가 없는 공개 데이터 앱이라 운영 주소가 곧 데모입니다.
- 릴리스: 태그·GitHub 릴리스 `vX.Y.Z`(제목도 같음), 대상은 병합 커밋 전체 SHA, 본문은 CHANGELOG의 해당 절.
- 릴리스 뒤 백업 `bash ~/Documents/Archive/Backup/backup.sh`, 보관함 `Beyond the Quasar v1.0.0 고도화 계획.md`에 진행 기록, 소개가 바뀌면 프로필 `ryushin01/ryushin01` README 표 갱신.

## 8. 보안·주의사항

- 비밀값과 `.env*`의 실제 값을 커밋하지 않습니다. 유료 키를 넣지 않습니다.
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
