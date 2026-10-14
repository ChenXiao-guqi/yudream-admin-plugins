<script setup lang="ts">
import { YdLoadingOverlay } from '@yudream/components'
import type { McguessPluginModel } from '../composables/useMcguessPlugin'
import { YdButton, YdCard, YdIcon, YdPageHeader, YdPageMain } from '@yudream/components'

defineProps<{ model: McguessPluginModel }>()
</script>

<template>
  <YdPageHeader title="我的猜谜战绩" class="mb-0">
    <YdButton variant="outline" :loading="model.loading" @click="model.loadMyStats"><YdIcon name="i-ri:refresh-line" />刷新</YdButton>
  </YdPageHeader>
  <YdPageMain>
    <YdLoadingOverlay :loading="model.loading" v-if="model.myStatsEmpty"><YdCard   class="mcguess-empty-card">
      <YdIcon name="i-ri:treasure-map-line" />
      <h3>还没有猜谜战绩</h3>
      <p>在 QQ 群内发送 <code>/猜物</code>、<code>/猜生物</code>、<code>/猜合成</code>、<code>/迷雾</code>、<code>/快答</code>、<code>/宾果</code>、<code>/找茬</code> 或 <code>/比大小</code> 参与游戏，猜测后会自动记录战绩。未绑定 QQ 时请先完成绑定。</p>
    </YdCard></YdLoadingOverlay>
    <template v-else-if="model.myStatsView">
      <YdLoadingOverlay :loading="model.loading"><div  class="mcguess-stat-grid">
        <YdCard class="mcguess-stat-card">
          <span>猜物 · 参与 / 获胜</span>
          <strong>{{ model.myStatsView.itemPlayed }} / {{ model.myStatsView.itemWins }}</strong>
        </YdCard>
        <YdCard class="mcguess-stat-card">
          <span>猜生物 · 参与 / 获胜</span>
          <strong>{{ model.myStatsView.mobPlayed }} / {{ model.myStatsView.mobWins }}</strong>
        </YdCard>
        <YdCard class="mcguess-stat-card">
          <span>猜合成 · 参与 / 获胜</span>
          <strong>{{ model.myStatsView.recipePlayed }} / {{ model.myStatsView.recipeWins }}</strong>
        </YdCard>
        <YdCard class="mcguess-stat-card">
          <span>迷雾 · 参与 / 获胜</span>
          <strong>{{ model.myStatsView.fogPlayed }} / {{ model.myStatsView.fogWins }}</strong>
        </YdCard>
        <YdCard class="mcguess-stat-card">
          <span>快答 · 参与 / 获胜</span>
          <strong>{{ model.myStatsView.quizPlayed }} / {{ model.myStatsView.quizWins }}</strong>
        </YdCard>
        <YdCard class="mcguess-stat-card">
          <span>宾果 · 参与 / 获胜</span>
          <strong>{{ model.myStatsView.bingoPlayed }} / {{ model.myStatsView.bingoWins }}</strong>
        </YdCard>
        <YdCard class="mcguess-stat-card">
          <span>找茬 · 参与 / 获胜</span>
          <strong>{{ model.myStatsView.spotPlayed }} / {{ model.myStatsView.spotWins }}</strong>
        </YdCard>
        <YdCard class="mcguess-stat-card">
          <span>图鉴 · 已收集</span>
          <strong>{{ model.myStatsView.collectionCount }}</strong>
        </YdCard>
        <YdCard class="mcguess-stat-card">
          <span>比大小 · 历史最佳</span>
          <strong>{{ model.myStatsView.holBest > 0 ? `${model.myStatsView.holBest} 连胜` : '-' }}</strong>
        </YdCard>
        <YdCard class="mcguess-stat-card">
          <span>胜率</span>
          <strong>{{ model.winRate }}</strong>
        </YdCard>
        <YdCard class="mcguess-stat-card">
          <span>总猜测</span>
          <strong>{{ model.myStatsView.totalGuesses }}</strong>
        </YdCard>
      </div></YdLoadingOverlay>
      <p class="mcguess-muted">最近参与：{{ model.formatTime(model.myStatsView.updatedAt) }}</p>
    </template>
    <YdLoadingOverlay :loading="true" v-else><YdCard   class="mcguess-empty-card"><p class="mcguess-muted">战绩加载中…</p></YdCard></YdLoadingOverlay>
  </YdPageMain>
</template>
