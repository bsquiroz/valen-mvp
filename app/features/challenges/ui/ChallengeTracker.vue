<script setup lang="ts">
import { CircleCheck, Flame } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { localIsoDate } from '@/lib/dates'
import type { Challenge, Enrollment } from '../data/challenges'
import { challengeProgress, challengeState, checkedInOn, currentStreak } from '../data/challenges'
import { useChallengesStore } from '../store'

// Estado y acciones de un reto: empezar, check-in del día (una escritura al día) y avance.
const props = defineProps<{
  challenge: Challenge
  enrollment?: Enrollment
}>()

const store = useChallengesStore()
const today = localIsoDate()
const pending = ref(false)
const failed = ref(false)

const state = computed(() => challengeState(props.enrollment))
const progress = computed(() => (props.enrollment ? challengeProgress(props.enrollment) : null))
const streak = computed(() => (props.enrollment ? currentStreak(props.enrollment, today) : 0))
const doneToday = computed(() => !!props.enrollment && checkedInOn(props.enrollment, today))
const oneTime = computed(() => (props.enrollment?.targetDays ?? props.challenge.durationDays) === 1)
// Con pocos días se muestran puntos; con muchos, una barra
const showDots = computed(() => !!progress.value && progress.value.total <= 14)

async function run(action: () => Promise<void>) {
  failed.value = false
  pending.value = true
  try {
    await action()
  }
  catch {
    failed.value = true
  }
  finally {
    pending.value = false
  }
}

const start = () => run(() => store.start(props.challenge.id))
const checkIn = () => run(() => store.checkIn(props.challenge.id, today))
</script>

<template>
  <div class="flex flex-col gap-3">
    <template v-if="state === 'in_progress' && progress && !oneTime">
      <div
        v-if="showDots"
        class="flex flex-wrap gap-1.5"
        role="img"
        :aria-label="$t('challenges.dayProgress', { ...progress })"
      >
        <span
          v-for="day in progress.total"
          :key="day"
          class="size-3 rounded-full"
          :class="day <= progress.done ? 'bg-primary' : 'bg-muted'"
        />
      </div>
      <ProgressBar
        v-else
        :value="progress.percent"
        :label="$t('challenges.dayProgress', { ...progress })"
      />
      <p class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
        <span>{{ $t('challenges.dayProgress', { ...progress }) }}</span>
        <span
          v-if="streak > 0"
          class="inline-flex items-center gap-1"
        >
          <Flame
            class="size-4 text-primary"
            aria-hidden="true"
          />
          {{ $t('challenges.streak', { count: streak }, streak) }}
        </span>
      </p>
    </template>

    <div class="flex flex-wrap items-center gap-2">
      <Button
        v-if="state === 'not_started'"
        :disabled="pending || !challenge.isActive"
        @click="start"
      >
        {{ $t('challenges.start') }}
      </Button>
      <template v-else-if="state === 'in_progress'">
        <p
          v-if="doneToday"
          class="inline-flex items-center gap-1.5 text-sm text-muted-foreground"
        >
          <CircleCheck
            class="size-4 text-primary"
            aria-hidden="true"
          />
          {{ $t('challenges.checkedInToday') }}
        </p>
        <Button
          v-else
          :disabled="pending"
          @click="checkIn"
        >
          {{ oneTime ? $t('challenges.markDone') : $t('challenges.checkIn') }}
        </Button>
      </template>
      <p
        v-else
        class="inline-flex items-center gap-1.5 text-sm font-medium"
      >
        <CircleCheck
          class="size-5 text-primary"
          aria-hidden="true"
        />
        {{ $t('challenges.completed') }}
      </p>
    </div>

    <p
      v-if="failed"
      class="text-sm text-destructive"
      role="alert"
    >
      {{ $t('challenges.actionError') }}
    </p>
  </div>
</template>
