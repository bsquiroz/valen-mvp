<script setup lang="ts">
import { Eye, EyeOff, GripVertical, Pencil, Trash2 } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import type { AdminChallenge, ChallengeForm as Form } from '@/features/challenges/data/adminChallenges'
import { canDeleteChallenge } from '@/features/challenges/data/adminChallenges'
import { localize } from '@/lib/localizedText'
import ChallengeForm from './ChallengeForm.vue'
import { useChallengesEditorContext } from './editorContext'

const props = defineProps<{
  challenge: AdminChallenge
  number: number
  total: number
}>()

const { editor, activeEditor, run } = useChallengesEditorContext()
const locale = useContentLocale()

const editorKey = computed(() => `challenge:${props.challenge.id}`)
const deletable = computed(() => canDeleteChallenge(props.challenge))
const confirmOpen = ref(false)

async function save(form: Form) {
  if (await run(() => editor.updateChallenge(props.challenge.id, form))) activeEditor.value = null
}

// Mover con teclado desde el asa; se devuelve el foco porque el nodo cambia de lugar.
const handleRef = useTemplateRef<HTMLButtonElement>('handle')

async function moveBy(delta: number) {
  if (await run(() => editor.moveChallenge(props.challenge.id, delta))) {
    await nextTick()
    handleRef.value?.focus()
  }
}
</script>

<template>
  <li class="py-3 first:pt-0 last:pb-0">
    <ChallengeForm
      v-if="activeEditor === editorKey"
      :title="$t('admin.challenges.editChallenge')"
      :initial="challenge"
      @save="save"
      @cancel="activeEditor = null"
    />
    <div
      v-else
      class="group flex items-start gap-1"
    >
      <button
        ref="handle"
        type="button"
        class="drag-handle -ml-1 flex size-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none active:cursor-grabbing"
        :aria-label="$t('admin.challenges.moveChallenge', { number, total })"
        :title="$t('admin.diagnostic.moveHint')"
        @keydown.up.prevent="moveBy(-1)"
        @keydown.down.prevent="moveBy(1)"
      >
        <GripVertical
          class="size-4"
          aria-hidden="true"
        />
      </button>
      <div
        class="flex min-w-0 flex-1 flex-col gap-1 pt-1"
        :class="{ 'text-muted-foreground': !challenge.isActive }"
        @dblclick="activeEditor = editorKey"
      >
        <p class="text-sm font-medium">
          <span class="text-muted-foreground">{{ number }}.</span>
          {{ localize(challenge.title, locale) }}
        </p>
        <p class="line-clamp-2 text-sm text-muted-foreground">
          {{ localize(challenge.description, locale) }}
        </p>
        <div class="flex flex-wrap items-center gap-1.5">
          <Badge
            v-if="!challenge.isActive"
            variant="outline"
          >
            {{ $t('admin.challenges.inactive') }}
          </Badge>
          <Badge variant="secondary">
            {{ challenge.durationDays === 1 ? $t('challenges.oneTime') : $t('challenges.durationDays', { count: challenge.durationDays }, challenge.durationDays) }}
          </Badge>
          <span class="text-xs text-muted-foreground">
            {{ $t('admin.challenges.usage', { started: challenge.started, completed: challenge.completed }) }}
          </span>
        </div>
      </div>
      <div class="flex items-center">
        <IconAction
          :icon="Pencil"
          :label="$t('admin.challenges.editChallenge')"
          @click="activeEditor = editorKey"
        />
        <IconAction
          :icon="challenge.isActive ? EyeOff : Eye"
          :label="$t(challenge.isActive ? 'admin.challenges.deactivate' : 'admin.challenges.activate')"
          @click="run(() => editor.updateChallenge(challenge.id, { isActive: !challenge.isActive }))"
        />
        <IconAction
          :icon="Trash2"
          :label="$t('admin.challenges.deleteChallenge')"
          :disabled="!deletable"
          :hint="deletable ? undefined : $t('admin.challenges.deleteDisabledHint')"
          @click="confirmOpen = true"
        />
      </div>
    </div>

    <ConfirmDelete
      v-model:open="confirmOpen"
      :title="$t('admin.challenges.confirmDelete.title')"
      :description="$t('admin.challenges.confirmDelete.description')"
      @confirm="run(() => editor.deleteChallenge(challenge.id))"
    />
  </li>
</template>
