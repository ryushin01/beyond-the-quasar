import type { RouteLocationNormalized, Router } from 'vue-router'

const STORAGE_KEY = 'btq:chunk-reload'
/** 이 시간 안에 다시 실패하면 새로고침하지 않습니다(같은 오류로 계속 새로고침하는 것을 막음). */
const RETRY_WINDOW_MS = 10_000

/** 화면 조각(JS·CSS)을 받지 못한 오류인지. 브라우저마다 문구가 달라 알려진 문구를 모두 봅니다. */
export function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '')
  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS|Loading chunk|Loading CSS chunk/i.test(message)
}

/** 같은 출처의 경로로만 바꿉니다. `//다른.사이트/`처럼 다른 출처로 풀리는 주소는 null(열린 리다이렉트 방지) */
export function sameOriginPath(url: string, origin = window.location.origin): string | null {
  try {
    const resolved = new URL(url, origin)
    return resolved.origin === origin ? resolved.pathname + resolved.search + resolved.hash : null
  } catch {
    return null
  }
}

/**
 * 주소로 한 번만 새로고침합니다. 실제로 새로고침할 때만 시각을 남기고, 직전 새로고침에서 10초가 지나지 않았으면 그대로 둡니다.
 * 시각을 남길 수 없으면(저장소 막힘) 새로고침 뒤에도 반복을 막을 방법이 없으므로 새로고침하지 않습니다.
 */
export function reloadOnce(url: string, now = Date.now(), assign = (to: string) => window.location.assign(to)): boolean {
  const target = sameOriginPath(url)
  if (target === null) {
    console.warn('[chunk-reload] 같은 출처의 경로가 아니므로 새로고침하지 않습니다.')
    return false
  }
  try {
    const last = Number(sessionStorage.getItem(STORAGE_KEY) ?? 0)
    if (now - last < RETRY_WINDOW_MS) {
      console.warn('[chunk-reload] 새로고침한 뒤에도 화면 조각을 받지 못해 더 새로고침하지 않습니다.')
      return false
    }
    sessionStorage.setItem(STORAGE_KEY, String(now))
  } catch {
    console.warn('[chunk-reload] 저장소를 쓸 수 없어 반복을 막을 수 없으므로 새로고침하지 않습니다.')
    return false
  }
  assign(target)
  return true
}

/**
 * 새로 배포되면 이전 빌드의 화면 조각이 사라집니다. 열어 둔 탭에서 아직 안 받은 화면으로 가면 조각을 못 받아
 * 빈 화면이 되므로, 그 주소로 새로고침해 새 빌드를 받게 합니다.
 */
export function reloadOnChunkError(router: Router): void {
  // 진행 중인 이동. 이동이 겹치면 먼저 끝난(취소된) 이동이 나중 이동의 목적지를 지우지 않게 이동마다 구분합니다.
  let pending: RouteLocationNormalized | null = null
  router.beforeEach((to) => {
    pending = to
  })
  router.afterEach((to) => {
    if (pending === to) pending = null
  })
  // 화면 조각에 딸린 파일(CSS·공유 조각)을 미리 받다 실패한 경우. 이동 중이면 가려던 주소로, 아니면 지금 주소로 새로고침합니다.
  window.addEventListener('vite:preloadError', (event) => {
    const url = pending?.fullPath ?? window.location.pathname + window.location.search + window.location.hash
    if (reloadOnce(url)) event.preventDefault()
  })
  // 조각 자체를 받지 못한 경우
  router.onError((error, to) => {
    if (isChunkLoadError(error)) reloadOnce(to.fullPath)
  })
}
