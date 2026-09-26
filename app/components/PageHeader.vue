<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <header class="mb-6 flex flex-col gap-1">
    <div class="flex flex-wrap items-center gap-2">
      <h1 class="text-2xl font-semibold tracking-tight">
        {{ title }}
      </h1>
      <slot name="badge" />
    </div>
    <p
      v-if="description"
      class="text-muted-foreground"
    >
      {{ description }}
    </p>
  </header>
</template>
