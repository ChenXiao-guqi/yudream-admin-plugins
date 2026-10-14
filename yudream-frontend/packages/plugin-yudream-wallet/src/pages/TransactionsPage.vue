<script setup lang="ts">
import type { WalletPluginModel } from '../composables/useWalletPlugin'
import { computed } from 'vue'
import { YdButton, YdIcon, YdInput, YdPageHeader, YdPageMain, YdPagination, YdSearchBar, YdSelect } from '@yudream/components'
import TransactionList from '../components/TransactionList.vue'

const props = defineProps<{ model: WalletPluginModel }>()
const assetOptions = computed(() => [{ label: '全部币种', value: '' }, ...props.model.assets.map(asset => ({ label: `${asset.name} (${asset.code})`, value: asset.code }))])
const sourceOptions = [
  { label: '全部来源', value: '' }, { label: '管理员', value: 'ADMIN' }, { label: '用户转账', value: 'TRANSFER' },
  { label: '支付宝', value: 'ALIPAY' }, { label: '周目继承', value: 'MINECRAFT_SEASON' },
]
const typeOptions = [{ label: '全部类型', value: '' }, { label: '入账', value: 'CREDIT' }, { label: '扣账', value: 'DEBIT' }, { label: '转账', value: 'TRANSFER' }]
function onPageChange() { props.model.loadTransactions() }
function onSizeChange() { props.model.transactionPager.page = 1; props.model.loadTransactions() }
</script>

<template>
  <YdPageHeader title="钱包交易记录" class="mb-0" />
  <YdPageMain>
    <YdSearchBar class="w-full mb-3">
      <div class="wallet-filter-bar">
        <YdSelect v-model="model.transactionFilters.assetCode" :options="assetOptions" />
        <YdSelect v-model="model.transactionFilters.source" :options="sourceOptions" />
        <YdSelect v-model="model.transactionFilters.type" :options="typeOptions" />
        <YdInput v-model="model.transactionFilters.user" clearable placeholder="ID / 用户名 / 邮箱" @keydown.enter="model.applyTransactionFilters" />
        <div class="wallet-actions wallet-filter-actions">
          <YdButton variant="outline" type="button" @click="model.resetTransactionFilters">重置</YdButton>
          <YdButton type="button" @click="model.applyTransactionFilters"><YdIcon name="i-ri:search-line" />查询</YdButton>
        </div>
      </div>
    </YdSearchBar>
    <TransactionList :model="model" :items="model.transactions" />
    <YdPagination v-model:page="model.transactionPager.page" v-model:size="model.transactionPager.size" :total="model.transactionPager.total" class="mt-3" @page-change="onPageChange" @size-change="onSizeChange" />
  </YdPageMain>
</template>
