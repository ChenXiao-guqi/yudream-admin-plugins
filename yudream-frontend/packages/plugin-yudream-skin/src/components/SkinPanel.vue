<template>
  <YdCard class="gap-0 py-0" v-bind="{ headerClass: 'flex flex-row flex-wrap items-center justify-between gap-3 py-4', contentClass: 'grid gap-4' }">
    <template v-if="$slots.header || title" #header>
      <strong>{{ title }}</strong>
      <slot name="header" />
    </template>
    <slot />
  </YdCard>
</template>

<script setup lang="ts">
import { YdCard } from '@yudream/components'
defineProps<{
  title?: string
  stack?: boolean
}>()
</script>
