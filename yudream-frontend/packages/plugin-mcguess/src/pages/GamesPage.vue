<script setup lang="ts">
import type { SearchConfig, SearchFieldConfig, SearchOptionsSource, StatusColumn, TableColumn } from '@yudream/components'
import type { McguessPluginModel } from '../composables/useMcguessPlugin'
import type { McguessGameView } from '../types'
import { ref } from 'vue'
import { YdDynamicSearchForm, YdLoadingOverlay, YdPagination, YdResponsiveEnhancedTable, YdTablePageLayout } from '@yudream/components'

const props = defineProps<{ model: McguessPluginModel }>()

const modeOptions = [
  { label: '全部模式', value: '' },
  { label: '猜物', value: 'item' },
  { label: '猜生物', value: 'mob' },
  { label: '猜合成', value: 'recipe' },
  { label: '迷雾', value: 'fog' },
  { label: '快答', value: 'quiz' },
  { label: '宾果', value: 'bingo' },
  { label: '找茬', value: 'spot' },
]
const statusOptions = [
  { label: '全部状态', value: '' },
  { label: '进行中', value: 'PLAYING' },
  { label: '已获胜', value: 'WON' },
  { label: '已揭晓', value: 'LOST' },
]

/** ControlType 是 components 内部的字符串枚举，桥接层只出类型，这里用字面量收敛一次 */
type SearchFieldInput = Partial<Omit<SearchFieldConfig, 'controlType'>> & Pick<SearchFieldConfig, 'fieldName' | 'label'> & { controlType?: 'TEXT' | 'SELECT' | 'DATE_RANGE' | 'NUMBER_RANGE' | 'CHECKBOX' | 'RADIO' }

function searchField(config: SearchFieldInput): SearchFieldConfig {
  const { controlType = 'TEXT', order = 0, showWhenFolded = false, width = '200px', ...rest } = config
  return { ...rest, fieldName: config.fieldName, label: config.label, controlType: controlType as SearchFieldConfig['controlType'], order, showWhenFolded, width }
}

const searchQuery = ref<Record<string, any>>({
  mode: props.model.gameFilters.mode ?? '',
  status: props.model.gameFilters.status ?? '',
})

const searchConfig: SearchConfig = {
  fields: [
    searchField({ fieldName: 'mode', label: '模式', controlType: 'SELECT', order: 1, showWhenFolded: true, width: '180px' }),
    searchField({ fieldName: 'status', label: '状态', controlType: 'SELECT', order: 2, showWhenFolded: true, width: '180px' }),
  ],
}

const optionsSources: SearchOptionsSource[] = [
  { id: 'modeOptions', loader: () => modeOptions },
  { id: 'statusOptions', loader: () => statusOptions },
]

function applyFilters() {
  props.model.gameFilters.mode = String(searchQuery.value.mode ?? '')
  props.model.gameFilters.status = String(searchQuery.value.status ?? '')
  props.model.applyGameFilters()
}

const columns: TableColumn<McguessGameView>[] = [
  { id: 'channel', header: '群聊', minWidth: 140 },
  { id: 'mode', header: '模式', width: 90 },
  { id: 'target', header: '目标 / 进度', width: 150 },
  { id: 'progress', header: '猜测次数', width: 90 },
  { id: 'winner', header: '终结者', width: 130 },
  { id: 'startedAt', header: '开始时间', width: 180 },
  { accessorKey: 'endedAt', header: '结束时间', width: 180, defaultHidden: true },
]

/** 对局状态：语义色胶囊 */
const gameStatusColumn: StatusColumn<McguessGameView> = {
  statusKey: 'status',
  header: '状态',
  width: 110,
  statusMap: {
    PLAYING: { label: '进行中', variant: 'default', tone: 'info' },
    WON: { label: '已获胜', variant: 'default', tone: 'success' },
    LOST: { label: '已揭晓', variant: 'secondary', tone: 'neutral' },
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
        @search="applyFilters"
        @reset="applyFilters"
      />
    </template>

    <template #table>
      <YdLoadingOverlay :loading="model.loading">
        <YdResponsiveEnhancedTable
          row-key="id"
          table-root-class="rounded-lg overflow-hidden"
          table-class="min-w-[960px]"
          border
          stripe
          column-visibility
          :status-column="gameStatusColumn"
          :columns="columns"
          :data="model.games"
          empty-text="暂无对局记录"
        >
          <template #cell-channel="{ row }">{{ row.original.channelId }}</template>
          <template #cell-mode="{ row }">{{ row.original.modeZh }}</template>
          <template #cell-target="{ row }"><strong>{{ row.original.target }}</strong></template>
          <template #cell-progress="{ row }">{{ row.original.guessCount }}</template>
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
        @size-change="model.applyGameFilters"
      />
    </template>
  </YdTablePageLayout>
</template>
