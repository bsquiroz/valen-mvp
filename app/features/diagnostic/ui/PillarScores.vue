<script setup lang="ts">
import { PILLARS } from '@/lib/pillars'
import type { PillarScores } from '../data/diagnostic'
import { scoreLevel } from '../data/diagnostic'

defineProps<{ scores: PillarScores }>()
</script>

<template>
  <ul class="flex flex-col gap-4">
    <li
      v-for="pillar in PILLARS"
      :key="pillar"
      class="flex flex-col gap-1.5"
    >
      <div class="flex items-baseline justify-between gap-2 text-sm">
        <span class="font-medium">{{ $t(`pillars.${pillar}`) }}</span>
        <span class="text-muted-foreground">
          {{ $t(`diagnostic.levels.${scoreLevel(scores[pillar])}`) }} · {{ scores[pillar] }}/100
        </span>
      </div>
      <ProgressBar
        :value="scores[pillar]"
        :label="$t(`pillars.${pillar}`)"
      />
    </li>
  </ul>
</template>
