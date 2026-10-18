<script setup lang="ts">
import type { SearchConfig, SearchFieldConfig, SearchOptionsSource, TableColumn, YdTablePageAction } from '@yudream/components'
import type { YuDreamPluginSdk } from '@yudream/plugin-sdk'
import type { SettlementRecord } from '../types'
import { YdDynamicSearchForm, YdLoadingOverlay, YdPagination, YdResponsiveEnhancedTable, YdTablePageLayout } from '@yudream/components'
import { computed, onMounted, ref } from 'vue'
import { createPlaytimePointsApi } from '../api/playtime-points-api'
import { useSettlements } from '../composables/useSettlements'
import { formatDuration, formatTime, subDetails, weightLabel } from '../composables/utils'

const props = defineProps<{ sdk: YuDreamPluginSdk }>()

const api = createPlaytimePointsApi(props.sdk)
const model = useSettlements(api)
const { loading, running, records, serverOptions, pager, filters } = model

/** ControlType 是 components 内部的字符串枚举，桥接层只出类型，这里用字面量收敛一次 */
type SearchFieldInput = Partial<Omit<SearchFieldConfig, 'controlType'>> & Pick<SearchFieldConfig, 'fieldName' | 'label'> & { controlType?: 'TEXT' | 'SELECT' | 'DATE_RANGE' | 'NUMBER_RANGE' | 'CHECKBOX' | 'RADIO' }

function searchField(config: SearchFieldInput): SearchFieldConfig {
  const { controlType = 'TEXT', order = 0, showWhenFolded = false, width = '200px', ...rest } = config
  return { ...rest, fieldName: config.fieldName, label: config.label, controlType: controlType as SearchFieldConfig['controlType'], order, showWhenFolded, width }
}

const searchQuery = ref<Record<string, any>>({
  serverId: filters.serverId ?? '',
  keyword: filters.keyword ?? '',
})

const searchConfig: SearchConfig = {
  fields: [
    searchField({ fieldName: 'keyword', label: '玩家', placeholder: '按玩家名搜索', order: 1, showWhenFolded: true, width: '220px' }),
    searchField({ fieldName: 'serverId', label: '服务器', controlType: 'SELECT', order: 2, width: '200px' }),
  ],
}

const optionsSources: SearchOptionsSource[] = [
  { id: 'serverOptions', loader: () => [{ label: '全部服务器', value: '' }, ...serverOptions.value] },
]

function applySearch() {
  filters.serverId = String(searchQuery.value.serverId ?? '')
  filters.keyword = String(searchQuery.value.keyword ?? '')
  model.search()
}

function resetSearch() {
  model.resetFilters()
  searchQuery.value = { serverId: '', keyword: '' }
}

const columns: TableColumn<SettlementRecord>[] = [
  { id: 'windowEnd', header: '退出时间', width: 180 },
  { accessorKey: 'serverName', header: '服务器', width: 160 },
  { accessorKey: 'playerName', header: '玩家', width: 140 },
  { id: 'effective', header: '有效时长', width: 130 },
  { id: 'detail', header: '在线 / 挂机', width: 180 },
  { id: 'subServers', header: '子服拆分', width: 260 },
  { id: 'weight', header: '权重', width: 90 },
  { id: 'points', header: '积分', width: 110 },
  { id: 'credited', header: '入账', width: 110 },
  { accessorKey: 'assetCode', header: '货币', width: 100 },
]

const pageActions = computed<YdTablePageAction[]>(() => [
  { label: '立即结算', icon: 'morph:play', disabled: running.value, onClick: () => void model.runNow() },
])

onMounted(() => {
  void model.load()
  void model.loadServerOptions()
})
</script>

<template>
  <YdTablePageLayout title="结算记录" :actions="pageActions">
    <template #search="{ fold }">
      <YdDynamicSearchForm
        v-model="searchQuery"
        :config="searchConfig"
        :fold="fold"
        :options-sources="optionsSources"
        @search="applySearch"
        @reset="resetSearch"
      />
    </template>

    <template #table>
      <YdLoadingOverlay :loading="loading">
        <YdResponsiveEnhancedTable
          row-key="id"
          table-root-class="rounded-lg overflow-hidden"
          table-class="min-w-[1360px]"
          border
          stripe
          column-visibility
          :columns="columns"
          :data="records"
          empty-text="暂无结算记录：玩家退出服务器并达到 1 积分后这里会出现流水。"
        >
          <template #cell-windowEnd="{ row }">{{ formatTime(row.original.windowEnd) }}</template>
          <template #cell-effective="{ row }">{{ row.original.effectiveMinutes }} 分钟</template>
          <template #cell-detail="{ row }">
            {{ formatDuration(row.original.onlineMillis) }} / {{ formatDuration(row.original.afkMillis) }}
          </template>
          <template #cell-subServers="{ row }">
            <div v-if="!subDetails(row.original).length" class="ptp-sub-empty">整服结算</div>
            <div v-else class="ptp-sub-list">
              <div v-for="sub in subDetails(row.original)" :key="sub.subServer" class="ptp-sub-item">
                <span class="ptp-sub-name">{{ sub.subServer }}</span>
                <span class="ptp-sub-meta">{{ sub.effectiveMinutes }} 分钟 × {{ sub.weight }}</span>
                <span class="ptp-sub-points">{{ sub.enabled ? `+${sub.points}` : '停算' }}</span>
              </div>
            </div>
          </template>
          <template #cell-weight="{ row }">{{ weightLabel(row.original) }}</template>
          <template #cell-points="{ row }">{{ row.original.points }}</template>
          <template #cell-credited="{ row }">
            <span class="yd-status-tone" :data-tone="Number(row.original.credited) > 0 ? 'success' : 'neutral'">
              {{ Number(row.original.credited) > 0 ? row.original.credited : '累计中' }}
            </span>
          </template>
        </YdResponsiveEnhancedTable>
      </YdLoadingOverlay>
    </template>

    <template #footer>
      <YdPagination
        v-model:page="pager.page"
        v-model:size="pager.size"
        :total="pager.total"
        @page-change="model.onPageChange"
        @size-change="model.onSizeChange"
      />
    </template>
  </YdTablePageLayout>
</template>
