<script setup lang="ts">
import type { Component } from 'vue'
import { Button } from '@/components/ui/button'

// Botón de icono para acciones de edición en listas. En desktop se muestra al pasar el mouse
// sobre el contenedor `group`; en móvil siempre está visible. `hint` se muestra como tooltip,
// útil para explicar por qué está deshabilitado.
defineProps<{
  icon: Component
  label: string
  disabled?: boolean
  hint?: string
}>()

defineEmits<{ click: [] }>()
</script>

<template>
  <span
    :title="hint ?? label"
    class="inline-flex transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
  >
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      :aria-label="label"
      :disabled="disabled"
      class="text-muted-foreground hover:text-foreground"
      @click="$emit('click')"
    >
      <component
        :is="icon"
        aria-hidden="true"
      />
    </Button>
  </span>
</template>
