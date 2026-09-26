<script setup lang="ts">
import type { PillarScores } from '../data/diagnostic'
import { opportunityAreas } from '../data/diagnostic'

const props = defineProps<{ scores: PillarScores }>()

const areas = computed(() => opportunityAreas(props.scores))
</script>

<template>
  <ul class="flex flex-wrap gap-2">
    <li
      v-for="pillar in areas"
      :key="pillar"
      class="rounded-md border px-3 py-1.5 text-sm font-medium"
    >
      {{ $t(`pillars.${pillar}`) }}
    </li>
  </ul>
</template>
