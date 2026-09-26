<script setup lang="ts">
import AdminFeedbackInbox from '@/features/feedback/ui/AdminFeedbackInbox.vue'

definePageMeta({ access: 'super_admin' })
</script>

<template>
  <div class="mx-auto max-w-3xl">
    <AdminBackLink />
    <PageHeader
      :title="$t('admin.sections.feedback')"
      :description="$t('admin.feedback.description')"
    />
    <AdminFeedbackInbox />
  </div>
</template>
