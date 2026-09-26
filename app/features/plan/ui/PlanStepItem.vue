<script setup lang="ts">
import { Check } from '@lucide/vue'
import { localize } from '@/lib/localizedText'
import type { PlanStep } from '../data/plan'

const props = defineProps<{
  step: PlanStep
  disabled?: boolean
}>()

const emit = defineEmits<{ toggle: [completed: boolean] }>()

const locale = useContentLocale()
const completed = computed(() => !!props.step.completedAt)
</script>

<template>
  <li>
    <button
      type="button"
      role="checkbox"
      :aria-checked="completed"
      :disabled="disabled"
      class="group flex w-full items-start gap-3 rounded-md px-2 py-2.5 text-left transition-colors hover:bg-accent/60 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-60"
      @click="emit('toggle', !completed)"
    >
      <span
        class="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border border-input transition-colors group-aria-checked:border-primary group-aria-checked:bg-primary group-aria-checked:text-primary-foreground"
        aria-hidden="true"
      >
        <Check
          v-if="completed"
          class="size-3.5"
        />
      </span>
      <span class="flex min-w-0 flex-col gap-0.5">
        <span
          class="text-sm font-medium transition-colors group-aria-checked:text-muted-foreground group-aria-checked:line-through"
        >
          {{ localize(step.title, locale) }}
        </span>
        <span
          v-if="step.description"
          class="text-sm text-muted-foreground"
        >
          {{ localize(step.description, locale) }}
        </span>
      </span>
    </button>
  </li>
</template>
