<script setup lang="ts">
import type { TableColumn } from '@yudream/components'
import type { PonyPluginModel } from '../composables/usePonyPlugin'
import type { PonyPlayerView } from '../types'
import { YdLoadingOverlay, YdPagination, YdResponsiveEnhancedTable, YdTablePageLayout } from '@yudream/components'

defineProps<{ model: PonyPluginModel }>()

const columns: TableColumn<PonyPlayerView>[] = [
  { id: 'player', header: '玩家', minWidth: 180 },
  { id: 'qq', header: 'QQ', width: 130 },
  { id: 'record', header: '胜 / 总', width: 100 },
  { id: 'horses', header: '放马数', width: 100 },
  { id: 'winRate', header: '胜率', width: 90 },
  { id: 'streak', header: '连胜', width: 160 },
  { accessorKey: 'updatedAt', header: '最近参与', width: 180 },
]
</script>

<template>
  <YdTablePageLayout title="玩家战绩" :show-search="false">
    <template #table>
      <YdLoadingOverlay :loading="model.loading">
        <YdResponsiveEnhancedTable
          row-key="userId"
          table-root-class="rounded-lg overflow-hidden"
          table-class="min-w-[980px]"
          border
          stripe
          column-visibility
          :columns="columns"
          :data="model.players"
          empty-text="暂无玩家战绩"
        >
          <template #cell-player="{ row }"><strong>{{ model.playerLabel(row.original) }}</strong></template>
          <template #cell-qq="{ row }">{{ row.original.qq || '-' }}</template>
          <template #cell-record="{ row }">{{ row.original.wins }} / {{ row.original.played }}</template>
          <template #cell-horses="{ row }">{{ row.original.horsesPlaced }}</template>
          <template #cell-winRate="{ row }">{{ model.playerWinRate(row.original) }}</template>
          <template #cell-streak="{ row }">
            <span class="yd-status-tone mr-1" data-tone="info">当前 {{ row.original.currentStreak }}</span>
            <span class="yd-status-tone" data-tone="neutral">最佳 {{ row.original.bestStreak }}</span>
          </template>
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
