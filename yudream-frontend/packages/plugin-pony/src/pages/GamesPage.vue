<script setup lang="ts">
import type { SearchConfig, SearchFieldConfig, SearchOptionsSource, StatusColumn, TableColumn } from '@yudream/components'
import type { PonyPluginModel } from '../composables/usePonyPlugin'
import type { PonyGameView } from '../types'
import { ref } from 'vue'
import { YdDynamicSearchForm, YdLoadingOverlay, YdPagination, YdResponsiveEnhancedTable, YdTablePageLayout } from '@yudream/components'

const props = defineProps<{ model: PonyPluginModel }>()

function applyStatusFilter() {
  props.model.gameStatusFilter = String(searchQuery.value.status ?? '')
  props.model.applyGameFilter()
}

const statusOptions = [
  { label: '全部状态', value: '' },
  { label: '进行中', value: 'PLAYING' },
  { label: '已归位', value: 'WON' },
  { label: '已结束', value: 'LOST' },
]

/** ControlType 是 components 内部的字符串枚举，桥接层只出类型，这里用字面量收敛一次 */
type SearchFieldInput = Partial<Omit<SearchFieldConfig, 'controlType'>> & Pick<SearchFieldConfig, 'fieldName' | 'label'> & { controlType?: 'TEXT' | 'SELECT' | 'DATE_RANGE' | 'NUMBER_RANGE' | 'CHECKBOX' | 'RADIO' }

function searchField(config: SearchFieldInput): SearchFieldConfig {
  const { controlType = 'TEXT', order = 0, showWhenFolded = false, width = '200px', ...rest } = config
  return { ...rest, fieldName: config.fieldName, label: config.label, controlType: controlType as SearchFieldConfig['controlType'], order, showWhenFolded, width }
}

const searchQuery = ref<Record<string, any>>({ status: '' })

const searchConfig: SearchConfig = {
  fields: [
    searchField({ fieldName: 'status', label: '状态', controlType: 'SELECT', order: 1, showWhenFolded: true, width: '180px' }),
  ],
}

const optionsSources: SearchOptionsSource[] = [
  { id: 'statusOptions', loader: () => statusOptions },
]

const columns: TableColumn<PonyGameView>[] = [
  { id: 'channel', header: '群聊', minWidth: 140 },
  { id: 'size', header: '棋盘', width: 100 },
  { id: 'progress', header: '进度', width: 100 },
  { id: 'lives', header: '生命', width: 90 },
  { id: 'mistakes', header: '失误', width: 90 },
  { id: 'starter', header: '开局人', width: 130 },
  { id: 'winner', header: '收官者', width: 130 },
  { id: 'startedAt', header: '开始时间', width: 180 },
  { accessorKey: 'endedAt', header: '结束时间', width: 180, defaultHidden: true },
]

/** 对局状态：语义色胶囊 */
const gameStatusColumn: StatusColumn<PonyGameView> = {
  statusKey: 'status',
  header: '状态',
  width: 110,
  statusMap: {
    PLAYING: { label: '进行中', variant: 'default', tone: 'info' },
    WON: { label: '已归位', variant: 'default', tone: 'success' },
    LOST: { label: '已结束', variant: 'secondary', tone: 'neutral' },
  },
}
</script>

<template>
  <YdTablePageLayout title="对局记录">
    <template #search="{ fold }">
      <YdDynamicSearchForm
        v-model="searchQuery"
        :config="searchConfig"
        :fold="fold"
        :options-sources="optionsSources"
        @search="applyStatusFilter"
        @reset="applyStatusFilter"
      />
    </template>

    <template #table>
      <YdLoadingOverlay :loading="model.loading">
        <YdResponsiveEnhancedTable
          row-key="id"
          table-root-class="rounded-lg overflow-hidden"
          table-class="min-w-[1160px]"
          border
          stripe
          column-visibility
          :status-column="gameStatusColumn"
          :columns="columns"
          :data="model.games"
          empty-text="暂无对局记录"
        >
          <template #cell-channel="{ row }">{{ row.original.channelId }}</template>
          <template #cell-size="{ row }">{{ row.original.size }}×{{ row.original.size }}</template>
          <template #cell-progress="{ row }">{{ row.original.horsesPlaced }} / {{ row.original.size }}</template>
          <template #cell-lives="{ row }">{{ row.original.lives }}</template>
          <template #cell-mistakes="{ row }">{{ row.original.mistakes }}</template>
          <template #cell-starter="{ row }">{{ row.original.startedByQq || '-' }}</template>
          <template #cell-winner="{ row }">{{ row.original.winnerQq || '-' }}</template>
          <template #cell-startedAt="{ row }">{{ model.formatTime(row.original.startedAt) }}</template>
          <template #cell-endedAt="{ row }">{{ model.formatTime(row.original.endedAt) }}</template>
        </YdResponsiveEnhancedTable>
      </YdLoadingOverlay>
    </template>

    <template #footer>
      <YdPagination
        v-model:page="model.gamePager.page"
        v-model:size="model.gamePager.size"
        :total="model.gamePager.total"
        @page-change="model.loadGames"
        @size-change="model.applyGameFilter"
      />
    </template>
  </YdTablePageLayout>
</template>
