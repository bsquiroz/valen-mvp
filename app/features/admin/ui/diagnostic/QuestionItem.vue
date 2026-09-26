<script setup lang="ts">
import { GripVertical, Pencil, Plus, Trash2 } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { MAX_OPTIONS } from '@/features/diagnostic/data/adminForms'
import type { DiagnosticQuestion } from '@/features/diagnostic/data/diagnostic'
import type { LocalizedText } from '@/lib/localizedText'
import { localize } from '@/lib/localizedText'
import { useEditorContext } from './editorContext'
import OptionItem from './OptionItem.vue'

const props = defineProps<{
  question: DiagnosticQuestion
  number: number
  total: number
}>()

const { editor, activeEditor, run } = useEditorContext()
const locale = useContentLocale()

const promptKey = computed(() => `question:${props.question.id}`)
const newOptionKey = computed(() => `new-option:${props.question.id}`)
const editingPrompt = computed(() => activeEditor.value === promptKey.value)
const addingOption = computed(() => activeEditor.value === newOptionKey.value)
const canAddOption = computed(() => props.question.options.length < MAX_OPTIONS)

const confirmOpen = ref(false)
const newOptionScore = ref(0)

function startEditingPrompt() {
  activeEditor.value = promptKey.value
}

function startAddingOption() {
  newOptionScore.value = 0
  activeEditor.value = newOptionKey.value
}

// Mover con teclado desde el asa; se devuelve el foco porque el nodo cambia de lugar.
const handleRef = useTemplateRef<HTMLButtonElement>('handle')

async function moveBy(delta: number) {
  if (await run(() => editor.moveQuestion(props.question.id, delta))) {
    await nextTick()
    handleRef.value?.focus()
  }
}

async function savePrompt(prompt: LocalizedText) {
  if (await run(() => editor.updateQuestionPrompt(props.question.id, prompt))) activeEditor.value = null
}

async function saveNewOption(label: LocalizedText) {
  const score = newOptionScore.value
  if (await run(() => editor.addOption(props.question.id, { label, score }))) activeEditor.value = null
}
</script>

<template>
  <li class="flex flex-col gap-2 py-4 first:pt-0 last:pb-0">
    <LocalizedTextEditor
      v-if="editingPrompt"
      :title="$t('admin.diagnostic.editQuestion')"
      :field-label="$t('admin.diagnostic.question')"
      :initial="question.prompt"
      @save="savePrompt"
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
        :aria-label="$t('admin.diagnostic.moveQuestion', { number, total })"
        :title="$t('admin.diagnostic.moveHint')"
        @keydown.up.prevent="moveBy(-1)"
        @keydown.down.prevent="moveBy(1)"
      >
        <GripVertical
          class="size-4"
          aria-hidden="true"
        />
      </button>
      <p
        class="min-w-0 flex-1 pt-1 text-sm font-medium"
        @dblclick="startEditingPrompt"
      >
        <span class="text-muted-foreground">{{ number }}.</span>
        {{ localize(question.prompt, locale) }}
      </p>
      <div class="flex items-center">
        <IconAction
          :icon="Pencil"
          :label="$t('admin.diagnostic.editQuestion')"
          @click="startEditingPrompt"
        />
        <IconAction
          :icon="Trash2"
          :label="$t('admin.diagnostic.deleteQuestion')"
          @click="confirmOpen = true"
        />
      </div>
    </div>

    <ul class="flex flex-col gap-0.5 pl-9">
      <OptionItem
        v-for="option in question.options"
        :key="option.id"
        :option="option"
        :question="question"
      />
    </ul>

    <div class="pl-9">
      <LocalizedTextEditor
        v-if="addingOption"
        :title="$t('admin.diagnostic.newOption')"
        :field-label="$t('admin.diagnostic.option')"
        :save-label="$t('admin.diagnostic.addOption')"
        @save="saveNewOption"
        @cancel="activeEditor = null"
      >
        <template #extra>
          <div class="flex items-center justify-between gap-2 text-sm">
            <span class="font-medium">{{ $t('admin.diagnostic.score') }}</span>
            <ScoreSelect
              v-model="newOptionScore"
              :label="$t('admin.diagnostic.score')"
            />
          </div>
        </template>
      </LocalizedTextEditor>
      <span
        v-else
        :title="canAddOption ? undefined : $t('admin.diagnostic.maxOptionsHint')"
        class="inline-flex"
      >
        <Button
          variant="ghost"
          size="sm"
          class="text-muted-foreground"
          :disabled="!canAddOption"
          @click="startAddingOption"
        >
          <Plus />
          {{ $t('admin.diagnostic.addOption') }}
        </Button>
      </span>
    </div>

    <ConfirmDelete
      v-model:open="confirmOpen"
      :title="$t('admin.diagnostic.confirmDeleteQuestion.title')"
      :description="$t('admin.diagnostic.confirmDeleteQuestion.description', { count: question.options.length })"
      @confirm="run(() => editor.deleteQuestion(question.id))"
    />
  </li>
</template>
