<script setup lang="ts">
import { YdLoadingOverlay } from '@yudream/components'
import type { WordlePluginModel } from '../composables/useWordlePlugin'
import { YdButton, YdCard, YdIcon, YdPageHeader, YdPageMain, YdStat, YdStats } from '@yudream/components'

const props = defineProps<{ model: WordlePluginModel }>()
const overview = () => props.model.overview
</script>

<template>
  <YdPageHeader title="猜词游戏总览" class="mb-0">
    <YdButton variant="outline" :loading="model.loading" @click="model.loadOverview">
      <YdIcon name="morph:refresh" />刷新
    </YdButton>
  </YdPageHeader>
  <YdPageMain>
    <YdLoadingOverlay :loading="model.loading">
      <YdStats>
        <YdStat title="累计对局" :value="overview()?.gamesTotal" />
        <YdStat title="进行中" :value="overview()?.gamesPlaying" />
        <YdStat title="已猜中" :value="overview()?.gamesWon" />
        <YdStat title="自定义词条" :value="overview()?.customWords" />
        <YdStat title="参与玩家" :value="overview()?.playersTotal" />
      </YdStats>
    </YdLoadingOverlay>

    <YdCard class="wordle-help-card mt-4">
      <h3>群内玩法</h3>
      <div class="wordle-help-grid">
        <div>
          <h4><YdIcon name="morph:gamepad" />开局</h4>
          <p><code>/猜单词</code> 开始一局英文单词（默认词长 5），可附加词长，如 <code>/猜单词 6</code>。</p>
          <p><code>/猜成语</code> 开始一局四字成语。</p>
          <p>附加「困难」开启困难模式：<code>/猜单词 困难</code>，困难模式必须沿用已揭示的提示。</p>
        </div>
        <div>
          <h4><YdIcon name="morph:keyboard" />猜词</h4>
          <p><code>/猜 crane</code> 提交一次猜测；<code>/猜 随机</code> 随机挑一个未猜过的词。</p>
          <p><code>/猜词状态</code> 查看当前棋盘，<code>/结束猜词</code> 提前揭晓答案。</p>
        </div>
        <div>
          <h4><YdIcon name="morph:trophy" />战绩</h4>
          <p><code>/猜词战绩</code> 查看个人战绩（需绑定账号），<code>/猜词排行</code> 查看群内排行。</p>
          <p><code>/猜词帮助</code> 查看完整指令说明。</p>
        </div>
        <div>
          <h4><YdIcon name="morph:grid" />图例</h4>
          <p>🟩 字母与位置都正确，🟨 字母存在但位置不对，⬜ 字母不存在。</p>
          <p>管理端可在「词条管理」中补充自定义词库，禁用词条不会进入答案池。</p>
        </div>
      </div>
    </YdCard>
  </YdPageMain>
</template>
