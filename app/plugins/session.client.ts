import { DEFAULT_ACCESS } from '@/features/auth/data/access'
import { useAuthStore } from '@/features/auth/store'
import { useLocaleStore } from '@/features/locale/store'
import { useProfileStore } from '@/features/profile/store'
import { useThemeStore } from '@/features/theme/store'

// Sincroniza la sesión con el perfil: carga el perfil al entrar, aplica y guarda tema e idioma,
// y saca al usuario de las páginas protegidas si la sesión termina.
export default defineNuxtPlugin(() => {
  const auth = useAuthStore()
  const profileStore = useProfileStore()
  const themeStore = useThemeStore()
  const localeStore = useLocaleStore()
  const router = useRouter()

  watch(() => auth.userId, async (userId) => {
    if (!userId) {
      await profileStore.load(null)
      const access = router.currentRoute.value.meta.access ?? DEFAULT_ACCESS
      if (access === 'user' || access === 'admin') await navigateTo('/auth/login')
      return
    }

    const profile = await profileStore.load(userId).catch((error) => {
      console.error('No se pudo cargar el perfil', error)
      return null
    })
    if (!profile) return

    if (profile.theme && profile.theme !== themeStore.current) themeStore.setTheme(profile.theme)
    if (profile.locale !== localeStore.current) await localeStore.setLocale(profile.locale)
  }, { immediate: true })

  function savePreference(preferences: Parameters<typeof profileStore.updatePreferences>[0]) {
    profileStore.updatePreferences(preferences).catch((error) => {
      console.error('No se pudo guardar la preferencia', error)
    })
  }

  watch(() => themeStore.current, (theme) => {
    if (profileStore.profile && profileStore.profile.theme !== theme) savePreference({ theme })
  })

  watch(() => localeStore.current, (locale) => {
    if (profileStore.profile && profileStore.profile.locale !== locale) savePreference({ locale })
  })
})
