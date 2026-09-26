import { DEFAULT_ACCESS } from '@/features/auth/data/access'
import { useAuthStore } from '@/features/auth/store'
import { useProfileStore } from '@/features/profile/store'

export default defineNuxtRouteMiddleware(async (to) => {
  const access = to.meta.access ?? DEFAULT_ACCESS
  if (access === 'public') return

  const auth = useAuthStore()

  if (access === 'guest') {
    if (auth.isAuthenticated) return navigateTo('/')
    return
  }

  if (!auth.isAuthenticated) {
    return navigateTo({
      path: '/auth/login',
      query: to.fullPath === '/' ? {} : { redirect: to.fullPath },
    })
  }

  if (access === 'admin') {
    const profileStore = useProfileStore()
    await profileStore.load(auth.userId).catch(() => null)
    if (!profileStore.isAdmin) return navigateTo('/')
  }
})
