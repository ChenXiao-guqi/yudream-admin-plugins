<script setup lang="ts">
import type { ActionMenuItem, TableColumn } from '@yudream/components'
import type { ProjectProgressModel } from '../composables/useProjectProgress'
import type { ProjectWorkDetail } from '../types'
import { computed, reactive, watch } from 'vue'
import { YdButton, YdIcon, YdPageHeader, YdPageMain, YdPagination, YdResponsiveEnhancedTable } from '@yudream/components'

const props = defineProps<{ model: ProjectProgressModel }>()
const pagination = reactive({ page: 1, size: 10 })
const rows = computed(() => props.model.claimableTasks.slice((pagination.page - 1) * pagination.size, pagination.page * pagination.size))
const columns: TableColumn<ProjectWorkDetail>[] = [
  { id: 'project', header: '项目', width: 180, fixed: 'left' },
  { id: 'task', header: '任务', width: 360 },
  { id: 'quota', header: '名额', width: 110 },
  { id: 'dueAt', header: '截止时间', width: 170 },
  { id: 'operation', header: '操作', width: 120, align: 'center', fixed: 'right' },
]
watch(() => props.model.claimableTasks.length, total => { pagination.page = Math.min(pagination.page, Math.max(1, Math.ceil(total / pagination.size))) })
watch(() => pagination.size, () => { pagination.page = 1 })
/** 行操作：认领任务 */
const rowActions: ActionMenuItem<unknown>[] = [
  { label: '认领', icon: 'morph:hand', disabled: () => props.model.saving, onClick: row => props.model.claim(row as never) },
]
</script>

<template>
  <YdPageHeader title="任务认领" class="mb-0">
    <YdButton variant="outline" :loading="model.loading" @click="model.loadTaskCenter"><YdIcon name="i-ri:refresh-line" />刷新</YdButton>
  </YdPageHeader>
  <YdPageMain>
    <div class="grid gap-4">
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div class="rounded-lg border p-4"><span class="text-sm text-muted-foreground">可认领任务</span><strong class="mt-2 block text-2xl">{{ model.claimableTasks.length }}</strong></div>
        <div class="rounded-lg border p-4"><span class="text-sm text-muted-foreground">Minecraft 联动</span><strong class="mt-2 block">{{ model.status?.minecraftReady ? '已启用' : '未启用' }}</strong></div>
        <div class="rounded-lg border p-4"><span class="text-sm text-muted-foreground">邮件通知</span><strong class="mt-2 block">{{ model.status?.mailReady ? '可用' : '未配置' }}</strong></div>
      </div>
      <YdResponsiveEnhancedTable row-key="id" table-root-class="rounded-lg overflow-hidden" table-class="min-w-[820px]" border stripe column-visibility :actions="rowActions" :columns="columns" :data="rows" empty-text="暂无可认领任务">
        <template #cell-project="{ row }">{{ model.projectName(row.original.projectId) }}</template>
        <template #cell-task="{ row }"><div class="grid gap-1"><strong>{{ row.original.title }}</strong><span class="text-sm text-muted-foreground">{{ row.original.description || '暂无说明' }}</span></div></template>
        <template #cell-quota="{ row }">{{ row.original.assigneeUserIds.length }} / {{ row.original.requiredAssigneeCount }}</template>
        <template #cell-dueAt="{ row }">{{ model.formatTime(row.original.dueAt) }}</template>
      </YdResponsiveEnhancedTable>
      <YdPagination v-model:page="pagination.page" v-model:size="pagination.size" :total="model.claimableTasks.length" class="mt-3" />
    </div>
  </YdPageMain>
</template>
