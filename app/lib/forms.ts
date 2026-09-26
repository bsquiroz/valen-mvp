import type { z } from 'zod'

// Primer mensaje de error por campo (los mensajes son claves de i18n).
// Los campos anidados usan la ruta con puntos: `options.0.label.es`.
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const issue of error.issues) {
    const field = issue.path.length ? issue.path.map(String).join('.') : 'form'
    errors[field] ??= issue.message
  }
  return errors
}
