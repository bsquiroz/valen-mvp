<script setup lang="ts">
import DiagnosticFlow from '@/features/diagnostic/ui/DiagnosticFlow.vue'

definePageMeta({ access: 'admin' })
</script>

<template>
  <div>
    <div class="mx-auto max-w-xl">
      <AdminBackLink to="/admin/diagnostic" />
    </div>
    <DiagnosticFlow preview />
  </div>
</template>
