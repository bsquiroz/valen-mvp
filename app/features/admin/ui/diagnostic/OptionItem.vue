<script setup lang="ts">
import { Pencil, Trash2 } from '@lucide/vue'
import type { DiagnosticOption, DiagnosticQuestion } from '@/features/diagnostic/data/diagnostic'
import { canRemoveOption } from '@/features/diagnostic/data/editorOps'
import type { LocalizedText } from '@/lib/localizedText'
import { localize } from '@/lib/localizedText'
import { useEditorContext } from './editorContext'

const props = defineProps<{
  option: DiagnosticOption
  question: DiagnosticQuestion
}>()

const { editor, activeEditor, run } = useEditorContext()
const locale = useContentLocale()

const editorKey = computed(() => `option:${props.option.id}`)
const editing = computed(() => activeEditor.value === editorKey.value)
const removable = computed(() => canRemoveOption(props.question))
const confirmOpen = ref(false)

const score = computed({
  get: () => props.option.score ?? 0,
  set: value => run(() => editor.updateOptionScore(props.option.id, value)),
})

function startEditing() {
  activeEditor.value = editorKey.value
}

async function saveLabel(label: LocalizedText) {
  if (await run(() => editor.updateOptionLabel(props.option.id, label))) activeEditor.value = null
}
</script>

<template>
  <li>
    <LocalizedTextEditor
      v-if="editing"
      :title="$t('admin.diagnostic.editOption')"
      :field-label="$t('admin.diagnostic.option')"
      :initial="option.label"
      @save="saveLabel"
      @cancel="activeEditor = null"
    />
    <div
      v-else
      class="group flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md py-1 pr-1 pl-2 transition-colors hover:bg-accent/50"
    >
      <span
        class="min-w-0 flex-1 basis-40 text-sm text-muted-foreground"
        @dblclick="startEditing"
      >
        {{ localize(option.label, locale) }}
      </span>
      <div class="flex items-center gap-1">
        <ScoreSelect
          v-model="score"
          :label="$t('admin.diagnostic.scoreOf', { option: localize(option.label, locale) })"
        />
        <IconAction
          :icon="Pencil"
          :label="$t('admin.diagnostic.editOption')"
          @click="startEditing"
        />
        <IconAction
          :icon="Trash2"
          :label="$t('admin.diagnostic.deleteOption')"
          :disabled="!removable"
          :hint="removable ? undefined : $t('admin.diagnostic.minOptionsHint')"
          @click="confirmOpen = true"
        />
      </div>
    </div>

    <ConfirmDelete
      v-model:open="confirmOpen"
      :title="$t('admin.diagnostic.confirmDeleteOption.title')"
      :description="$t('admin.diagnostic.confirmDeleteOption.description', { option: localize(option.label, locale) })"
      @confirm="run(() => editor.deleteOption(option.id))"
    />
  </li>
</template>
