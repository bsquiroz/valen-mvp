<script setup lang="ts">
import { Plus } from '@lucide/vue'
import { VueDraggable } from 'vue-draggable-plus'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AdminChallenge, ChallengeForm as Form } from '@/features/challenges/data/adminChallenges'
import { isChallengeInUseError } from '@/features/challenges/data/adminChallenges'
import { useChallengesEditor } from '@/features/challenges/ui/useChallengesEditor'
import { groupByPillar } from '@/lib/pillarOrdering'
import type { Pillar } from '@/lib/pillars'
import { PILLARS } from '@/lib/pillars'
import ChallengeEditorItem from './ChallengeEditorItem.vue'
import ChallengeForm from './ChallengeForm.vue'
import { challengesEditorContextKey } from './editorContext'

const editor = useChallengesEditor()
const { challenges, status, saving, changeCount, hasChanges } = editor
const groups = computed(() => groupByPillar(challenges.value))
const activeCount = computed(() => challenges.value.filter(challenge => challenge.isActive).length)
const { t } = useI18n()

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

provide(challengesEditorContextKey, { editor, activeEditor, run })

// Los cambios quedan en un borrador local; "Guardar cambios" hace una sola escritura.
async function save() {
  saveError.value = null
  try {
    await editor.save()
  }
  catch (error) {
    console.error(error)
    saveError.value = t(isChallengeInUseError(error) ? 'admin.challenges.inUseError' : 'admin.diagnostic.saveError')
  }
}

function discard() {
  saveError.value = null
  activeEditor.value = null
  editor.discard()
}

useUnsavedChangesGuard({ hasChanges: () => hasChanges.value, discard: editor.discard })

function onReorder(pillar: Pillar, list: AdminChallenge[]) {
  run(() => editor.reorderChallenges(pillar, list.map(challenge => challenge.id)))
}

async function create(pillar: Pillar, form: Form) {
  if (await run(() => editor.createChallenge(pillar, form))) activeEditor.value = null
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
        {{ $t('admin.challenges.count', { active: activeCount, total: challenges.length }) }}
      </p>
      <p>{{ $t('admin.challenges.changesNote') }}</p>
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
      <AlertDescription>{{ $t('admin.challenges.loadError') }}</AlertDescription>
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
            :group="`challenges-${pillar}`"
            :animation="150"
            ghost-class="drag-ghost"
            class="flex flex-col divide-y"
            @update:model-value="onReorder(pillar, $event)"
          >
            <ChallengeEditorItem
              v-for="(challenge, index) in groups[pillar]"
              :key="challenge.id"
              :challenge="challenge"
              :number="index + 1"
              :total="groups[pillar].length"
            />
          </VueDraggable>

          <ChallengeForm
            v-if="activeEditor === `new-challenge:${pillar}`"
            :title="$t('admin.challenges.newChallengeIn', { pillar: $t(`pillars.${pillar}`) })"
            :save-label="$t('admin.challenges.createChallenge')"
            @save="create(pillar, $event)"
            @cancel="activeEditor = null"
          />
          <Button
            v-else
            variant="outline"
            class="self-start border-dashed"
            @click="activeEditor = `new-challenge:${pillar}`"
          >
            <Plus />
            {{ $t('admin.challenges.addChallengeTo', { pillar: $t(`pillars.${pillar}`) }) }}
          </Button>
        </CardContent>
      </Card>
    </template>

    <UnsavedChangesBar
      v-if="hasChanges"
      :message="t('admin.challenges.unsaved', { count: changeCount }, changeCount)"
      :save-label="t('common.unsaved.save')"
      :error="saveError"
      :saving="saving"
      @save="save"
      @discard="discard"
    />
  </div>
</template>
