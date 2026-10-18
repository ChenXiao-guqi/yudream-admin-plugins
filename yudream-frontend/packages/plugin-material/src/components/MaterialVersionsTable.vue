<script setup lang="ts">
import { YdLoadingOverlay } from '@yudream/components'
import type { ActionMenuItem, TableColumn } from '@yudream/components'
import type { VersionView } from '../types'
import { YdButton, YdResponsiveEnhancedTable, YdTag } from '@yudream/components'
import { formatSize, formatTime } from '../types'

/**
 * 版本历史表格：父物料主文件版本与子物料版本结构一致，共用同一套渲染。
 * 父组件负责标题（当前目标的名称）与「上传新版本」入口。
 * canWrite=false（他人物料且无管理权限）时隐藏回滚与删除。
 */
const props = defineProps<{
  versions: VersionView[]
  loading?: boolean
  /** 是否可回滚/删除版本（删除版本仅属主，管理端亦然） */
  canWrite?: boolean
  /** 是否可上传新版本（属主或有管理权限） */
  canUpload?: boolean
}>()
const emit = defineEmits<{
  preview: [version: VersionView]
  download: [version: VersionView]
  restore: [version: VersionView]
  remove: [version: VersionView]
  upload: []
}>()

const columns: TableColumn<VersionView>[] = [
  { id: 'version', header: '版本', width: 96 },
  { accessorKey: 'originalName', header: '文件名', minWidth: 180 },
  { id: 'size', header: '大小', width: 100 },
  { accessorKey: 'note', header: '备注', minWidth: 140 },
  { accessorKey: 'uploaderName', header: '上传者', width: 110 },
  { accessorKey: 'createdAt', header: '上传时间', width: 170 },
]

/** 行操作统一收进操作菜单；canWrite=false（他人物料）隐藏回滚与删除 */
const rowActions: ActionMenuItem<VersionView>[] = [
  { label: '预览', icon: 'morph:eye', onClick: row => emit('preview', row) },
  { label: '下载', icon: 'morph:download', onClick: row => emit('download', row) },
  { label: '回滚到此', icon: 'morph:history', visible: row => Boolean(props.canWrite) && !row.current, onClick: row => emit('restore', row) },
  { label: '删除', icon: 'morph:trash-2', danger: true, visible: row => Boolean(props.canWrite) && !row.current, onClick: row => emit('remove', row) },
]
</script>

<template>
  <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
    <slot name="title" />
    <div class="flex items-center gap-2">
      <span class="text-xs text-secondary-foreground/70">共 {{ props.versions.length }} 个版本</span>
      <YdButton v-if="props.canUpload" size="sm" variant="outline" @click="emit('upload')">上传新版本</YdButton>
    </div>
  </div>
  <YdLoadingOverlay :loading="props.loading"><YdResponsiveEnhancedTable
    :columns="columns"
    :data="props.versions"
    row-key="version"
    table-root-class="rounded-lg overflow-hidden"
    table-class="min-w-[820px]"
    border stripe
    column-visibility
    :actions="rowActions"
    empty-text="暂无版本"
  >
    <template #cell-version="{ row }">
      <strong>v{{ row.original.version }}</strong>
      <YdTag v-if="row.original.current" class="ml-2" variant="secondary">当前</YdTag>
    </template>
    <template #cell-originalName="{ row }">{{ row.original.originalName || '-' }}</template>
    <template #cell-size="{ row }">{{ formatSize(row.original.size) }}</template>
    <template #cell-note="{ row }">{{ row.original.note || '-' }}</template>
    <template #cell-uploaderName="{ row }">{{ row.original.uploaderName || row.original.uploaderId }}</template>
    <template #cell-createdAt="{ row }">{{ formatTime(row.original.createdAt) }}</template>
  </YdResponsiveEnhancedTable></YdLoadingOverlay>
</template>
