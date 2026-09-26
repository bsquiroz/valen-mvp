<script setup lang="ts">
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { signIn } from '../api/auth'
import { safeRedirect } from '../data/access'
import { signInSchema } from '../data/schemas'

const route = useRoute()
const { values, errors, pending, validate } = useZodForm(signInSchema, { email: '', password: '' })
const formError = ref<string | null>(null)

async function onSubmit() {
  formError.value = null
  const input = validate()
  if (!input) return

  pending.value = true
  const result = await signIn(input)
  pending.value = false

  if (result.ok) {
    await navigateTo(safeRedirect(route.query.redirect))
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
      <AlertDescription>
        {{ $t(formError) }}
        <NuxtLink
          v-if="formError === 'auth.errors.emailNotConfirmed'"
          :to="{ path: '/auth/check-email', query: { email: values.email } }"
          class="font-medium underline underline-offset-4"
        >
          {{ $t('auth.checkEmail.resend') }}
        </NuxtLink>
      </AlertDescription>
    </Alert>

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
        autocomplete="current-password"
        :aria-invalid="!!errors.password"
      />
    </FormField>

    <NuxtLink
      to="/auth/forgot-password"
      class="self-end text-sm text-muted-foreground underline-offset-4 hover:underline"
    >
      {{ $t('auth.login.forgotPassword') }}
    </NuxtLink>

    <Button
      type="submit"
      :disabled="pending"
    >
      {{ $t('auth.login.submit') }}
    </Button>
  </form>
</template>
