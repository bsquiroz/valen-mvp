<script setup lang="ts">
import { Plus } from '@lucide/vue'
import { VueDraggable } from 'vue-draggable-plus'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { PlanStepForm as Form, PlanStepTemplate } from '@/features/plan/data/adminPlan'
import { isTemplateInUseError } from '@/features/plan/data/adminPlan'
import { usePlanEditor } from '@/features/plan/ui/usePlanEditor'
import { groupByPillar } from '@/lib/pillarOrdering'
import type { Pillar } from '@/lib/pillars'
import { PILLARS } from '@/lib/pillars'
import { planEditorContextKey } from './editorContext'
import PlanStepForm from './PlanStepForm.vue'
import PlanStepTemplateItem from './PlanStepTemplateItem.vue'

const editor = usePlanEditor()
const { templates, status, saving, changeCount, hasChanges } = editor
const { t } = useI18n()
const groups = computed(() => groupByPillar(templates.value))
const activeCount = computed(() => templates.value.filter(template => template.isActive).length)

const activeEditor = ref<string | null>(null)
const actionError = ref(false)
const saveError = ref<string | null>(null)

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

// Los cambios quedan en un borrador local; "Guardar cambios" hace una sola escritura.
async function save() {
  saveError.value = null
  try {
    await editor.save()
  }
  catch (error) {
    console.error(error)
    saveError.value = t(isTemplateInUseError(error) ? 'admin.plan.inUseError' : 'admin.diagnostic.saveError')
  }
}

function discard() {
  saveError.value = null
  activeEditor.value = null
  editor.discard()
}

useUnsavedChangesGuard({ hasChanges: () => hasChanges.value, discard: editor.discard })

provide(planEditorContextKey, { editor, activeEditor, run })

function onReorder(pillar: Pillar, list: PlanStepTemplate[]) {
  run(() => editor.reorderTemplates(pillar, list.map(template => template.id)))
}

async function create(pillar: Pillar, form: Form) {
  if (await run(() => editor.createTemplate(pillar, form))) activeEditor.value = null
}

onMounted(editor.load)
</script>

<template>
  <div
    class="flex flex-col gap-4"
    :class="{ 'pb-24': hasChanges }"
  >
    <div class="flex flex-col gap-0.5 text-sm text-muted-foreground">
      <p class="font-medium text-foreground">
        {{ $t('admin.plan.count', { active: activeCount, total: templates.length }) }}
      </p>
      <p>{{ $t('admin.plan.changesNote') }}</p>
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
      <AlertDescription>{{ $t('admin.plan.loadError') }}</AlertDescription>
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
            :group="`plan-${pillar}`"
            :animation="150"
            ghost-class="drag-ghost"
            class="flex flex-col divide-y"
            @update:model-value="onReorder(pillar, $event)"
          >
            <PlanStepTemplateItem
              v-for="(template, index) in groups[pillar]"
              :key="template.id"
              :template="template"
              :number="index + 1"
              :total="groups[pillar].length"
            />
          </VueDraggable>

          <PlanStepForm
            v-if="activeEditor === `new-step:${pillar}`"
            :title="$t('admin.plan.newStepIn', { pillar: $t(`pillars.${pillar}`) })"
            :save-label="$t('admin.plan.createStep')"
            @save="create(pillar, $event)"
            @cancel="activeEditor = null"
          />
          <Button
            v-else
            variant="outline"
            class="self-start border-dashed"
            @click="activeEditor = `new-step:${pillar}`"
          >
            <Plus />
            {{ $t('admin.plan.addStepTo', { pillar: $t(`pillars.${pillar}`) }) }}
          </Button>
        </CardContent>
      </Card>
    </template>

    <UnsavedChangesBar
      v-if="hasChanges"
      :message="t('admin.plan.unsaved', { count: changeCount }, changeCount)"
      :save-label="t('common.unsaved.save')"
      :error="saveError"
      :saving="saving"
      @save="save"
      @discard="discard"
    />
  </div>
</template>
