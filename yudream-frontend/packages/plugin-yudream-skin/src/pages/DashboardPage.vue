<script setup lang="ts">
import type { SkinPluginModel } from '../composables/useSkinPlugin'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { YdAnimatedCountTo, YdButton, YdDigitalCard, YdIcon, YdPageHeader, YdPageMain } from '@yudream/components'
import ClosetWorkbench from '../components/ClosetWorkbench.vue'

const props = defineProps<{ model: SkinPluginModel }>()
const router = useRouter()
const basePath = '/platform/plugins/yudream-skin'
const stats = computed(() => [
  { title: '我的角色', value: props.model.players.length, icon: 'morph:users', description: '选择角色，为它搭配外观' },
  { title: '收藏皮肤', value: props.model.closetItems.filter(item => { const texture = props.model.textures.find(texture => texture.hash === item.textureHash); return texture && texture.type !== 'cape' }).length, icon: 'morph:shirt', description: '喜欢的皮肤，随时试穿' },
  { title: '收藏披风', value: props.model.closetItems.filter(item => props.model.textures.find(texture => texture.hash === item.textureHash)?.type === 'cape').length, icon: 'morph:flag', description: '搭配披风，保留当前皮肤' },
])
</script>

<template>
  <div class="skin-dashboard">
    <YdPageHeader title="我的皮肤与衣柜" description="角色、收藏和换装预览，都在同一个工作区。" class="mb-0">
      <div class="skin-dashboard__actions">
        <YdButton variant="outline" @click="router.push(`${basePath}/players`)"><YdIcon name="morph:users" />{{ model.players.length ? '管理角色' : '创建角色' }}</YdButton>
        <YdButton @click="router.push(`${basePath}/textures`)"><YdIcon name="morph:shirt" />去皮肤库</YdButton>
      </div>
    </YdPageHeader>
    <YdPageMain>
      <div class="skin-dashboard__content">
        <div class="skin-dashboard__stats" aria-label="个人皮肤站概况">
          <YdDigitalCard v-for="stat in stats" :key="stat.title" :title="stat.title" :digital="stat.value" :icon="stat.icon" :description="stat.description">
            <template #value><YdAnimatedCountTo :value="stat.value" /></template>
          </YdDigitalCard>
        </div>
        <section id="closet" class="skin-dashboard__closet" aria-label="我的衣柜"><ClosetWorkbench :model="model" /></section>
      </div>
    </YdPageMain>
  </div>
</template>

<style scoped>
.skin-dashboard { min-width: 0; }
.skin-dashboard__content { display: grid; gap: var(--yd-content-gap, 24px); min-width: 0; }
.skin-dashboard__actions { display: flex; flex-wrap: wrap; gap: 8px; }
.skin-dashboard__stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--yd-content-gap, 16px); }
.skin-dashboard__closet { min-width: 0; scroll-margin-top: 24px; }
@container (max-width: 600px) {
  .skin-dashboard__stats { gap: 8px; }
  .skin-dashboard__stats :deep(.yd-digital-card) { padding: 12px; gap: 8px; }
  .skin-dashboard__stats :deep(header) { font-size: 12px; }
  .skin-dashboard__stats :deep(header svg),
  .skin-dashboard__stats :deep(.yd-digital-card > div.yd-muted) { display: none; }
  .skin-dashboard__stats :deep(.yd-digital-value) { font-size: 24px; }
}
</style>
