<script setup lang="ts">
import LessonPlayer from '@/features/courses/ui/LessonPlayer.vue'

const route = useRoute()
const courseId = computed(() => String(route.params.courseId))
const lessonId = computed(() => String(route.params.lessonId))
</script>

<template>
  <LessonPlayer
    :course-id="courseId"
    :lesson-id="lessonId"
  />
</template>
