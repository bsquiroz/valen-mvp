<script setup lang="ts">
import AdminChallenges from '@/features/admin/ui/challenges/AdminChallenges.vue'

definePageMeta({ access: 'admin' })
</script>

<template>
  <div class="mx-auto max-w-3xl">
    <AdminBackLink />
    <PageHeader
      :title="$t('admin.sections.challenges')"
      :description="$t('admin.challenges.pageDescription')"
    />
    <AdminChallenges />
  </div>
</template>
