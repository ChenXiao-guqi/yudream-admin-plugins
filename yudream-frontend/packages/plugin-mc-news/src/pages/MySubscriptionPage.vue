<script setup lang="ts">
import type { ActionMenuItem, TableColumn, YdTablePageAction } from '@yudream/components'
import type { YuDreamPluginSdk } from '@yudream/plugin-sdk'
import type { MySubscriptionView, PushTargetView, WebhookHeader } from '../types'
import { YdButton, YdForm, YdFormItem, YdIcon, YdInput, YdLoadingOverlay, YdModal, YdResponsiveEnhancedTable, YdSwitch, YdTablePageLayout, useYdModal, useYdToast } from '@yudream/components'
import { computed, onMounted, reactive, ref } from 'vue'
import { createMcNewsApi } from '../api/mc-news-api'
import { errorMessage } from '../composables/utils'

const props = defineProps<{ sdk: YuDreamPluginSdk }>()
const api = createMcNewsApi(props.sdk)
const toast = useYdToast()
const confirm = useYdModal()

const loading = ref(false)
const view = ref<MySubscriptionView | null>(null)

const editorOpen = ref(false)
const editing = ref<PushTargetView | null>(null)
const saving = ref(false)

const webhookForm = reactive({
  name: '',
  url: '',
  enabled: true,
  headers: [] as WebhookHeader[],
})

const columns: TableColumn<PushTargetView>[] = [
  { accessorKey: 'name', header: '名称', minWidth: 140 },
  { id: 'url', header: 'Webhook 地址', minWidth: 240 },
  { id: 'enabled', header: '启用', width: 80 },
]

/** 行操作统一收进操作菜单，删除保持确认流程 */
const rowActions: ActionMenuItem<PushTargetView>[] = [
  { label: '测试', icon: 'morph:flask', onClick: row => void testWebhook(row) },
  { label: '编辑', icon: 'morph:pencil', onClick: row => openEdit(row) },
  { label: '删除', icon: 'morph:trash-2', danger: true, onClick: row => confirmDelete(row) },
]

const canAddMore = computed(() => (view.value?.webhooks.length ?? 0) < (view.value?.maxWebhooks ?? 5))

const pageActions = computed<YdTablePageAction[]>(() => [
  { label: '新增 Webhook', icon: 'morph:plus', disabled: !canAddMore.value, onClick: openCreate },
])

async function load() {
  loading.value = true
  try {
    view.value = await api.mySubscription()
  }
  catch (error) {
    toast.error(errorMessage(error, '加载订阅信息失败'))
  }
  finally {
    loading.value = false
  }
}

async function toggleDirect(enabled: boolean) {
  try {
    await api.setDirectEnabled(enabled)
    if (view.value)
      view.value.directEnabled = enabled
    toast.success(enabled ? '已开启私信推送，新新闻将发送到绑定会话' : '已关闭私信推送')
  }
  catch (error) {
    toast.error(errorMessage(error, '更新订阅失败'))
  }
}

async function testDirect() {
  try {
    const result = await api.testMyDirect()
    if (result.ok)
      toast.success('测试私信已发送，请注意查收')
    else
      toast.error(`测试私信发送失败：${result.error || '未知错误'}`)
  }
  catch (error) {
    toast.error(errorMessage(error, '测试私信发送失败'))
  }
}

function openCreate() {
  editing.value = null
  webhookForm.name = ''
  webhookForm.url = ''
  webhookForm.enabled = true
  webhookForm.headers = []
  editorOpen.value = true
}

function openEdit(row: PushTargetView) {
  editing.value = row
  webhookForm.name = row.name
  webhookForm.url = row.webhookUrl
  webhookForm.enabled = row.enabled
  webhookForm.headers = row.headers.map(header => ({ ...header }))
  editorOpen.value = true
}

function addHeader() {
  webhookForm.headers = [...webhookForm.headers, { key: '', value: '' }]
}

function removeHeader(index: number) {
  webhookForm.headers = webhookForm.headers.filter((_, i) => i !== index)
}

function updateHeader(index: number, patch: Partial<WebhookHeader>) {
  const headers = [...webhookForm.headers]
  headers[index] = { ...headers[index], ...patch }
  webhookForm.headers = headers
}

