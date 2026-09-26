<script setup lang="ts">
import DiagnosticFlow from '@/features/diagnostic/ui/DiagnosticFlow.vue'

// Sin navegación: el diagnóstico se termina antes de usar el resto de la app
definePageMeta({ diagnosticGate: false, layout: 'focus' })
</script>

<template>
  <DiagnosticFlow />
</template>
