import { z } from 'zod'

export const profileFormSchema = z.object({
  displayName: z.string().trim().min(1, { error: 'auth.errors.nameRequired' }).max(80, { error: 'auth.errors.nameMax' }),
})

export type ProfileFormInput = z.output<typeof profileFormSchema>
