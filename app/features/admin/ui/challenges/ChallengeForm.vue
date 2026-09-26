<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { AdminChallenge, ChallengeForm } from '@/features/challenges/data/adminChallenges'
import { challengeFormSchema, toChallengeFormInput } from '@/features/challenges/data/adminChallenges'
import { LONG_TEXT_MAX } from '@/lib/localizedText'

// Formulario en línea para crear o editar un reto: título y descripción (ES/EN) y días.
const props = defineProps<{
  title: string
  saveLabel?: string
  initial?: AdminChallenge
}>()

const emit = defineEmits<{
  save: [form: ChallengeForm]
  cancel: []
}>()

const id = useId()
const { values, errors, isValid, validate } = useZodForm(challengeFormSchema, toChallengeFormInput(props.initial))
const LOCALES = ['es', 'en'] as const

function onSubmit() {
  const form = validate()
  if (form) emit('save', form)
}

// `autofocus` no aplica a elementos insertados después de cargar la página
const formRef = useTemplateRef<HTMLFormElement>('form')
onMounted(() => formRef.value?.querySelector('input')?.focus())
</script>

<template>
  <form
    ref="form"
    class="flex flex-col gap-4 rounded-lg border border-primary/40 bg-card p-3 shadow-sm"
    novalidate
    @submit.prevent="onSubmit"
    @keydown.esc.prevent="emit('cancel')"
  >
    <p class="text-xs font-medium text-muted-foreground">
      {{ title }}
    </p>
    <div class="grid gap-3 sm:grid-cols-2">
      <FormField
        v-for="locale in LOCALES"
        :id="`${id}-title-${locale}`"
        :key="`t-${locale}`"
        :label="`${$t('admin.challenges.challengeTitle')} · ${$t(`locale.names.${locale}`)}`"
        :error="errors[`title.${locale}`]"
      >
        <Input
          :id="`${id}-title-${locale}`"
          v-model="values.title[locale]"
          :lang="locale"
          :aria-invalid="!!errors[`title.${locale}`]"
        />
      </FormField>
      <FormField
        v-for="locale in LOCALES"
        :id="`${id}-description-${locale}`"
        :key="`d-${locale}`"
        :label="`${$t('admin.challenges.challengeDescription')} · ${$t(`locale.names.${locale}`)}`"
        :error="errors[`description.${locale}`]"
      >
        <Textarea
          :id="`${id}-description-${locale}`"
          v-model="values.description[locale]"
          :lang="locale"
          :maxlength="LONG_TEXT_MAX"
          :placeholder="$t('admin.challenges.descriptionPlaceholder')"
          :aria-invalid="!!errors[`description.${locale}`]"
        />
      </FormField>
      <FormField
        :id="`${id}-days`"
        :label="$t('admin.challenges.durationDays')"
        :error="errors.durationDays"
      >
        <Input
          :id="`${id}-days`"
          v-model="values.durationDays"
          inputmode="numeric"
          :placeholder="$t('admin.challenges.durationPlaceholder')"
          :aria-invalid="!!errors.durationDays"
          :aria-describedby="`${id}-days-hint`"
        />
        <p
          :id="`${id}-days-hint`"
          class="text-xs text-muted-foreground"
        >
          {{ $t('admin.challenges.durationHint') }}
        </p>
      </FormField>
    </div>
    <div class="flex flex-wrap items-center justify-end gap-2">
      <RequiredHint
        v-if="!isValid"
        class="mr-auto"
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        @click="emit('cancel')"
      >
        {{ $t('common.cancel') }}
      </Button>
      <Button
        type="submit"
        size="sm"
        :disabled="!isValid"
      >
        {{ saveLabel ?? $t('common.save') }}
      </Button>
    </div>
  </form>
</template>
