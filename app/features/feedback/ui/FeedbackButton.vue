<script setup lang="ts">
import { MessageSquarePlus } from '@lucide/vue'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import FeedbackDialogForm from './FeedbackDialogForm.vue'

// Botón flotante, siempre disponible con sesión, para enviar sugerencias o reportar problemas.
// En móvil queda sobre la barra de navegación inferior; se oculta si hay una barra de
// "cambios sin guardar" para no taparla.
// `withBottomNav`: el layout tiene barra de navegación inferior en móvil (el del diagnóstico no)
withDefaults(defineProps<{ withBottomNav?: boolean }>(), { withBottomNav: true })

const { hasBottomBar } = useBottomBar()
const open = ref(false)
</script>

<template>
  <Dialog v-model:open="open">
    <button
      v-show="!hasBottomBar"
      type="button"
      class="fixed right-4 z-30 flex size-12 items-center justify-center rounded-full border bg-card text-card-foreground shadow-lg transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none md:bottom-6"
      :class="withBottomNav ? 'bottom-20' : 'bottom-6'"
      :aria-label="$t('feedback.open')"
      :title="$t('feedback.open')"
      @click="open = true"
    >
      <MessageSquarePlus
        class="size-5"
        aria-hidden="true"
      />
    </button>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ $t('feedback.title') }}</DialogTitle>
        <DialogDescription>{{ $t('feedback.description') }}</DialogDescription>
      </DialogHeader>
      <!-- Se monta al abrir: cada vez empieza vacío -->
      <FeedbackDialogForm
        v-if="open"
        @close="open = false"
      />
    </DialogContent>
  </Dialog>
</template>
