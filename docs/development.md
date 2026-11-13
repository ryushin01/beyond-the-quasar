# 개발 가이드

## 궤도 데이터

앱은 `public/data/tle-snapshot.json`만 읽고 실행 중에 외부로 요청하지 않습니다. CelesTrak 이용 규칙(같은 데이터 반복 요청 제한)을 지키고, 백엔드 없이 배포할 수 있게 하려는 선택입니다.

- 갱신: 매주 월요일 `.github/workflows/refresh-tle.yml`이 자동으로 받아 커밋합니다(Actions에서 수동 실행도 가능). 로컬에서는 `bun run data:tle`. `scripts/fetch-tle.mjs`의 `FAMILIES`가 받을 위성과 분류를 정합니다.
- TLE는 시간이 지나면 오차가 커집니다. 원격 측정의 **TLE 기원**이 오래되면 다시 받습니다. 받을 때 기원이 45일 넘은 항목은 제외합니다.
- 분류(`category`)와 임무(`mission`)는 위성 계열을 기준으로 직접 붙인 값이고, 운영 주체·발사일·원지점 등은 SATCAT 값입니다.
- 정찰 임무는 "공개 자료 기준"으로 표시합니다. 비공개 위성의 궤도 추정치는 쓰지 않습니다.
- 통과 예측과 근접 거리는 참고 값입니다. 충돌 판단이나 실제 운용에 쓸 수 없습니다.

## Vite 버전

Histoire 1.0 beta가 Vite 7만 지원해 `vite`를 7.3으로 고정하고 `overrides`로 하나로 맞췄습니다. 같은 이유로 `@quasar/vite-plugin`은 1.x, `vitest`는 4, Cypress는 15를 씁니다(Cypress 16의 컴포넌트 테스트는 Vite 8만 지원). `satellite.js`는 7의 WASM 빌드가 Vite 빌드와 충돌해 6을 씁니다.

## 3D 궤도

카탈로그의 3D 보기(`widgets/orbit-globe`)는 three.js로 그립니다.

- 좌표: 관성 좌표(ECI)를 지구 반지름 1로 나눠 씁니다. three.js에 맞춰 북극을 y축으로 둡니다(`entities/satellite`의 `orbitPath`, `scenePosition`). 관성 좌표라 궤도가 닫힌 고리가 되고, 지구본은 그리니치 항성시만큼 돌려 둡니다.
- 크기: `three`에서 쓰는 클래스만 가져오고, 컴포넌트가 장면 파일(`lib/scene.ts`)을 늦게 불러와 3D 보기를 열 때만 내려받습니다(gzip 약 136kB).
- 모션: 동작 줄이기나 모션 정지 중에는 자동 회전과 위성 위치 갱신을 멈춥니다.
- 정리: 보기를 닫으면 `renderer.dispose()` 뒤에 `forceContextLoss()`로 WebGL 맥락을 바로 돌려줍니다. dispose만으로는 브라우저가 GC 때까지 맥락을 쥐고 있어, 여닫기를 반복하면 맥락 수 한도(보통 16개)에 걸립니다.
- 테스트: jsdom에는 WebGL이 없어 단위 테스트는 글 요약과 대체 안내를 확인하고, 실제 그리기는 E2E(Chromium)에서 확인합니다.

## 별자리와 이벤트

