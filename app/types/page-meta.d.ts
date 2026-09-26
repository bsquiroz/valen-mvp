import type { Access } from '@/features/auth/data/access'

declare module '#app' {
  interface PageMeta {
    access?: Access
    // false = la página se puede ver aunque falte el diagnóstico obligatorio
    diagnosticGate?: boolean
  }
}

export {}
