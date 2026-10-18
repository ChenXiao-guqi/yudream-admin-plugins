<script setup lang="ts">
import type { TableColumn } from '@yudream/components'
import type { WordlePluginModel } from '../composables/useWordlePlugin'
import type { WordlePlayerView } from '../types'
import { YdLoadingOverlay, YdPagination, YdResponsiveEnhancedTable, YdTablePageLayout } from '@yudream/components'

defineProps<{ model: WordlePluginModel }>()

const columns: TableColumn<WordlePlayerView>[] = [
  { id: 'player', header: '玩家', minWidth: 180 },
  { id: 'qq', header: 'QQ', width: 130 },
  { id: 'english', header: '英文单词', width: 120 },
  { id: 'idiom', header: '四字成语', width: 120 },
  { id: 'winRate', header: '胜率', width: 90 },
  { id: 'streak', header: '连胜', width: 160 },
  { id: 'distribution', header: '猜中分布', minWidth: 200 },
  { accessorKey: 'updatedAt', header: '最近参与', width: 180, defaultHidden: true },
]

function distributionText(player: WordlePlayerView) {
  const entries = Object.entries(player.winDistribution || {}).sort(([a], [b]) => Number(a) - Number(b))
  return entries.length ? entries.map(([guesses, count]) => `${guesses} 次×${count}`).join('，') : '-'
}
</script>

<template>
  <YdTablePageLayout title="玩家战绩" :show-search="false">
    <template #table>
      <YdLoadingOverlay :loading="model.loading">
        <YdResponsiveEnhancedTable
          row-key="userId"
          table-root-class="rounded-lg overflow-hidden"
          table-class="min-w-[1120px]"
          border
          stripe
          column-visibility
          :columns="columns"
          :data="model.players"
          empty-text="暂无玩家战绩"
        >
          <template #cell-player="{ row }"><strong>{{ model.playerLabel(row.original) }}</strong></template>
          <template #cell-qq="{ row }">{{ row.original.qq || '-' }}</template>
          <template #cell-english="{ row }">{{ row.original.englishWins }} / {{ row.original.englishPlayed }}</template>
          <template #cell-idiom="{ row }">{{ row.original.idiomWins }} / {{ row.original.idiomPlayed }}</template>
          <template #cell-winRate="{ row }">{{ model.playerWinRate(row.original) }}</template>
          <template #cell-streak="{ row }">
            <span class="yd-status-tone mr-1" data-tone="info">当前 {{ row.original.currentStreak }}</span>
            <span class="yd-status-tone" data-tone="neutral">最佳 {{ row.original.bestStreak }}</span>
          </template>
          <template #cell-distribution="{ row }">{{ distributionText(row.original) }}</template>
          <template #cell-updatedAt="{ row }">{{ model.formatTime(row.original.updatedAt) }}</template>
        </YdResponsiveEnhancedTable>
      </YdLoadingOverlay>
    </template>

    <template #footer>
      <YdPagination
        v-model:page="model.playerPager.page"
        v-model:size="model.playerPager.size"
        :total="model.playerPager.total"
        @page-change="model.loadPlayers"
        @size-change="model.loadPlayers"
      />
    </template>
  </YdTablePageLayout>
</template>
