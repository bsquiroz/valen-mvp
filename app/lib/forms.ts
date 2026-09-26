import type { z } from 'zod'

// Primer mensaje de error por campo (los mensajes son claves de i18n).
// Los campos anidados usan la ruta con puntos: `options.0.label.es`.
// `include` filtra qué errores mostrar (p. ej. solo los visibles antes de enviar).
export function fieldErrors(error: z.ZodError, include: (issue: z.core.$ZodIssue) => boolean = () => true): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const issue of error.issues) {
    if (!include(issue)) continue
    const field = issue.path.length ? issue.path.map(String).join('.') : 'form'
    errors[field] ??= issue.message
  }
  return errors
}

// Marca para reglas entre campos que conviene mostrar mientras se escribe
// (p. ej. "si hay descripción, en ambos idiomas"): addIssue({ ..., params: EARLY_ISSUE }).
export const EARLY_ISSUE = { showEarly: true } as const

function valueAt(values: unknown, path: PropertyKey[]): unknown {
  return path.reduce<unknown>((current, key) => (current && typeof current === 'object' ? (current as Record<PropertyKey, unknown>)[key] : undefined), values)
}

// Antes de enviar solo se muestran errores de campos con texto (formato inválido) y reglas
// marcadas con EARLY_ISSUE; los campos obligatorios vacíos no se marcan hasta intentar enviar.
export function isVisibleBeforeSubmit(issue: z.core.$ZodIssue, values: unknown): boolean {
  if (issue.code === 'custom' && issue.params?.showEarly) return true
  const value = valueAt(values, issue.path)
  return typeof value === 'string' && value.trim() !== ''
}
