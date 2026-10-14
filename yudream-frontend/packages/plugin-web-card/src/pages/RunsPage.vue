<script setup lang="ts">
import { YdLoadingOverlay } from '@yudream/components'
import { onMounted, ref } from 'vue'
import { YdAlert, YdButton, YdCard, YdIcon, YdPageHeader, YdPageMain, YdPagination, YdResponsiveTable, YdTag, useYdToast, type TableColumn } from '@yudream/components'
import type { YuDreamPluginSdk } from '@yudream/plugin-sdk'
import { createWebCardApi } from '../api/web-card-api'
import type { DeliveryRecord } from '../types'
import { dateTime, errorText } from '../ui'

const props = defineProps<{ sdk: YuDreamPluginSdk }>()
const api = createWebCardApi(props.sdk)
const toast = useYdToast()
const rows = ref<DeliveryRecord[]>([])
const page = ref(1)
const size = ref(10)
const total = ref(0)
const loading = ref(false)
const error = ref('')
const columns: TableColumn<DeliveryRecord>[] = [{ accessorKey: 'stage', header: '结果', width: 120 }, { accessorKey: 'contentId', header: '内容 ID', minWidth: 220 }, { id: 'mode', header: '触发方式', width: 120 }, { accessorKey: 'attempts', header: '尝试', width: 80 }, { accessorKey: 'error', header: '错误', minWidth: 320 }, { id: 'updatedAt', header: '更新时间', width: 180 }, { id: 'operation', header: '操作', width: 110 }]
async function load() { loading.value = true; error.value = ''; try { const result = await api.deliveries(page.value, size.value); rows.value = result.records; total.value = result.total } catch (cause) { error.value = errorText(cause, '加载运行记录失败') } finally { loading.value = false } }
async function retry(value: DeliveryRecord) { try { await api.retry(value.id); toast.success('定时投递已重新执行'); await load() } catch (cause) { toast.error(errorText(cause, '重试失败')) } }
function variant(stage: string) { return stage === 'DELIVERED' ? 'default' : stage === 'FAILED' ? 'destructive' : 'secondary' }
onMounted(load)
</script>

<template><section><YdPageHeader title="运行记录" description="查看即时链接回复和定时推送的渲染、发送结果与失败原因。"><YdButton variant="outline" @click="load"><YdIcon name="i-ri:refresh-line"/>刷新</YdButton></YdPageHeader><YdPageMain class="space-y-4"><YdAlert v-if="error" variant="destructive" title="加载失败" :description="error"/><YdLoadingOverlay :loading="loading"><YdResponsiveTable  row-key="id" table-root-class="rounded-lg overflow-hidden" table-class="min-w-[1080px]" border stripe :columns="columns" :data="rows"><template #cell-stage="{row}"><YdTag :variant="variant(row.original.stage)">{{ row.original.stage }}</YdTag></template><template #cell-mode="{row}">{{ row.original.bindingId ? '定时推送' : '即时回复' }}</template><template #cell-updatedAt="{row}">{{ dateTime(row.original.updatedAt) }}</template><template #cell-operation="{row}"><YdButton v-if="row.original.bindingId&&(row.original.stage==='FAILED'||row.original.stage==='DELAYED')" size="sm" variant="outline" @click="retry(row.original)"><YdIcon name="i-ri:restart-line"/>重试</YdButton></template>
<template #card="{ row }">
  <YdCard class="w-full">
    <div class="flex flex-col gap-3">
      <div class="flex items-center justify-between gap-2">
        <span class="min-w-0 break-words text-base font-semibold">{{ row.contentId || '-' }}</span>
        <div class="flex gap-1">
          <YdTag :variant="variant(row.stage)">{{ row.stage }}</YdTag>
        </div>
      </div>
      <div class="flex flex-col gap-1 text-sm">
        <div class="flex gap-2"><span class="shrink-0 text-secondary-foreground/60">触发方式</span><span class="break-all">{{ row.bindingId ? '定时推送' : '即时回复' }}</span></div>
        <div class="flex gap-2"><span class="shrink-0 text-secondary-foreground/60">尝试</span><span class="break-all">{{ row.attempts }}</span></div>
        <div v-if="row.error" class="flex gap-2"><span class="shrink-0 text-secondary-foreground/60">错误</span><span class="break-all">{{ row.error }}</span></div>
        <div class="flex gap-2"><span class="shrink-0 text-secondary-foreground/60">更新时间</span><span>{{ dateTime(row.updatedAt) }}</span></div>
      </div>
      <div v-if="row.bindingId && (row.stage === 'FAILED' || row.stage === 'DELAYED')" class="flex flex-wrap gap-2 border-t pt-3">
        <YdButton size="sm" variant="outline" @click="retry(row)"><YdIcon name="i-ri:restart-line"/>重试</YdButton>
      </div>
    </div>
  </YdCard>
</template></YdResponsiveTable></YdLoadingOverlay><YdPagination v-model:page="page" v-model:size="size" :total="total" class="mt-3" @page-change="load" @size-change="load"/></YdPageMain></section></template>
