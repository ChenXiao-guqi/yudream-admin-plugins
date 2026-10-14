<script setup lang="ts">
import { YdLoadingOverlay } from '@yudream/components'
import type { WordlePluginModel } from '../composables/useWordlePlugin'
import { YdButton, YdCard, YdIcon, YdPageHeader, YdPageMain, YdTag } from '@yudream/components'

const props = defineProps<{ model: WordlePluginModel }>()

function distributionEntries() {
  const view = props.model.myStatsView
  if (!view) {
    return []
  }
  return Object.entries(view.winDistribution || {}).sort(([a], [b]) => Number(a) - Number(b))
}
</script>

<template>
  <YdPageHeader title="我的猜词战绩" class="mb-0">
    <YdButton variant="outline" :loading="model.loading" @click="model.loadMyStats"><YdIcon name="i-ri:refresh-line" />刷新</YdButton>
  </YdPageHeader>
  <YdPageMain>
    <YdLoadingOverlay :loading="model.loading" v-if="model.myStatsEmpty"><YdCard   class="wordle-empty-card">
      <YdIcon name="i-ri:gamepad-line" />
      <h3>还没有猜词战绩</h3>
      <p>在 QQ 群内发送 <code>/猜单词</code> 或 <code>/猜成语</code> 开局，猜词后会自动记录战绩。未绑定 QQ 时请先完成绑定。</p>
    </YdCard></YdLoadingOverlay>
    <template v-else-if="model.myStatsView">
      <YdLoadingOverlay :loading="model.loading"><div  class="wordle-stat-grid">
        <YdCard class="wordle-stat-card">
          <span>总场次</span>
          <strong>{{ model.totalPlayed }}</strong>
        </YdCard>
        <YdCard class="wordle-stat-card">
          <span>总胜场</span>
          <strong>{{ model.totalWins }}</strong>
        </YdCard>
        <YdCard class="wordle-stat-card">
          <span>胜率</span>
          <strong>{{ model.winRate }}</strong>
        </YdCard>
        <YdCard class="wordle-stat-card">
          <span>当前连胜</span>
          <strong>{{ model.myStatsView.currentStreak }}</strong>
        </YdCard>
        <YdCard class="wordle-stat-card">
          <span>最佳连胜</span>
          <strong>{{ model.myStatsView.bestStreak }}</strong>
        </YdCard>
      </div></YdLoadingOverlay>

      <div class="wordle-two-col">
        <YdCard class="wordle-panel-card">
          <h3>模式战绩</h3>
          <div class="wordle-mode-row">
            <div>
              <YdTag variant="secondary">英文单词</YdTag>
              <strong>{{ model.myStatsView.englishWins }} / {{ model.myStatsView.englishPlayed }}</strong>
              <span>胜 / 总</span>
            </div>
            <div>
              <YdTag variant="secondary">四字成语</YdTag>
              <strong>{{ model.myStatsView.idiomWins }} / {{ model.myStatsView.idiomPlayed }}</strong>
              <span>胜 / 总</span>
            </div>
          </div>
        </YdCard>
        <YdCard class="wordle-panel-card">
          <h3>猜中分布</h3>
          <div v-if="distributionEntries().length" class="wordle-distribution">
            <div v-for="[guesses, count] in distributionEntries()" :key="guesses" class="wordle-distribution-row">
              <span class="wordle-distribution-label">{{ guesses }} 次猜中</span>
              <div class="wordle-distribution-bar">
                <div class="wordle-distribution-fill" :style="{ width: `${Math.min(100, (count / Math.max(...distributionEntries().map(([, c]) => c))) * 100)}%` }" />
              </div>
              <span>{{ count }}</span>
            </div>
          </div>
          <p v-else class="wordle-muted">还没有猜中记录。</p>
        </YdCard>
      </div>
      <p class="wordle-muted">最近参与：{{ model.formatTime(model.myStatsView.updatedAt) }}</p>
    </template>
    <YdLoadingOverlay :loading="true" v-else><YdCard   class="wordle-empty-card"><p class="wordle-muted">战绩加载中…</p></YdCard></YdLoadingOverlay>
  </YdPageMain>
</template>
