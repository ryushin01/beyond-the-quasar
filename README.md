# 🔵 Beyond the Quasar

[![CI](https://github.com/ryushin01/beyond-the-quasar/actions/workflows/ci.yml/badge.svg)](https://github.com/ryushin01/beyond-the-quasar/actions/workflows/ci.yml)
![version](https://img.shields.io/badge/version-0.7.2-1a3fe0)
![Histoire](https://img.shields.io/badge/Histoire-1.0_beta-34D399)

군사·항법·기상·통신 위성을 추적하고 오늘 밤의 하늘을 관측하는 위성 관제·천체 관측 웹 앱입니다.

**[데모 바로 보기](https://beyond-the-quasar-ryushin01.vercel.app/)**

> **프로젝트 상태:** 공개 데이터로 동작하는 **포트폴리오용 시뮬레이션**입니다. 실제 위성과 연결되지 않고, 명령 전송은 거리로 계산한 지연을 흉내 낼 뿐입니다. 궤도 값은 공개 TLE로 계산한 참고 값입니다.

## 화면

궤도와 위성 정보는 CelesTrak 공개 카탈로그의 실제 값이고, 지상국 좌표는 지역 대표 좌표입니다.

| 첫 화면 | 궤도 자산 분류 |
|---|---|
| ![거대한 BEYOND THE QUASAR 글자 뒤로 파란 강착원반과 제트가 빛나는 첫 화면](docs/images/home-hero.jpg) | ![파란 바탕에서 일곱 분류의 플레이트가 한 벌에서 펼쳐지는 장면](docs/images/home-plates.jpg) |

| 관제·관측과 진행 바 |
|---|
| ![점으로 그린 지구본에 위성 직하점과 대전 지상국을 표시하고 양옆에 관제와 관측을 크게 적은 화면, 아래에 구역 진행 바](docs/images/home-axes.jpg) |

| 실시간 별자리 | Histoire 워프 전환 |
|---|---|
| ![검은 하늘에 대전 상공의 별자리선과 별 이름을 그리고 왼쪽 아래에 UTC 시계, 오른쪽 아래에 다음 천문 현상과 방향 조절 버튼을 둔 화면](docs/images/home-sky.jpg) | ![파란 빛줄기가 사방으로 뻗는 가운데 HISTOIRE 글자가 크게 나타나는 화면 전환](docs/images/histoire-warp.jpg) |

| 이벤트: 입구 | 이벤트: 사건의 지평선 |
|---|---|
| ![어두운 산 사이 수면 위에 푸른 빛의 고리가 뜬 장면과 모서리를 깎은 관제 화면 테두리](docs/images/event-entrance.jpg) | ![중력 렌즈로 휘어 보이는 강착원반과 검은 그림자, 얇은 글자의 제목과 블랙홀 정보 패널](docs/images/event-horizon.jpg) |

| 일식 망원경 시야 | 개기월식 망원경 시야 |
|---|---|
| ![아타카마에서 본 2027년 2월 일식의 둥근 망원경 시야. 붉은 십자선 가운데 해를 달이 아래쪽부터 가리고, 왼쪽에 시작·절정·끝 시각과 가림 비율 35%, 시각 막대가 있다](docs/images/eclipse-solar.jpg) | ![2028년 12월 31일 개기월식 절정의 망원경 시야. 달 전체가 지구 본그림자 안에서 붉게 물들고 그림자 가장자리가 점선으로 보인다](docs/images/eclipse-lunar.jpg) |

| 위성 관제: 지도 | 위성 관제: 지구본 |
|---|---|
| ![군사 필터를 켠 위성 목록, 지상 궤적 지도, 원격 측정과 상공 현황 패널](docs/images/control-map.jpg) | ![위성을 표시한 지구본과 통과 예측 표](docs/images/control-globe.jpg) |

| 위성 카탈로그 | 위성 상세 |
|---|---|
| ![임무, 운영 주체, 궤도 필터와 군사 위성 플레이트 목록](docs/images/catalog.jpg) | ![SBIRS GEO-1의 임무 유형 도식과 임무, 운영 주체, 발사일, 궤도 값을 보여 주는 대화상자](docs/images/catalog-detail.jpg) |

| 궤도 분포도 | 3D 궤도 |
|---|---|
| ![경사각과 평균 고도로 위성을 찍은 분포도에서 군사 위성만 진하게 표시하고 말풍선으로 위성 정보를 보여 주는 화면](docs/images/orbit-map.jpg) | ![군사 위성 66기의 궤도를 눈금선 지구 둘레에 그린 3D 화면. 정지궤도 고리 위에 위성이 마름모로 표시되고 오른쪽 위에 돌리기·확대 버튼이 있다](docs/images/orbit-globe.jpg) |

| 검색 팔레트 | 천체 관측 |
|---|---|
| ![GPS를 검색해 위성 목록이 나온 검색 대화상자](docs/images/palette.jpg) | ![별, 위성, 관측 대상을 표시한 하늘 지도와 현재 고도가 있는 대상 목록](docs/images/observatory.jpg) |

| 모바일 | |
|---|---|
| <img src="docs/images/mobile-home.jpg" alt="모바일 첫 화면" width="200"> <img src="docs/images/mobile-control.jpg" alt="모바일 관제 지도와 임무 시계" width="200"> | <img src="docs/images/mobile-sky.jpg" alt="모바일 실시간 별자리" width="200"> <img src="docs/images/mobile-event.jpg" alt="모바일 이벤트 화면의 블랙홀과 제목" width="200"> |

## 주요 기능

| 메뉴 | 내용 |
|---|---|
| 위성 관제 | 위성 151기 실시간 전파, 지상 궤적·가시 범위·낮밤 경계 지도(평면·지구본), 원격 측정, 통과 예측, 관심 위성 24시간 통과 일정, 지상국 상공 현황, 근접 위성, 임무 시계 배속, 시뮬레이션 명령 전송 |
| 위성 카탈로그 | 분류·임무·궤도·운영 주체·겸용 여부 필터와 검색, 플레이트 목록, 경사각·고도 궤도 분포도, 3D 궤도(three.js), 위성 상세(임무 유형 도식, NORAD 번호, 발사일, 원지점, 근지점 등) |
| 천체 관측 | 관측지별 일몰·박명·월출, 달 위상, 하늘 지도, 시각 조절, 퀘이사·은하·성운·성단 고도 곡선, 관측 일지 |
| 홈 별자리 | 선택한 지상국의 현재 하늘을 계산한 별자리선·밝은 별·달·행성, 끌어서 방향 전환, 다음 천문 현상 안내 |
| 이벤트 | 다음 보름달·절기·월식·일식 계산 일정과 그날 하늘 보기(관측 화면 `?at=`), 일식·월식 망원경 시야와 5분 단위 시각 이동, 광선 적분으로 그린 WebGL 블랙홀, 스크롤로 이어지는 네 구역 |
| 공통 | Histoire 문서로 가는 워프 전환 버튼, `Ctrl/⌘ K` 검색 팔레트, 관심 위성, 필터·위성이 담긴 공유 링크, 한국어·영어, 밝은·어두운 화면, 모션 정지 버튼과 동작 줄이기 대응 |

**위성 분류:** 군사(군 위성통신, 미사일 조기경보, 정찰·감시, 우주 상황 인식 등), 항법, 지구 관측, 기상, 통신, 과학, 유인. 비공개 위성은 공개 카탈로그에 없으므로 나오지 않습니다.

**모션:** WebGL 퀘이사(포인터 주변이 격자로 끊기는 셰이더), 격자 프리로더와 화면 전환, 스크롤에 맞물린 선언문·파란 점 전환·플레이트 펼침·축소되는 헤더, 글자 굵기가 변하는 푸터, 스크롤에 따라 채워지는 구역 진행 바, 양쪽에서 모이는 관제·관측과 도는 점 지구본.

## 기술 스택

![Vue.js, Quasar, TypeScript, Vite, Pinia, Bun, D3, three.js, Vitest, Cypress, GitHub Actions](docs/images/tech-stack.svg)

| 구분 | 사용 기술 |
|---|---|
| 프레임워크 | Vue 3.5, Quasar 2, TypeScript 5.9, Vite 7, Vue Router 5 |
| 상태·데이터 | Pinia 4, TanStack Query 5, VueUse |
| 궤도·천체 | satellite.js 6(SGP4), Astronomy Engine, d3-geo, world-atlas, three.js(3D 궤도) |
| 스타일·다국어 | UnoCSS, vue-i18n 11, Oswald·Orbit·Gothic A1·Roboto Mono·Nanum Gothic Coding |
| 모션 | GSAP 3(ScrollTrigger), Lenis, WebGL 셰이더 |
| 품질 | oxlint, vue-tsc, Vitest, Vue Test Utils, Cypress(컴포넌트), Playwright, axe |
| 문서 | Histoire |
| 패키지·배포 | Bun, GitHub Actions, Vercel |

## 시작하기

Bun 1.4 이상이 필요합니다.

```bash
bun install
bun run dev    # http://localhost:5173
```

| 명령 | 설명 |
|---|---|
| `bun run build` / `preview` | 타입 검사 후 프로덕션 빌드 / 빌드 결과 실행 (`:4173`) |
| `bun run build:site` | 프로덕션 빌드에 Histoire를 `/histoire/`로 합치기 (Vercel 배포용) |
| `bun run story:dev` / `story:build` | Histoire 개발 서버 / 빌드 |
| `bun run lint` / `typecheck` | oxlint / vue-tsc |
| `bun run test` | 단위·컴포넌트 테스트 |
| `bun run test:e2e` | 프로덕션 빌드의 레이아웃·접근성·업무 흐름 검사 (먼저 `build` 필요) |
| `bun run data:tle` | CelesTrak에서 궤도 스냅샷 갱신 |

## 프로젝트 구조

Feature-Sliced Design을 따릅니다.

```
public/data/     궤도 스냅샷 (tle-snapshot.json)
scripts/         스냅샷 생성 스크립트
e2e/             E2E 테스트
src/
├─ app/          진입점, 라우터, 전역 스타일, Histoire 설정
├─ pages/        홈, 관제, 카탈로그, 관측, 이벤트, 404
├─ widgets/      지도, 하늘 지도, 원격 측정, 퀘이사 셰이더, 플레이트 덱 등
├─ features/     Histoire 바로가기, 위성 필터, 명령 전송, 관측지 변경, 임무 시계, 관측 일지, 환경 설정
├─ entities/     satellite, sky, observer, clock
└─ shared/       UI, 모션, 다국어, 유틸리티
```

## 문서

| 문서 | 내용 |
|---|---|
| [개발 가이드](docs/development.md) | 데이터 갱신, 모션 규칙, 접근성 점검, 테스트 |
| [버전 기록](CHANGELOG.md) | 버전별 변경 내용 |
