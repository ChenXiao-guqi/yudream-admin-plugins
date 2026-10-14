<script setup lang="ts">
import { YdLoadingOverlay } from '@yudream/components'
import type { TableColumn } from '@yudream/components'
import type { ActivityProofExportRecord } from '../types'
import type { YuDreamPluginSdk } from '@yudream/plugin-sdk'
import type { RouteLocationNormalizedLoaded } from 'vue-router'
import { YdButton, YdCard, YdIcon, YdPageHeader, YdPageMain, YdPagination, YdResponsiveTable } from '@yudream/components'
import { onMounted } from 'vue'
import { useMyProofs } from '../composables/useMyProofs'
import { formatTime } from '../composables/utils'

const props = defineProps<{
  sdk: YuDreamPluginSdk
  route?: RouteLocationNormalizedLoaded
}>()

const model = useMyProofs(props.sdk)
const { loading, downloading, records, pager } = model

onMounted(model.load)

const columns: TableColumn<ActivityProofExportRecord>[] = [
  { accessorKey: 'activityName', header: '活动', width: 240, fixed: 'left' },
  { accessorKey: 'serverName', header: '服务器', width: 180 },
  { id: 'uploadedAt', header: '盖章时间', width: 180 },
  { id: 'operation', header: '操作', width: 140, align: 'center', fixed: 'right' },
]
</script>

<template>
  <section class="proof-page">
    <YdPageHeader title="我的活动证明" class="mb-0">
      <YdButton variant="outline" :loading="loading" @click="model.load">
        <YdIcon name="i-ri:refresh-line" />刷新
      </YdButton>
    </YdPageHeader>
    <YdPageMain>
      <YdLoadingOverlay :loading="loading"><YdResponsiveTable

        row-key="id"
        table-root-class="proof-table-scroll"
        table-class="proof-table-w760"
        border
        stripe
        column-visibility
        :columns="columns"
        :data="records"
      >
        <template #cell-uploadedAt="{ row }">{{ formatTime(row.original.stampedPdfUploadedAt) }}</template>
        <template #cell-operation="{ row }">
          <YdButton size="sm" variant="outline" :loading="downloading" @click="model.downloadStamped(row.original)">下载 PDF</YdButton>
        </template>
        <template #card="{ row }">
          <YdCard class="w-full">
            <div class="flex flex-col gap-3">
              <div class="flex items-center justify-between gap-2">
                <span class="min-w-0 break-words text-base font-semibold">{{ row.activityName }}</span>
              </div>
              <div class="flex flex-col gap-1 text-sm">
                <div v-if="row.serverName" class="flex gap-2">
                  <span class="shrink-0 text-secondary-foreground/60">服务器</span>
                  <span class="break-all">{{ row.serverName }}</span>
                </div>
                <div class="flex gap-2">
                  <span class="shrink-0 text-secondary-foreground/60">盖章时间</span>
                  <span>{{ formatTime(row.stampedPdfUploadedAt) }}</span>
                </div>
              </div>
              <div class="flex flex-wrap gap-2 border-t pt-3">
                <YdButton size="sm" variant="outline" :loading="downloading" @click="model.downloadStamped(row)">下载 PDF</YdButton>
              </div>
            </div>
          </YdCard>
        </template>
      </YdResponsiveTable></YdLoadingOverlay>
      <YdPagination
        v-model:page="pager.page"
        v-model:size="pager.size"
        :total="pager.total"
        class="mt-3"
        @page-change="model.load"
        @size-change="model.load"
      />
    </YdPageMain>
  </section>
</template>
