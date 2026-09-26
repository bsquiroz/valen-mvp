<script setup lang="ts">
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useThemeStore } from '@/features/theme/store'
import { DEFAULT_LOCALE, isLocale } from '@/lib/locales'
import { signUp } from '../api/auth'
import { signUpSchema } from '../data/schemas'

const { locale } = useI18n()
const themeStore = useThemeStore()
const { values, errors, pending, validate } = useZodForm(signUpSchema, {
  displayName: '',
  email: '',
  password: '',
  passwordConfirm: '',
})
const formError = ref<string | null>(null)

async function onSubmit() {
  formError.value = null
  const input = validate()
  if (!input) return

  pending.value = true
  const result = await signUp(input, {
    locale: isLocale(locale.value) ? locale.value : DEFAULT_LOCALE,
    theme: themeStore.current,
  })
  pending.value = false

  if (result.ok) {
    // Si el correo ya existía Supabase no devuelve error (evita revelar cuentas); el mensaje es el mismo.
    await navigateTo({ path: '/auth/check-email', query: { email: input.email } })
  }
  else {
    formError.value = result.errorKey
  }
}
</script>

<template>
  <form
    class="flex flex-col gap-4"
    novalidate
    @submit.prevent="onSubmit"
  >
    <Alert
      v-if="formError"
      variant="destructive"
    >
      <AlertDescription>{{ $t(formError) }}</AlertDescription>
    </Alert>

    <FormField
      id="displayName"
      :label="$t('auth.fields.displayName')"
      :error="errors.displayName"
    >
      <Input
        id="displayName"
        v-model="values.displayName"
        autocomplete="name"
        :aria-invalid="!!errors.displayName"
      />
    </FormField>

    <FormField
      id="email"
      :label="$t('auth.fields.email')"
      :error="errors.email"
    >
      <Input
        id="email"
        v-model="values.email"
        type="email"
        autocomplete="email"
        :aria-invalid="!!errors.email"
      />
    </FormField>

    <FormField
      id="password"
      :label="$t('auth.fields.password')"
      :error="errors.password"
    >
      <Input
        id="password"
        v-model="values.password"
        type="password"
        autocomplete="new-password"
        :aria-invalid="!!errors.password"
      />
    </FormField>

    <FormField
      id="passwordConfirm"
      :label="$t('auth.fields.passwordConfirm')"
      :error="errors.passwordConfirm"
    >
      <Input
        id="passwordConfirm"
        v-model="values.passwordConfirm"
        type="password"
        autocomplete="new-password"
        :aria-invalid="!!errors.passwordConfirm"
      />
    </FormField>

    <Button
      type="submit"
      :disabled="pending"
    >
      {{ $t('auth.register.submit') }}
    </Button>
  </form>
</template>
