<script setup lang="ts">
import { useProfileStore } from '@/features/profile/store'

const profileStore = useProfileStore()
</script>

<template>
  <div>
    <PageHeader
      :title="profileStore.profile?.displayName ? $t('home.greeting', { name: profileStore.profile.displayName }) : $t('app.welcome')"
      :description="$t('home.subtitle')"
    />
    <!-- El dashboard de progreso llega en la Fase 9 -->
    <div class="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
      {{ $t('home.placeholder') }}
    </div>
  </div>
</template>
