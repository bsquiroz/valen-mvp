<script setup lang="ts">
import { CircleUser, LogOut, Settings, ShieldCheck } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuthStore } from '@/features/auth/store'
import { useSignOut } from '@/features/auth/ui/useSignOut'
import { useProfileStore } from '@/features/profile/store'

const auth = useAuthStore()
const profileStore = useProfileStore()
const { signOut } = useSignOut()
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button
        variant="ghost"
        size="icon"
        :aria-label="$t('nav.menu')"
      >
        <CircleUser class="size-5" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent
      align="end"
      class="w-60"
    >
      <DropdownMenuLabel class="flex flex-col gap-1 font-normal">
        <span class="flex items-center gap-2 font-medium">
          <span class="truncate">{{ profileStore.profile?.displayName }}</span>
          <Badge
            v-if="profileStore.isAdmin"
            variant="secondary"
          >
            {{ $t('admin.badge') }}
          </Badge>
        </span>
        <span class="truncate text-xs text-muted-foreground">{{ auth.email }}</span>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem as-child>
        <NuxtLink to="/settings">
          <Settings />
          {{ $t('nav.settings') }}
        </NuxtLink>
      </DropdownMenuItem>
      <DropdownMenuItem
        v-if="profileStore.isAdmin"
        as-child
      >
        <NuxtLink to="/admin">
          <ShieldCheck />
          {{ $t('nav.admin') }}
        </NuxtLink>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem @select="signOut">
        <LogOut />
        {{ $t('auth.signOut') }}
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
