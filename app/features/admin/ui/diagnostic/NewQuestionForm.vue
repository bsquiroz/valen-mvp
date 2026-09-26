<script setup lang="ts">
import { Plus, X } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  emptyOptionForm,
  emptyQuestionForm,
  MAX_OPTIONS,
  MIN_OPTIONS,
  questionFormSchema,
} from '@/features/diagnostic/data/adminForms'
import type { Pillar } from '@/lib/pillars'
import { useEditorContext } from './editorContext'

const props = defineProps<{ pillar: Pillar }>()
const emit = defineEmits<{ done: [] }>()

const { editor, run } = useEditorContext()
const id = useId()
const { values, errors, pending, isValid, validate } = useZodForm(questionFormSchema, emptyQuestionForm())

function addRow() {
  if (values.options.length < MAX_OPTIONS) values.options.push(emptyOptionForm())
}

function removeRow(index: number) {
  if (values.options.length > MIN_OPTIONS) values.options.splice(index, 1)
}

async function onSubmit() {
  const form = validate()
  if (!form) return
  pending.value = true
  const ok = await run(() => editor.createQuestion(props.pillar, form))
  pending.value = false
  if (ok) emit('done')
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
    @keydown.esc.prevent="emit('done')"
  >
    <p class="text-xs font-medium text-muted-foreground">
      {{ $t('admin.diagnostic.newQuestionIn', { pillar: $t(`pillars.${pillar}`) }) }}
    </p>

    <div class="grid gap-3 sm:grid-cols-2">
      <FormField
        :id="`${id}-prompt-es`"
        :label="`${$t('admin.diagnostic.question')} · ${$t('locale.names.es')}`"
        :error="errors['prompt.es']"
      >
        <Input
          :id="`${id}-prompt-es`"
          v-model="values.prompt.es"
          lang="es"
          :aria-invalid="!!errors['prompt.es']"
        />
      </FormField>
      <FormField
        :id="`${id}-prompt-en`"
        :label="`${$t('admin.diagnostic.question')} · ${$t('locale.names.en')}`"
        :error="errors['prompt.en']"
      >
        <Input
          :id="`${id}-prompt-en`"
          v-model="values.prompt.en"
          lang="en"
          :aria-invalid="!!errors['prompt.en']"
        />
      </FormField>
    </div>

    <fieldset class="flex flex-col gap-3">
      <legend class="mb-2 text-sm font-medium">
        {{ $t('admin.diagnostic.options') }}
      </legend>
      <div
        v-for="(option, index) in values.options"
        :key="index"
        class="flex flex-col gap-2 rounded-md border border-border p-2"
      >
        <div class="flex items-center justify-between gap-2">
          <span class="text-xs text-muted-foreground">{{ $t('admin.diagnostic.optionNumber', { number: index + 1 }) }}</span>
          <div class="flex items-center gap-1">
            <ScoreSelect
              v-model="option.score"
              :label="$t('admin.diagnostic.scoreOfNumber', { number: index + 1 })"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              :aria-label="$t('admin.diagnostic.removeOptionRow', { number: index + 1 })"
              :disabled="values.options.length <= MIN_OPTIONS"
              @click="removeRow(index)"
            >
              <X />
            </Button>
          </div>
        </div>
        <div class="grid gap-2 sm:grid-cols-2">
          <FormField
            :id="`${id}-o${index}-es`"
            :label="$t('locale.names.es')"
            :error="errors[`options.${index}.label.es`]"
          >
            <Input
              :id="`${id}-o${index}-es`"
              v-model="option.label.es"
              lang="es"
              :aria-invalid="!!errors[`options.${index}.label.es`]"
            />
          </FormField>
          <FormField
            :id="`${id}-o${index}-en`"
            :label="$t('locale.names.en')"
            :error="errors[`options.${index}.label.en`]"
          >
            <Input
              :id="`${id}-o${index}-en`"
              v-model="option.label.en"
              lang="en"
              :aria-invalid="!!errors[`options.${index}.label.en`]"
            />
          </FormField>
        </div>
      </div>
      <p
        v-if="errors.options"
        class="text-sm text-destructive"
      >
        {{ $t(errors.options) }}
      </p>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        class="self-start text-muted-foreground"
        :disabled="values.options.length >= MAX_OPTIONS"
        @click="addRow"
      >
        <Plus />
        {{ $t('admin.diagnostic.addOption') }}
      </Button>
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
        @click="emit('done')"
      >
        {{ $t('common.cancel') }}
      </Button>
      <Button
        type="submit"
        size="sm"
        :disabled="pending || !isValid"
      >
        {{ $t('admin.diagnostic.createQuestion') }}
      </Button>
    </div>
  </form>
</template>
