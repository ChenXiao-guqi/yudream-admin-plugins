<script setup lang="ts">
import { YdLoadingOverlay } from '@yudream/components'
import type { ActionMenuItem, TableColumn } from '@yudream/components'
import type { MaterialItemView } from '../types'
import { YdIcon, YdResponsiveEnhancedTable, YdTag } from '@yudream/components'
import { computed, ref } from 'vue'
import { formatSize, formatTime, TYPE_ICONS } from '../types'

/**
 * 子物料表格：详情页与管理工作台（抽屉）共用。
 * 版本管理入口集中在行内「版本」动作，父组件负责打开该子物料的版本链。
 * 组合物料没有主文件，行内「设为主文件」把某个子物料指定为父物料的预览主文件（父物料在线预览/下载跟随它）。
 */
const props = defineProps<{
  items: MaterialItemView[]
  loading?: boolean
  /** 当前在版本区展开的子物料 id，用于高亮 */
  activeId?: string
  /** 只读：他人物料且无管理权限时隐藏全部写操作 */
  readonly?: boolean
  /** 父物料当前的预览主文件（子物料 id）；空串表示未指定 */
  previewItemId?: string
}>()
const emit = defineEmits<{
  versions: [item: MaterialItemView]
  'new-version': [item: MaterialItemView]
  rename: [item: MaterialItemView]
  remove: [item: MaterialItemView]
  download: [item: MaterialItemView]
  /** 把该子物料设为父物料的预览主文件 */
  'set-preview': [item: MaterialItemView]
  /** 取消预览主文件指定，预览回退第一个子物料 */
  'clear-preview': []
}>()

const columns: TableColumn<MaterialItemView>[] = [
  { accessorKey: 'name', header: '子物料', minWidth: 180 },
  { id: 'type', header: '类型', width: 96 },
  { id: 'fileName', header: '当前文件', minWidth: 160 },
  { id: 'currentVersion', header: '版本', width: 76 },
  { id: 'size', header: '大小', width: 96 },
  { accessorKey: 'updatedAt', header: '更新时间', width: 168 },
]

/** 行操作统一收进操作菜单；readonly（他人物料）隐藏全部写操作 */
const rowActions = computed<ActionMenuItem<MaterialItemView>[]>(() => [
  { label: '版本', icon: 'morph:git-branch', onClick: row => emit('versions', row) },
  { label: row => (isPreviewItem(row) ? '取消主文件' : '设为主文件'), icon: 'morph:star', visible: () => !props.readonly, onClick: (row) => { if (isPreviewItem(row)) { emit('clear-preview') } else { emit('set-preview', row) } } },
  { label: '新版本', icon: 'morph:cloud-upload', visible: () => !props.readonly, onClick: row => emit('new-version', row) },
  { label: '下载', icon: 'morph:download', onClick: row => emit('download', row) },
  { label: '重命名', icon: 'morph:pencil', visible: () => !props.readonly, onClick: row => emit('rename', row) },
  { label: '删除', icon: 'morph:trash-2', danger: true, visible: () => !props.readonly, onClick: row => emit('remove', row) },
])

const rowRef = computed(() => props.items[0])

function typeIcon(item: MaterialItemView) {
  return TYPE_ICONS[item.type] || TYPE_ICONS.OTHER
}

function isPreviewItem(item: MaterialItemView) {
  return !!props.previewItemId && item.id === props.previewItemId
}
</script>

<template>
  <YdLoadingOverlay :loading="props.loading"><YdResponsiveEnhancedTable
    :columns="columns"
    :data="props.items"
    row-key="id"
    table-root-class="rounded-lg overflow-hidden"
    table-class="min-w-[820px]"
    border stripe
    column-visibility
    :actions="rowActions"
    empty-text="暂无子物料"
  >
    <template #cell-name="{ row }">
      <div class="flex items-center gap-2">
        <YdIcon :name="typeIcon(row.original)" class="shrink-0 text-secondary-foreground/70" />
        <strong class="truncate">{{ row.original.name }}</strong>
        <YdTag v-if="isPreviewItem(row.original)" variant="secondary" class="shrink-0">预览主文件</YdTag>
        <YdTag v-if="row.original.id === props.activeId" variant="outline" class="shrink-0">版本区</YdTag>
      </div>
    </template>
    <template #cell-type="{ row }">
      <YdTag variant="secondary">{{ row.original.typeLabel }} · .{{ row.original.ext || '?' }}</YdTag>
    </template>
    <template #cell-fileName="{ row }">{{ row.original.name }}</template>
    <template #cell-currentVersion="{ row }">v{{ row.original.currentVersion }}</template>
    <template #cell-size="{ row }">{{ formatSize(row.original.size) }}</template>
    <template #cell-updatedAt="{ row }">{{ formatTime(row.original.updatedAt) }}</template>
  </YdResponsiveEnhancedTable></YdLoadingOverlay>
</template>
