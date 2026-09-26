<script setup lang="ts">
import { ArrowLeft, ArrowRight, CircleCheck, Lock } from '@lucide/vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useProfileStore } from '@/features/profile/store'
import { formatDuration } from '@/lib/duration'
import { localize } from '@/lib/localizedText'
import { fetchLessonVideoUrl } from '../api/courses'
import { adjacentLessons, courseProgress, isLessonUnlocked, resumeLesson } from '../data/courses'
import LessonTimeline from './LessonTimeline.vue'
import { useCoursesData } from './useCoursesData'

const props = defineProps<{ courseId: string, lessonId: string }>()

const { store, status, load } = useCoursesData()
const locale = useContentLocale()
const profileStore = useProfileStore()

const course = computed(() => store.courseById(props.courseId))
const lesson = computed(() => course.value?.lessons.find(candidate => candidate.id === props.lessonId) ?? null)
const lessonIndex = computed(() => course.value?.lessons.findIndex(candidate => candidate.id === props.lessonId) ?? -1)
const adjacent = computed(() => (course.value ? adjacentLessons(course.value, props.lessonId) : { previous: null, next: null }))
const isCompleted = computed(() => store.completed.has(props.lessonId))
// Secuencial: se abre al completar la anterior (los admins pueden ver todas)
const isUnlocked = computed(() => profileStore.isAdmin || (!!course.value && isLessonUnlocked(course.value, store.completed, props.lessonId)))
const resume = computed(() => (course.value ? resumeLesson(course.value, store.completed) : null))
const progress = computed(() => (course.value ? courseProgress(course.value, store.completed) : null))
// A la siguiente se avanza completando esta
const canGoNext = computed(() => !!adjacent.value.next && (isCompleted.value || profileStore.isAdmin))

// El enlace del video se pide firmado a la Edge Function (expira en unas horas)
const videoUrl = ref<string | null>(null)
const videoStatus = ref<'loading' | 'error' | 'ready'>('loading')

async function loadVideo() {
  if (!isUnlocked.value) return
  videoStatus.value = 'loading'
  videoUrl.value = null
  try {
    videoUrl.value = (await fetchLessonVideoUrl(props.lessonId)).url
    videoStatus.value = 'ready'
  }
  catch {
    videoStatus.value = 'error'
  }
}

// Espera a tener cursos y progreso para saber si la lección está desbloqueada
watch([() => props.lessonId, isUnlocked], ([, unlocked]) => {
  if (unlocked) loadVideo()
}, { immediate: true })

const saving = ref(false)
const saveError = ref(false)

// Completar es la única forma de avanzar: una escritura, definitiva, que abre la siguiente
async function completeAndContinue() {
  saveError.value = false
  saving.value = true
  try {
    await store.completeLesson(props.lessonId)
  }
  catch {
    saveError.value = true
    return
  }
  finally {
    saving.value = false
  }
  if (adjacent.value.next) await navigateTo(`/courses/${props.courseId}/${adjacent.value.next.id}`)
}
</script>

