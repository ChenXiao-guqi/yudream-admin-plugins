<template>
  <YdCard :title="title" :description="eyebrow">
    <slot />
  </YdCard>
</template>

<script setup lang="ts">
import { YdCard } from '@yudream/components'

defineProps<{
  title: string
  eyebrow: string
}>()
</script>
