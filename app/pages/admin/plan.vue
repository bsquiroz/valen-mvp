<script setup lang="ts">
import AdminPlanSteps from '@/features/admin/ui/plan/AdminPlanSteps.vue'

definePageMeta({ access: 'admin' })
</script>

<template>
  <div class="mx-auto max-w-3xl">
    <AdminBackLink />
    <PageHeader
      :title="$t('admin.sections.plan')"
      :description="$t('admin.plan.description')"
    />
    <AdminPlanSteps />
  </div>
</template>
