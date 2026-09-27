<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PILLARS } from '@/lib/pillars'
import { PROGRESS_SOURCES } from '../data/progress'
import { useProgressData } from './useProgressData'

// Avance de cada pilar (plan, lecciones y retos), para el inicio.
const { status, byPillar, total, load } = useProgressData()
</script>

<template>
  <Card v-if="status === 'ready' && total.total">
    <CardHeader>
      <CardTitle as="h2">
        {{ $t('progress.title') }}
      </CardTitle>
      <CardDescription>
        {{ $t('progress.total', { percent: total.percent }) }}
      </CardDescription>
    </CardHeader>
    <CardContent>
      <ul class="flex flex-col gap-5">
        <li
          v-for="pillar in PILLARS"
          :key="pillar"
          class="flex flex-col gap-1.5"
        >
          <div class="flex items-baseline justify-between gap-2 text-sm">
            <span class="font-medium">{{ $t(`pillars.${pillar}`) }}</span>
            <span class="text-muted-foreground">{{ byPillar[pillar].overall.percent }}%</span>
          </div>
          <ProgressBar
            :value="byPillar[pillar].overall.percent"
            :label="$t(`pillars.${pillar}`)"
          />
          <p
            v-if="byPillar[pillar].overall.total"
            class="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground"
          >
            <template
              v-for="source in PROGRESS_SOURCES"
              :key="source"
            >
              <span v-if="byPillar[pillar].sources[source].total">
                {{ $t(`progress.sources.${source}`, { done: byPillar[pillar].sources[source].done, total: byPillar[pillar].sources[source].total }) }}
              </span>
            </template>
            <span v-if="byPillar[pillar].challengesInProgress">
              {{ $t('progress.challengesInProgress', { count: byPillar[pillar].challengesInProgress }, byPillar[pillar].challengesInProgress) }}
            </span>
          </p>
          <p
            v-else
            class="text-xs text-muted-foreground"
          >
            {{ $t('progress.noContent') }}
          </p>
        </li>
      </ul>
    </CardContent>
  </Card>
  <div
    v-else-if="status === 'error'"
    class="flex items-center gap-3 text-sm text-muted-foreground"
  >
    <span>{{ $t('progress.loadError') }}</span>
    <Button
      variant="outline"
      size="sm"
      @click="load"
    >
      {{ $t('common.retry') }}
    </Button>
  </div>
</template>
