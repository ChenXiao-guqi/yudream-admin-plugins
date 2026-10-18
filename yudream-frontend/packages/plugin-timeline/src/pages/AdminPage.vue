<script setup lang="ts">
import type { ActionMenuItem, SearchConfig, SearchFieldConfig, SearchOptionsSource, StatusColumn, TableColumn, YdTablePageAction } from '@yudream/components'
import type { TimelinePluginModel } from '../composables/useTimelinePlugin'
import type { TimelineEventSummary, TimelineStatusFilter, TimelineTypeFilter } from '../types'
import { YdButton, YdDynamicSearchForm, YdIcon, YdLoadingOverlay, YdPagination, YdResponsiveEnhancedTable, YdTablePageLayout, YdTag, useYdModal } from '@yudream/components'
import { onMounted, ref } from 'vue'
import CoverThumb from '../components/CoverThumb.vue'
import EventEditorModal from '../components/EventEditorModal.vue'
import { EVENT_TYPE_OPTIONS, eventTypeMeta, formatEventDate, formatTime, resolveImageUrl, resolveThumbUrl } from '../composables/utils'

const props = defineProps<{ model: TimelinePluginModel }>()
const model = props.model
const confirm = useYdModal()

const editorOpen = ref(false)
const editingId = ref<string | null>(null)

const statusOptions = [
  { label: '全部状态', value: '' },
  { label: '已发布', value: 'published' },
  { label: '草稿', value: 'draft' },
]

const typeOptions = [
  { label: '全部类型', value: '' },
  ...EVENT_TYPE_OPTIONS.map(item => ({ label: item.label, value: item.value })),
]

/** ControlType 是 components 内部的字符串枚举，桥接层只出类型，这里用字面量收敛一次 */
type SearchFieldInput = Partial<Omit<SearchFieldConfig, 'controlType'>> & Pick<SearchFieldConfig, 'fieldName' | 'label'> & { controlType?: 'TEXT' | 'SELECT' | 'DATE_RANGE' | 'NUMBER_RANGE' | 'CHECKBOX' | 'RADIO' }

function searchField(config: SearchFieldInput): SearchFieldConfig {
  const { controlType = 'TEXT', order = 0, showWhenFolded = false, width = '200px', ...rest } = config
  return { ...rest, fieldName: config.fieldName, label: config.label, controlType: controlType as SearchFieldConfig['controlType'], order, showWhenFolded, width }
}

const searchQuery = ref<Record<string, any>>({
  keyword: model.adminFilters.keyword ?? '',
  status: model.adminFilters.status ?? '',
  type: model.adminFilters.type ?? '',
})

const searchConfig: SearchConfig = {
  fields: [
    searchField({ fieldName: 'keyword', label: '关键词', placeholder: '搜索标题、简述或时间文案', order: 1, showWhenFolded: true, width: '240px' }),
    searchField({ fieldName: 'status', label: '状态', controlType: 'SELECT', order: 2, width: '160px' }),
    searchField({ fieldName: 'type', label: '类型', controlType: 'SELECT', order: 3, width: '160px' }),
  ],
}

const optionsSources: SearchOptionsSource[] = [
  { id: 'statusOptions', loader: () => statusOptions },
  { id: 'typeOptions', loader: () => typeOptions },
]

function applySearch() {
  model.adminFilters.keyword = String(searchQuery.value.keyword ?? '')
  model.adminFilters.status = String(searchQuery.value.status ?? '') as TimelineStatusFilter
  model.adminFilters.type = String(searchQuery.value.type ?? '') as TimelineTypeFilter
  applyFilters()
}

const columns: TableColumn<TimelineEventSummary>[] = [
  { accessorKey: 'eventDate', header: '事件时间', width: 130 },
  { id: 'title', header: '事件', minWidth: 260 },
  { accessorKey: 'imageCount', header: '图集', width: 70 },
  { accessorKey: 'sort', header: '排序', width: 70 },
  { accessorKey: 'updatedAt', header: '更新时间', width: 170 },
]

/** 发布状态：语义色胶囊 */
const publishedStatusColumn: StatusColumn<TimelineEventSummary> = {
  statusKey: 'published',
  header: '状态',
  width: 100,
  statusMap: {
    'true': { label: '已发布', variant: 'default', tone: 'success' },
    'false': { label: '草稿', variant: 'secondary', tone: 'neutral' },
  },
}