async function saveWebhook() {
  if (!webhookForm.name.trim() || !webhookForm.url.trim()) {
    toast.error('请填写名称与 Webhook 地址')
    return
  }
  saving.value = true
  try {
    const payload = { name: webhookForm.name, url: webhookForm.url, enabled: webhookForm.enabled, headers: webhookForm.headers }
    if (editing.value)
      await api.updateMyWebhook(editing.value.id, payload)
    else
      await api.createMyWebhook(payload)
    toast.success(editing.value ? 'Webhook 已更新' : 'Webhook 已创建')
    editorOpen.value = false
    await load()
  }
  catch (error) {
    toast.error(errorMessage(error, '保存 Webhook 失败'))
  }
  finally {
    saving.value = false
  }
}

async function testWebhook(row: PushTargetView) {
  try {
    const result = await api.testMyWebhook(row.id)
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
    title: '删除 Webhook',
    content: `确认删除「${row.name}」吗？删除后新新闻不再推送到该地址。`,
    onConfirm: async () => {
      try {
        await api.deleteMyWebhook(row.id)
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
  <YdTablePageLayout title="我的新闻订阅" :show-search="false" :actions="pageActions">
    <template #page-title>
      <div class="flex items-center gap-2">
        <YdSwitch
          :model-value="view?.directEnabled ?? false"
          :disabled="loading"
          @update:model-value="(value?: boolean) => toggleDirect(value === true)"
        />
        <span class="text-sm text-muted-foreground">私信推送</span>
        <YdButton size="sm" variant="outline" @click="testDirect">
          发送测试私信
        </YdButton>
      </div>
    </template>

    <template #table>
      <YdLoadingOverlay :loading="loading">
        <YdResponsiveEnhancedTable
          row-key="id"
          table-root-class="rounded-lg overflow-hidden"
          table-class="min-w-[560px]"
          border
          stripe
          :actions="rowActions"
          :columns="columns"
          :data="view?.webhooks ?? []"
          empty-text="还没有个人 Webhook，点击「新增 Webhook」创建；开启私信推送也可直接发送到绑定会话"
        >
          <template #cell-url="{ row }">
            <span class="mc-news-url" :title="row.original.webhookUrl">{{ row.original.webhookUrl || '-' }}</span>
          </template>
          <template #cell-enabled="{ row }">
            <span class="yd-status-tone" :data-tone="row.original.enabled ? 'success' : 'neutral'">{{ row.original.enabled ? '启用' : '停用' }}</span>
          </template>
        </YdResponsiveEnhancedTable>
      </YdLoadingOverlay>
    </template>
  </YdTablePageLayout>

  <YdModal v-model="editorOpen" :title="editing ? '编辑 Webhook' : '新增 Webhook'" :show-confirm-button="false" :close-on-click-overlay="false">
    <YdForm :model="webhookForm" layout="vertical">
      <div class="flex flex-col gap-4">
        <YdFormItem label="名称" required>
          <YdInput v-model="webhookForm.name" placeholder="如：我的频道通知" />
        </YdFormItem>
        <YdFormItem label="Webhook 地址" required extra="新新闻时会 POST JSON：title / content / body / sourceName / category / url / timestamp 等。">
          <YdInput v-model="webhookForm.url" placeholder="https://..." />
        </YdFormItem>
        <YdFormItem label="自定义 Header">
          <div class="flex flex-col gap-2">
            <YdButton size="sm" variant="outline" class="self-start" @click="addHeader">
              <YdIcon name="morph:plus" />添加 Header
            </YdButton>
            <div v-for="(header, index) in webhookForm.headers" :key="index" class="flex gap-2">
              <YdInput :model-value="header.key" class="flex-1" placeholder="Header 名" @update:model-value="(value?: string) => updateHeader(index, { key: value ?? '' })" />
              <YdInput :model-value="header.value" class="flex-1" placeholder="Header 值" @update:model-value="(value?: string) => updateHeader(index, { value: value ?? '' })" />
              <YdButton size="sm" variant="destructive" @click="removeHeader(index)">
                移除
              </YdButton>
            </div>
          </div>
        </YdFormItem>
        <YdFormItem label="启用">
          <YdSwitch v-model="webhookForm.enabled" />
        </YdFormItem>
      </div>
    </YdForm>
    <template #footer>
      <YdButton variant="outline" :disabled="saving" @click="editorOpen = false">
        取消
      </YdButton>
      <YdButton :loading="saving" @click="saveWebhook">
        保存
      </YdButton>
    </template>
  </YdModal>
</template>
