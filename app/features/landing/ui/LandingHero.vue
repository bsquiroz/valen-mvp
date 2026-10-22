<script setup lang="ts">
import LandingCountdown from './LandingCountdown.vue'
import { useLaunch } from './useLaunch'

const { price } = useLaunch()

const CHIPS = ['weeks', 'schedule', 'live'] as const
</script>

<template>
  <section class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,520px),1fr))] gap-0.5 border-b-2 border-foreground bg-foreground">
    <div class="flex flex-col gap-[clamp(24px,3vw,40px)] bg-background px-[clamp(20px,4vw,56px)] py-[clamp(36px,7vw,104px)]">
      <div class="flex flex-wrap gap-2.5">
        <span
          v-for="chip in CHIPS"
          :key="chip"
          class="border-2 border-foreground px-2.5 py-1.5 text-xs font-bold tracking-[.06em] uppercase"
        >
          {{ $t(`landing.hero.chips.${chip}`) }}
        </span>
      </div>
      <h1 class="m-0 text-[clamp(40px,6.4vw,112px)] leading-[.88] font-black tracking-[-.05em] text-balance uppercase">
        {{ $t('landing.hero.titleLead') }}
        <span class="text-primary">{{ $t('landing.hero.titleAccent') }}</span>
      </h1>
      <p class="m-0 max-w-[40ch] text-[clamp(18px,1.5vw,22px)] leading-[1.45] text-pretty">
        {{ $t('landing.hero.description') }}
      </p>
      <div class="mt-2 grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-2">
        <NuxtLink
          to="/auth/register"
          class="flex items-center justify-between gap-6 border-2 border-primary bg-primary px-[22px] py-5 text-lg font-extrabold text-primary-foreground transition-colors hover:bg-primary/85"
        >
          {{ $t('landing.hero.cta') }} <span aria-hidden="true">→</span>
        </NuxtLink>
        <div class="flex flex-col justify-center border-2 border-foreground px-5 py-3">
          <span class="text-[22px] font-black tracking-[-.02em]">{{ price }}</span>
          <span class="text-xs font-semibold tracking-[.06em] uppercase">{{ $t('landing.hero.priceNote') }}</span>
        </div>
      </div>
    </div>
    <div class="grid grid-rows-[1fr_auto] bg-background">
      <!-- Pendiente: foto real en blanco y negro (retrato de un hombre joven). -->
      <div
        aria-hidden="true"
        class="min-h-[clamp(220px,40vw,360px)] bg-[repeating-linear-gradient(135deg,var(--muted)_0_12px,var(--background)_12px_24px)]"
      />
      <LandingCountdown />
    </div>
  </section>
</template>
