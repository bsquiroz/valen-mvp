<script setup lang="ts">
import { Eye, EyeOff, GripVertical, Pencil, Trash2 } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import type { PlanStepForm as Form, PlanStepTemplate } from '@/features/plan/data/adminPlan'
import { canDeleteTemplate } from '@/features/plan/data/adminPlan'
import { localize } from '@/lib/localizedText'
import { usePlanEditorContext } from './editorContext'
import PlanStepForm from './PlanStepForm.vue'

const props = defineProps<{
  template: PlanStepTemplate
  number: number
  total: number
}>()

const { editor, activeEditor, run } = usePlanEditorContext()
const locale = useContentLocale()

const editorKey = computed(() => `step:${props.template.id}`)
const editing = computed(() => activeEditor.value === editorKey.value)
const deletable = computed(() => canDeleteTemplate(props.template))
const confirmOpen = ref(false)

function startEditing() {
  activeEditor.value = editorKey.value
}

async function save(form: Form) {
  if (await run(() => editor.updateTemplate(props.template.id, form))) activeEditor.value = null
}

function toggleActive() {
  run(() => editor.updateTemplate(props.template.id, { isActive: !props.template.isActive }))
}

// Mover con teclado desde el asa; se devuelve el foco porque el nodo cambia de lugar.
const handleRef = useTemplateRef<HTMLButtonElement>('handle')

async function moveBy(delta: number) {
  if (await run(() => editor.moveTemplate(props.template.id, delta))) {
    await nextTick()
    handleRef.value?.focus()
  }
}
</script>

<template>
  <li class="py-3 first:pt-0 last:pb-0">
    <PlanStepForm
      v-if="editing"
      :title="$t('admin.plan.editStep')"
      :initial="template"
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
        :aria-label="$t('admin.plan.moveStep', { number, total })"
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
        :class="{ 'text-muted-foreground': !template.isActive }"
        @dblclick="startEditing"
      >
        <p class="text-sm font-medium">
          <span class="text-muted-foreground">{{ number }}.</span>
          {{ localize(template.title, locale) }}
        </p>
        <p
          v-if="template.description"
          class="text-sm text-muted-foreground"
        >
          {{ localize(template.description, locale) }}
        </p>
        <div class="flex flex-wrap items-center gap-1.5">
          <Badge
            v-if="!template.isActive"
            variant="outline"
          >
            {{ $t('admin.plan.inactive') }}
          </Badge>
          <Badge
            v-for="level in template.levels"
            :key="level"
            variant="secondary"
          >
            {{ $t(`diagnostic.levels.${level}`) }}
          </Badge>
          <span class="text-xs text-muted-foreground">
            {{ $t('admin.plan.usage', { count: template.users }, template.users) }}
          </span>
        </div>
      </div>

      <div class="flex items-center">
        <IconAction
          :icon="Pencil"
          :label="$t('admin.plan.editStep')"
          @click="startEditing"
        />
        <IconAction
          :icon="template.isActive ? EyeOff : Eye"
          :label="$t(template.isActive ? 'admin.plan.deactivate' : 'admin.plan.activate')"
          @click="toggleActive"
        />
        <IconAction
          :icon="Trash2"
          :label="$t('admin.plan.deleteStep')"
          :disabled="!deletable"
          :hint="deletable ? undefined : $t('admin.plan.deleteDisabledHint')"
          @click="confirmOpen = true"
        />
      </div>
    </div>

    <ConfirmDelete
      v-model:open="confirmOpen"
      :title="$t('admin.plan.confirmDelete.title')"
      :description="$t('admin.plan.confirmDelete.description')"
      @confirm="run(() => editor.deleteTemplate(template.id))"
    />
  </li>
</template>
