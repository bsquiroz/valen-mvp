<script setup lang="ts">
import { useLaunch } from './useLaunch'

const { spots, price } = useLaunch()
</script>

<template>
  <NuxtLink
    to="/auth/register"
    class="fixed inset-x-0 bottom-0 z-20 grid grid-cols-[1fr_auto] items-stretch border-t-2 border-foreground bg-foreground text-background dark:bg-muted dark:text-foreground"
  >
    <span class="flex flex-col justify-center px-5 py-3">
      <span class="text-xl font-black tracking-[-.02em]">{{ price }} COP</span>
      <span class="text-xs font-semibold tracking-[.06em] uppercase">{{ $t('landing.stickyBar.spotsLeft', { left: spots.left }) }}</span>
    </span>
    <span class="flex items-center gap-3 bg-primary px-[22px] text-base font-extrabold text-primary-foreground">
      {{ $t('landing.stickyBar.cta') }} <span aria-hidden="true">→</span>
    </span>
  </NuxtLink>
</template>
