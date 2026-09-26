<script setup lang="ts">
import ChallengeDetail from '@/features/challenges/ui/ChallengeDetail.vue'

const route = useRoute()
const challengeId = computed(() => String(route.params.challengeId))
</script>

<template>
  <ChallengeDetail :challenge-id="challengeId" />
</template>
