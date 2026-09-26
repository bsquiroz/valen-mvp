<script setup lang="ts">
import { ChevronRight } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { localize } from '@/lib/localizedText'
import type { Challenge, Enrollment } from '../data/challenges'
import ChallengeTracker from './ChallengeTracker.vue'

defineProps<{
  challenge: Challenge
  enrollment?: Enrollment
}>()

const locale = useContentLocale()
</script>

<template>
  <Card>
    <CardHeader>
      <!-- El pilar va siempre: en "En curso" el reto ya no está bajo el título de su pilar -->
      <div class="flex flex-wrap items-center gap-2">
        <Badge variant="outline">
          {{ $t(`pillars.${challenge.pillar}`) }}
        </Badge>
        <Badge variant="secondary">
          {{ challenge.durationDays === 1 ? $t('challenges.oneTime') : $t('challenges.durationDays', { count: challenge.durationDays }, challenge.durationDays) }}
        </Badge>
        <Badge
          v-if="!challenge.isActive"
          variant="outline"
        >
          {{ $t('challenges.inactive') }}
        </Badge>
      </div>
      <CardTitle as="h3">
        <NuxtLink
          :to="`/challenges/${challenge.id}`"
          class="inline-flex items-center gap-1 hover:underline"
        >
          {{ localize(challenge.title, locale) }}
          <ChevronRight
            class="size-4 text-muted-foreground"
            aria-hidden="true"
          />
        </NuxtLink>
      </CardTitle>
      <CardDescription class="line-clamp-3 whitespace-pre-line">
        {{ localize(challenge.description, locale) }}
      </CardDescription>
    </CardHeader>
    <CardContent>
      <ChallengeTracker
        :challenge="challenge"
        :enrollment="enrollment"
      />
    </CardContent>
  </Card>
</template>