- 홈 별자리(`pages/home`): 별자리선과 밝은 별은 공개 좌표를 근사식(`sky-view.ts`)으로 30초마다 다시 계산하고, 달과 행성은 Astronomy Engine을 씁니다. 어두운 배경 별은 장식이며 화면의 설명 패널에도 그렇게 적습니다.
- 이벤트 일정(`entities/sky`의 `upcomingSkyEvents`): 실제 행사가 아니라 계산된 천문 현상입니다.
- 일식·월식(`entities/sky`의 `eclipseWindow`, `eyepieceScene`): 일식은 관측지 기준(`SearchLocalSolarEclipse`), 월식은 반영식 시작~끝입니다. 망원경 시야는 작은 각도라 평면으로 근사하고, 지구 그림자는 지구 중심 벡터(`GeoVector`)로 구해 대기 효과로 2% 키웁니다. `Observer(0, 0, 0)`은 지구 중심이 아니라 적도 위 지점이므로 쓰지 않습니다.
- 블랙홀(`pages/event/lib/shader.ts`): 슈바르츠실트 반지름을 1로 둔 광선 적분 근사입니다. 원반의 색과 무늬는 연출이고, 프레임이 밀리면 내부 해상도를 낮춥니다. 셰이더 컴파일이 첫 글자 표시를 늦추지 않게 한가할 때(`requestIdleCallback`) 켜고, GPU 가속이 없는 기기(`failIfMajorPerformanceCaveat`)에서는 정적 대체 화면을 씁니다. Cypress는 CI에 GPU가 없어 `allowSoftware`로 컴파일만 확인합니다. 참고 사이트의 이미지나 코드는 쓰지 않았습니다.

## Histoire 배포와 바로가기

`bun run build:site`가 `HISTOIRE_BASE=/histoire/`로 Histoire를 빌드해 `dist/histoire`에 합칩니다. Vercel은 이 명령을 쓰고, `vercel.json`의 SPA rewrite에서 `histoire/`를 뺐습니다. 바로가기 주소(`HISTOIRE_URL`)는 개발 중 `http://localhost:6006/`(`bun run story:dev` 필요), 배포본에서 `/histoire/index.html`이고 `VITE_HISTOIRE_URL`로 바꿀 수 있습니다.

## 모션 규칙

- 모든 GSAP 코드는 `gsap.context` 안에 두고 `onBeforeUnmount`에서 되돌립니다.
- `useMotionPreference().enabled`가 거짓이면 연출을 만들지 않습니다. 기본 CSS는 **연출 없이도 완성된 화면**이어야 합니다. 시작 상태를 CSS로 숨기지 않습니다.
- OS의 동작 줄이기와 헤더의 모션 정지 버튼을 함께 반영합니다(KWCAG 6.2.2). 셰이더, CSS 애니메이션, Lenis, 프리로더가 모두 멈춥니다.
- 글자를 쪼개는 연출은 원문을 `sr-only`로 두고 조각에 `aria-hidden`을 답니다.
- 이징은 `shared/motion`의 `EASE`, CSS는 `--ease-out`으로 통일합니다.

## 접근성 점검

**2026-11-10부터 이 프로젝트는 접근성을 기준에서 뺍니다.** 참고 디자인과 부딪히는 접근성 보정(명도 대비용 어둠 막·글자 그림자, 끌기 대신 쓰는 버튼 등)은 하지 않습니다. 기존 axe 검사는 남아 있으며, 디자인과 충돌하면 해당 규칙을 끕니다. 아래 표는 그 전에 구현한 내용입니다.

axe는 E2E에서 전 페이지, 밝은·어두운 화면, 데스크톱·모바일로 돌립니다. axe로 잡히지 않아 직접 지키는 항목은 다음과 같습니다.

| 항목 | 구현 |
|---|---|
| 5.1.1 대체 텍스트 | 지도(`canvas`)·하늘 지도·차트·3D 궤도에 현재 값을 담은 글 요약 |
| 5.4.1 색 무관 인식 | 군사 위성은 마름모, 상태는 글자로도 표시. 홈 지구본도 같은 기호와 글자 범례 사용 |
| 6.1.1 키보드 | 지도·하늘 지도·궤도 분포도의 위성과 대상은 목록·플레이트 버튼으로 같은 조작 제공, 검색 팔레트는 콤보박스 패턴 |
| 6.1.2 초점 | 화면 전환 후 `main`으로 초점 이동. 홈 진행 바는 숨어 있어도 초점을 받으면 나타나고, 이동한 구역으로 초점을 옮김 |
| 6.2.2 정지 | 헤더의 모션 정지, 임무 시계 정지. 동작 줄이기 중에는 Histoire 전환 연출 없이 바로 이동 |
| 6.3.1 깜빡임 | Histoire 전환의 밝아지는 빛은 한 번만 나오고 반복되지 않음 |
| 6.4.1 건너뛰기 | 본문 바로가기 |
| 6.1.4 문자 단축키 | 검색 팔레트는 수정 키(`Ctrl/⌘ K`)가 있어야 열림 |
| 6.5.1 단일 포인터 | 지도 확대·축소 버튼, 3D 궤도의 돌리기·확대 버튼, 지구본은 추적 위성을 자동으로 따라감 |
| 7.1.1 기본 언어 | 언어 전환 시 `html[lang]` 갱신 |
| 7.3.1 오류 정정 | 안전 모드 명령은 확인 대화상자, 일지는 입력 오류 안내 |

