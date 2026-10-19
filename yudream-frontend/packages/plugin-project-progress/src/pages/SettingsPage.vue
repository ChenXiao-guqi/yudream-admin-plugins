<script setup lang="ts">
// yudream-self-chrome 页面自管页头与卡片
import type { ProjectProgressModel } from '../composables/useProjectProgress'
import { ref } from 'vue'
import { YdButton, YdPageHeader, YdSettingsLayout, YdSettingsSection } from '@yudream/components'
import ProgressPanel from '../components/ProgressPanel.vue'

defineProps<{
  model: ProjectProgressModel
}>()
/** 设置页分区：单分区页保持统一骨架 */
const activeSection = ref('main')
const sectionList: { icon?: string, label: string, value: string }[] = [
  { label: "联动状态", value: 'main' },
]
</script>

<template>

  <YdPageHeader title="插件设置" class="mb-0"></YdPageHeader>
  <div class="pp-settings-shell">

  <YdSettingsLayout
    v-model="activeSection"
    :list="sectionList"
    surface
    scroll
    width-class="max-w-[880px]"
  >
    <template #main>
      <YdSettingsSection
        title="联动状态"
        description="插件依赖能力的可用性状态。"
      >
  <section class="pp-page">
    <section class="pp-toolbar">
      <div>
        <span>联动状态</span>
        <h2>插件状态</h2>
      </div>
      <YdButton variant="outline" :loading="model.loading" @click="model.load">刷新状态</YdButton>
    </section>

    <ProgressPanel title="依赖能力" subtle="Minecraft 自动打卡已改为按项目配置，这里只显示联动能力是否可用">
      <div class="pp-status-grid">
        <article :class="{ ok: model.status?.mailReady }">
          <span>邮件通知</span>
          <strong>{{ model.status?.mailReady ? '可用' : '不可用' }}</strong>
        </article>
        <article :class="{ ok: model.status?.minecraftReady }">
          <span>Minecraft Server</span>
          <strong>{{ model.status?.minecraftReady ? '已启用' : '未启用' }}</strong>
        </article>
      </div>
    </ProgressPanel>
  </section>
      </YdSettingsSection>
    </template>
  </YdSettingsLayout>
</div>

</template>
