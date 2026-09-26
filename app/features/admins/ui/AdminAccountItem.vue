<script setup lang="ts">
import { KeyRound, Trash2 } from '@lucide/vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatDate } from '@/lib/dates'
import { AdminsError } from '../api/admins'
import type { AdminAccount } from '../data/admins'
import { adminPasswordSchema } from '../data/admins'
import { useAdminsStore } from '../store'

const props = defineProps<{ admin: AdminAccount }>()
// Un solo formulario de contraseña abierto a la vez
const editing = defineModel<boolean>('editing', { required: true })

const store = useAdminsStore()
const { locale } = useI18n()
const { values, errors, pending, validate } = useZodForm(adminPasswordSchema, { password: '' })
const status = ref<{ kind: 'saved' } | { kind: 'error', errorKey: string } | null>(null)
const confirmOpen = ref(false)

const passwordId = computed(() => `admin-password-${props.admin.id}`)

watch(editing, () => {
  values.password = ''
  errors.value = {}
})

function errorKeyOf(error: unknown) {
  return error instanceof AdminsError ? error.errorKey : 'auth.errors.unknown'
}

async function savePassword() {
  status.value = null
  const input = validate()
  if (!input) return

  pending.value = true
  try {
    await store.setPassword(props.admin.id, input.password)
    editing.value = false
    status.value = { kind: 'saved' }
  }
  catch (error) {
    status.value = { kind: 'error', errorKey: errorKeyOf(error) }
  }
  finally {
    pending.value = false
  }
}

async function remove() {
  status.value = null
  pending.value = true
  try {
    await store.remove(props.admin.id)
  }
  catch (error) {
    status.value = { kind: 'error', errorKey: errorKeyOf(error) }
    pending.value = false
  }
}
</script>

<template>
  <li class="flex flex-col gap-3 py-3 first:pt-0 last:pb-0">
    <div class="group flex items-center gap-2">
      <div class="flex min-w-0 flex-1 flex-col">
        <span class="truncate text-sm font-medium">{{ admin.displayName || admin.email }}</span>
        <span class="truncate text-sm text-muted-foreground">{{ admin.email }}</span>
        <span class="text-xs text-muted-foreground">
          {{ $t('admins.createdOn', { date: formatDate(admin.createdAt, locale) }) }}
        </span>
      </div>
      <IconAction
        :icon="KeyRound"
        :label="$t('admins.changePassword')"
        :disabled="pending"
        @click="editing = !editing"
      />
      <IconAction
        :icon="Trash2"
        :label="$t('admins.delete')"
        :disabled="pending"
        @click="confirmOpen = true"
      />
    </div>

    <Alert
      v-if="status"
      :variant="status.kind === 'error' ? 'destructive' : 'default'"
    >
      <AlertDescription>
        {{ $t(status.kind === 'error' ? status.errorKey : 'admins.passwordChanged') }}
      </AlertDescription>
    </Alert>

    <form
      v-if="editing"
      class="flex flex-col gap-3 rounded-lg border p-3"
      novalidate
      @submit.prevent="savePassword"
    >
      <FormField
        :id="passwordId"
        :label="$t('admins.newPassword')"
        :error="errors.password"
      >
        <Input
          :id="passwordId"
          v-model="values.password"
          type="password"
          autocomplete="new-password"
          :aria-invalid="!!errors.password"
        />
      </FormField>
      <div class="flex gap-2">
        <Button
          type="submit"
          size="sm"
          :disabled="pending"
        >
          {{ $t('common.save') }}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          @click="editing = false"
        >
          {{ $t('common.cancel') }}
        </Button>
      </div>
    </form>

    <ConfirmDelete
      v-model:open="confirmOpen"
      :title="$t('admins.confirmDelete.title')"
      :description="$t('admins.confirmDelete.description', { email: admin.email })"
      @confirm="remove"
    />
  </li>
</template>
