import type { Locale } from '@/lib/locales'
import { DEFAULT_LOCALE, isLocale } from '@/lib/locales'

// Idioma activo tipado, para elegir la traducción de contenido de la base (`localize`).
export function useContentLocale() {
  const { locale } = useI18n()
  return computed<Locale>(() => (isLocale(locale.value) ? locale.value : DEFAULT_LOCALE))
}
