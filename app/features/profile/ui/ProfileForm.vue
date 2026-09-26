<script setup lang="ts">
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { profileFormSchema } from '../data/profileForm'
import { useProfileStore } from '../store'

const profileStore = useProfileStore()
const { values, errors, pending, validate } = useZodForm(profileFormSchema, {
  displayName: profileStore.profile?.displayName ?? '',
})
const status = ref<'saved' | 'error' | null>(null)

// El perfil puede cargar después de montar el formulario
watch(() => profileStore.profile?.displayName, (name) => {
  if (name !== undefined && !values.displayName) values.displayName = name
})

async function onSubmit() {
  status.value = null
  const input = validate()
  if (!input) return

  pending.value = true
  try {
    await profileStore.updatePreferences({ displayName: input.displayName })
    status.value = 'saved'
  }
  catch {
    status.value = 'error'
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
      :variant="status === 'error' ? 'destructive' : 'default'"
    >
      <AlertDescription>
        {{ $t(status === 'saved' ? 'settings.profile.saved' : 'auth.errors.unknown') }}
      </AlertDescription>
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

    <Button
      type="submit"
      class="self-start"
      :disabled="pending"
    >
      {{ $t('settings.profile.save') }}
    </Button>
  </form>
</template>
