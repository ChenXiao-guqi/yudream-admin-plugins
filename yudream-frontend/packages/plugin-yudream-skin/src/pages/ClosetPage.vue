<script setup lang="ts">
// yudream-self-chrome 页面自管页头与卡片
import type { SkinPluginModel } from '../composables/useSkinPlugin'
import { nextTick, onMounted } from 'vue'
import DashboardPage from './DashboardPage.vue'
import { YdPageHeader, YdPageMain } from '@yudream/components'

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

  <YdPageHeader title="我的衣柜" class="mb-0" />
  <YdPageMain>  <DashboardPage :model="model" />
</YdPageMain>
</template>
