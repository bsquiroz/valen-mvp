<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { signOut } from '../api/auth'

const pending = ref(false)

async function onSignOut() {
  pending.value = true
  await signOut()
  pending.value = false
  await navigateTo('/auth/login')
}
</script>

<template>
  <Button
    variant="ghost"
    size="sm"
    :disabled="pending"
    @click="onSignOut"
  >
    {{ $t('auth.signOut') }}
  </Button>
</template>
