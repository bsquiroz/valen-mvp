<script setup lang="ts">
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/dates'
import { useProfileStore } from '@/features/profile/store'
import { PILLARS } from '@/lib/pillars'
import { useDiagnosticStore } from '../store'
import OpportunityAreas from './OpportunityAreas.vue'
import PillarScores from './PillarScores.vue'

const store = useDiagnosticStore()
const profileStore = useProfileStore()
const { locale } = useI18n()

const status = ref<'loading' | 'error' | 'ready'>('loading')
const latest = computed(() => store.latestResult)
const previous = computed(() => store.results?.slice(1) ?? [])

async function load() {
  status.value = 'loading'
  try {
    await store.loadResults(true)
    status.value = 'ready'
  }
  catch {
    status.value = 'error'
  }
}

onMounted(load)
</script>

<template>
  <div class="mx-auto flex max-w-2xl flex-col gap-4">
    <PageHeader
      :title="$t('diagnostic.results.title')"
      :description="latest ? $t('diagnostic.results.completedOn', { date: formatDate(latest.completedAt, locale) }) : undefined"
    />

    <p
      v-if="status === 'loading'"
      class="text-sm text-muted-foreground"
    >
      {{ $t('common.loading') }}
    </p>

    <Alert
      v-else-if="status === 'error'"
      variant="destructive"
    >
      <AlertDescription>{{ $t('diagnostic.loadError') }}</AlertDescription>
    </Alert>

    <div
      v-else-if="!latest"
      class="flex flex-col items-start gap-4 rounded-lg border border-dashed p-6 text-sm text-muted-foreground"
    >
      {{ $t('diagnostic.results.empty') }}
      <Button as-child>
        <NuxtLink to="/diagnostic">
          {{ $t('diagnostic.intro.start') }}
        </NuxtLink>
      </Button>
    </div>

    <template v-else>
      <Card>
        <CardHeader>
          <CardTitle as="h2">
            {{ $t('diagnostic.results.byPillar') }}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PillarScores :scores="latest.scores" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle as="h2">
            {{ $t('diagnostic.results.opportunities') }}
          </CardTitle>
          <CardDescription>{{ $t('diagnostic.results.opportunitiesDescription') }}</CardDescription>
        </CardHeader>
        <CardContent class="flex flex-col gap-4">
          <OpportunityAreas :scores="latest.scores" />
          <Button
            class="self-start"
            as-child
          >
            <NuxtLink to="/plan">
              {{ $t('plan.next.open') }}
            </NuxtLink>
          </Button>
        </CardContent>
      </Card>

      <Card v-if="previous.length">
        <CardHeader>
          <CardTitle as="h2">
            {{ $t('diagnostic.results.history') }}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul class="flex flex-col divide-y text-sm">
            <li
              v-for="result in previous"
              :key="result.id"
              class="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <span class="font-medium">{{ formatDate(result.completedAt, locale) }}</span>
              <span class="flex flex-wrap gap-x-3 text-muted-foreground">
                <span
                  v-for="pillar in PILLARS"
                  :key="pillar"
                >
                  {{ $t(`pillars.${pillar}`) }} {{ result.scores[pillar] }}
                </span>
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>

      <!-- Solo si un desarrollador habilitó repetirlo -->
      <Button
        v-if="profileStore.profile?.diagnosticRetakeAllowed"
        variant="outline"
        class="self-start"
        as-child
      >
        <NuxtLink to="/diagnostic">
          {{ $t('diagnostic.results.retake') }}
        </NuxtLink>
      </Button>
    </template>
  </div>
</template>
