<script setup lang="ts">
import { ChevronRight, Clock } from '@lucide/vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { roundedMinutes } from '@/lib/duration'
import { localize } from '@/lib/localizedText'
import { PILLARS } from '@/lib/pillars'
import { courseDurationSeconds, courseProgress, coursesByPillar } from '../data/courses'
import { useCoursesData } from './useCoursesData'

const { store, status, load } = useCoursesData()
const locale = useContentLocale()

const groups = computed(() => coursesByPillar(store.courses ?? []))
const pillars = computed(() => PILLARS.filter(pillar => groups.value[pillar].length))
</script>

<template>
  <div class="mx-auto flex max-w-3xl flex-col gap-6">
    <PageHeader
      :title="$t('courses.title')"
      :description="$t('courses.description')"
    />

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
      v-else-if="!pillars.length"
      class="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground"
    >
      {{ $t('courses.empty') }}
    </p>

    <section
      v-for="pillar in pillars"
      v-else
      :key="pillar"
      class="flex flex-col gap-3"
    >
      <h2 class="text-lg font-semibold tracking-tight">
        {{ $t(`pillars.${pillar}`) }}
      </h2>
      <NuxtLink
        v-for="course in groups[pillar]"
        :key="course.id"
        :to="`/courses/${course.id}`"
        class="group rounded-xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <Card class="transition-colors group-hover:bg-accent">
          <CardHeader>
            <CardTitle
              as="h3"
              class="flex items-center gap-2"
            >
              {{ localize(course.title, locale) }}
              <ChevronRight
                class="ml-auto size-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
            </CardTitle>
            <CardDescription v-if="course.description">
              {{ localize(course.description, locale) }}
            </CardDescription>
          </CardHeader>
          <CardContent class="flex flex-col gap-2">
            <p class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span>{{ $t('courses.lessonCount', { count: course.lessons.length }, course.lessons.length) }}</span>
              <span
                v-if="courseDurationSeconds(course)"
                class="inline-flex items-center gap-1"
              >
                <Clock
                  class="size-3.5"
                  aria-hidden="true"
                />
                {{ $t('courses.minutes', { count: roundedMinutes(courseDurationSeconds(course)) }) }}
              </span>
            </p>
            <ProgressBar
              :value="courseProgress(course, store.completed).percent"
              :label="$t('courses.progress', { ...courseProgress(course, store.completed) })"
            />
          </CardContent>
        </Card>
      </NuxtLink>
    </section>
  </div>
</template>
