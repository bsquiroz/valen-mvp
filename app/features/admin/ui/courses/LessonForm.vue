<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { AdminLesson, LessonForm } from '@/features/courses/data/adminCourses'
import { lessonFormSchema, toLessonFormInput } from '@/features/courses/data/adminCourses'
import { LONG_TEXT_MAX } from '@/lib/localizedText'

// Formulario en línea para crear o editar una lección: título y descripción (ES/EN),
// id del video en Bunny y duración.
const props = defineProps<{
  title: string
  saveLabel?: string
  initial?: AdminLesson
}>()

const emit = defineEmits<{
  save: [form: LessonForm]
  cancel: []
}>()

const id = useId()
const { values, errors, isValid, validate } = useZodForm(lessonFormSchema, toLessonFormInput(props.initial))
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
        :label="`${$t('admin.courses.lessonTitle')} · ${$t(`locale.names.${locale}`)}`"
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
        :label="`${$t('admin.courses.description')} · ${$t(`locale.names.${locale}`)}`"
        :error="errors[`description.${locale}`]"
      >
        <Textarea
          :id="`${id}-description-${locale}`"
          v-model="values.description[locale]"
          :lang="locale"
          :maxlength="LONG_TEXT_MAX"
          :aria-invalid="!!errors[`description.${locale}`]"
        />
      </FormField>
      <FormField
        :id="`${id}-video`"
        :label="$t('admin.courses.videoId')"
        :error="errors.videoId"
      >
        <Input
          :id="`${id}-video`"
          v-model="values.videoId"
          :placeholder="$t('admin.courses.videoIdPlaceholder')"
          autocomplete="off"
          spellcheck="false"
          :aria-invalid="!!errors.videoId"
          :aria-describedby="`${id}-video-hint`"
        />
        <p
          :id="`${id}-video-hint`"
          class="text-xs text-muted-foreground"
        >
          {{ $t('admin.courses.videoIdHint') }}
        </p>
      </FormField>
      <FormField
        :id="`${id}-duration`"
        :label="$t('admin.courses.duration')"
        :error="errors.duration"
      >
        <Input
          :id="`${id}-duration`"
          v-model="values.duration"
          :placeholder="$t('admin.courses.durationPlaceholder')"
          autocomplete="off"
          :aria-invalid="!!errors.duration"
        />
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
