import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

import { ROUTES } from '@/shared/config'

const routes: RouteRecordRaw[] = [
  { path: ROUTES.home, name: 'home', component: () => import('@/pages/home'), meta: { title: 'titles.home' } },
  { path: ROUTES.control, name: 'control', component: () => import('@/pages/control'), meta: { title: 'titles.control', console: true } },
  { path: ROUTES.catalog, name: 'catalog', component: () => import('@/pages/catalog'), meta: { title: 'titles.catalog' } },
  { path: ROUTES.observatory, name: 'observatory', component: () => import('@/pages/observatory'), meta: { title: 'titles.observatory' } },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/pages/not-found'), meta: { title: 'titles.notFound' } },
]

let restoreTop = 0

/** 새 화면이 그려진 뒤 옮겨 갈 스크롤 위치 */
export const consumeRestoreTop = (): number => {
  const top = restoreTop
  restoreTop = 0
  return top
}

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  // 스크롤은 화면 전환 막이 덮인 뒤 App.vue에서 처리합니다. 뒤로 가기면 이전 위치를 기억해 둡니다.
  scrollBehavior: (_to, _from, savedPosition) => {
    restoreTop = savedPosition?.top ?? 0
    return false
  },
})
