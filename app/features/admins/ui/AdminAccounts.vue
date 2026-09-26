<script setup lang="ts">
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useAdminsStore } from '../store'
import AdminAccountItem from './AdminAccountItem.vue'
import CreateAdminForm from './CreateAdminForm.vue'

const store = useAdminsStore()
const status = ref<'loading' | 'error' | 'ready'>('loading')
const editingId = ref<string | null>(null)

async function load() {
  status.value = 'loading'
  try {
    await store.load()
    status.value = 'ready'
  }
  catch {
    status.value = 'error'
  }
}

onMounted(load)
</script>

<template>
  <div class="flex flex-col gap-4">
    <SettingsSection
      :title="$t('admins.listTitle')"
      :description="$t('admins.listDescription')"
    >
      <p
        v-if="status === 'loading'"
        class="text-sm text-muted-foreground"
      >
        {{ $t('common.loading') }}
      </p>
      <div
        v-else-if="status === 'error'"
        class="flex flex-col items-start gap-4"
      >
        <Alert variant="destructive">
          <AlertDescription>{{ $t('admins.loadError') }}</AlertDescription>
        </Alert>
        <Button
          variant="outline"
          @click="load"
        >
          {{ $t('common.retry') }}
        </Button>
      </div>
      <p
        v-else-if="!store.admins?.length"
        class="text-sm text-muted-foreground"
      >
        {{ $t('admins.empty') }}
      </p>
      <ul
        v-else
        class="flex flex-col divide-y"
      >
        <AdminAccountItem
          v-for="admin in store.admins"
          :key="admin.id"
          :admin="admin"
          :editing="editingId === admin.id"
          @update:editing="editingId = $event ? admin.id : null"
        />
      </ul>
    </SettingsSection>

    <SettingsSection
      :title="$t('admins.createTitle')"
      :description="$t('admins.createDescription')"
    >
      <CreateAdminForm />
    </SettingsSection>
  </div>
</template>
