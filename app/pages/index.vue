<script setup lang="ts">
import DiagnosticSummaryCard from '@/features/diagnostic/ui/DiagnosticSummaryCard.vue'
import PlanNextStepCard from '@/features/plan/ui/PlanNextStepCard.vue'
import ProgressDashboard from '@/features/progress/ui/ProgressDashboard.vue'
import { useProfileStore } from '@/features/profile/store'

const profileStore = useProfileStore()
</script>

<template>
  <div class="flex flex-col gap-4">
    <PageHeader
      :title="profileStore.profile?.displayName ? $t('home.greeting', { name: profileStore.profile.displayName }) : $t('app.welcome')"
      :description="$t('home.subtitle')"
    />
    <PlanNextStepCard />
    <ProgressDashboard />
    <DiagnosticSummaryCard />
  </div>
</template>
