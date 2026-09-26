import type { z } from 'zod'
import { fieldErrors } from '@/lib/forms'

// Estado mínimo de un formulario validado con Zod. Los errores son claves de i18n.
export function useZodForm<Schema extends z.ZodType<Record<string, unknown>>>(
  schema: Schema,
  initialValues: z.input<Schema>,
) {
  const values = reactive({ ...(initialValues as Record<string, unknown>) }) as z.input<Schema>
  const errors = ref<Record<string, string>>({})
  const pending = ref(false)

  function validate(): z.output<Schema> | null {
    const result = schema.safeParse(values)
    if (result.success) {
      errors.value = {}
      return result.data
    }
    errors.value = fieldErrors(result.error)
    return null
  }

  return { values, errors, pending, validate }
}
