<script setup lang="ts">
const props = defineProps<{
  // 0–100
  value: number
  label?: string
}>()

const clamped = computed(() => Math.min(100, Math.max(0, Math.round(props.value))))
</script>

<template>
  <div
    role="progressbar"
    :aria-valuenow="clamped"
    aria-valuemin="0"
    aria-valuemax="100"
    :aria-label="label"
    class="h-2 w-full overflow-hidden rounded-full bg-muted"
  >
    <div
      class="h-full rounded-full bg-primary transition-[width] duration-300"
      :style="{ width: `${clamped}%` }"
    />
  </div>
</template>
