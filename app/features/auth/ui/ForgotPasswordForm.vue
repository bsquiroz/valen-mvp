<script setup lang="ts">
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { requestPasswordReset } from '../api/auth'
import { forgotPasswordSchema } from '../data/schemas'

const { values, errors, pending, validate } = useZodForm(forgotPasswordSchema, { email: '' })
const formError = ref<string | null>(null)
const sent = ref(false)

async function onSubmit() {
  formError.value = null
  const input = validate()
  if (!input) return

  pending.value = true
  const result = await requestPasswordReset(input)
  pending.value = false

  if (result.ok) sent.value = true
  else formError.value = result.errorKey
}
</script>

<template>
  <Alert v-if="sent">
    <AlertDescription>{{ $t('auth.forgotPassword.sent') }}</AlertDescription>
  </Alert>

  <form
    v-else
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

    <Button
      type="submit"
      :disabled="pending"
    >
      {{ $t('auth.forgotPassword.submit') }}
    </Button>
  </form>
</template>
