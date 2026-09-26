<script setup lang="ts">
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { updatePassword } from '../api/auth'
import { updatePasswordSchema } from '../data/schemas'

const { values, errors, pending, validate } = useZodForm(updatePasswordSchema, { password: '', passwordConfirm: '' })
const formError = ref<string | null>(null)
const updated = ref(false)

async function onSubmit() {
  formError.value = null
  const input = validate()
  if (!input) return

  pending.value = true
  const result = await updatePassword(input.password)
  pending.value = false

  if (result.ok) updated.value = true
  else formError.value = result.errorKey
}
</script>

<template>
  <div
    v-if="updated"
    class="flex flex-col gap-4"
  >
    <Alert>
      <AlertDescription>{{ $t('auth.updatePassword.done') }}</AlertDescription>
    </Alert>
    <Button as-child>
      <NuxtLink to="/">
        {{ $t('auth.updatePassword.continue') }}
      </NuxtLink>
    </Button>
  </div>

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
      id="password"
      :label="$t('auth.fields.newPassword')"
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
      {{ $t('auth.updatePassword.submit') }}
    </Button>
  </form>
</template>
