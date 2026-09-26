<script setup lang="ts">
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/dates'
import type { FeedbackEntry, FeedbackFilters, FeedbackStatus } from '../data/feedback'
import { countByStatus, FEEDBACK_STATUSES, FEEDBACK_TYPES, filterFeedback } from '../data/feedback'
import { useFeedbackStore } from '../store'

const store = useFeedbackStore()
const { locale } = useI18n()
const status = ref<'loading' | 'error' | 'ready'>('loading')
const actionError = ref(false)
const updating = ref<string | null>(null)
// Por defecto, lo que falta atender
const filters = reactive<FeedbackFilters>({ type: 'all', status: 'new' })

const entries = computed(() => filterFeedback(store.entries ?? [], filters))
const counts = computed(() => countByStatus(store.entries ?? []))

// Siguientes estados posibles desde cada estado
const NEXT: Record<FeedbackStatus, FeedbackStatus[]> = {
  new: ['in_review', 'resolved', 'dismissed'],
  in_review: ['resolved', 'dismissed'],
  resolved: ['in_review'],
  dismissed: ['in_review'],
}

async function load() {
  status.value = 'loading'
  try {
    await store.load()
    status.value = 'ready'
  }
  catch {
    status.value = 'error'
  }
}

async function changeStatus(entry: FeedbackEntry, next: FeedbackStatus) {
  actionError.value = false
  updating.value = entry.id
  try {
    await store.setStatus(entry.id, next)
  }
  catch {
    actionError.value = true
  }
  finally {
    updating.value = null
  }
}

onMounted(load)
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-col gap-3">
      <div
        role="radiogroup"
        :aria-label="$t('admin.feedback.filterStatus')"
        class="flex flex-wrap gap-2"
      >
        <button
          v-for="option in ['all', ...FEEDBACK_STATUSES] as const"
          :key="option"
          type="button"
          role="radio"
          :aria-checked="filters.status === option"
          class="rounded-full border border-border px-3 py-1 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground aria-checked:border-primary aria-checked:bg-secondary aria-checked:text-secondary-foreground"
          @click="filters.status = option"
        >
          {{ $t(`admin.feedback.statuses.${option}`) }}
          <span
            v-if="option !== 'all'"
            class="tabular-nums"
          >· {{ counts[option] }}</span>
        </button>
      </div>
      <div
        role="radiogroup"
        :aria-label="$t('admin.feedback.filterType')"
        class="flex flex-wrap gap-2"
      >
        <button
          v-for="option in ['all', ...FEEDBACK_TYPES] as const"
          :key="option"
          type="button"
          role="radio"
          :aria-checked="filters.type === option"
          class="rounded-full border border-border px-3 py-1 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground aria-checked:border-primary aria-checked:bg-secondary aria-checked:text-secondary-foreground"
          @click="filters.type = option"
        >
          {{ option === 'all' ? $t('admin.feedback.allTypes') : $t(`feedback.types.${option}`) }}
        </button>
      </div>
    </div>

    <Alert
      v-if="actionError"
      variant="destructive"
    >
      <AlertDescription>{{ $t('admin.feedback.actionError') }}</AlertDescription>
    </Alert>

    <p
      v-if="status === 'loading'"
      class="text-sm text-muted-foreground"
    >
      {{ $t('common.loading') }}
    </p>

    <div
      v-else-if="status === 'error'"
      class="flex flex-col items-start gap-4"
    >
      <Alert variant="destructive">
        <AlertDescription>{{ $t('admin.feedback.loadError') }}</AlertDescription>
      </Alert>
      <Button
        variant="outline"
        @click="load"
      >
        {{ $t('common.retry') }}
      </Button>
    </div>

    <p
      v-else-if="!entries.length"
      class="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground"
    >
      {{ $t('admin.feedback.empty') }}
    </p>

    <ul
      v-else
      class="flex flex-col gap-3"
    >
      <li
        v-for="entry in entries"
        :key="entry.id"
        class="flex flex-col gap-3 rounded-lg border bg-card p-4 text-card-foreground"
      >
        <div class="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary">
            {{ $t(`feedback.types.${entry.type}`) }}
          </Badge>
          <Badge variant="outline">
            {{ $t(`admin.feedback.statuses.${entry.status}`) }}
          </Badge>
          <span>{{ formatDate(entry.createdAt, locale) }}</span>
        </div>
        <p class="text-sm whitespace-pre-line">
          {{ entry.message }}
        </p>
        <dl class="grid gap-1 text-xs text-muted-foreground sm:grid-cols-[auto_1fr] sm:gap-x-3">
          <dt class="font-medium">
            {{ $t('admin.feedback.from') }}
          </dt>
          <dd class="break-all">
            {{ entry.displayName || '—' }} · {{ entry.email || '—' }}
          </dd>
          <template v-if="entry.page">
            <dt class="font-medium">
              {{ $t('admin.feedback.page') }}
            </dt>
            <dd class="break-all">
              {{ entry.page }}
            </dd>
          </template>
          <template v-if="entry.userAgent">
            <dt class="font-medium">
              {{ $t('admin.feedback.browser') }}
            </dt>
            <dd class="break-all">
              {{ entry.userAgent }}
            </dd>
          </template>
        </dl>
        <div class="flex flex-wrap gap-2">
          <Button
            v-for="next in NEXT[entry.status]"
            :key="next"
            size="sm"
            :variant="next === 'resolved' ? 'default' : 'outline'"
            :disabled="updating === entry.id"
            @click="changeStatus(entry, next)"
          >
            {{ $t(`admin.feedback.actions.${next}`) }}
          </Button>
        </div>
      </li>
    </ul>
  </div>
</template>
