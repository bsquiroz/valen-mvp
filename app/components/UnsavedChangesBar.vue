<script setup lang="ts">
import { Button } from '@/components/ui/button'

// Barra fija con los cambios sin guardar de un borrador local: una sola escritura al guardar.
// En móvil queda sobre la barra de navegación inferior.
defineProps<{
  message: string
  saveLabel: string
  // Mensaje de error del último guardado, si falló
  error?: string | null
  saving?: boolean
}>()

const emit = defineEmits<{ save: [], discard: [] }>()
</script>

<template>
  <div class="fixed inset-x-0 bottom-20 z-30 px-4 md:bottom-6">
    <div
      role="region"
      :aria-label="$t('common.unsaved.label')"
      class="mx-auto flex max-w-2xl flex-col gap-3 rounded-lg border bg-popover p-3 text-popover-foreground shadow-lg sm:flex-row sm:items-center"
    >
      <p
        class="flex-1 text-sm"
        aria-live="polite"
      >
        <span
          v-if="error"
          class="text-destructive"
        >{{ error }}</span>
        <template v-else>
          {{ message }}
        </template>
      </p>
      <div class="flex gap-2 self-end sm:self-auto">
        <Button
          variant="ghost"
          size="sm"
          :disabled="saving"
          @click="emit('discard')"
        >
          {{ $t('common.unsaved.discard') }}
        </Button>
        <Button
          size="sm"
          :disabled="saving"
          @click="emit('save')"
        >
          {{ saving ? $t('common.unsaved.saving') : saveLabel }}
        </Button>
      </div>
    </div>
  </div>
</template>