이 앱에는 공식 KWCAG 심사를 거친 결과가 없습니다. 인증이 필요하면 공식 문서 기준으로 다시 점검합니다.

## 주소 상태

`?sat=NORAD`(관제의 추적 위성, 카탈로그의 상세), `?category=&mission=&orbit=&owner=&q=&dualUse=1`(카탈로그 필터), `?view=orbit`(궤도 분포도), `?view=globe`(3D 궤도), `?at=ISO 시각`(관측 화면의 기준 시각, 이벤트 일정에서 연결), `?event=solarEclipse|lunarEclipse`(일식·월식 패널과 절정 기준 시각 이동)를 씁니다. 주소 값은 허용 목록으로 걸러 받고, `router.replace`로 써서 뒤로 가기 기록을 늘리지 않습니다. 관심 위성은 개인 설정이라 주소에 넣지 않습니다.

## 배포

Vercel 프로젝트 `beyond-the-quasar`가 GitHub 저장소와 연결되어 있어 `main`에 푸시하면 자동으로 배포됩니다. 설정은 `vercel.json`에 있습니다. 궤도 스냅샷 자동 갱신 커밋도 같은 경로로 배포됩니다.

## 테스트

| 범위 | 위치 | 내용 |
|---|---|---|
| 단위·컴포넌트 | `src/**/*.test.ts` | 궤도·천체 계산, 필터, 명령 지연, 각 컴포넌트 |
| 컴포넌트(실제 브라우저) | `src/**/*.cy.ts` | Cypress 컴포넌트 테스트. jsdom이 그리지 못하는 지상 궤적 지도(2D 캔버스)와 3D 궤도(WebGL)가 실제로 그려지는지, 확대·전환 버튼이 그림을 바꾸는지, 닫으면 그리기를 멈추는지 확인합니다. `bun run test:component` |
| 스토리 | `src/**/*.story.vue` | 컴포넌트별 상태 (`bun run story:build`로 CI에서 빌드 확인) |
| E2E | `e2e/` | 넘침, 프리로더, 모션 정지, 관제·카탈로그·관측 흐름, axe |

E2E는 프로덕션 빌드(`bun run build`)를 대상으로 합니다. `4173` 포트에 서버가 떠 있으면 재사용합니다.

## 품질 예산

- **웹 글꼴:** 한글 글꼴은 글자 묶음마다 `@font-face`가 있어(약 480개) 선언만 CSS 118 kB(gzip)입니다. `src/app/styles/fonts.css`에 모으고 `main.ts`가 화면을 그린 뒤 `import()`로 따로 받아, 첫 화면 CSS가 116 kB에서 41 kB로 줄었습니다. 그 사이에는 `global.css`의 대체 글꼴로 보입니다. 글꼴을 더할 때는 `main.ts`가 아니라 이 파일에 넣습니다.
- **셰이더 화면:** 화면 전체에 프래그먼트 셰이더를 그리는 곳(이벤트 무대, 퀘이사 배경)은 `shared/lib`의 `createFullscreenShader`로 준비합니다.
- **번들 크기:** `bun run size`가 전체 JS 540 kB, 전체 CSS 140 kB(gzip)를 넘으면 실패합니다. 기준은 `.size-limit.json`에 있습니다.
- **Vue 템플릿 접근성:** oxlint의 jsx-a11y는 Vue 템플릿을 보지 못해 `bun run lint`가 `eslint-plugin-vuejs-accessibility`도 돌립니다(`eslint.config.js`, 코드 규칙은 oxlint가 그대로 맡음). 지도·하늘 지도·분포도의 클릭과 검색 팔레트의 옵션은 위 키보드 대안이 있어 그 줄만 예외로 둡니다.
- **Lighthouse:** `bun run lhci`가 첫 화면·카탈로그·관제·관측소가 데스크톱 기준 성능 90·접근성 100·권장 사항 95·SEO 90점, LCP 2.5초·TBT 200ms·CLS 0.1 이하인지 3번씩 재서 확인합니다. 기준은 `lighthouserc.json`에 있습니다.

