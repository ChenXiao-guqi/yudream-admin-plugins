<script setup lang="ts">
import { YdLoadingOverlay } from '@yudream/components'
import type { WordlePluginModel } from '../composables/useWordlePlugin'
import { YdButton, YdCard, YdEmpty, YdIcon, YdPageHeader, YdPageMain, YdStat, YdStats, YdTag } from '@yudream/components'

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
    <YdButton variant="outline" :loading="model.loading" @click="model.loadMyStats">
      <YdIcon name="morph:refresh" />刷新
    </YdButton>
  </YdPageHeader>
  <YdPageMain>
    <YdEmpty
      v-if="model.myStatsEmpty"
      icon="morph:gamepad"
      title="还没有猜词战绩"
      description="在 QQ 群内发送 /猜单词 或 /猜成语 开局，猜词后会自动记录战绩。未绑定 QQ 时请先完成绑定。"
    />
    <template v-else-if="model.myStatsView">
      <YdLoadingOverlay :loading="model.loading">
        <YdStats>
          <YdStat title="总场次" :value="model.totalPlayed" />
          <YdStat title="总胜场" :value="model.totalWins" />
          <YdStat title="胜率" :value="model.winRate" />
          <YdStat title="当前连胜" :value="model.myStatsView.currentStreak" />
          <YdStat title="最佳连胜" :value="model.myStatsView.bestStreak" />
        </YdStats>
      </YdLoadingOverlay>

      <div class="wordle-two-col mt-4">
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
          <p v-else class="wordle-muted">
            还没有猜中记录。
          </p>
        </YdCard>
      </div>
      <p class="wordle-muted mt-3">最近参与：{{ model.formatTime(model.myStatsView.updatedAt) }}</p>
    </template>
    <YdLoadingOverlay v-else :loading="true">
      <YdCard class="wordle-empty-card">
        <p class="wordle-muted">战绩加载中…</p>
      </YdCard>
    </YdLoadingOverlay>
  </YdPageMain>
</template>
