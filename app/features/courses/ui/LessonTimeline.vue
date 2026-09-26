<script setup lang="ts">
import { Check, Lock } from '@lucide/vue'
import { formatDuration } from '@/lib/duration'
import { localize } from '@/lib/localizedText'
import type { Course } from '../data/courses'
import { lessonStatus } from '../data/courses'

// Mapa del curso: línea de tiempo con lo completado, la lección actual, lo disponible y lo
// bloqueado (las lecciones son secuenciales). Se usa en la página del curso y junto al video.
const props = defineProps<{
  course: Course
  completed: Set<string>
  currentLessonId?: string
  // Los admins pueden abrir todas las lecciones
  unlockAll?: boolean
}>()

const locale = useContentLocale()
const NuxtLink = resolveComponent('NuxtLink')

const items = computed(() => props.course.lessons.map(lesson => ({
  lesson,
  status: lessonStatus(props.course, props.completed, lesson.id, props.unlockAll),
  current: lesson.id === props.currentLessonId,
})))
</script>

<template>
  <ol class="flex flex-col">
    <li
      v-for="({ lesson, status, current }, index) in items"
      :key="lesson.id"
      class="relative"
    >
      <!-- Conector vertical hasta el círculo de la siguiente lección -->
      <span
        v-if="index < items.length - 1"
        class="absolute top-[1.875rem] -bottom-2.5 left-[1.375rem] w-px"
        :class="status === 'completed' ? 'bg-primary' : 'bg-border'"
        aria-hidden="true"
      />
      <component
        :is="status === 'locked' ? 'div' : NuxtLink"
        :to="status === 'locked' ? undefined : `/courses/${course.id}/${lesson.id}`"
        :aria-current="current ? 'step' : undefined"
        class="relative flex items-start gap-3 rounded-md px-3 py-2.5"
        :class="[
          current ? 'bg-accent text-accent-foreground' : '',
          status === 'locked'
            ? 'cursor-not-allowed text-muted-foreground'
            : 'transition-colors hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
        ]"
      >
        <span
          class="flex size-5 shrink-0 items-center justify-center rounded-full"
          aria-hidden="true"
          :class="{
            'bg-primary text-primary-foreground': status === 'completed',
            'border-2 border-primary bg-background': status === 'available' && current,
            'border-2 border-muted-foreground/60 bg-background': status === 'available' && !current,
            'bg-background': status === 'locked',
          }"
        >
          <Check
            v-if="status === 'completed'"
            class="size-3"
          />
          <span
            v-else-if="status === 'available' && current"
            class="size-2 rounded-full bg-primary"
          />
          <Lock
            v-else-if="status === 'locked'"
            class="size-3.5"
          />
        </span>
        <span class="flex min-w-0 flex-1 flex-col gap-0.5">
          <span
            class="text-sm"
            :class="current ? 'font-semibold' : 'font-medium'"
          >
            {{ localize(lesson.title, locale) }}
          </span>
          <span class="text-xs text-muted-foreground">
            {{ lesson.durationSeconds ? $t('courses.lessonMeta', { duration: formatDuration(lesson.durationSeconds) }) : $t('courses.lessonMetaNoDuration') }}
          </span>
          <span class="sr-only">
            {{ current ? $t('courses.current') : '' }}
            {{ status === 'completed' ? $t('courses.completed') : status === 'locked' ? $t('courses.locked') : '' }}
          </span>
        </span>
      </component>
    </li>
  </ol>
</template>