### GPU가 없는 CI에서의 측정

첫 화면의 three.js 장면은 GPU가 없는 CI에서 소프트웨어로 그려 TBT가 10초까지 나옵니다(GPU가 있는 기기에서는 0~100ms). 그래서 첫 화면은 성능 점수와 LCP·TBT를 재지 않고 접근성·권장 사항·SEO·CLS만 봅니다.

관제 화면은 CI에서 CLS가 0.198로 나옵니다(로컬 0.01). 느린 기기에서 지도와 위성 데이터가 늦게 자리를 잡아 화면이 밀리는 것으로 보여 따로 고치고, 그때까지 경고로 둡니다.

### 첫 화면의 알려진 접근성 문제

Lighthouse가 첫 화면에서 두 가지를 찾았습니다. 디자인을 바꿔야 해서 따로 고치고, 그때까지 첫 화면만 두 항목을 경고로 둡니다(접근성 점수 기준 90).

- **명도 대비(KWCAG 5.4.3):** 스크롤로 하나씩 드러나는 선언문 글자가 드러나기 전에는 불투명도 0.16이라 대비가 1.44:1입니다.
- **조작 크기(KWCAG 6.1.3):** 겹쳐 쌓인 카테고리 카드 덱의 링크가 서로 가려 누를 수 있는 영역이 0.1px까지 줄어듭니다.

두 검사 모두 프로덕션 빌드가 먼저 있어야 하며, CI는 빌드 뒤에 돌립니다.

## 모니터링

`src/app/main.ts`가 화면을 그리기 전에 `app/monitoring`을 켜고(Vue가 잡은 컴포넌트 오류는 `app.config.errorHandler`에서 보냄), Sentry와 web-vitals는 나중에 따로 받습니다.

| 환경 변수 | 내용 |
| --- | --- |
| `VITE_SENTRY_DSN` | 있으면 처리하지 못한 오류와 나쁜(poor) Web Vitals를 Sentry로 보냅니다. 없으면 Sentry를 번들에 넣지 않고, 개발 모드에서 Web Vitals를 콘솔에만 찍습니다 |

- Sentry에는 오류 내용만 보내고 사용자 정보·쿠키·헤더·쿼리 문자열, 방문 기록(세션), 이동·클릭 기록(브레드크럼), 콘솔 기록은 모으지 않습니다. Sentry를 받기 전에 난 오류는 모아 두었다가 처리되지 않은 오류로 보냅니다.
- 쓰는 함수만 `sentry.ts`에서 다시 내보내 약 31 kB(gzip)로 받습니다. 모듈 전체를 불러오면 리플레이·피드백까지 들어가 140 kB가 됩니다.
- 브라우저 오류만 모읍니다. 서버에서 난 오류는 호스팅(Vercel 등)의 로그로 확인합니다.

## 의존성 갱신 (Dependabot)

`.github/dependabot.yml`이 bun 패키지는 매주 부 버전·패치를 한 PR로 묶어 올리고, GitHub Actions는 매달 올립니다. 주 버전은 따로 PR이 열리므로 변경 내역을 확인하고 CI가 통과할 때만 병합합니다.
