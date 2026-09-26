<script setup lang="ts">
import AdminAccounts from '@/features/admins/ui/AdminAccounts.vue'

definePageMeta({ access: 'super_admin' })
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <AdminBackLink />
    <PageHeader
      :title="$t('admin.sections.admins')"
      :description="$t('admins.description')"
    />
    <AdminAccounts />
  </div>
</template>
