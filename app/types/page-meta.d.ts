import type { Access } from '@/features/auth/data/access'

declare module '#app' {
  interface PageMeta {
    access?: Access
  }
}

export {}
