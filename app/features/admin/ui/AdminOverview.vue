<script setup lang="ts">
import { BookOpen, Target, Users, Video } from '@lucide/vue'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Secciones del panel; cada una se construye junto con su feature (Fases 6–8).
const sections = [
  { key: 'courses', icon: BookOpen },
  { key: 'challenges', icon: Target },
  { key: 'sessions', icon: Video },
  { key: 'users', icon: Users },
] as const
</script>

<template>
  <div class="grid gap-4 sm:grid-cols-2">
    <Card
      v-for="section in sections"
      :key="section.key"
    >
      <CardHeader>
        <CardTitle
          as="h2"
          class="flex items-center gap-2"
        >
          <component
            :is="section.icon"
            class="size-4 text-muted-foreground"
            aria-hidden="true"
          />
          {{ $t(`admin.sections.${section.key}`) }}
        </CardTitle>
        <CardDescription>{{ $t('comingSoon.description') }}</CardDescription>
      </CardHeader>
    </Card>
  </div>
</template>
