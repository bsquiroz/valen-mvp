<script setup lang="ts">
import { ArrowLeft } from '@lucide/vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { localize } from '@/lib/localizedText'
import ChallengeTracker from './ChallengeTracker.vue'
import { useChallengesData } from './useChallengesData'

const props = defineProps<{ challengeId: string }>()

const { store, status, load } = useChallengesData()
const locale = useContentLocale()

const challenge = computed(() => store.challengeById(props.challengeId))
const enrollment = computed(() => store.enrollmentById.get(props.challengeId))
const targetDays = computed(() => enrollment.value?.targetDays ?? challenge.value?.durationDays ?? 1)
</script>

<template>
  <div class="mx-auto flex max-w-3xl flex-col gap-4">
    <NuxtLink
      to="/challenges"
      class="inline-flex items-center gap-1 self-start text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft class="size-4" />
      {{ $t('challenges.back') }}
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
      v-else-if="!challenge"
      class="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground"
    >
      {{ $t('challenges.notFound') }}
    </p>

    <template v-else>
      <PageHeader :title="localize(challenge.title, locale)">
        <template #badge>
          <Badge variant="secondary">
            {{ $t(`pillars.${challenge.pillar}`) }}
          </Badge>
          <Badge variant="outline">
            {{ targetDays === 1 ? $t('challenges.oneTime') : $t('challenges.durationDays', { count: targetDays }, targetDays) }}
          </Badge>
          <Badge
            v-if="!challenge.isActive"
            variant="outline"
          >
            {{ $t('challenges.inactive') }}
          </Badge>
        </template>
      </PageHeader>

      <p class="whitespace-pre-line text-muted-foreground">
        {{ localize(challenge.description, locale) }}
      </p>

      <p
        v-if="targetDays > 1"
        class="text-sm text-muted-foreground"
      >
        {{ $t('challenges.howItWorks', { count: targetDays }) }}
      </p>

      <div class="rounded-lg border p-4">
        <ChallengeTracker
          :challenge="challenge"
          :enrollment="enrollment"
        />
      </div>
    </template>
  </div>
</template>
