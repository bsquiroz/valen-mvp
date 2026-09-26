<script setup lang="ts">
// Placeholder de secciones que todavía no están construidas.
defineProps<{ title: string }>()
</script>

<template>
  <div>
    <PageHeader :title="title" />
    <div class="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
      {{ $t('comingSoon.description') }}
    </div>
  </div>
</template>
