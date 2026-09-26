<script setup lang="ts">
import AdminCourses from '@/features/admin/ui/courses/AdminCourses.vue'

definePageMeta({ access: 'admin' })
</script>

<template>
  <div class="mx-auto max-w-3xl">
    <AdminBackLink />
    <PageHeader
      :title="$t('admin.sections.courses')"
      :description="$t('admin.courses.pageDescription')"
    />
    <AdminCourses />
  </div>
</template>
