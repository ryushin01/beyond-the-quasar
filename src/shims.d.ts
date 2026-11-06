declare module 'quasar/icon-set/svg-material-symbols-sharp' {
  import type { QuasarIconSet } from 'quasar'
  const iconSet: QuasarIconSet
  export default iconSet
}

declare module 'world-atlas/land-110m.json' {
  const topology: unknown
  export default topology
}

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    console?: boolean
  }
}

export {}
