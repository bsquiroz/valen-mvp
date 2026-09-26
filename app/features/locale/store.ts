import { defineStore } from 'pinia'
import type { Locale } from '@/lib/locales'
import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, isLocale } from '@/lib/locales'

export const useLocaleStore = defineStore('locale', () => {
  const i18n = useNuxtApp().$i18n

  const current = computed<Locale>(() => (isLocale(i18n.locale.value) ? i18n.locale.value : DEFAULT_LOCALE))

  async function setLocale(locale: Locale) {
    if (locale !== i18n.locale.value) await i18n.setLocale(locale)
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, locale)
    }
    catch {
      // Sin storage disponible el idioma solo dura la sesión.
    }
  }

  return { current, setLocale }
})
