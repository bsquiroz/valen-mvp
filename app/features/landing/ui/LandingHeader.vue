<script setup lang="ts">
import LandingPreferences from './LandingPreferences.vue'
import { useLaunch } from './useLaunch'

const { spots } = useLaunch()
</script>

<template>
  <div class="flex flex-wrap justify-between gap-4 bg-foreground px-[clamp(20px,4vw,56px)] py-2.5 text-[13px] font-semibold tracking-[.04em] text-background uppercase dark:bg-muted dark:text-foreground">
    <span>{{ $t('landing.announcement.generation') }}</span>
    <span class="flex items-center gap-2">
      <span class="size-2 bg-primary" />
      {{ $t('landing.announcement.spotsLeft', { left: spots.left, total: spots.total }) }}
    </span>
  </div>

  <header class="sticky top-0 z-10 grid grid-cols-[1fr_auto] items-stretch border-b-2 border-foreground bg-background">
    <div class="flex items-center gap-3 px-[clamp(20px,4vw,56px)] py-3.5">
      <NuxtLink
        to="/landing"
        class="text-[26px] font-black tracking-[-.04em]"
      >
        VALEN<span
          aria-hidden="true"
          class="ml-0.5 inline-block size-[.55em] bg-primary"
        />
      </NuxtLink>
      <div class="ml-auto">
        <LandingPreferences />
      </div>
    </div>
    <NuxtLink
      to="/auth/register"
      class="flex items-center gap-3 border-l-2 border-foreground bg-primary px-[clamp(18px,3vw,40px)] text-[15px] font-bold text-primary-foreground transition-colors hover:bg-primary/85"
    >
      {{ $t('landing.header.enroll') }} <span aria-hidden="true">→</span>
    </NuxtLink>
  </header>
</template>
