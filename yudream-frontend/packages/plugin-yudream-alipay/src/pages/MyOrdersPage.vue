<script setup lang="ts">
import type { StatusColumn, TableColumn } from '@yudream/components'
import type { YuDreamPluginSdk } from '@yudream/plugin-sdk'
import type { AlipayOrder } from '../types'
import { onMounted, reactive, ref } from 'vue'
import { YdLoadingOverlay, YdPagination, YdResponsiveEnhancedTable, YdTablePageLayout } from '@yudream/components'
import { createAlipayApi } from '../api/alipay-api'

const props = defineProps<{ sdk: YuDreamPluginSdk }>()
const api = createAlipayApi(props.sdk)

const loading = ref(false)
const rows = ref<AlipayOrder[]>([])
const pager = reactive({ page: 1, size: 10, total: 0 })

const columns: TableColumn<AlipayOrder>[] = [
  { accessorKey: 'outTradeNo', header: '订单号', minWidth: 230 },
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
    const result = await api.meOrders(pager.page, pager.size)
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
  <YdTablePageLayout title="我的支付宝订单" :show-search="false">
    <template #table>
      <YdLoadingOverlay :loading="loading">
        <YdResponsiveEnhancedTable
          row-key="outTradeNo"
          table-root-class="rounded-lg overflow-hidden"
          table-class="min-w-[860px]"
          border
          stripe
          column-visibility
          :status-column="orderStatusColumn"
          :columns="columns"
          :data="rows"
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
