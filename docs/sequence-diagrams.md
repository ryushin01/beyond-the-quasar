# 시퀀스 다이어그램

Beyond the Quasar는 서버 없이 동작합니다. 공개 TLE 스냅샷을 정적 파일로 배포하고, 위치와 통과 시각은 브라우저에서 계산합니다.

## 1. 궤도 스냅샷 갱신 (매주)

```mermaid
sequenceDiagram
    participant 스케줄 as GitHub Actions<br/>(refresh-tle.yml, 매주 월 03:17 UTC)
    participant 스크립트 as scripts/fetch-tle.mjs
    participant 셀레스트랙 as CelesTrak<br/>(GP·SATCAT)
    participant 저장소 as GitHub main
    participant 배포 as Vercel

    스케줄->>스크립트: bun run data:tle
    스크립트->>셀레스트랙: TLE, 위성 정보 요청
    셀레스트랙-->>스크립트: TLE 텍스트, SATCAT JSON
    스크립트->>스크립트: public/data/tle-snapshot.json 작성
    스케줄->>스케줄: bun run test:snapshot (스냅샷 검사)
    alt 바뀐 내용 없음
        스케줄-->>스케줄: 종료
    else 바뀜
        스케줄->>저장소: "궤도 스냅샷 갱신" 커밋, push
        저장소->>배포: main 배포
    end
```

## 2. 관제 화면의 실시간 위치

```mermaid
sequenceDiagram
    actor 사용자
    participant 화면 as 관제 화면<br/>(pages/control)
    participant 카탈로그 as useSatelliteCatalog<br/>(TanStack Query)
    participant 정적 as /data/tle-snapshot.json
    participant 시계 as 임무 시계<br/>(entities/clock)
    participant 궤도 as stateAt<br/>(satellite.js SGP4)
    participant 지도 as 지상 궤적 지도

    사용자->>화면: /control 열기
    화면->>카탈로그: 위성 목록
    카탈로그->>정적: fetch (한 번 받아 캐시)
    정적-->>카탈로그: TLE 151기
    카탈로그-->>화면: 위성, 궤도 분류, 기준 시각
    loop 250ms마다
        시계->>시계: now = 실제 시각 + 배속·정지 오프셋
        시계-->>지도: now
        지도->>궤도: stateAt(satrec, now)
        궤도-->>지도: 위도, 경도, 고도
        지도-->>사용자: 위치·가시 범위·낮밤 경계 갱신
    end
    사용자->>화면: 배속 변경 또는 정지
    화면->>시계: rate / paused
```

## 3. 시뮬레이션 명령 전송

실제 위성에 보내지 않습니다. 지상국과 위성 사이 거리로 왕복 시간을 계산해 응답을 흉내 냅니다.

```mermaid
sequenceDiagram
    actor 사용자
    participant 폼 as 명령 폼<br/>(features/send-command)
    participant 변이 as useSendCommand<br/>(useMutation)
    participant 모의 as simulateUplink
    participant 기록 as 명령 기록<br/>(Pinia + localStorage, 최근 30건)

    사용자->>폼: 명령 선택(ping, downlink 등) 후 전송
    폼->>변이: mutate(요청: 위성, 명령, 거리)
    변이->>모의: simulateUplink(요청)
    alt 위성이 지평선 아래(거리 없음)
        모의->>모의: 300ms 대기
        모의-->>변이: state=queued, 지연 없음
    else 보임
        모의->>모의: 왕복 거리 / 광속 + 처리 700ms 대기
        모의-->>변이: state=ack, latencyMs
    end
    변이->>기록: add(결과)
    기록-->>폼: 목록 갱신
```
