import { useLocaleStore } from '@/features/locale/store'
import { LOCALE_STORAGE_KEY, resolveInitialLocale } from '@/lib/locales'

// Aplica el idioma guardado en este navegador antes del primer render.
export default defineNuxtPlugin(async () => {
  let stored: string | null = null
  try {
    stored = localStorage.getItem(LOCALE_STORAGE_KEY)
  }
  catch {
    // Sin storage: se queda el idioma por defecto.
  }
  await useLocaleStore().setLocale(resolveInitialLocale(stored))
})
