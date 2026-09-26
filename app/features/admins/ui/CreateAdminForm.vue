<script setup lang="ts">
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AdminsError } from '../api/admins'
import { createAdminSchema } from '../data/admins'
import { useAdminsStore } from '../store'

const store = useAdminsStore()
const { values, errors, pending, validate } = useZodForm(createAdminSchema, {
  displayName: '',
  email: '',
  password: '',
})
const status = ref<{ kind: 'created' } | { kind: 'error', errorKey: string } | null>(null)

async function onSubmit() {
  status.value = null
  const input = validate()
  if (!input) return

  pending.value = true
  try {
    await store.create(input)
    values.displayName = ''
    values.email = ''
    values.password = ''
    status.value = { kind: 'created' }
  }
  catch (error) {
    status.value = { kind: 'error', errorKey: error instanceof AdminsError ? error.errorKey : 'auth.errors.unknown' }
  }
  finally {
    pending.value = false
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
      v-if="status"
      :variant="status.kind === 'error' ? 'destructive' : 'default'"
    >
      <AlertDescription>
        {{ $t(status.kind === 'error' ? status.errorKey : 'admins.created') }}
      </AlertDescription>
    </Alert>

    <FormField
      id="adminDisplayName"
      :label="$t('auth.fields.displayName')"
      :error="errors.displayName"
    >
      <Input
        id="adminDisplayName"
        v-model="values.displayName"
        autocomplete="off"
        :aria-invalid="!!errors.displayName"
      />
    </FormField>

    <FormField
      id="adminEmail"
      :label="$t('auth.fields.email')"
      :error="errors.email"
    >
      <Input
        id="adminEmail"
        v-model="values.email"
        type="email"
        autocomplete="off"
        :aria-invalid="!!errors.email"
      />
    </FormField>

    <FormField
      id="adminPassword"
      :label="$t('auth.fields.password')"
      :error="errors.password"
    >
      <Input
        id="adminPassword"
        v-model="values.password"
        type="password"
        autocomplete="new-password"
        :aria-invalid="!!errors.password"
      />
    </FormField>

    <p class="text-sm text-muted-foreground">
      {{ $t('admins.createHint') }}
    </p>

    <Button
      type="submit"
      class="self-start"
      :disabled="pending"
    >
      {{ $t('admins.create') }}
    </Button>
  </form>
</template>
