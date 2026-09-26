<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { LocalizedText } from '@/lib/localizedText'
import { localizedTextInputSchema } from '@/lib/localizedText'

// Recuadro de edición en línea para un texto traducible (ES/EN). El slot `extra` permite
// agregar campos (p. ej. el puntaje de una respuesta nueva).
const props = defineProps<{
  title: string
  initial?: LocalizedText
  // Etiqueta de los campos de texto (p. ej. "Pregunta", "Respuesta")
  fieldLabel: string
  saveLabel?: string
  pending?: boolean
}>()

const emit = defineEmits<{
  save: [value: LocalizedText]
  cancel: []
}>()

const id = useId()
const { values, errors, isValid, validate } = useZodForm(localizedTextInputSchema, {
  es: props.initial?.es ?? '',
  en: props.initial?.en ?? '',
})

function onSubmit() {
  const value = validate()
  if (value) emit('save', value)
}

// `autofocus` no aplica a elementos insertados después de cargar la página
const formRef = useTemplateRef<HTMLFormElement>('form')
onMounted(() => formRef.value?.querySelector('input')?.focus())
</script>

<template>
  <form
    ref="form"
    class="flex flex-col gap-3 rounded-lg border border-primary/40 bg-card p-3 shadow-sm"
    novalidate
    @submit.prevent="onSubmit"
    @keydown.esc.prevent="emit('cancel')"
  >
    <p class="text-xs font-medium text-muted-foreground">
      {{ title }}
    </p>
    <FormField
      :id="`${id}-es`"
      :label="`${fieldLabel} · ${$t('locale.names.es')}`"
      :error="errors.es"
    >
      <Input
        :id="`${id}-es`"
        v-model="values.es"
        lang="es"
        :aria-invalid="!!errors.es"
      />
    </FormField>
    <FormField
      :id="`${id}-en`"
      :label="`${fieldLabel} · ${$t('locale.names.en')}`"
      :error="errors.en"
    >
      <Input
        :id="`${id}-en`"
        v-model="values.en"
        lang="en"
        :aria-invalid="!!errors.en"
      />
    </FormField>
    <slot name="extra" />
    <div class="flex flex-wrap items-center justify-end gap-2">
      <RequiredHint
        v-if="!isValid"
        class="mr-auto"
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        :disabled="pending"
        @click="emit('cancel')"
      >
        {{ $t('common.cancel') }}
      </Button>
      <Button
        type="submit"
        size="sm"
        :disabled="pending || !isValid"
      >
        {{ saveLabel ?? $t('common.save') }}
      </Button>
    </div>
  </form>
</template>
