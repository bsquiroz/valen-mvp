import { z } from 'zod'

export const PASSWORD_MIN_LENGTH = 8

const email = z.string().trim().min(1, { error: 'auth.errors.emailRequired' }).pipe(z.email({ error: 'auth.errors.emailInvalid' }))
const password = z.string().min(PASSWORD_MIN_LENGTH, { error: 'auth.errors.passwordMin' })

export const signInSchema = z.object({
  email,
  password: z.string().min(1, { error: 'auth.errors.passwordRequired' }),
})

export const signUpSchema = z.object({
  displayName: z.string().trim().min(1, { error: 'auth.errors.nameRequired' }).max(80, { error: 'auth.errors.nameMax' }),
  email,
  password,
  passwordConfirm: z.string(),
}).refine(data => data.password === data.passwordConfirm, {
  error: 'auth.errors.passwordMismatch',
  path: ['passwordConfirm'],
})

export const forgotPasswordSchema = z.object({ email })

export const updatePasswordSchema = z.object({
  password,
  passwordConfirm: z.string(),
}).refine(data => data.password === data.passwordConfirm, {
  error: 'auth.errors.passwordMismatch',
  path: ['passwordConfirm'],
})

export type SignInInput = z.output<typeof signInSchema>
export type SignUpInput = z.output<typeof signUpSchema>
export type ForgotPasswordInput = z.output<typeof forgotPasswordSchema>
export type UpdatePasswordInput = z.output<typeof updatePasswordSchema>
