<script setup lang="ts">
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { resendConfirmation } from '../api/auth'

const props = defineProps<{ email: string }>()

const pending = ref(false)
const status = ref<{ ok: boolean, messageKey: string } | null>(null)

async function onResend() {
  pending.value = true
  const result = await resendConfirmation(props.email)
  pending.value = false
  status.value = result.ok
    ? { ok: true, messageKey: 'auth.checkEmail.resent' }
    : { ok: false, messageKey: result.errorKey }
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <Alert
      v-if="status"
      :variant="status.ok ? 'default' : 'destructive'"
    >
      <AlertDescription>{{ $t(status.messageKey) }}</AlertDescription>
    </Alert>
    <Button
      variant="outline"
      :disabled="pending"
      @click="onResend"
    >
      {{ $t('auth.checkEmail.resend') }}
    </Button>
  </div>
</template>
