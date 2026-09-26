import { BookOpen, House, Route, Target, Video } from '@lucide/vue'
import type { Component } from 'vue'
import type { NavIcon } from '../data/navigation'

export const NAV_ICONS: Record<NavIcon, Component> = {
  home: House,
  plan: Route,
  courses: BookOpen,
  challenges: Target,
  sessions: Video,
}
