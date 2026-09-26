import type { z } from 'zod'
import { fieldErrors, isVisibleBeforeSubmit } from '@/lib/forms'

// Estado mínimo de un formulario validado con Zod. Los errores son claves de i18n.
// - `isValid`: para deshabilitar el botón mientras falte algo obligatorio o haya un formato inválido.
// - `errors`: se recalculan al escribir. Antes de enviar solo muestran formatos inválidos en campos
//   con texto; después de intentar enviar, todos.
export function useZodForm<Schema extends z.ZodType<Record<string, unknown>>>(
  schema: Schema,
  initialValues: z.input<Schema>,
) {
  const values = reactive({ ...(initialValues as Record<string, unknown>) }) as z.input<Schema>
  const submitted = ref(false)
  const pending = ref(false)

  const result = computed(() => schema.safeParse(values))
  const isValid = computed(() => result.value.success)
  const errors = computed<Record<string, string>>(() => {
    const { error } = result.value
    if (!error) return {}
    return submitted.value ? fieldErrors(error) : fieldErrors(error, issue => isVisibleBeforeSubmit(issue, values))
  })

  function validate(): z.output<Schema> | null {
    submitted.value = true
    return result.value.success ? result.value.data : null
  }

  // Vuelve a ocultar los errores de campos vacíos (p. ej. al reabrir un formulario)
  function reset() {
    submitted.value = false
  }

  return { values, errors, pending, isValid, validate, reset }
}