/** 行操作统一收进操作菜单，删除保持确认流程 */
const rowActions: ActionMenuItem<TimelineEventSummary>[] = [
  { label: '编辑', icon: 'morph:pencil', onClick: row => openEdit(row) },
  { label: row => (row.published ? '下架' : '发布'), icon: 'morph:eye', disabled: () => model.toggling, onClick: row => togglePublish(row) },
  { label: '删除', icon: 'morph:trash-2', danger: true, onClick: row => confirmDelete(row) },
]

const pageActions: YdTablePageAction[] = [
  { label: '新建事件', icon: 'morph:plus', onClick: openCreate },
]

function applyFilters() {
  model.adminPager.page = 1
  void model.loadAdminEvents(1)
}

function coverUrl(row: TimelineEventSummary) {
  return resolveImageUrl(model.sdk, row.coverImage)
}

function coverThumb(row: TimelineEventSummary) {
  return resolveThumbUrl(model.sdk, row.coverImage)
}

function openCreate() {
  editingId.value = null
  editorOpen.value = true
}

function openEdit(row: TimelineEventSummary) {
  editingId.value = row.id
  editorOpen.value = true
}

async function onSaved() {
  editorOpen.value = false
  await model.loadAdminEvents()
}

function confirmDelete(row: TimelineEventSummary) {
  confirm.confirm({
    title: '删除事件',
    content: `确认删除「${row.title}」吗？删除后公开时间轴将不再展示该事件，且不可恢复。`,
    onConfirm: () => model.removeEvent(row),
  })
}

function togglePublish(row: TimelineEventSummary) {
  void model.setPublished(row.id, !row.published)
}

onMounted(() => {
  void model.loadAdminEvents()
})
</script>

<template>
  <YdTablePageLayout title="事件管理" :actions="pageActions">
    <template #search="{ fold }">
      <YdDynamicSearchForm
        v-model="searchQuery"
        :config="searchConfig"
        :fold="fold"
        :options-sources="optionsSources"
        @search="applySearch"
        @reset="applySearch"
      />
    </template>

    <template #table>
      <YdLoadingOverlay :loading="model.adminLoading">
        <YdResponsiveEnhancedTable
          :columns="columns"
          :data="model.adminEvents"
          row-key="id"
          table-root-class="rounded-lg overflow-hidden"
          table-class="min-w-[860px]"
          border
          stripe
          column-visibility
          :status-column="publishedStatusColumn"
          :actions="rowActions"
          empty-text="暂无事件，点击「新建事件」创建第一条大事记"
        >
          <template #cell-eventDate="{ row }">
            <span>{{ formatEventDate(row.original.eventDate, row.original.dateLabel) }}</span>
          </template>
          <template #cell-title="{ row }">
            <div class="tl-event-cell">
              <CoverThumb
                v-if="row.original.coverImage"
                :src="coverThumb(row.original)"
                :fallback-src="coverUrl(row.original)"
                :alt="row.original.title"
                img-class="tl-event-thumb"
              />
              <div class="tl-event-cell-text">
                <span class="tl-event-cell-title" :title="row.original.title">
                  <YdTag :variant="eventTypeMeta(row.original.eventType).tagVariant" class="tl-event-type-tag">
                    {{ eventTypeMeta(row.original.eventType).label }}
                  </YdTag>
                  {{ row.original.title }}
                </span>
                <span v-if="row.original.summary" class="tl-event-cell-summary" :title="row.original.summary">{{ row.original.summary }}</span>
              </div>
            </div>
          </template>
          <template #cell-updatedAt="{ row }">
            {{ formatTime(row.original.updatedAt) }}
          </template>
        </YdResponsiveEnhancedTable>
      </YdLoadingOverlay>
    </template>

    <template #footer>
      <YdPagination
        v-model:page="model.adminPager.page"
        v-model:size="model.adminPager.size"
        :total="model.adminPager.total"
        @page-change="model.loadAdminEvents()"
        @size-change="applyFilters"
      />
    </template>
  </YdTablePageLayout>

  <EventEditorModal v-model:open="editorOpen" :event-id="editingId" :model="model" @saved="onSaved" />
</template>
