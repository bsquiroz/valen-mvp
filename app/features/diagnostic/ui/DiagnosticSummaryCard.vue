<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/dates'
import { useDiagnosticStore } from '../store'
import PillarScores from './PillarScores.vue'

// Resumen del último diagnóstico para el inicio.
const store = useDiagnosticStore()
const { locale } = useI18n()
const failed = ref(false)

onMounted(() => {
  store.loadResults().catch(() => {
    failed.value = true
  })
})
</script>

<template>
  <Card v-if="store.latestResult">
    <CardHeader>
      <CardTitle as="h2">
        {{ $t('diagnostic.summary.title') }}
      </CardTitle>
      <CardDescription>
        {{ $t('diagnostic.results.completedOn', { date: formatDate(store.latestResult.completedAt, locale) }) }}
      </CardDescription>
    </CardHeader>
    <CardContent class="flex flex-col gap-6">
      <PillarScores :scores="store.latestResult.scores" />
      <Button
        variant="outline"
        class="self-start"
        as-child
      >
        <NuxtLink to="/diagnostic/results">
          {{ $t('diagnostic.summary.details') }}
        </NuxtLink>
      </Button>
    </CardContent>
  </Card>
  <p
    v-else-if="failed"
    class="text-sm text-muted-foreground"
  >
    {{ $t('diagnostic.loadError') }}
  </p>
</template>
