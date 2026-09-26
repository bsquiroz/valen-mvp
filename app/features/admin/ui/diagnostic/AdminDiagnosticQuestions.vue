<script setup lang="ts">
import { FlaskConical, Plus } from '@lucide/vue'
import { VueDraggable } from 'vue-draggable-plus'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { DiagnosticQuestion } from '@/features/diagnostic/data/diagnostic'
import { questionsByPillar } from '@/features/diagnostic/data/diagnostic'
import { useDiagnosticEditor } from '@/features/diagnostic/ui/useDiagnosticEditor'
import type { Pillar } from '@/lib/pillars'
import { PILLARS } from '@/lib/pillars'
import { editorContextKey } from './editorContext'
import NewQuestionForm from './NewQuestionForm.vue'
import QuestionItem from './QuestionItem.vue'

const editor = useDiagnosticEditor()
const { questions, status, saving, changeCount, hasChanges } = editor
const groups = computed(() => questionsByPillar(questions.value))
const { t } = useI18n()

const activeEditor = ref<string | null>(null)
const actionError = ref(false)
const saveError = ref(false)

// Los cambios quedan en un borrador local; "Guardar cambios" hace una sola escritura.
async function save() {
  saveError.value = false
  try {
    await editor.save()
  }
  catch (error) {
    console.error(error)
    saveError.value = true
  }
}

function discard() {
  saveError.value = false
  activeEditor.value = null
  editor.discard()
}

useUnsavedChangesGuard({ hasChanges: () => hasChanges.value, discard: editor.discard })

async function run(operation: () => unknown): Promise<boolean> {
  actionError.value = false
  try {
    await operation()
    return true
  }
  catch (error) {
    console.error(error)
    actionError.value = true
    return false
  }
}

provide(editorContextKey, { editor, activeEditor, run })

function onReorder(pillar: Pillar, list: DiagnosticQuestion[]) {
  run(() => editor.reorderQuestions(pillar, list.map(question => question.id)))
}

onMounted(editor.load)
</script>

<template>
  <div
    class="flex flex-col gap-4"
    :class="{ 'pb-24': hasChanges }"
  >
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div class="flex flex-col gap-0.5 text-sm text-muted-foreground">
        <p class="font-medium text-foreground">
          {{ $t('admin.diagnostic.count', { count: questions.length }) }}
        </p>
        <p>{{ $t('admin.diagnostic.changesNote') }}</p>
      </div>
      <!-- La vista previa usa lo guardado: con cambios pendientes se guarda primero -->
      <span
        :title="hasChanges ? $t('admin.diagnostic.saveBeforeTrying') : undefined"
        class="inline-flex"
      >
        <Button
          v-if="hasChanges"
          disabled
        >
          <FlaskConical />
          {{ $t('admin.diagnostic.tryIt') }}
        </Button>
        <Button
          v-else
          as-child
        >
          <NuxtLink to="/admin/diagnostic/preview">
            <FlaskConical />
            {{ $t('admin.diagnostic.tryIt') }}
          </NuxtLink>
        </Button>
      </span>
    </div>

    <Alert
      v-if="actionError"
      variant="destructive"
    >
      <AlertDescription>{{ $t('admin.diagnostic.actionError') }}</AlertDescription>
    </Alert>

    <p
      v-if="status === 'loading'"
      class="text-sm text-muted-foreground"
    >
      {{ $t('common.loading') }}
    </p>

    <Alert
      v-else-if="status === 'error'"
      variant="destructive"
    >
      <AlertDescription>{{ $t('diagnostic.loadError') }}</AlertDescription>
    </Alert>

    <template v-else>
      <Card
        v-for="pillar in PILLARS"
        :key="pillar"
      >
        <CardHeader>
          <CardTitle
            as="h2"
            class="flex items-center gap-2"
          >
            {{ $t(`pillars.${pillar}`) }}
            <Badge variant="secondary">
              {{ groups[pillar].length }}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent class="flex flex-col gap-4">
          <!-- Arrastrar desde el asa reordena dentro del pilar (no entre pilares) -->
          <VueDraggable
            v-if="groups[pillar].length"
            :model-value="groups[pillar]"
            tag="ol"
            handle=".drag-handle"
            :group="pillar"
            :animation="150"
            ghost-class="drag-ghost"
            class="flex flex-col divide-y"
            @update:model-value="onReorder(pillar, $event)"
          >
            <QuestionItem
              v-for="(question, index) in groups[pillar]"
              :key="question.id"
              :question="question"
              :number="index + 1"
              :total="groups[pillar].length"
            />
          </VueDraggable>

          <NewQuestionForm
            v-if="activeEditor === `new-question:${pillar}`"
            :pillar="pillar"
            @done="activeEditor = null"
          />
          <Button
            v-else
            variant="outline"
            class="self-start border-dashed"
            @click="activeEditor = `new-question:${pillar}`"
          >
            <Plus />
            {{ $t('admin.diagnostic.addQuestionTo', { pillar: $t(`pillars.${pillar}`) }) }}
          </Button>
        </CardContent>
      </Card>
    </template>

    <UnsavedChangesBar
      v-if="hasChanges"
      :message="t('admin.diagnostic.unsaved', { count: changeCount }, changeCount)"
      :save-label="t('common.unsaved.save')"
      :error="saveError ? t('admin.diagnostic.saveError') : null"
      :saving="saving"
      @save="save"
      @discard="discard"
    />
  </div>
</template>
