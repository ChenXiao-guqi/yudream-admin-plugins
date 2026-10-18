<script setup lang="ts">
import type { ActionMenuItem, StatusColumn, TableColumn } from '@yudream/components'
import type { YuDreamPluginSdk } from '@yudream/plugin-sdk'
import type { PushLogView } from '../types'
import { YdDrawer, YdLoadingOverlay, YdPagination, YdResponsiveEnhancedTable, YdTablePageLayout, YdTag, useYdToast } from '@yudream/components'
import { computed, onMounted, reactive, ref } from 'vue'
import { createMcNewsApi } from '../api/mc-news-api'
import { errorMessage, LOG_MODE_META } from '../composables/utils'

const props = defineProps<{ sdk: YuDreamPluginSdk }>()
const api = createMcNewsApi(props.sdk)
const toast = useYdToast()

const loading = ref(false)
const rows = ref<PushLogView[]>([])
const pager = reactive({ page: 1, size: 10, total: 0 })
const detail = ref<PushLogView | null>(null)
const detailOpen = ref(false)

const columns: TableColumn<PushLogView>[] = [
  { accessorKey: 'createdAtLabel', header: '时间', width: 150 },
  { id: 'title', header: '新闻', minWidth: 280 },
  { accessorKey: 'sourceName', header: '来源', width: 160 },
  { id: 'result', header: '结果', width: 100 },
]

/** 推送方式列：语义色胶囊 */
const modeStatusColumn: StatusColumn<PushLogView> = {
  statusKey: 'mode',
  header: '类型',
  width: 110,
  statusMap: {
    poll: { label: LOG_MODE_META.poll.label, variant: 'default', tone: 'info' },
    manual: { label: LOG_MODE_META.manual.label, variant: 'default', tone: 'warning' },
    push: { label: LOG_MODE_META.push.label, variant: 'default', tone: 'success' },
    test: { label: LOG_MODE_META.test.label, variant: 'secondary', tone: 'neutral' },
  },
}

/** 行操作统一收进操作菜单 */
const rowActions: ActionMenuItem<PushLogView>[] = [
  { label: '详情', icon: 'morph:eye', onClick: row => openDetail(row) },
]

const detailResults = computed(() => detail.value?.results ?? [])

async function load() {
  loading.value = true
  try {
    const page = await api.logs(pager.page, pager.size)
    rows.value = page.records ?? []
    pager.total = Number(page.total ?? 0)
  }
  catch (error) {
    toast.error(errorMessage(error, '加载推送记录失败'))
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

function openDetail(row: PushLogView) {
  detail.value = row
  detailOpen.value = true
}

onMounted(() => {
  void load()
})
</script>

<template>
  <YdTablePageLayout title="推送记录" :show-search="false">
    <template #table>
      <YdLoadingOverlay :loading="loading">
        <YdResponsiveEnhancedTable
          row-key="id"
          table-root-class="rounded-lg overflow-hidden"
          table-class="min-w-[860px]"
          border
          stripe
          column-visibility
          :status-column="modeStatusColumn"
          :actions="rowActions"
          :columns="columns"
          :data="rows"
          empty-text="暂无推送记录"
        >
          <template #cell-title="{ row }">
            <a v-if="row.original.url" class="mc-news-link" :href="row.original.url" target="_blank" rel="noopener">{{ row.original.title }}</a>
            <span v-else>{{ row.original.title }}</span>
          </template>
          <template #cell-result="{ row }">
            <span class="yd-status-tone" :data-tone="row.original.okCount > 0 ? 'success' : 'danger'">{{ row.original.okCount }}/{{ row.original.total }}</span>
          </template>
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

  <YdDrawer v-model="detailOpen" title="推送明细" side="right" :show-confirm-button="false" :footer="false" content-class="mc-news-drawer-body">
    <div v-if="detail" class="mc-news-form">
      <div class="mc-news-form-item">
        <span class="mc-news-form-label">{{ detail.title }}</span>
        <span class="mc-news-form-hint">{{ detail.createdAtLabel }}｜{{ LOG_MODE_META[detail.mode]?.label ?? detail.mode }}｜{{ detail.sourceName }}</span>
      </div>
      <div class="mc-news-result-list">
        <div v-for="result in detailResults" :key="result.targetId" class="mc-news-result-row">
          <span class="yd-status-tone" :data-tone="result.ok ? 'success' : 'danger'">{{ result.ok ? '成功' : '失败' }}</span>
          <span>{{ result.targetName }}</span>
          <span class="mc-news-form-hint">{{ result.targetType }}</span>
          <span v-if="result.error" class="mc-news-form-hint">{{ result.error }}</span>
        </div>
        <span v-if="!detailResults.length" class="mc-news-form-hint">无推送目标</span>
      </div>
    </div>
  </YdDrawer>
</template>
