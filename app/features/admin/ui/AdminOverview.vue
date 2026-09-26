<script setup lang="ts">
import { BookOpen, ChevronRight, ClipboardList, ListChecks, ShieldCheck, Target, Users, Video } from '@lucide/vue'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useProfileStore } from '@/features/profile/store'

// Secciones del panel. Las que no tienen `to` todavía no existen (se construyen con su feature).
// `superAdmin`: datos de usuarios y cuentas, solo para el super admin.
const SECTIONS = [
  { key: 'diagnostic', icon: ClipboardList, to: '/admin/diagnostic' },
  { key: 'plan', icon: ListChecks, to: '/admin/plan' },
  { key: 'courses', icon: BookOpen, to: '/admin/courses' },
  { key: 'challenges', icon: Target, to: '/admin/challenges' },
  { key: 'sessions', icon: Video },
  { key: 'users', icon: Users, superAdmin: true },
  { key: 'admins', icon: ShieldCheck, to: '/admin/admins', superAdmin: true },
] as const

const profileStore = useProfileStore()
const sections = computed(() => SECTIONS.filter(section => !('superAdmin' in section) || profileStore.isSuperAdmin))

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
