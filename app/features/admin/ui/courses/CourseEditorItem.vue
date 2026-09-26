<script setup lang="ts">
import { Eye, EyeOff, GripVertical, Pencil, Plus, Trash2 } from '@lucide/vue'
import { VueDraggable } from 'vue-draggable-plus'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { AdminCourse, AdminLesson, CourseForm as CForm, LessonForm as LForm } from '@/features/courses/data/adminCourses'
import { canDeleteCourse } from '@/features/courses/data/adminCourses'
import { localize } from '@/lib/localizedText'
import CourseForm from './CourseForm.vue'
import { useCoursesEditorContext } from './editorContext'
import LessonEditorItem from './LessonEditorItem.vue'
import LessonForm from './LessonForm.vue'

const props = defineProps<{
  course: AdminCourse
  number: number
  total: number
}>()

const { editor, activeEditor, run } = useCoursesEditorContext()
const locale = useContentLocale()

const editorKey = computed(() => `course:${props.course.id}`)
const newLessonKey = computed(() => `new-lesson:${props.course.id}`)
const deletable = computed(() => canDeleteCourse(props.course))
const confirmOpen = ref(false)

async function save(form: CForm) {
  if (await run(() => editor.updateCourse(props.course.id, form))) activeEditor.value = null
}

async function createLesson(form: LForm) {
  if (await run(() => editor.createLesson(props.course.id, form))) activeEditor.value = null
}

function onReorderLessons(list: AdminLesson[]) {
  run(() => editor.reorderLessons(props.course.id, list.map(lesson => lesson.id)))
}

// Mover con teclado desde el asa; se devuelve el foco porque el nodo cambia de lugar.
const handleRef = useTemplateRef<HTMLButtonElement>('handle')

async function moveBy(delta: number) {
  if (await run(() => editor.moveCourse(props.course.id, delta))) {
    await nextTick()
    handleRef.value?.focus()
  }
}
</script>

<template>
  <li class="flex flex-col gap-3 py-4 first:pt-0 last:pb-0">
    <CourseForm
      v-if="activeEditor === editorKey"
      :title="$t('admin.courses.editCourse')"
      :initial="course"
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
        class="course-drag-handle -ml-1 flex size-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none active:cursor-grabbing"
        :aria-label="$t('admin.courses.moveCourse', { number, total })"
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
        :class="{ 'text-muted-foreground': !course.isActive }"
        @dblclick="activeEditor = editorKey"
      >
        <p class="font-medium">
          {{ localize(course.title, locale) }}
        </p>
        <p
          v-if="course.description"
          class="text-sm text-muted-foreground"
        >
          {{ localize(course.description, locale) }}
        </p>
        <div class="flex flex-wrap items-center gap-1.5">
          <Badge
            v-if="!course.isActive"
            variant="outline"
          >
            {{ $t('admin.courses.inactive') }}
          </Badge>
          <span class="text-xs text-muted-foreground">
            {{ $t('courses.lessonCount', { count: course.lessons.length }, course.lessons.length) }}
          </span>
        </div>
      </div>
      <div class="flex items-center">
        <IconAction
          :icon="Pencil"
          :label="$t('admin.courses.editCourse')"
          @click="activeEditor = editorKey"
        />
        <IconAction
          :icon="course.isActive ? EyeOff : Eye"
          :label="$t(course.isActive ? 'admin.courses.deactivateCourse' : 'admin.courses.activateCourse')"
          @click="run(() => editor.updateCourse(course.id, { isActive: !course.isActive }))"
        />
        <IconAction
          :icon="Trash2"
          :label="$t('admin.courses.deleteCourse')"
          :disabled="!deletable"
          :hint="deletable ? undefined : $t('admin.courses.deleteCourseDisabled')"
          @click="confirmOpen = true"
        />
      </div>
    </div>

    <div class="flex flex-col gap-2 border-l pl-4 sm:ml-4">
      <VueDraggable
        v-if="course.lessons.length"
        :model-value="course.lessons"
        tag="ol"
        handle=".lesson-drag-handle"
        :group="`lessons-${course.id}`"
        :animation="150"
        ghost-class="drag-ghost"
        class="flex flex-col divide-y"
        @update:model-value="onReorderLessons"
      >
        <LessonEditorItem
          v-for="(lesson, index) in course.lessons"
          :key="lesson.id"
          :lesson="lesson"
          :number="index + 1"
          :total="course.lessons.length"
        />
      </VueDraggable>
      <p
        v-else
        class="text-sm text-muted-foreground"
      >
        {{ $t('admin.courses.noLessons') }}
      </p>

      <LessonForm
        v-if="activeEditor === newLessonKey"
        :title="$t('admin.courses.newLesson')"
        :save-label="$t('admin.courses.createLesson')"
        @save="createLesson"
        @cancel="activeEditor = null"
      />
      <Button
        v-else
        variant="ghost"
        size="sm"
        class="self-start text-muted-foreground"
        @click="activeEditor = newLessonKey"
      >
        <Plus />
        {{ $t('admin.courses.addLesson') }}
      </Button>
    </div>

    <ConfirmDelete
      v-model:open="confirmOpen"
      :title="$t('admin.courses.confirmDeleteCourse.title')"
      :description="$t('admin.courses.confirmDeleteCourse.description', { count: course.lessons.length })"
      @confirm="run(() => editor.deleteCourse(course.id))"
    />
  </li>
</template>
