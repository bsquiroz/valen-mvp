<script setup lang="ts">
import CourseDetail from '@/features/courses/ui/CourseDetail.vue'

const route = useRoute()
const courseId = computed(() => String(route.params.courseId))
</script>

<template>
  <CourseDetail :course-id="courseId" />
</template>
