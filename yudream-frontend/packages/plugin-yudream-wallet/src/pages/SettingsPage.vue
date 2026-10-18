<script setup lang="ts">
import type { ActionMenuItem, TableColumn, YdTablePageAction } from '@yudream/components'
import type { WalletPluginModel } from '../composables/useWalletPlugin'
import type { WalletAsset } from '../types'
import { ref } from 'vue'
import { YdForm, YdFormItem, YdInput, YdLoadingOverlay, YdModal, YdNumberField, YdPagination, YdResponsiveEnhancedTable, YdSwitch, YdTablePageLayout, useYdModal } from '@yudream/components'

const props = defineProps<{ model: WalletPluginModel }>()
const modal = useYdModal()
const formVisible = ref(false)

const assetColumns: TableColumn<WalletAsset>[] = [
  { accessorKey: 'code', header: '编码', width: 100 },
  { accessorKey: 'name', header: '名称', width: 140 },
  { accessorKey: 'symbol', header: '符号', width: 90 },
  { accessorKey: 'scale', header: '精度', width: 80 },
  { accessorKey: 'minTransferAmount', header: '最低转账', width: 130 },
]

/** 行操作统一收进操作菜单，删除保持确认流程 */
const rowActions: ActionMenuItem<WalletAsset>[] = [
  { label: '编辑', icon: 'morph:pencil', onClick: row => openEdit(row) },
  { label: '删除', icon: 'morph:trash-2', danger: true, onClick: row => confirmDeleteAsset(row) },
]

const pageActions: YdTablePageAction[] = [
  { label: '新增币种', icon: 'morph:plus', onClick: openCreate },
]

function confirmDeleteAsset(asset: WalletAsset) {
  modal.confirm({
    title: '删除币种',
    content: `确认删除币种“${asset.name}（${asset.code}）”吗？已有余额或流水时后端会拒绝删除。`,
    onConfirm: () => props.model.deleteAsset(asset),
  })
}

function onAssetPage() {
  props.model.loadAdminAssets()
}

function onAssetSize() {
  props.model.assetPager.page = 1
  props.model.loadAdminAssets()
}

function openCreate() {
  props.model.resetAssetForm()
  formVisible.value = true
}

function openEdit(asset: WalletAsset) {
  props.model.editAsset(asset)
  formVisible.value = true
}

async function saveAsset() {
  await props.model.saveAsset()
  formVisible.value = false
}
</script>

<template>
  <YdTablePageLayout title="币种管理" :show-search="false" :actions="pageActions">
    <template #table>
      <YdLoadingOverlay :loading="model.loading">
        <YdResponsiveEnhancedTable
          row-key="code"
          table-root-class="rounded-lg overflow-hidden"
          table-class="min-w-[820px]"
          border
          stripe
          column-visibility
          :actions="rowActions"
          :columns="assetColumns"
          :data="model.managedAssets"
          empty-text="暂无币种"
        >
          <template #cell-type="{ row }">
            <span class="yd-status-tone" :data-tone="row.original.money ? 'info' : 'neutral'">{{ row.original.money ? '货币' : '积分' }}</span>
          </template>
          <template #cell-transferEnabled="{ row }">
            <span class="yd-status-tone" :data-tone="row.original.transferEnabled ? 'success' : 'neutral'">{{ row.original.transferEnabled ? '允许转账' : '禁止转账' }}</span>
          </template>
          <template #cell-enabled="{ row }">
            <span class="yd-status-tone" :data-tone="row.original.enabled ? 'success' : 'neutral'">{{ row.original.enabled ? '启用' : '停用' }}</span>
          </template>
        </YdResponsiveEnhancedTable>
      </YdLoadingOverlay>
    </template>

    <template #footer>
      <YdPagination
        v-model:page="model.assetPager.page"
        v-model:size="model.assetPager.size"
        :total="model.assetPager.total"
        @page-change="onAssetPage"
        @size-change="onAssetSize"
      />
    </template>
  </YdTablePageLayout>

  <YdModal v-model="formVisible" title="币种配置" show-cancel-button class="sm:max-w-2xl" :confirm-loading="model.saving" @confirm="saveAsset">
    <YdForm :model="model.assetForm" layout="vertical">
      <div class="flex flex-col gap-4">
        <YdFormItem label="编码" required>
          <YdInput v-model="model.assetForm.code" placeholder="POINT" />
        </YdFormItem>
        <YdFormItem label="名称" required>
          <YdInput v-model="model.assetForm.name" placeholder="积分" />
        </YdFormItem>
        <YdFormItem label="符号">
          <YdInput v-model="model.assetForm.symbol" placeholder="¥ / 积分" />
        </YdFormItem>
        <YdFormItem label="精度">
          <YdNumberField v-model="model.assetForm.scale" :min="0" :max="8" />
        </YdFormItem>
        <YdFormItem label="最低转账">
          <YdInput v-model="model.assetForm.minTransferAmount" inputmode="decimal" />
        </YdFormItem>
        <YdFormItem label="货币资产">
          <YdSwitch v-model="model.assetForm.money" />
        </YdFormItem>
        <YdFormItem label="允许转账">
          <YdSwitch v-model="model.assetForm.transferEnabled" />
        </YdFormItem>
        <YdFormItem label="启用">
          <YdSwitch v-model="model.assetForm.enabled" />
        </YdFormItem>
      </div>
    </YdForm>
  </YdModal>
</template>
