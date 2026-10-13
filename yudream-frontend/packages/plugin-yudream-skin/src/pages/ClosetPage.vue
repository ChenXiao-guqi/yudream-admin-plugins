<script setup lang="ts">
import type { SkinPluginModel } from '../composables/useSkinPlugin'
import { nextTick, onMounted } from 'vue'
import DashboardPage from './DashboardPage.vue'

const props = defineProps<{
  model: SkinPluginModel
}>()

async function focusCloset() {
  await nextTick()
  document.getElementById('closet')?.scrollIntoView({ block: 'start' })
}

onMounted(focusCloset)
</script>

<template>
  <DashboardPage :model="model" />
</template>
