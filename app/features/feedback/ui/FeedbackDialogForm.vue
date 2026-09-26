<script setup lang="ts">
import { Bug, CircleCheck, Frown, Lightbulb, Rocket } from '@lucide/vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { submitFeedback } from '../api/feedback'
import type { FeedbackType } from '../data/feedback'
import { FEEDBACK_MAX_LENGTH, FEEDBACK_TYPES, feedbackFormSchema, isRateLimitedError } from '../data/feedback'

const emit = defineEmits<{ close: [] }>()

const route = useRoute()
const id = useId()
const { values, errors, pending, isValid, validate } = useZodForm(feedbackFormSchema, { type: '', message: '' })
const status = ref<'idle' | 'sent'>('idle')
const errorKey = ref<string | null>(null)

const ICONS: Record<FeedbackType, typeof Bug> = {
  suggestion: Lightbulb,
  bug: Bug,
  complaint: Frown,
  improvement: Rocket,
}

async function onSubmit() {
  errorKey.value = null
  const form = validate()
  if (!form) return
  pending.value = true
  try {
    // La página y el navegador ayudan a entender el contexto (sobre todo en los bugs)
    await submitFeedback(form, { page: route.fullPath, userAgent: navigator.userAgent })
    status.value = 'sent'
  }
  catch (error) {
    errorKey.value = isRateLimitedError(error) ? 'feedback.errors.rateLimited' : 'feedback.errors.sendFailed'
  }
  finally {
    pending.value = false
  }
}
</script>

<template>
  <div
    v-if="status === 'sent'"
    class="flex flex-col items-start gap-4"
  >
    <p class="flex items-center gap-2 font-medium">
      <CircleCheck
        class="size-5 text-primary"
        aria-hidden="true"
      />
      {{ $t('feedback.thanks') }}
    </p>
    <p class="text-sm text-muted-foreground">
      {{ $t('feedback.thanksDescription') }}
    </p>
    <Button
      class="self-end"
      @click="emit('close')"
    >
      {{ $t('common.close') }}
    </Button>
  </div>

  <form
    v-else
    class="flex flex-col gap-4"
    novalidate
    @submit.prevent="onSubmit"
  >
    <Alert
      v-if="errorKey"
      variant="destructive"
    >
      <AlertDescription>{{ $t(errorKey) }}</AlertDescription>
    </Alert>

    <fieldset class="flex flex-col gap-2">
      <legend class="mb-2 text-sm font-medium">
        {{ $t('feedback.typeLabel') }}
      </legend>
      <div
        role="radiogroup"
        :aria-label="$t('feedback.typeLabel')"
        class="grid grid-cols-2 gap-2"
      >
        <button
          v-for="type in FEEDBACK_TYPES"
          :key="type"
          type="button"
          role="radio"
          :aria-checked="values.type === type"
          class="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground aria-checked:border-primary aria-checked:bg-secondary aria-checked:text-secondary-foreground"
          @click="values.type = type"
        >
          <component
            :is="ICONS[type]"
            class="size-4 shrink-0"
            aria-hidden="true"
          />
          {{ $t(`feedback.types.${type}`) }}
        </button>
      </div>
      <p
        v-if="errors.type"
        class="text-sm text-destructive"
      >
        {{ $t(errors.type) }}
      </p>
    </fieldset>

    <FormField
      :id="`${id}-message`"
      :label="$t('feedback.messageLabel')"
      :error="errors.message"
    >
      <Textarea
        :id="`${id}-message`"
        v-model="values.message"
        :maxlength="FEEDBACK_MAX_LENGTH"
        :placeholder="$t(values.type ? `feedback.placeholders.${values.type}` : 'feedback.placeholders.default')"
        :aria-invalid="!!errors.message"
      />
      <p class="flex justify-between gap-2 text-xs text-muted-foreground">
        <span>{{ $t('feedback.contextNote') }}</span>
        <span class="tabular-nums">{{ values.message.length }}/{{ FEEDBACK_MAX_LENGTH }}</span>
      </p>
    </FormField>

    <div class="flex flex-wrap items-center justify-end gap-2">
      <RequiredHint
        v-if="!isValid"
        class="mr-auto"
      />
      <Button
        type="button"
        variant="ghost"
        :disabled="pending"
        @click="emit('close')"
      >
        {{ $t('common.cancel') }}
      </Button>
      <Button
        type="submit"
        :disabled="pending || !isValid"
      >
        {{ pending ? $t('feedback.sending') : $t('feedback.send') }}
      </Button>
    </div>
  </form>
</template>
