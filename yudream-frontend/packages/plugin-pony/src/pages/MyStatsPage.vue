<script setup lang="ts">
import { YdLoadingOverlay } from '@yudream/components'
import type { PonyPluginModel } from '../composables/usePonyPlugin'
import { YdButton, YdCard, YdEmpty, YdIcon, YdPageHeader, YdPageMain, YdStat, YdStats, YdTag } from '@yudream/components'

defineProps<{ model: PonyPluginModel }>()
</script>

<template>
  <YdPageHeader title="我的小马战绩" class="mb-0">
    <YdButton variant="outline" :loading="model.loading" @click="model.loadMyStats">
      <YdIcon name="morph:refresh" />刷新
    </YdButton>
  </YdPageHeader>
  <YdPageMain>
    <YdEmpty
      v-if="model.myStatsEmpty"
      icon="morph:gamepad"
      title="还没有小马归位战绩"
      description="在 QQ 群内发送 /小马 开局，成功放马后会自动记录战绩。未绑定 QQ 时请先完成绑定。"
    />
    <template v-else-if="model.myStatsView">
      <YdLoadingOverlay :loading="model.loading">
        <YdStats>
          <YdStat title="总场次" :value="model.myStatsView.played" />
          <YdStat title="总胜场" :value="model.myStatsView.wins" />
          <YdStat title="胜率" :value="model.winRate" />
          <YdStat title="累计放马" :value="model.myStatsView.horsesPlaced" />
          <YdStat title="当前连胜" :value="model.myStatsView.currentStreak" />
          <YdStat title="最佳连胜" :value="model.myStatsView.bestStreak" />
        </YdStats>
      </YdLoadingOverlay>

      <YdCard class="pony-panel-card mt-4">
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
      <p class="pony-muted mt-3">最近参与：{{ model.formatTime(model.myStatsView.updatedAt) }}</p>
    </template>
    <YdLoadingOverlay v-else :loading="true">
      <YdCard class="pony-empty-card">
        <p class="pony-muted">战绩加载中…</p>
      </YdCard>
    </YdLoadingOverlay>
  </YdPageMain>
</template>
