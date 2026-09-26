export type NavIcon = 'home' | 'plan' | 'courses' | 'challenges' | 'sessions'

export interface NavItem {
  to: string
  labelKey: string
  icon: NavIcon
}

// Navegación principal. En móvil va en la barra inferior, así que conviene no pasar de 5 ítems.
export const MAIN_NAV: NavItem[] = [
  { to: '/', labelKey: 'nav.home', icon: 'home' },
  { to: '/plan', labelKey: 'nav.plan', icon: 'plan' },
  { to: '/courses', labelKey: 'nav.courses', icon: 'courses' },
  { to: '/challenges', labelKey: 'nav.challenges', icon: 'challenges' },
  { to: '/sessions', labelKey: 'nav.sessions', icon: 'sessions' },
]

export function isNavActive(currentPath: string, to: string): boolean {
  if (to === '/') return currentPath === '/'
  return currentPath === to || currentPath.startsWith(`${to}/`)
}
