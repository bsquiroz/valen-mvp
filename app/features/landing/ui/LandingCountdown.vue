<script setup lang="ts">
import { useIntervalFn, useNow } from '@vueuse/core'
import { countdownParts, LAUNCH } from '../data/launch'

const startMs = Date.parse(LAUNCH.startsAt)
// Un tick por segundo (por defecto useNow actualiza en cada frame).
const now = useNow({ scheduler: cb => useIntervalFn(cb, 1000) })

const units = computed(() => {
  const parts = countdownParts(startMs, now.value.getTime())
  return [
    { key: 'days', value: parts.days },
    { key: 'hours', value: parts.hours },
    { key: 'minutes', value: parts.minutes },
    { key: 'seconds', value: parts.seconds },
  ] as const
})

const pad = (value: number) => String(value).padStart(2, '0')
</script>

<template>
  <div class="border-t-2 border-foreground px-[clamp(20px,3vw,40px)] py-6">
    <p class="mb-3.5 text-xs font-bold tracking-[.08em] uppercase">
      {{ $t('landing.hero.countdownTitle') }}
    </p>
    <div class="grid grid-cols-4 border-2 border-foreground">
      <div
        v-for="unit in units"
        :key="unit.key"
        class="border-foreground px-3 py-3.5 not-last:border-r-2"
      >
        <div class="text-[clamp(32px,3.6vw,56px)] leading-none font-black tracking-[-.04em] tabular-nums">
          {{ pad(unit.value) }}
        </div>
        <div class="mt-1.5 text-[11px] font-bold tracking-[.08em] uppercase">
          {{ $t(`landing.hero.units.${unit.key}`) }}
        </div>
      </div>
    </div>
  </div>
</template>
