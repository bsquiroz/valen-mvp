<script setup lang="ts">
import { PAIN_KEYS } from '../data/launch'
</script>

<template>
  <section class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] gap-0.5 border-b-2 border-foreground bg-foreground">
    <div class="bg-background px-[clamp(20px,4vw,56px)] py-[clamp(48px,8vw,112px)]">
      <p class="mb-5 text-xs font-bold tracking-[.08em] text-primary uppercase">
        {{ $t('landing.problem.kicker') }}
      </p>
      <h2 class="m-0 text-[clamp(38px,4.6vw,72px)] leading-[.95] font-black tracking-[-.04em] text-balance">
        {{ $t('landing.problem.title') }}
      </h2>
    </div>
    <div class="flex flex-col bg-background">
      <div
        v-for="(key, index) in PAIN_KEYS"
        :key="key"
        class="grid flex-1 grid-cols-[52px_1fr] border-b-2 border-foreground"
      >
        <div class="flex justify-center border-r-2 border-foreground py-5 text-sm font-extrabold">
          0{{ index + 1 }}
        </div>
        <p class="m-0 self-center px-[clamp(16px,3vw,40px)] py-5 text-[clamp(17px,1.4vw,20px)] leading-[1.4]">
          {{ $t(`landing.problem.pains.${key}`) }}
        </p>
      </div>
      <p class="m-0 px-[clamp(20px,3vw,40px)] py-6 text-[clamp(18px,1.5vw,22px)] leading-[1.35] font-extrabold">
        {{ $t('landing.problem.closing') }}
      </p>
    </div>
  </section>
</template>
