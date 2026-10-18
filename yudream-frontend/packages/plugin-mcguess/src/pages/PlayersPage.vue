<script setup lang="ts">
import type { TableColumn } from '@yudream/components'
import type { McguessPluginModel } from '../composables/useMcguessPlugin'
import type { McguessPlayerView } from '../types'
import { YdLoadingOverlay, YdPagination, YdResponsiveEnhancedTable, YdTablePageLayout } from '@yudream/components'

defineProps<{ model: McguessPluginModel }>()

const columns: TableColumn<McguessPlayerView>[] = [
  { id: 'player', header: '玩家', minWidth: 180 },
  { id: 'qq', header: 'QQ', width: 130 },
  { id: 'item', header: '猜物 胜/参', width: 110 },
  { id: 'mob', header: '猜生物 胜/参', width: 110 },
  { id: 'recipe', header: '猜合成 胜/参', width: 110 },
  { id: 'fog', header: '迷雾 胜/参', width: 100, defaultHidden: true },
  { id: 'quiz', header: '快答 胜/参', width: 100, defaultHidden: true },
  { id: 'bingo', header: '宾果 胜/参', width: 100, defaultHidden: true },
  { id: 'spot', header: '找茬 胜/参', width: 100, defaultHidden: true },
  { id: 'collection', header: '图鉴', width: 80 },
  { id: 'hol', header: '比大小最佳', width: 100, defaultHidden: true },
  { id: 'wins', header: '总胜场', width: 90 },
  { id: 'winRate', header: '胜率', width: 90 },
  { id: 'guesses', header: '总猜测', width: 100, defaultHidden: true },
  { accessorKey: 'updatedAt', header: '最近参与', width: 180, defaultHidden: true },
]
</script>

<template>
  <YdTablePageLayout title="玩家战绩" :show-search="false">
    <template #table>
      <YdLoadingOverlay :loading="model.loading">
        <YdResponsiveEnhancedTable
          row-key="userId"
          table-root-class="rounded-lg overflow-hidden"
          table-class="min-w-[1360px]"
          border
          stripe
          column-visibility
          :columns="columns"
          :data="model.players"
          empty-text="暂无玩家战绩"
        >
          <template #cell-player="{ row }"><strong>{{ model.playerLabel(row.original) }}</strong></template>
          <template #cell-qq="{ row }">{{ row.original.qq || '-' }}</template>
          <template #cell-item="{ row }">{{ row.original.itemWins }} / {{ row.original.itemPlayed }}</template>
          <template #cell-mob="{ row }">{{ row.original.mobWins }} / {{ row.original.mobPlayed }}</template>
          <template #cell-recipe="{ row }">{{ row.original.recipeWins }} / {{ row.original.recipePlayed }}</template>
          <template #cell-fog="{ row }">{{ row.original.fogWins }} / {{ row.original.fogPlayed }}</template>
          <template #cell-quiz="{ row }">{{ row.original.quizWins }} / {{ row.original.quizPlayed }}</template>
          <template #cell-bingo="{ row }">{{ row.original.bingoWins }} / {{ row.original.bingoPlayed }}</template>
          <template #cell-spot="{ row }">{{ row.original.spotWins }} / {{ row.original.spotPlayed }}</template>
          <template #cell-collection="{ row }">
            <span class="yd-status-tone" data-tone="info">{{ row.original.collectionCount }}</span>
          </template>
          <template #cell-hol="{ row }">{{ row.original.holBest > 0 ? `${row.original.holBest} 连胜` : '-' }}</template>
          <template #cell-wins="{ row }">{{ model.totalWins(row.original) }}</template>
          <template #cell-winRate="{ row }">{{ model.winRateOf(row.original) }}</template>
          <template #cell-guesses="{ row }">{{ row.original.totalGuesses }}</template>
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
