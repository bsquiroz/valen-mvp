<script setup lang="ts">
import { Label } from '@/components/ui/label'

defineProps<{
  id: string
  label: string
  // Clave de i18n del error, si hay
  error?: string
}>()
</script>

<template>
  <div class="flex flex-col gap-2">
    <Label :for="id">{{ label }}</Label>
    <slot />
    <p
      v-if="error"
      :id="`${id}-error`"
      class="text-sm text-destructive"
    >
      {{ $t(error) }}
    </p>
  </div>
</template>
