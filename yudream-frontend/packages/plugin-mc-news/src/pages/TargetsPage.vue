<script setup lang="ts">
import type { ActionMenuItem, TableColumn, YdTablePageAction } from '@yudream/components'
import type { YuDreamPluginSdk } from '@yudream/plugin-sdk'
import type { PushTargetView } from '../types'
import { YdButton, YdIcon, YdLoadingOverlay, YdResponsiveEnhancedTable, YdSwitch, YdTablePageLayout, useYdModal, useYdToast } from '@yudream/components'
import { onMounted, ref } from 'vue'
import { createMcNewsApi } from '../api/mc-news-api'
import { errorMessage } from '../composables/utils'
import TargetEditorModal from '../components/TargetEditorModal.vue'

const props = defineProps<{ sdk: YuDreamPluginSdk }>()
const api = createMcNewsApi(props.sdk)
const toast = useYdToast()
const confirm = useYdModal()

const loading = ref(false)
const rows = ref<PushTargetView[]>([])
const editorOpen = ref(false)
const editing = ref<PushTargetView | null>(null)

const columns: TableColumn<PushTargetView>[] = [
  { accessorKey: 'name', header: '名称', minWidth: 160 },
  { id: 'type', header: '类型', width: 110 },
  { id: 'target', header: '推送位置', minWidth: 240 },
  { id: 'enabled', header: '启用', width: 80 },
  { accessorKey: 'markdown', header: 'Markdown', width: 100, defaultHidden: true },
]

/** 行操作统一收进操作菜单，删除保持确认流程 */
const rowActions: ActionMenuItem<PushTargetView>[] = [
  { label: '测试', icon: 'morph:flask', onClick: row => void test(row) },
  { label: '编辑', icon: 'morph:pencil', onClick: row => openEdit(row) },
  { label: '删除', icon: 'morph:trash-2', danger: true, onClick: row => confirmDelete(row) },
]

const pageActions: YdTablePageAction[] = [
  { label: '新增目标', icon: 'morph:plus', onClick: openCreate },
]

async function load() {
  loading.value = true
  try {
    rows.value = await api.targets()
  }
  catch (error) {
    toast.error(errorMessage(error, '加载推送目标失败'))
  }
  finally {
    loading.value = false
  }
}

function openCreate() {
  editing.value = null
  editorOpen.value = true
}

function openEdit(row: PushTargetView) {
  editing.value = row
  editorOpen.value = true
}

function targetLabel(row: PushTargetView) {
  if (row.type === 'messaging')
    return row.channelName || row.channelId
  return row.webhookUrl
}

async function toggleEnabled(row: PushTargetView, enabled: boolean) {
  try {
    await api.updateTarget(row.id, { enabled })
    row.enabled = enabled
    toast.success(enabled ? '已启用' : '已停用')
  }
  catch (error) {
    row.enabled = !enabled
    toast.error(errorMessage(error, '更新失败'))
  }
}

async function test(row: PushTargetView) {
  try {
    const result = await api.testTarget(row.id)
    if (result.ok)
      toast.success(`已向「${row.name}」发送测试推送`)
    else
      toast.error(`测试推送失败：${result.error || '未知错误'}`)
  }
  catch (error) {
    toast.error(errorMessage(error, '测试推送失败'))
  }
}

function confirmDelete(row: PushTargetView) {
  confirm.confirm({
    title: '删除推送目标',
    content: `确认删除「${row.name}」吗？删除后新新闻不再推送到该目标。`,
    onConfirm: async () => {
      try {
        await api.deleteTarget(row.id)
        toast.success('已删除')
        await load()
      }
      catch (error) {
        toast.error(errorMessage(error, '删除失败'))
      }
    },
  })
}

onMounted(() => {
  void load()
})
</script>

<template>
  <YdTablePageLayout title="推送目标" :show-search="false" :actions="pageActions">
    <template #table>
      <YdLoadingOverlay :loading="loading">
        <YdResponsiveEnhancedTable
          row-key="id"
          table-root-class="rounded-lg overflow-hidden"
          table-class="min-w-[820px]"
          border
          stripe
          column-visibility
          :actions="rowActions"
          :columns="columns"
          :data="rows"
          empty-text="暂无推送目标，点击「新增目标」创建"
        >
          <template #cell-type="{ row }">
            <span class="yd-status-tone" :data-tone="row.original.type === 'messaging' ? 'info' : 'neutral'">
              {{ row.original.type === 'messaging' ? '机器人群聊' : 'Webhook' }}
            </span>
          </template>
          <template #cell-target="{ row }">
            <span class="mc-news-url" :title="targetLabel(row.original)">{{ targetLabel(row.original) || '-' }}</span>
          </template>
          <template #cell-enabled="{ row }">
            <YdSwitch :model-value="row.original.enabled" @update:model-value="(value?: boolean) => toggleEnabled(row.original, value === true)" />
          </template>
          <template #cell-markdown="{ row }">
            <span v-if="row.original.type === 'messaging'">{{ row.original.markdown ? '开' : '关' }}</span>
            <span v-else class="text-muted-foreground/40">-</span>
          </template>
        </YdResponsiveEnhancedTable>
      </YdLoadingOverlay>
    </template>
  </YdTablePageLayout>

  <TargetEditorModal v-model:open="editorOpen" :sdk="props.sdk" :target="editing" @saved="() => load()" />
</template>
