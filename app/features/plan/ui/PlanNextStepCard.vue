<script setup lang="ts">
import { ArrowRight } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { localize } from '@/lib/localizedText'
import { usePlanData } from './usePlanData'

// Siguiente paso del plan, para el inicio.
const { status, latest, progress, next, load } = usePlanData()
const locale = useContentLocale()

onMounted(load)
</script>

<template>
  <Card v-if="status === 'ready' && latest && progress.total">
    <CardHeader>
      <CardTitle as="h2">
        {{ next ? $t('plan.next.title') : $t('plan.next.doneTitle') }}
      </CardTitle>
      <CardDescription>
        {{ $t('plan.progress', { done: progress.done, total: progress.total }) }}
      </CardDescription>
    </CardHeader>
    <CardContent class="flex flex-col gap-4">
      <ProgressBar
        :value="progress.percent"
        :label="$t('plan.progress', { done: progress.done, total: progress.total })"
      />
      <div
        v-if="next"
        class="flex flex-col gap-1"
      >
        <span class="text-xs text-muted-foreground">{{ $t(`pillars.${next.pillar}`) }}</span>
        <span class="font-medium">{{ localize(next.title, locale) }}</span>
      </div>
      <p
        v-else
        class="text-sm text-muted-foreground"
      >
        {{ $t('plan.next.doneDescription') }}
      </p>
      <Button
        variant="outline"
        class="self-start"
        as-child
      >
        <NuxtLink to="/plan">
          {{ $t('plan.next.open') }}
          <ArrowRight />
        </NuxtLink>
      </Button>
    </CardContent>
  </Card>
</template>
