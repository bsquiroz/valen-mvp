<script setup lang="ts">
import { INCLUDE_KEYS } from '../data/launch'
import { useLaunch } from './useLaunch'

const { spots, price, sessionPrice, sessions } = useLaunch()
</script>

<template>
  <section
    id="inversion"
    class="grid scroll-mt-20 grid-cols-[repeat(auto-fit,minmax(min(100%,460px),1fr))] gap-0.5 border-b-2 border-foreground bg-foreground"
  >
    <div class="flex flex-col gap-5 bg-background px-[clamp(20px,4vw,56px)] py-[clamp(48px,8vw,104px)]">
      <p class="m-0 text-xs font-bold tracking-[.08em] text-primary uppercase">
        {{ $t('landing.pricing.kicker') }}
      </p>
      <p class="m-0 text-[clamp(56px,8vw,120px)] leading-[.85] font-black tracking-[-.06em]">
        {{ price }}
      </p>
      <p class="m-0 text-base font-bold tracking-[.06em] uppercase">
        {{ $t('landing.pricing.terms') }}
      </p>
      <div class="mt-2 grid grid-cols-2 border-2 border-foreground">
        <div class="border-r-2 border-foreground p-[18px]">
          <div class="text-[clamp(26px,3vw,34px)] font-black tracking-[-.03em]">
            {{ sessionPrice }}
          </div>
          <div class="mt-1 text-[13px] font-semibold">
            {{ $t('landing.pricing.perSession') }}
          </div>
        </div>
        <div class="p-[18px]">
          <div class="text-[clamp(26px,3vw,34px)] font-black tracking-[-.03em]">
            {{ sessions }}
          </div>
          <div class="mt-1 text-[13px] font-semibold">
            {{ $t('landing.pricing.sessions') }}
          </div>
        </div>
      </div>
      <p class="m-0 max-w-[40ch] text-lg leading-[1.45]">
        {{ $t('landing.pricing.note') }}
      </p>
    </div>
    <div class="flex flex-col bg-background">
      <ul>
        <li
          v-for="key in INCLUDE_KEYS"
          :key="key"
          class="grid grid-cols-[56px_1fr] border-b-2 border-foreground"
        >
          <span
            aria-hidden="true"
            class="flex items-center justify-center border-r-2 border-foreground font-black text-primary"
          >✓</span>
          <span class="px-[clamp(16px,3vw,32px)] py-[18px] text-[17px] font-semibold">
            {{ $t(`landing.pricing.includes.${key}`) }}
          </span>
        </li>
      </ul>
      <div class="flex flex-col gap-3.5 px-[clamp(20px,3vw,32px)] py-7">
        <div class="flex justify-between text-[13px] font-bold tracking-[.06em] uppercase">
          <span>{{ $t('landing.pricing.spotsTaken') }}</span>
          <span>{{ spots.taken }}/{{ spots.total }}</span>
        </div>
        <div
          role="progressbar"
          :aria-label="$t('landing.pricing.spotsTaken')"
          :aria-valuenow="spots.taken"
          aria-valuemin="0"
          :aria-valuemax="spots.total"
          class="relative h-3.5 border-2 border-foreground"
        >
          <div
            class="absolute inset-y-0 left-0 bg-primary"
            :style="{ width: `${spots.pct}%` }"
          />
        </div>
        <NuxtLink
          to="/auth/register"
          class="mt-2 flex justify-between gap-4 bg-foreground px-[22px] py-5 text-[17px] font-extrabold text-background transition-colors hover:bg-primary hover:text-primary-foreground dark:bg-muted dark:text-foreground dark:hover:bg-primary dark:hover:text-primary-foreground"
        >
          {{ $t('landing.pricing.cta', { left: spots.left }) }} <span aria-hidden="true">→</span>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>
