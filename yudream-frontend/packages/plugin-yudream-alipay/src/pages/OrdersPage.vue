<script setup lang="ts">
import type { SearchConfig, SearchFieldConfig, SearchOptionsSource, StatusColumn, TableColumn } from '@yudream/components'
import type { YuDreamPluginSdk } from '@yudream/plugin-sdk'
import type { AlipayOrder } from '../types'
import { computed, onMounted, reactive, ref } from 'vue'
import { YdDynamicSearchForm, YdLoadingOverlay, YdPagination, YdResponsiveEnhancedTable, YdTablePageLayout } from '@yudream/components'
import { createAlipayApi } from '../api/alipay-api'

const props = defineProps<{ sdk: YuDreamPluginSdk }>()
const api = createAlipayApi(props.sdk)

const loading = ref(false)
const rows = ref<AlipayOrder[]>([])
const pager = reactive({ page: 1, size: 10, total: 0 })
/** 订单量小，关键词在当前页内过滤（订单号 / 用户 / 状态） */
const searchQuery = ref<Record<string, any>>({ keyword: '' })

const filteredRows = computed(() => {
  const key = String(searchQuery.value.keyword ?? '').trim().toLowerCase()
  return key ? rows.value.filter(row => `${row.outTradeNo} ${row.userId} ${row.status}`.toLowerCase().includes(key)) : rows.value
})

/** ControlType 是 components 内部的字符串枚举，桥接层只出类型，这里用字面量收敛一次 */
type SearchFieldInput = Partial<Omit<SearchFieldConfig, 'controlType'>> & Pick<SearchFieldConfig, 'fieldName' | 'label'> & { controlType?: 'TEXT' | 'SELECT' | 'DATE_RANGE' | 'NUMBER_RANGE' | 'CHECKBOX' | 'RADIO' }

function searchField(config: SearchFieldInput): SearchFieldConfig {
  const { controlType = 'TEXT', order = 0, showWhenFolded = false, width = '200px', ...rest } = config
  return { ...rest, fieldName: config.fieldName, label: config.label, controlType: controlType as SearchFieldConfig['controlType'], order, showWhenFolded, width }
}

const searchConfig: SearchConfig = {
  fields: [
    searchField({ fieldName: 'keyword', label: '关键词', placeholder: '订单号 / 用户 / 状态', order: 1, showWhenFolded: true, width: '240px' }),
  ],
}

const optionsSources: SearchOptionsSource[] = []

const columns: TableColumn<AlipayOrder>[] = [
  { accessorKey: 'outTradeNo', header: '订单号', minWidth: 230 },
  { accessorKey: 'userId', header: '用户', width: 150 },
  { accessorKey: 'assetCode', header: '币种', width: 100 },
  { accessorKey: 'amount', header: '支付金额', width: 120 },
  { accessorKey: 'walletAmount', header: '到账金额', width: 120 },
  { accessorKey: 'createdAt', header: '创建时间', width: 180 },
]

/** 订单状态：语义色胶囊，一眼扫出已支付与关闭单 */
const orderStatusColumn: StatusColumn<AlipayOrder> = {
  statusKey: 'status',
  header: '状态',
  width: 110,
  statusMap: {
    CREATED: { label: '已创建', variant: 'secondary', tone: 'neutral' },
    PAYING: { label: '支付中', variant: 'default', tone: 'warning' },
    PAID: { label: '已支付', variant: 'default', tone: 'success' },
    CLOSED: { label: '已关闭', variant: 'secondary', tone: 'neutral' },
  },
}

function formatTime(value?: number) {
  return value ? new Date(value).toLocaleString('zh-CN', { hour12: false }) : '-'
}

async function load() {
  loading.value = true
  try {
    const result = await api.adminOrders(pager.page, pager.size)
    rows.value = result.records
    pager.total = Number(result.total ?? 0)
  }
  finally {
    loading.value = false
  }
}

function onPageChange() {
  void load()
}

function onSizeChange() {
  pager.page = 1
  void load()
}

onMounted(load)
</script>

<template>
  <YdTablePageLayout title="支付宝订单">
    <template #search="{ fold }">
      <YdDynamicSearchForm
        v-model="searchQuery"
        :config="searchConfig"
        :fold="fold"
        :options-sources="optionsSources"
      />
    </template>

    <template #table>
      <YdLoadingOverlay :loading="loading">
        <YdResponsiveEnhancedTable
          row-key="outTradeNo"
          table-root-class="rounded-lg overflow-hidden"
          table-class="min-w-[1000px]"
          border
          stripe
          column-visibility
          :status-column="orderStatusColumn"
          :columns="columns"
          :data="filteredRows"
          empty-text="暂无订单"
        >
          <template #cell-createdAt="{ row }">{{ formatTime(row.original.createdAt) }}</template>
        </YdResponsiveEnhancedTable>
      </YdLoadingOverlay>
    </template>

    <template #footer>
      <YdPagination
        v-model:page="pager.page"
        v-model:size="pager.size"
        :total="pager.total"
        @page-change="onPageChange"
        @size-change="onSizeChange"
      />
    </template>
  </YdTablePageLayout>
</template>
