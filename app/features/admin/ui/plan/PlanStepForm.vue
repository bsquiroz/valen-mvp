<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SCORE_LEVELS } from '@/features/diagnostic/data/diagnostic'
import type { ScoreLevel } from '@/features/diagnostic/data/diagnostic'
import type { PlanStepForm, PlanStepTemplate } from '@/features/plan/data/adminPlan'
import { planStepFormSchema, toPlanStepFormInput } from '@/features/plan/data/adminPlan'

// Formulario en línea para crear o editar un paso: título y descripción (ES/EN) y niveles.
const props = defineProps<{
  title: string
  saveLabel?: string
  initial?: PlanStepTemplate
  pending?: boolean
}>()

const emit = defineEmits<{
  save: [form: PlanStepForm]
  cancel: []
}>()

const id = useId()
const { values, errors, isValid, validate } = useZodForm(planStepFormSchema, toPlanStepFormInput(props.initial))

function toggleLevel(level: ScoreLevel) {
  values.levels = values.levels.includes(level)
    ? values.levels.filter(candidate => candidate !== level)
    : [...values.levels, level]
}

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
        v-for="locale in (['es', 'en'] as const)"
        :id="`${id}-title-${locale}`"
        :key="locale"
        :label="`${$t('admin.plan.stepTitle')} · ${$t(`locale.names.${locale}`)}`"
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
        v-for="locale in (['es', 'en'] as const)"
        :id="`${id}-description-${locale}`"
        :key="`d-${locale}`"
        :label="`${$t('admin.plan.stepDescription')} · ${$t(`locale.names.${locale}`)}`"
        :error="errors[`description.${locale}`]"
      >
        <Input
          :id="`${id}-description-${locale}`"
          v-model="values.description[locale]"
          :lang="locale"
          :aria-invalid="!!errors[`description.${locale}`]"
        />
      </FormField>
    </div>

    <fieldset class="flex flex-col gap-2">
      <legend class="text-sm font-medium">
        {{ $t('admin.plan.levels') }}
      </legend>
      <p class="text-xs text-muted-foreground">
        {{ $t('admin.plan.levelsHint') }}
      </p>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="level in SCORE_LEVELS"
          :key="level"
          type="button"
          role="checkbox"
          :aria-checked="values.levels.includes(level)"
          class="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground aria-checked:border-primary aria-checked:bg-secondary aria-checked:text-secondary-foreground"
          @click="toggleLevel(level)"
        >
          {{ $t(`diagnostic.levels.${level}`) }}
        </button>
      </div>
      <p
        v-if="errors.levels"
        class="text-sm text-destructive"
      >
        {{ $t(errors.levels) }}
      </p>
    </fieldset>

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
