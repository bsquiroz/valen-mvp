<script setup lang="ts">
import { Plus } from '@lucide/vue'
import { VueDraggable } from 'vue-draggable-plus'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AdminCourse, CourseForm as Form } from '@/features/courses/data/adminCourses'
import { isLessonInUseError } from '@/features/courses/data/adminCourses'
import { useCoursesEditor } from '@/features/courses/ui/useCoursesEditor'
import { groupByPillar } from '@/lib/pillarOrdering'
import type { Pillar } from '@/lib/pillars'
import { PILLARS } from '@/lib/pillars'
import CourseEditorItem from './CourseEditorItem.vue'
import CourseForm from './CourseForm.vue'
import { coursesEditorContextKey } from './editorContext'

const editor = useCoursesEditor()
const { courses, status, saving, changeCount, hasChanges } = editor
const groups = computed(() => groupByPillar(courses.value))
const lessonTotal = computed(() => courses.value.reduce((sum, course) => sum + course.lessons.length, 0))
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

provide(coursesEditorContextKey, { editor, activeEditor, run })

// Los cambios quedan en un borrador local; "Guardar cambios" hace una sola escritura.
async function save() {
  saveError.value = null
  try {
    await editor.save()
  }
  catch (error) {
    console.error(error)
    saveError.value = t(isLessonInUseError(error) ? 'admin.courses.inUseError' : 'admin.diagnostic.saveError')
  }
}

function discard() {
  saveError.value = null
  activeEditor.value = null
  editor.discard()
}

useUnsavedChangesGuard({ hasChanges: () => hasChanges.value, discard: editor.discard })

function onReorder(pillar: Pillar, list: AdminCourse[]) {
  run(() => editor.reorderCourses(pillar, list.map(course => course.id)))
}

async function create(pillar: Pillar, form: Form) {
  if (await run(() => editor.createCourse(pillar, form))) activeEditor.value = null
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
        {{ $t('admin.courses.count', { courses: courses.length, lessons: lessonTotal }) }}
      </p>
      <p>{{ $t('admin.courses.changesNote') }}</p>
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
      <AlertDescription>{{ $t('admin.courses.loadError') }}</AlertDescription>
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
            handle=".course-drag-handle"
            :group="`courses-${pillar}`"
            :animation="150"
            ghost-class="drag-ghost"
            class="flex flex-col divide-y"
            @update:model-value="onReorder(pillar, $event)"
          >
            <CourseEditorItem
              v-for="(course, index) in groups[pillar]"
              :key="course.id"
              :course="course"
              :number="index + 1"
              :total="groups[pillar].length"
            />
          </VueDraggable>

          <CourseForm
            v-if="activeEditor === `new-course:${pillar}`"
            :title="$t('admin.courses.newCourseIn', { pillar: $t(`pillars.${pillar}`) })"
            :save-label="$t('admin.courses.createCourse')"
            @save="create(pillar, $event)"
            @cancel="activeEditor = null"
          />
          <Button
            v-else
            variant="outline"
            class="self-start border-dashed"
            @click="activeEditor = `new-course:${pillar}`"
          >
            <Plus />
            {{ $t('admin.courses.addCourseTo', { pillar: $t(`pillars.${pillar}`) }) }}
          </Button>
        </CardContent>
      </Card>
    </template>

    <UnsavedChangesBar
      v-if="hasChanges"
      :message="t('admin.courses.unsaved', { count: changeCount }, changeCount)"
      :save-label="t('common.unsaved.save')"
      :error="saveError"
      :saving="saving"
      @save="save"
      @discard="discard"
    />
  </div>
</template>
