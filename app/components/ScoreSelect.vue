<script setup lang="ts">
// Selector segmentado de puntaje (0 · 1 · 2 · 3 por defecto).
withDefaults(defineProps<{
  values?: readonly number[]
  label: string
  disabled?: boolean
}>(), {
  values: () => [0, 1, 2, 3],
})

const model = defineModel<number>({ required: true })
</script>

<template>
  <div
    role="radiogroup"
    :aria-label="label"
    class="inline-flex shrink-0 rounded-md border border-border p-0.5 text-xs font-medium tabular-nums"
  >
    <button
      v-for="value in values"
      :key="value"
      type="button"
      role="radio"
      :aria-checked="model === value"
      :disabled="disabled"
      class="min-w-7 rounded-sm px-1.5 py-1 text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-50 aria-checked:bg-secondary aria-checked:text-secondary-foreground"
      @click="model = value"
    >
      {{ value }}
    </button>
  </div>
</template>
