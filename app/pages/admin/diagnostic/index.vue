<script setup lang="ts">
import AdminDiagnosticQuestions from '@/features/admin/ui/diagnostic/AdminDiagnosticQuestions.vue'

definePageMeta({ access: 'admin' })
</script>

<template>
  <div class="mx-auto max-w-3xl">
    <AdminBackLink />
    <PageHeader
      :title="$t('admin.sections.diagnostic')"
      :description="$t('admin.diagnostic.description')"
    />
    <AdminDiagnosticQuestions />
  </div>
</template>
