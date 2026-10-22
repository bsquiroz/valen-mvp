<script setup lang="ts">
import type { Pillar } from '@/lib/pillars'
import { PROGRAM_WEEKS, SESSION_DAYS } from '../data/launch'

const week = ref<Pillar>(PROGRAM_WEEKS[0]!)
</script>

<template>
  <section
    id="calendario"
    class="scroll-mt-20 border-b-2 border-foreground"
  >
    <div class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] items-end gap-6 px-[clamp(20px,4vw,56px)] pt-[clamp(48px,8vw,104px)] pb-8">
      <h2 class="m-0 text-[clamp(36px,5.4vw,84px)] leading-[.92] font-black tracking-[-.05em] uppercase">
        {{ $t('landing.schedule.title') }}
      </h2>
      <p class="m-0 max-w-[44ch] text-lg leading-[1.45]">
        {{ $t('landing.schedule.description') }}
      </p>
    </div>
    <div
      role="tablist"
      :aria-label="$t('landing.schedule.weeksLabel')"
      class="grid grid-cols-2 gap-2 px-[clamp(20px,4vw,56px)] pb-6 md:grid-cols-4"
    >
      <button
        v-for="(pillar, index) in PROGRAM_WEEKS"
        :key="pillar"
        type="button"
        role="tab"
        :aria-selected="week === pillar"
        class="min-h-12 cursor-pointer border-2 border-foreground px-4 py-3.5 text-left text-sm font-bold transition-colors hover:bg-muted aria-selected:bg-foreground aria-selected:text-background"
        @click="week = pillar"
      >
        {{ $t('landing.schedule.weekTab', { n: index + 1, name: $t(`landing.pillars.items.${pillar}.name`) }) }}
      </button>
    </div>
    <div
      role="tabpanel"
      class="grid grid-cols-2 gap-0.5 border-t-2 border-foreground bg-foreground md:grid-cols-4"
    >
      <div
        v-for="day in SESSION_DAYS"
        :key="day"
        class="flex min-h-[clamp(150px,18vw,220px)] flex-col gap-3 bg-background p-[clamp(16px,1.6vw,20px)] first:bg-primary first:text-primary-foreground"
      >
        <span class="text-[clamp(28px,2.6vw,40px)] leading-none font-black tracking-[-.04em] uppercase">
          {{ $t(`landing.schedule.days.${day}`) }}
        </span>
        <span class="text-xs font-bold tracking-[.06em] uppercase">{{ $t('landing.schedule.time') }}</span>
        <span class="mt-auto text-[15px] leading-[1.3] font-semibold">
          {{ $t(`landing.schedule.topics.${week}.${day}`) }}
        </span>
      </div>
    </div>
    <div class="flex flex-wrap items-baseline gap-x-6 gap-y-2 border-t-2 border-foreground bg-muted px-[clamp(20px,4vw,56px)] py-5">
      <span class="text-[clamp(22px,2.4vw,32px)] font-black tracking-[-.03em] uppercase">{{ $t('landing.schedule.restDays') }}</span>
      <span class="text-[15px] font-semibold">{{ $t('landing.schedule.restNote') }}</span>
    </div>
  </section>
</template>
