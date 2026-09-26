import { z } from 'zod'
import type { Locale } from './locales'
import { DEFAULT_LOCALE } from './locales'

// Contenido traducible guardado en la base como jsonb: {"es": "...", "en": "..."}
export const localizedTextSchema = z.object({
  es: z.string(),
  en: z.string(),
})

export type LocalizedText = z.output<typeof localizedTextSchema>

export function localize(text: LocalizedText, locale: Locale): string {
  return text[locale] || text[DEFAULT_LOCALE]
}

// Para formularios: ambos idiomas obligatorios.
export const localizedTextInputSchema = z.object({
  es: z.string().trim().min(1, { error: 'admin.errors.textRequired' }).max(500, { error: 'admin.errors.textTooLong' }),
  en: z.string().trim().min(1, { error: 'admin.errors.textRequired' }).max(500, { error: 'admin.errors.textTooLong' }),
})

// Textos largos (descripciones): ambos idiomas obligatorios, hasta 2000 caracteres.
export const LONG_TEXT_MAX = 2000

export const localizedLongTextInputSchema = z.object({
  es: z.string().trim().min(1, { error: 'admin.errors.textRequired' }).max(LONG_TEXT_MAX, { error: 'admin.errors.textTooLong' }),
  en: z.string().trim().min(1, { error: 'admin.errors.textRequired' }).max(LONG_TEXT_MAX, { error: 'admin.errors.textTooLong' }),
})
