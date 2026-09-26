<script setup lang="ts">
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { scoreLevel } from '@/features/diagnostic/data/diagnostic'
import { useProfileStore } from '@/features/profile/store'
import { progressOf } from '../data/plan'
import { usePlanStore } from '../store'
import PlanStepItem from './PlanStepItem.vue'
import { usePlanData } from './usePlanData'

const planStore = usePlanStore()
const profileStore = useProfileStore()
const { status, latest, priority, groups, progress, load } = usePlanData()

const toggleError = ref(false)
const pending = ref(new Set<string>())

async function toggle(templateId: string, completed: boolean) {
  toggleError.value = false
  pending.value.add(templateId)
  try {
    await planStore.toggleStep(templateId, completed)
  }
  catch {
    toggleError.value = true
  }
  finally {
    pending.value.delete(templateId)
  }
}

onMounted(load)
</script>

<template>
  <div class="mx-auto flex max-w-2xl flex-col gap-4">
    <PageHeader
      :title="$t('plan.title')"
      :description="$t('plan.description')"
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
        <AlertDescription>{{ $t('plan.loadError') }}</AlertDescription>
      </Alert>
      <Button
        variant="outline"
        @click="load"
      >
        {{ $t('common.retry') }}
      </Button>
    </div>

    <div
      v-else-if="!latest"
      class="flex flex-col items-start gap-4 rounded-lg border border-dashed p-6 text-sm text-muted-foreground"
    >
      {{ $t('plan.noDiagnostic') }}
      <Button as-child>
        <NuxtLink to="/diagnostic">
          {{ $t('diagnostic.intro.start') }}
        </NuxtLink>
      </Button>
    </div>

    <template v-else>
      <div class="flex flex-col gap-2">
        <p class="text-sm text-muted-foreground">
          {{ $t('plan.progress', { done: progress.done, total: progress.total }) }}
        </p>
        <ProgressBar
          :value="progress.percent"
          :label="$t('plan.progress', { done: progress.done, total: progress.total })"
        />
      </div>

      <Alert
        v-if="toggleError"
        variant="destructive"
      >
        <AlertDescription>{{ $t('plan.toggleError') }}</AlertDescription>
      </Alert>

      <Card
        v-for="(pillar, index) in priority"
        :key="pillar"
      >
        <CardHeader>
          <p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {{ $t('plan.priority', { number: index + 1 }) }}
          </p>
          <CardTitle
            as="h2"
            class="flex flex-wrap items-center gap-2"
          >
            {{ $t(`pillars.${pillar}`) }}
            <Badge variant="secondary">
              {{ $t(`diagnostic.levels.${scoreLevel(latest.scores[pillar])}`) }} · {{ latest.scores[pillar] }}/100
            </Badge>
          </CardTitle>
          <CardDescription v-if="groups[pillar].length">
            {{ $t('plan.pillarProgress', { done: progressOf(groups[pillar]).done, total: groups[pillar].length }) }}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul
            v-if="groups[pillar].length"
            class="-mx-2 flex flex-col"
          >
            <PlanStepItem
              v-for="step in groups[pillar]"
              :key="step.templateId"
              :step="step"
              :disabled="pending.has(step.templateId)"
              @toggle="toggle(step.templateId, $event)"
            />
          </ul>
          <p
            v-else
            class="text-sm text-muted-foreground"
          >
            {{ $t('plan.noSteps') }}
          </p>
        </CardContent>
      </Card>

      <!-- Solo si un desarrollador habilitó repetir el diagnóstico -->
      <p
        v-if="profileStore.profile?.diagnosticRetakeAllowed"
        class="text-sm text-muted-foreground"
      >
        {{ $t('plan.updateNote') }}
        <NuxtLink
          to="/diagnostic"
          class="font-medium text-foreground underline-offset-4 hover:underline"
        >
          {{ $t('diagnostic.results.retake') }}
        </NuxtLink>
      </p>
    </template>
  </div>
</template>
