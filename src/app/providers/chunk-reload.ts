import type { Router } from 'vue-router'

const STORAGE_KEY = 'btq:chunk-reload'
/** 이 시간 안에 다시 실패하면 새로고침하지 않습니다(같은 오류로 계속 새로고침하는 것을 막음). */
const RETRY_WINDOW_MS = 10_000

/** 화면 조각(JS·CSS)을 받지 못한 오류인지. 브라우저마다 문구가 달라 알려진 문구를 모두 봅니다. */
export function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '')
  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS|Loading chunk|Loading CSS chunk/i.test(message)
}

/** 주소로 한 번만 새로고침합니다. 직전에 이미 새로고침했으면 false를 돌려주고 그대로 둡니다. */
export function reloadOnce(url: string, now = Date.now(), assign = (to: string) => window.location.assign(to)): boolean {
  let last = 0
  try {
    last = Number(sessionStorage.getItem(STORAGE_KEY) ?? 0)
    sessionStorage.setItem(STORAGE_KEY, String(now))
  } catch {
    // 저장소를 쓸 수 없으면 반복 방지 없이 한 번 새로고침합니다.
  }
  if (now - last < RETRY_WINDOW_MS) return false
  assign(url)
  return true
}

/**
 * 새로 배포되면 이전 빌드의 화면 조각이 사라집니다. 열어 둔 탭에서 아직 안 받은 화면으로 가면 조각을 못 받아
 * 빈 화면이 되므로, 그 주소로 새로고침해 새 빌드를 받게 합니다.
 */
export function reloadOnChunkError(router: Router): void {
  let target: string | null = null
  router.beforeEach((to) => {
    target = to.fullPath
  })
  router.afterEach(() => {
    target = null
  })
  // 화면 조각에 딸린 파일(CSS·공유 조각)을 미리 받다 실패한 경우. 이동 중이면 가려던 주소로, 아니면 지금 주소로 새로고침합니다.
  window.addEventListener('vite:preloadError', (event) => {
    if (reloadOnce(target ?? window.location.pathname + window.location.search + window.location.hash)) event.preventDefault()
  })
  // 조각 자체를 받지 못한 경우
  router.onError((error, to) => {
    if (isChunkLoadError(error)) reloadOnce(to.fullPath)
  })
}
