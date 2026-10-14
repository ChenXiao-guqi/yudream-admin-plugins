<script setup lang="ts">
import { YdLoadingOverlay } from '@yudream/components'
import type { PonyPluginModel } from '../composables/usePonyPlugin'
import { YdButton, YdCard, YdIcon, YdPageHeader, YdPageMain, YdTag } from '@yudream/components'

defineProps<{ model: PonyPluginModel }>()
</script>

<template>
  <YdPageHeader title="我的小马战绩" class="mb-0">
    <YdButton variant="outline" :loading="model.loading" @click="model.loadMyStats"><YdIcon name="i-ri:refresh-line" />刷新</YdButton>
  </YdPageHeader>
  <YdPageMain>
    <YdLoadingOverlay :loading="model.loading" v-if="model.myStatsEmpty"><YdCard   class="pony-empty-card">
      <YdIcon name="i-ri:gamepad-line" />
      <h3>还没有小马归位战绩</h3>
      <p>在 QQ 群内发送 <code>/小马</code> 开局，成功放马后会自动记录战绩。未绑定 QQ 时请先完成绑定。</p>
    </YdCard></YdLoadingOverlay>
    <template v-else-if="model.myStatsView">
      <YdLoadingOverlay :loading="model.loading"><div  class="pony-stat-grid">
        <YdCard class="pony-stat-card">
          <span>总场次</span>
          <strong>{{ model.myStatsView.played }}</strong>
        </YdCard>
        <YdCard class="pony-stat-card">
          <span>总胜场</span>
          <strong>{{ model.myStatsView.wins }}</strong>
        </YdCard>
        <YdCard class="pony-stat-card">
          <span>胜率</span>
          <strong>{{ model.winRate }}</strong>
        </YdCard>
        <YdCard class="pony-stat-card">
          <span>累计放马</span>
          <strong>{{ model.myStatsView.horsesPlaced }}</strong>
        </YdCard>
        <YdCard class="pony-stat-card">
          <span>当前连胜</span>
          <strong>{{ model.myStatsView.currentStreak }}</strong>
        </YdCard>
        <YdCard class="pony-stat-card">
          <span>最佳连胜</span>
          <strong>{{ model.myStatsView.bestStreak }}</strong>
        </YdCard>
      </div></YdLoadingOverlay>

      <YdCard class="pony-panel-card">
        <h3>战绩概览</h3>
        <div class="pony-mode-row">
          <div>
            <YdTag variant="secondary">胜 / 总</YdTag>
            <strong>{{ model.myStatsView.wins }} / {{ model.myStatsView.played }}</strong>
            <span>群内协作归位</span>
          </div>
          <div>
            <YdTag variant="secondary">连胜</YdTag>
            <strong>{{ model.myStatsView.currentStreak }} / {{ model.myStatsView.bestStreak }}</strong>
            <span>当前 / 最佳</span>
          </div>
        </div>
      </YdCard>
      <p class="pony-muted">最近参与：{{ model.formatTime(model.myStatsView.updatedAt) }}</p>
    </template>
    <YdLoadingOverlay :loading="true" v-else><YdCard   class="pony-empty-card"><p class="pony-muted">战绩加载中…</p></YdCard></YdLoadingOverlay>
  </YdPageMain>
</template>
