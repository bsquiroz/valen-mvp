<script setup lang="ts">
import { Badge } from '@/components/ui/badge'
import AdminOverview from '@/features/admin/ui/AdminOverview.vue'

definePageMeta({ access: 'admin' })
</script>

<template>
  <div>
    <PageHeader
      :title="$t('admin.title')"
      :description="$t('admin.description')"
    >
      <template #badge>
        <Badge variant="secondary">
          {{ $t('admin.badge') }}
        </Badge>
      </template>
    </PageHeader>
    <AdminOverview />
  </div>
</template>
