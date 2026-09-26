import { DEFAULT_ACCESS } from '@/features/auth/data/access'
import { useAuthStore } from '@/features/auth/store'
import { needsDiagnostic } from '@/features/profile/data/profile'
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

  if (access === 'user' && to.meta.diagnosticGate !== false) {
    const profile = await useProfileStore().load(auth.userId).catch(() => null)
    if (needsDiagnostic(profile)) return navigateTo('/diagnostic')
  }

  if (access === 'admin' || access === 'super_admin') {
    const profileStore = useProfileStore()
    await profileStore.load(auth.userId).catch(() => null)
    if (!profileStore.isAdmin) return navigateTo('/')
    if (access === 'super_admin' && !profileStore.isSuperAdmin) return navigateTo('/admin')
  }
})
