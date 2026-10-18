<script setup lang="ts">
import type { SearchConfig, SearchFieldConfig, SearchOptionsSource, StatusColumn, TableColumn } from '@yudream/components'
import type { WordlePluginModel } from '../composables/useWordlePlugin'
import type { WordleGameView } from '../types'
import { ref } from 'vue'
import { YdDynamicSearchForm, YdLoadingOverlay, YdPagination, YdResponsiveEnhancedTable, YdTablePageLayout } from '@yudream/components'

const props = defineProps<{ model: WordlePluginModel }>()

const statusOptions = [
  { label: '全部状态', value: '' },
  { label: '进行中', value: 'PLAYING' },
  { label: '已猜中', value: 'WON' },
  { label: '已结束', value: 'LOST' },
]

/** ControlType 是 components 内部的字符串枚举，桥接层只出类型，这里用字面量收敛一次 */
type SearchFieldInput = Partial<Omit<SearchFieldConfig, 'controlType'>> & Pick<SearchFieldConfig, 'fieldName' | 'label'> & { controlType?: 'TEXT' | 'SELECT' | 'DATE_RANGE' | 'NUMBER_RANGE' | 'CHECKBOX' | 'RADIO' }

function searchField(config: SearchFieldInput): SearchFieldConfig {
  const { controlType = 'TEXT', order = 0, showWhenFolded = false, width = '200px', ...rest } = config
  return { ...rest, fieldName: config.fieldName, label: config.label, controlType: controlType as SearchFieldConfig['controlType'], order, showWhenFolded, width }
}

const searchQuery = ref<Record<string, any>>({ status: props.model.gameStatusFilter ?? '' })

const searchConfig: SearchConfig = {
  fields: [
    searchField({ fieldName: 'status', label: '状态', controlType: 'SELECT', order: 1, showWhenFolded: true, width: '180px' }),
  ],
}

const optionsSources: SearchOptionsSource[] = [
  { id: 'statusOptions', loader: () => statusOptions },
]

function applyStatusFilter() {
  props.model.gameStatusFilter = String(searchQuery.value.status ?? '')
  props.model.applyGameFilter()
}

const columns: TableColumn<WordleGameView>[] = [
  { id: 'channel', header: '群聊', minWidth: 140 },
  { id: 'mode', header: '模式', width: 150 },
  { id: 'answer', header: '答案', width: 140 },
  { id: 'progress', header: '进度', width: 110 },
  { id: 'starter', header: '开局人', width: 130 },
  { id: 'winner', header: '猜中者', width: 130 },
  { id: 'startedAt', header: '开始时间', width: 180 },
  { accessorKey: 'endedAt', header: '结束时间', width: 180, defaultHidden: true },
]

/** 对局状态：语义色胶囊 */
const gameStatusColumn: StatusColumn<WordleGameView> = {
  statusKey: 'status',
  header: '状态',
  width: 110,
  statusMap: {
    PLAYING: { label: '进行中', variant: 'default', tone: 'info' },
    WON: { label: '已猜中', variant: 'default', tone: 'success' },
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
          <template #cell-mode="{ row }">{{ row.original.modeLabel }} · {{ row.original.length }} 字{{ row.original.hardMode ? ' · 困难' : '' }}</template>
          <template #cell-answer="{ row }"><strong>{{ row.original.answer }}</strong></template>
          <template #cell-progress="{ row }">{{ row.original.guessCount }} / {{ row.original.maxGuesses }}</template>
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
