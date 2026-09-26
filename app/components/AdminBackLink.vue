<script setup lang="ts">
import { ArrowLeft } from '@lucide/vue'

withDefaults(defineProps<{ to?: string }>(), { to: '/admin' })
</script>

<template>
  <NuxtLink
    :to="to"
    class="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
  >
    <ArrowLeft class="size-4" />
    {{ $t('common.back') }}
  </NuxtLink>
</template>
