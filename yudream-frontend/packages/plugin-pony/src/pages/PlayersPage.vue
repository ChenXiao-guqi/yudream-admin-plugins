<script setup lang="ts">
import { YdLoadingOverlay } from '@yudream/components'
import type { TableColumn } from '@yudream/components'
import type { PonyPluginModel } from '../composables/usePonyPlugin'
import type { PonyPlayerView } from '../types'
import { YdButton, YdCard, YdIcon, YdPageHeader, YdPageMain, YdPagination, YdResponsiveTable, YdTag } from '@yudream/components'

defineProps<{ model: PonyPluginModel }>()
const columns: TableColumn<PonyPlayerView>[] = [
  { id: 'player', header: '玩家', minWidth: 180, fixed: 'left' },
  { id: 'qq', header: 'QQ', width: 130 },
  { id: 'record', header: '胜 / 总', width: 100 },
  { id: 'horses', header: '放马数', width: 100 },
  { id: 'winRate', header: '胜率', width: 90 },
  { id: 'streak', header: '连胜', width: 130 },
  { id: 'updatedAt', header: '最近参与', width: 180 },
]
</script>

<template>
  <YdPageHeader title="玩家战绩" class="mb-0">
    <YdButton variant="outline" :loading="model.loading" @click="model.loadPlayers"><YdIcon name="i-ri:refresh-line" />刷新</YdButton>
  </YdPageHeader>
  <YdPageMain>
    <YdLoadingOverlay :loading="model.loading"><YdResponsiveTable

      :columns="columns"
      :data="model.players"
      row-key="userId"
      table-root-class="max-w-full overflow-x-auto rounded-lg"
      table-class="min-w-[1100px]"
      border stripe column-visibility
      empty-text="暂无玩家战绩"
    >
      <template #cell-player="{ row }"><strong>{{ model.playerLabel(row.original) }}</strong></template>
      <template #cell-qq="{ row }">{{ row.original.qq || '-' }}</template>
      <template #cell-record="{ row }">{{ row.original.wins }} / {{ row.original.played }}</template>
      <template #cell-horses="{ row }">{{ row.original.horsesPlaced }}</template>
      <template #cell-winRate="{ row }">{{ model.playerWinRate(row.original) }}</template>
      <template #cell-streak="{ row }">
        <div class="pony-chip-list">
          <YdTag variant="secondary">当前 {{ row.original.currentStreak }}</YdTag>
          <YdTag variant="secondary">最佳 {{ row.original.bestStreak }}</YdTag>
        </div>
      </template>
      <template #cell-updatedAt="{ row }">{{ model.formatTime(row.original.updatedAt) }}</template>
      <template #card="{ row }">
        <YdCard class="w-full">
          <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between gap-2">
              <span class="min-w-0 break-words text-base font-semibold">{{ model.playerLabel(row) }}</span>
              <YdTag variant="secondary">胜率 {{ model.playerWinRate(row) }}</YdTag>
            </div>
            <div class="flex flex-col gap-1 text-sm">
              <div class="flex gap-2"><span class="shrink-0 text-secondary-foreground/60">QQ</span><span>{{ row.qq || '-' }}</span></div>
              <div class="flex gap-2"><span class="shrink-0 text-secondary-foreground/60">胜 / 总</span><span>{{ row.wins }} / {{ row.played }}</span></div>
              <div class="flex gap-2"><span class="shrink-0 text-secondary-foreground/60">放马数</span><span>{{ row.horsesPlaced }}</span></div>
              <div class="flex gap-2"><span class="shrink-0 text-secondary-foreground/60">连胜</span><span>当前 {{ row.currentStreak }} · 最佳 {{ row.bestStreak }}</span></div>
              <div class="flex gap-2"><span class="shrink-0 text-secondary-foreground/60">最近参与</span><span>{{ model.formatTime(row.updatedAt) }}</span></div>
            </div>
          </div>
        </YdCard>
      </template>
    </YdResponsiveTable></YdLoadingOverlay>
    <YdPagination v-model:page="model.playerPager.page" v-model:size="model.playerPager.size" :total="model.playerPager.total" class="mt-3" @page-change="model.loadPlayers" @size-change="model.loadPlayers" />
  </YdPageMain>
</template>
