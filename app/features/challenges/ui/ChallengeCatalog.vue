<script setup lang="ts">
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { PILLARS } from '@/lib/pillars'
import { challengesByPillar, challengeState } from '../data/challenges'
import ChallengeCard from './ChallengeCard.vue'
import { useChallengesData } from './useChallengesData'

const { store, status, load } = useChallengesData()

// Arriba los retos en curso; debajo el catálogo por pilar (sin repetir los que están en curso)
const inProgress = computed(() => (store.challenges ?? []).filter(challenge => challengeState(store.enrollmentById.get(challenge.id)) === 'in_progress'))
const groups = computed(() => challengesByPillar((store.challenges ?? []).filter(challenge => !inProgress.value.includes(challenge))))
const pillars = computed(() => PILLARS.filter(pillar => groups.value[pillar].length))
</script>

<template>
  <div class="mx-auto flex max-w-3xl flex-col gap-6">
    <PageHeader
      :title="$t('challenges.title')"
      :description="$t('challenges.description')"
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
        <AlertDescription>{{ $t('challenges.loadError') }}</AlertDescription>
      </Alert>
      <Button
        variant="outline"
        @click="load"
      >
        {{ $t('common.retry') }}
      </Button>
    </div>

    <p
      v-else-if="!store.challenges?.length"
      class="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground"
    >
      {{ $t('challenges.empty') }}
    </p>

    <template v-else>
      <section
        v-if="inProgress.length"
        class="flex flex-col gap-3"
      >
        <h2 class="text-lg font-semibold tracking-tight">
          {{ $t('challenges.inProgressTitle') }}
        </h2>
        <ChallengeCard
          v-for="challenge in inProgress"
          :key="challenge.id"
          :challenge="challenge"
          :enrollment="store.enrollmentById.get(challenge.id)"
        />
      </section>

      <section
        v-for="pillar in pillars"
        :key="pillar"
        class="flex flex-col gap-3"
      >
        <h2 class="text-lg font-semibold tracking-tight">
          {{ $t(`pillars.${pillar}`) }}
        </h2>
        <ChallengeCard
          v-for="challenge in groups[pillar]"
          :key="challenge.id"
          :challenge="challenge"
          :enrollment="store.enrollmentById.get(challenge.id)"
        />
      </section>
    </template>
  </div>
</template>
