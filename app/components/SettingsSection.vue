<script setup lang="ts">
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle as="h2">
        {{ title }}
      </CardTitle>
      <CardDescription v-if="description">
        {{ description }}
      </CardDescription>
    </CardHeader>
    <CardContent>
      <slot />
    </CardContent>
  </Card>
</template>
