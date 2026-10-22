<script setup lang="ts">
import { OUTCOME_KEYS, PROGRAM_WEEKS } from '../data/launch'
</script>

<template>
  <section
    id="pilares"
    class="scroll-mt-20 border-b-2 border-foreground"
  >
    <div class="flex flex-wrap items-end justify-between gap-6 px-[clamp(20px,4vw,56px)] pt-[clamp(48px,8vw,104px)] pb-8">
      <h2 class="m-0 text-[clamp(40px,6vw,96px)] leading-[.9] font-black tracking-[-.05em] uppercase">
        {{ $t('landing.pillars.titleLine1') }}<br>{{ $t('landing.pillars.titleLine2') }}
      </h2>
      <p class="m-0 max-w-[38ch] text-lg leading-[1.45]">
        {{ $t('landing.pillars.description') }}
      </p>
    </div>
    <div class="grid grid-cols-1 gap-0.5 border-t-2 border-foreground bg-foreground sm:grid-cols-2 xl:grid-cols-4">
      <article
        v-for="(pillar, index) in PROGRAM_WEEKS"
        :key="pillar"
        class="flex flex-col gap-[18px] bg-background px-[clamp(20px,2.4vw,32px)] pt-7 pb-8 transition-colors hover:bg-muted"
      >
        <div class="flex items-baseline justify-between">
          <span class="text-[clamp(48px,6vw,64px)] leading-[.8] font-black tracking-[-.05em] text-primary">0{{ index + 1 }}</span>
          <span class="text-xs font-bold tracking-[.08em] uppercase">{{ $t('landing.pillars.week', { n: index + 1 }) }}</span>
        </div>
        <h3 class="m-0 text-[clamp(32px,2.8vw,42px)] leading-[.95] font-black tracking-[-.04em] uppercase">
          {{ $t(`landing.pillars.items.${pillar}.name`) }}
        </h3>
        <div class="border-y-2 border-foreground py-2.5 text-[13px] font-bold tracking-[.06em] uppercase">
          {{ $t('landing.pillars.with', { pro: $t(`landing.pillars.items.${pillar}.pro`) }) }}
        </div>
        <p class="m-0 text-base leading-normal text-pretty">
          {{ $t(`landing.pillars.items.${pillar}.description`) }}
        </p>
        <ul class="mt-auto flex flex-col gap-2">
          <li
            v-for="outcome in OUTCOME_KEYS"
            :key="outcome"
            class="flex gap-2.5 text-sm font-semibold"
          >
            <span
              aria-hidden="true"
              class="text-primary"
            >→</span>
            {{ $t(`landing.pillars.items.${pillar}.outcomes.${outcome}`) }}
          </li>
        </ul>
      </article>
    </div>
  </section>
</template>
