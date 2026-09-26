<script setup lang="ts">
import { Eye, EyeOff, GripVertical, Pencil, Play, Trash2 } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import type { AdminLesson, LessonForm as Form } from '@/features/courses/data/adminCourses'
import { canDeleteLesson } from '@/features/courses/data/adminCourses'
import { formatDuration } from '@/lib/duration'
import { localize } from '@/lib/localizedText'
import { isTempId } from '@/lib/tempId'
import { useCoursesEditorContext } from './editorContext'
import LessonForm from './LessonForm.vue'

const props = defineProps<{
  lesson: AdminLesson
  number: number
  total: number
}>()

const { editor, activeEditor, run } = useCoursesEditorContext()
const locale = useContentLocale()

const editorKey = computed(() => `lesson:${props.lesson.id}`)
const editing = computed(() => activeEditor.value === editorKey.value)
const deletable = computed(() => canDeleteLesson(props.lesson))
// Solo se puede ver una lección ya guardada y sin cambios pendientes
const previewable = computed(() => !isTempId(props.lesson.id) && !isTempId(props.lesson.courseId) && !editor.hasChanges.value)
const confirmOpen = ref(false)

async function save(form: Form) {
  if (await run(() => editor.updateLesson(props.lesson.id, form))) activeEditor.value = null
}

// Mover con teclado desde el asa; se devuelve el foco porque el nodo cambia de lugar.
const handleRef = useTemplateRef<HTMLButtonElement>('handle')

async function moveBy(delta: number) {
  if (await run(() => editor.moveLesson(props.lesson.id, delta))) {
    await nextTick()
    handleRef.value?.focus()
  }
}
</script>

<template>
  <li class="py-2 first:pt-0 last:pb-0">
    <LessonForm
      v-if="editing"
      :title="$t('admin.courses.editLesson')"
      :initial="lesson"
      @save="save"
      @cancel="activeEditor = null"
    />
    <div
      v-else
      class="group flex items-start gap-1"
    >
      <button
        ref="handle"
        type="button"
        class="lesson-drag-handle -ml-1 flex size-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none active:cursor-grabbing"
        :aria-label="$t('admin.courses.moveLesson', { number, total })"
        :title="$t('admin.diagnostic.moveHint')"
        @keydown.up.prevent="moveBy(-1)"
        @keydown.down.prevent="moveBy(1)"
      >
        <GripVertical
          class="size-4"
          aria-hidden="true"
        />
      </button>
      <div
        class="flex min-w-0 flex-1 flex-col gap-1 pt-1"
        :class="{ 'text-muted-foreground': !lesson.isActive }"
        @dblclick="activeEditor = editorKey"
      >
        <p class="text-sm">
          <span class="text-muted-foreground">{{ number }}.</span>
          {{ localize(lesson.title, locale) }}
        </p>
        <div class="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <Badge
            v-if="!lesson.isActive"
            variant="outline"
          >
            {{ $t('admin.courses.inactive') }}
          </Badge>
          <span v-if="lesson.durationSeconds">{{ formatDuration(lesson.durationSeconds) }} ·</span>
          <span>{{ $t('admin.courses.usage', { count: lesson.users }, lesson.users) }}</span>
        </div>
      </div>
      <div class="flex items-center">
        <span
          :title="previewable ? $t('admin.courses.previewLesson') : $t('admin.courses.previewUnsaved')"
          class="inline-flex transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
        >
          <NuxtLink
            v-if="previewable"
            :to="`/courses/${lesson.courseId}/${lesson.id}`"
            :aria-label="$t('admin.courses.previewLesson')"
            class="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <Play
              class="size-4"
              aria-hidden="true"
            />
          </NuxtLink>
        </span>
        <IconAction
          :icon="Pencil"
          :label="$t('admin.courses.editLesson')"
          @click="activeEditor = editorKey"
        />
        <IconAction
          :icon="lesson.isActive ? EyeOff : Eye"
          :label="$t(lesson.isActive ? 'admin.courses.deactivateLesson' : 'admin.courses.activateLesson')"
          @click="run(() => editor.updateLesson(lesson.id, { isActive: !lesson.isActive }))"
        />
        <IconAction
          :icon="Trash2"
          :label="$t('admin.courses.deleteLesson')"
          :disabled="!deletable"
          :hint="deletable ? undefined : $t('admin.courses.deleteLessonDisabled')"
          @click="confirmOpen = true"
        />
      </div>
    </div>

    <ConfirmDelete
      v-model:open="confirmOpen"
      :title="$t('admin.courses.confirmDeleteLesson.title')"
      :description="$t('admin.courses.confirmDeleteLesson.description')"
      @confirm="run(() => editor.deleteLesson(lesson.id))"
    />
  </li>
</template>
