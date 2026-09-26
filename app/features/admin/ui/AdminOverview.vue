<script setup lang="ts">
import { BookOpen, ChevronRight, ClipboardList, Target, Users, Video } from '@lucide/vue'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Secciones del panel. Las que no tienen `to` todavía no existen (se construyen con su feature).
const sections = [
  { key: 'diagnostic', icon: ClipboardList, to: '/admin/diagnostic' },
  { key: 'courses', icon: BookOpen },
  { key: 'challenges', icon: Target },
  { key: 'sessions', icon: Video },
  { key: 'users', icon: Users },
] as const

const NuxtLink = resolveComponent('NuxtLink')
</script>

<template>
  <div class="grid gap-4 sm:grid-cols-2">
    <component
      :is="'to' in section ? NuxtLink : 'div'"
      v-for="section in sections"
      :key="section.key"
      :to="'to' in section ? section.to : undefined"
      class="group rounded-xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <Card
        class="h-full transition-colors"
        :class="'to' in section ? 'group-hover:bg-accent' : 'opacity-70'"
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
            <ChevronRight
              v-if="'to' in section"
              class="ml-auto size-4 text-muted-foreground"
              aria-hidden="true"
            />
          </CardTitle>
          <CardDescription>
            {{ 'to' in section ? $t(`admin.sectionDescriptions.${section.key}`) : $t('comingSoon.description') }}
          </CardDescription>
        </CardHeader>
      </Card>
    </component>
  </div>
</template>
