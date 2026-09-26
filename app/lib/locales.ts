export const LOCALES = ['es', 'en'] as const

export type Locale = typeof LOCALES[number]

export const DEFAULT_LOCALE: Locale = 'es'

export const LOCALE_STORAGE_KEY = 'locale'

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
}

// Idioma guardado si es válido; si no, español (no se detecta el idioma del navegador).
export function resolveInitialLocale(stored: string | null): Locale {
  return isLocale(stored) ? stored : DEFAULT_LOCALE
}
