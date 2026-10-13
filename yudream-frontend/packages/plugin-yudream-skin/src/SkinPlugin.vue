<script setup lang="ts">
import type { Component } from 'vue'
import type { YuDreamPluginSdk } from '@yudream/plugin-sdk'
import { FaAlert, FaButton, FaIcon, FaPageMain } from '@yudream/components'
import { computed, onMounted, ref, watch } from 'vue'
import { useSkinPlugin } from './composables/useSkinPlugin'
import AdminPlayersPage from './pages/AdminPlayersPage.vue'
import AdminTexturesPage from './pages/AdminTexturesPage.vue'
import AdminClosetPage from './pages/AdminClosetPage.vue'
import ClosetPage from './pages/ClosetPage.vue'
import DashboardPage from './pages/DashboardPage.vue'
import PlayersPage from './pages/PlayersPage.vue'
import MigrationPage from './pages/MigrationPage.vue'
import SystemPage from './pages/SystemPage.vue'
import TexturesPage from './pages/TexturesPage.vue'
import type { SkinPage } from './types'

const props = defineProps<{
  sdk: YuDreamPluginSdk
  page: SkinPage
  scope: 'user' | 'admin'
}>()

const model = useSkinPlugin(props.sdk)
const loadError = ref('')
const initialLoad = ref(true)

const pageComponents: Record<SkinPage, Component> = {
  dashboard: DashboardPage,
  settings: SystemPage,
  migration: MigrationPage,
  players: PlayersPage,
  textures: TexturesPage,
  closet: ClosetPage,
  playerManagement: AdminPlayersPage,
  textureManagement: AdminTexturesPage,
  closetManagement: AdminClosetPage,
}

const pageComponent = computed(() => pageComponents[props.page])
const personalPermissionMissing = computed(() => {
  return props.scope === 'user'
    && props.page !== 'textures'
    && !model.canUse
})

async function loadCurrentPage() {
  if (personalPermissionMissing.value) {
    initialLoad.value = false
    return
  }
  loadError.value = ''
  const includeCollections = props.page !== 'settings'
  try {
    await model.load({
      includeCloset: includeCollections && props.page !== 'playerManagement' && props.page !== 'textureManagement',
      includeMigration: props.page === 'migration',
      includePlayers: includeCollections && props.page !== 'textureManagement' && props.page !== 'closetManagement',
      includeTextures: includeCollections,
      scope: props.scope,
    })
  }
  catch (error) {
    loadError.value = error instanceof Error ? error.message : '皮肤站数据加载失败，请重试。'
  }
  finally {
    initialLoad.value = false
  }
}

onMounted(loadCurrentPage)
watch(() => [props.page, props.scope, model.canUse], loadCurrentPage)
</script>

<template>
  <div class="skin-plugin">
    <FaPageMain v-if="personalPermissionMissing">
      <FaAlert
        icon="i-ri:lock-line"
        title="个人皮肤功能需要使用权限"
        description="当前账号可以查看皮肤库。使用仪表盘中的个人角色和衣柜功能，请联系管理员开通「使用皮肤站」权限。"
      />
      <a class="skin-secondary-link mt-4" href="/platform/plugins/yudream-skin/textures">查看皮肤库</a>
    </FaPageMain>
    <FaPageMain v-else-if="initialLoad || (model.loading && !model.me)" role="status" aria-live="polite">
      <div class="flex items-center gap-2 py-6">
        <FaIcon name="morph:loader-circle" class="animate-spin" />
        正在加载皮肤与衣柜…
      </div>
    </FaPageMain>
    <FaPageMain v-else-if="loadError">
      <FaAlert title="皮肤站数据加载失败" :description="loadError" />
      <FaButton class="mt-4" :loading="model.loading" @click="loadCurrentPage">重新加载</FaButton>
    </FaPageMain>
    <component v-else :is="pageComponent" :model="model" />
  </div>
</template>
