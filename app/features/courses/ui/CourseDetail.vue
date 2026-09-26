<script setup lang="ts">
import { ArrowLeft } from '@lucide/vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useProfileStore } from '@/features/profile/store'
import { localize } from '@/lib/localizedText'
import { courseProgress, resumeLesson } from '../data/courses'
import LessonTimeline from './LessonTimeline.vue'
import { useCoursesData } from './useCoursesData'

const props = defineProps<{ courseId: string }>()

const { store, status, load } = useCoursesData()
const locale = useContentLocale()
const profileStore = useProfileStore()

const course = computed(() => store.courseById(props.courseId))
const progress = computed(() => (course.value ? courseProgress(course.value, store.completed) : null))
const resume = computed(() => (course.value ? resumeLesson(course.value, store.completed) : null))
</script>

<template>
  <div class="mx-auto flex max-w-3xl flex-col gap-4">
    <NuxtLink
      to="/courses"
      class="inline-flex items-center gap-1 self-start text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft class="size-4" />
      {{ $t('courses.back') }}
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
      v-else-if="!course || !progress"
      class="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground"
    >
      {{ $t('courses.notFound') }}
    </p>

    <template v-else>
      <PageHeader
        :title="localize(course.title, locale)"
        :description="course.description ? localize(course.description, locale) : undefined"
      >
        <template #badge>
          <Badge variant="secondary">
            {{ $t(`pillars.${course.pillar}`) }}
          </Badge>
          <Badge
            v-if="!course.isActive"
            variant="outline"
          >
            {{ $t('courses.inactive') }}
          </Badge>
        </template>
      </PageHeader>

      <div class="flex flex-col gap-2">
        <p class="text-sm text-muted-foreground">
          {{ $t('courses.progress', { ...progress }) }}
        </p>
        <ProgressBar
          :value="progress.percent"
          :label="$t('courses.progress', { ...progress })"
        />
      </div>

      <Button
        v-if="resume"
        class="self-start"
        as-child
      >
        <NuxtLink :to="`/courses/${course.id}/${resume.id}`">
          {{ progress.done === 0 ? $t('courses.start') : progress.done === progress.total ? $t('courses.review') : $t('courses.continue') }}
        </NuxtLink>
      </Button>

      <div class="rounded-lg border p-2">
        <LessonTimeline
          :course="course"
          :completed="store.completed"
          :unlock-all="profileStore.isAdmin"
        />
      </div>
    </template>
  </div>
</template>