<template>
  <div class="mx-auto flex max-w-5xl flex-col gap-4">
    <NuxtLink
      :to="`/courses/${courseId}`"
      class="inline-flex items-center gap-1 self-start text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft class="size-4" />
      {{ $t('courses.backToCourse') }}
    </NuxtLink>

    <p
      v-if="status === 'loading'"
      class="text-sm text-muted-foreground"
    >
      {{ $t('common.loading') }}
    </p>

    <div
      v-else-if="status === 'error'"
      class="flex flex-col items-start gap-4"
    >
      <Alert variant="destructive">
        <AlertDescription>{{ $t('courses.loadError') }}</AlertDescription>
      </Alert>
      <Button
        variant="outline"
        @click="load"
      >
        {{ $t('common.retry') }}
      </Button>
    </div>

    <p
      v-else-if="!course || !lesson"
      class="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground"
    >
      {{ $t('courses.notFound') }}
    </p>

    <div
      v-else
      class="grid gap-6 lg:grid-cols-3 lg:items-start"
    >
      <!-- Mapa del curso: a la izquierda y fijo en desktop; al final en móvil (el video va primero) -->
      <aside
        class="order-last flex flex-col gap-4 lg:sticky lg:top-20 lg:order-first lg:max-h-[calc(100dvh-6rem)]"
        :aria-label="$t('courses.courseContent')"
      >
        <div class="flex flex-col gap-3 rounded-lg border bg-card p-4 text-card-foreground">
          <NuxtLink
            :to="`/courses/${courseId}`"
            class="font-semibold tracking-tight hover:underline"
          >
            {{ localize(course.title, locale) }}
          </NuxtLink>
          <template v-if="progress">
            <ProgressBar
              :value="progress.percent"
              :label="$t('courses.progress', { ...progress })"
            />
            <p class="text-xs text-muted-foreground">
              {{ $t('courses.percentCompleted', { percent: progress.percent }) }} · {{ $t('courses.progress', { ...progress }) }}
            </p>
          </template>
        </div>
        <div class="min-h-0 overflow-y-auto">
          <LessonTimeline
            :course="course"
            :completed="store.completed"
            :current-lesson-id="lessonId"
            :unlock-all="profileStore.isAdmin"
          />
        </div>
      </aside>

      <section class="flex min-w-0 flex-col gap-4 lg:col-span-2">
        <div
          v-if="!isUnlocked"
          class="flex flex-col items-start gap-4 rounded-lg border border-dashed p-6"
        >
          <p class="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock
              class="size-4 shrink-0"
              aria-hidden="true"
            />
            {{ $t('courses.lockedDescription') }}
          </p>
          <Button
            v-if="resume"
            as-child
          >
            <NuxtLink :to="`/courses/${courseId}/${resume.id}`">
              {{ $t('courses.goToCurrent') }}
            </NuxtLink>
          </Button>
        </div>

        <template v-else>
          <div class="aspect-video w-full overflow-hidden rounded-lg border bg-muted">
            <iframe
              v-if="videoStatus === 'ready' && videoUrl"
              :key="videoUrl"
              :src="videoUrl"
              :title="$t('courses.playerTitle', { title: localize(lesson.title, locale) })"
              class="size-full"
              loading="lazy"
              allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
              allowfullscreen
            />
            <div
              v-else-if="videoStatus === 'error'"
              class="flex size-full flex-col items-center justify-center gap-3 p-4 text-center text-sm text-muted-foreground"
            >
              {{ $t('courses.videoError') }}
              <Button
                variant="outline"
                size="sm"
                @click="loadVideo"
              >
                {{ $t('common.retry') }}
              </Button>
            </div>
            <p
              v-else
              class="flex size-full items-center justify-center text-sm text-muted-foreground"
            >
              {{ $t('common.loading') }}
            </p>
          </div>

          <!-- Título a la izquierda y "Completar y seguir" a la derecha (debajo en móvil) -->
          <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div class="flex min-w-0 flex-col gap-1">
              <div class="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>{{ $t('courses.lessonNumber', { number: lessonIndex + 1 }) }}</span>
                <span v-if="lesson.durationSeconds">· {{ formatDuration(lesson.durationSeconds) }}</span>
                <Badge
                  v-if="!lesson.isActive"
                  variant="outline"
                >
                  {{ $t('courses.inactive') }}
                </Badge>
              </div>
              <h1 class="text-2xl font-semibold tracking-tight">
                {{ localize(lesson.title, locale) }}
              </h1>
              <p
                v-if="lesson.description"
                class="whitespace-pre-line text-muted-foreground"
              >
                {{ localize(lesson.description, locale) }}
              </p>
            </div>
            <div class="shrink-0">
              <span
                v-if="isCompleted"
                class="inline-flex items-center gap-1.5 text-sm font-medium"
              >
                <CircleCheck
                  class="size-5 text-primary"
                  aria-hidden="true"
                />
                {{ $t('courses.completed') }}
              </span>
              <Button
                v-else
                :disabled="saving || !lesson.isActive"
                @click="completeAndContinue"
              >
                {{ adjacent.next ? $t('courses.completeAndNext') : $t('courses.markCompleted') }}
                <ArrowRight v-if="adjacent.next" />
              </Button>
            </div>
          </div>

          <Alert
            v-if="saveError"
            variant="destructive"
          >
            <AlertDescription>{{ $t('courses.completeError') }}</AlertDescription>
          </Alert>

          <nav
            :aria-label="$t('courses.lessonNav')"
            class="flex items-center justify-between gap-2 border-t pt-4"
          >
            <Button
              v-if="adjacent.previous"
              variant="ghost"
              as-child
            >
              <NuxtLink :to="`/courses/${courseId}/${adjacent.previous.id}`">
                <ArrowLeft />
                {{ $t('common.back') }}
              </NuxtLink>
            </Button>
            <span v-else />
            <Button
              v-if="canGoNext && adjacent.next"
              variant="outline"
              as-child
            >
              <NuxtLink :to="`/courses/${courseId}/${adjacent.next.id}`">
                {{ $t('courses.nextLesson') }}
                <ArrowRight />
              </NuxtLink>
            </Button>
            <span
              v-else-if="adjacent.next"
              class="inline-flex items-center gap-1.5 text-sm text-muted-foreground"
            >
              <Lock
                class="size-4"
                aria-hidden="true"
              />
              {{ $t('courses.nextLocked') }}
            </span>
          </nav>
        </template>
      </section>
    </div>
  </div>
</template>
