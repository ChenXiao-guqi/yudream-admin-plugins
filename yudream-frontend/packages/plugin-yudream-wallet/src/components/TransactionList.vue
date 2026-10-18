<script setup lang="ts">
import type { StatusColumn, TableColumn } from '@yudream/components'
import type { WalletPluginModel } from '../composables/useWalletPlugin'
import type { WalletTransaction } from '../types'
import { YdResponsiveEnhancedTable } from '@yudream/components'

defineProps<{ model: WalletPluginModel, items: WalletTransaction[] }>()

const columns: TableColumn<WalletTransaction>[] = [
  { accessorKey: 'source', header: '来源', width: 110 },
  { accessorKey: 'assetCode', header: '资产', width: 100 },
  { id: 'amount', header: '金额', width: 140 },
  { id: 'user', header: '用户', minWidth: 240 },
  { accessorKey: 'businessNo', header: '业务单号', minWidth: 220, defaultHidden: true },
  { accessorKey: 'createdAt', header: '时间', width: 180 },
]

/** 交易类型：入账/扣账/转账语义色胶囊 */
const typeStatusColumn: StatusColumn<WalletTransaction> = {
  statusKey: 'type',
  header: '类型',
  width: 100,
  statusMap: {
    CREDIT: { label: '入账', variant: 'default', tone: 'success' },
    DEBIT: { label: '扣账', variant: 'default', tone: 'danger' },
    TRANSFER: { label: '转账', variant: 'default', tone: 'info' },
  },
}
</script>

<template>
  <YdResponsiveEnhancedTable
    row-key="id"
    table-root-class="rounded-lg overflow-hidden"
    table-class="min-w-[1000px]"
    border
    stripe
    column-visibility
    :status-column="typeStatusColumn"
    :columns="columns"
    :data="items"
    empty-text="暂无流水"
  >
    <template #cell-source="{ row }">{{ model.sourceLabel(row.original.source) }}</template>
    <template #cell-assetCode="{ row }">{{ model.assetName(row.original.assetCode) }}</template>
    <template #cell-amount="{ row }">
      {{ model.assetSymbol(row.original.assetCode) }}{{ model.formatAmount(row.original.amount, row.original.assetCode) }}
    </template>
    <template #cell-user="{ row }">
      <template v-if="row.original.type === 'TRANSFER'">
        {{ model.userLabel(row.original.fromUser, row.original.fromUserId) }} → {{ model.userLabel(row.original.toUser, row.original.toUserId) }}
      </template>
      <template v-else>
        {{ model.userLabel(row.original.toUser || row.original.fromUser, row.original.toUserId || row.original.fromUserId) }}
      </template>
    </template>
    <template #cell-businessNo="{ row }">{{ row.original.businessNo || '-' }}</template>
    <template #cell-createdAt="{ row }">{{ model.formatTime(row.original.createdAt) }}</template>
  </YdResponsiveEnhancedTable>
</template>
