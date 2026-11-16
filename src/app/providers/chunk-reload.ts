import { isNavigationFailure, NavigationFailureType, type RouteLocationNormalized, type Router } from 'vue-router'

const STORAGE_KEY = 'btq:chunk-reload'
/** 이 시간 안에 다시 실패하면 새로고침하지 않습니다(같은 오류로 계속 새로고침하는 것을 막음). */
const RETRY_WINDOW_MS = 10_000
/** 실패가 10초보다 조금씩 늦게 되풀이돼도 끝없이 새로고침하지 않도록, 이 시간 동안은 최대 MAX_RELOADS번만 새로고침합니다. */
const BUDGET_WINDOW_MS = 10 * 60_000
const MAX_RELOADS = 2

/** 화면 조각(JS·CSS)을 받지 못한 오류인지. 브라우저마다 문구가 달라 알려진 문구를 모두 봅니다. */
export function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '')
  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS|Loading chunk|Loading CSS chunk/i.test(message)
}

/**
 * 같은 출처의 절대 주소로 바꿉니다. 다른 출처로 풀리는 주소(`//다른.사이트/`)는 null(열린 리다이렉트 방지).
 * 경로만 돌려주면 `/.//다른.사이트/`가 `//다른.사이트/`로 풀려 다시 다른 출처가 되므로, 출처까지 붙은 주소를 씁니다.
 */
export function sameOriginUrl(url: string, origin = window.location.origin): string | null {
  try {
    const resolved = new URL(url, origin)
    return resolved.origin === origin ? resolved.href : null
  } catch {
    return null
  }
}

/**
 * 주소로 한 번만 새로고침합니다. 실제로 새로고침할 때만 시각을 남기고, 직전 새로고침에서 10초가 지나지 않았으면 그대로 둡니다.
 * 시각을 남길 수 없으면(저장소 막힘) 새로고침 뒤에도 반복을 막을 방법이 없으므로 새로고침하지 않습니다.
 */
export function reloadOnce(url: string, now = Date.now(), assign = (to: string) => window.location.assign(to)): boolean {
  const target = sameOriginUrl(url)
  if (target === null) {
    console.warn('[chunk-reload] 같은 출처의 경로가 아니므로 새로고침하지 않습니다.')
    return false
  }
  try {
    // 최근 새로고침 시각들(10분 안). 예전 형식(숫자 하나)이나 깨진 값은 비어 있는 것으로 봅니다.
    let history: number[] = []
    try {
      const saved: unknown = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '[]')
      history = (Array.isArray(saved) ? saved : [saved]).filter((value): value is number => typeof value === 'number' && now - value < BUDGET_WINDOW_MS)
    } catch {
      history = []
    }
    const last = Math.max(0, ...history)
    if (now - last < RETRY_WINDOW_MS || history.length >= MAX_RELOADS) {
      console.warn('[chunk-reload] 새로고침한 뒤에도 화면 조각을 받지 못해 더 새로고침하지 않습니다.')
      return false
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...history, now]))
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
export function reloadOnChunkError(router: Router, assign?: (to: string) => void): () => void {
  // 진행 중인 이동. 이동이 겹치면 먼저 끝난(취소된) 이동이 나중 이동의 목적지를 지우지 않게 이동마다 구분합니다.
  let pending: RouteLocationNormalized | null = null
  const removeBefore = router.beforeEach((to) => {
    pending = to
  })
  const removeAfter = router.afterEach((to, _from, failure) => {
    // 지금 화면으로 다시 가는 이동(중복)은 가드를 건너뛰지만, 진행 중이던 이동을 버린 것이므로 함께 비웁니다.
    if (pending === to || isNavigationFailure(failure, NavigationFailureType.duplicated)) pending = null
  })
  // 화면 조각에 딸린 파일(CSS·공유 조각)을 미리 받다 실패한 경우. 진행 중인 화면 이동이 있을 때만 그 목적지로 새로고침합니다.
  // 버려진 이동이나 화면 이동이 아닌 지연 로딩(3D 장면 등)은 새로고침하지 않고 각자의 대체 안내에 맡깁니다.
  const onPreloadError = (event: Event) => {
    if (pending && reloadOnce(pending.fullPath, Date.now(), assign)) event.preventDefault()
  }
  window.addEventListener('vite:preloadError', onPreloadError)
  // 조각 자체를 받지 못한 경우. 사용자가 그새 다른 곳으로 갔으면(버려진 이동) 새로고침하지 않습니다.
  const removeError = router.onError((error, to) => {
    if (isChunkLoadError(error) && pending === to) reloadOnce(to.fullPath, Date.now(), assign)
  })
  // 앱에서는 끝까지 두지만, 테스트가 정리할 수 있게 해제 함수를 돌려줍니다.
  return () => {
    removeBefore()
    removeAfter()
    removeError()
    window.removeEventListener('vite:preloadError', onPreloadError)
  }
}
