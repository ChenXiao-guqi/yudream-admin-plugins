<script setup lang="ts">
// yudream-self-chrome 页面自管页头与卡片
import { YdLoadingOverlay, YdPageHeader, YdPageMain } from '@yudream/components'
import type { TableColumn } from '@yudream/components'
import type { ProjectProgressModel } from '../composables/useProjectProgress'
import type { ProjectWorkDetail } from '../types'

import { YdButton, YdCard, YdInput, YdModal, YdNumberField, YdPagination, YdRadioGroup, YdResponsiveTable, YdSelect, YdTag, YdTextarea, useYdModal } from '@yudream/components'
import { computed, reactive, ref, watch } from 'vue'
import EvidenceFileList from '../components/EvidenceFileList.vue'
import PeoplePicker from '../components/PeoplePicker.vue'

const props = defineProps<{ model: ProjectProgressModel }>()
const modalVisible = ref(false)
const confirm = useYdModal()
const pagination = reactive({ page: 1, size: 10 })
const modalTitle = computed(() => props.model.selectedDetailId ? '编辑工作细节' : '新建工作细节')
const projectOptions = computed(() => props.model.projects.map(project => ({ label: project.name, value: project.id })))
const editableStatusOptions = computed(() => props.model.projectStatusOptions.filter((item) => {
  const doneCode = props.model.selectedProject?.doneStatusCode
  return item.code !== doneCode || props.model.selectedDetail?.statusCode === item.code
}).map(item => ({ label: item.label, value: item.code })))
const assignmentOptions = [{ label: '用户认领', value: 'CLAIM' }, { label: '随机分配', value: 'RANDOM' }]
const scopeOptions = computed(() => props.model.detailForm.assignmentMode === 'CLAIM'
  ? [{ label: '所有人可认领', value: 'ALL' }, { label: '仅指定人员可认领', value: 'SELECTED' }]
  : [{ label: '从项目成员中随机', value: 'PROJECT_MEMBERS' }, { label: '从指定人员中随机', value: 'SELECTED' }])
const pagedRows = computed(() => props.model.details.slice((pagination.page - 1) * pagination.size, pagination.page * pagination.size))
const columns: TableColumn<ProjectWorkDetail>[] = [
  { id: 'detail', header: '工作细节', width: 340, fixed: 'left' },
  { id: 'status', header: '状态', width: 160 },
  { id: 'assignment', header: '分配方式', width: 150 },
  { id: 'assignees', header: '负责人', width: 240 },
  { id: 'acceptors', header: '验收人', width: 220 },
  { id: 'published', header: '发布状态', width: 120 },
  { id: 'dueAt', header: '截止时间', width: 170 },
  { id: 'operation', header: '操作', width: 300, align: 'center', fixed: 'right' },
]

watch(() => props.model.details.length, total => { pagination.page = Math.min(pagination.page, Math.max(1, Math.ceil(total / pagination.size))) })
watch(() => pagination.size, () => { pagination.page = 1 })

async function selectProject(projectId: unknown) { pagination.page = 1; await props.model.selectProjectById(String(projectId || '')) }
function createDetail() { props.model.newDetail(); modalVisible.value = true }
function editDetail(detail: ProjectWorkDetail) { props.model.selectDetail(detail); modalVisible.value = true }
async function saveDetail() { await props.model.saveDetail(); modalVisible.value = false }
function changeAssignmentMode(value: unknown) { props.model.detailForm.candidateScope = value === 'CLAIM' ? 'ALL' : 'PROJECT_MEMBERS' }
function confirmDelete(detail: ProjectWorkDetail) {
  confirm.confirm({ title: '删除工作细节', content: `确认删除“${detail.title}”吗？删除后无法恢复。`, onConfirm: () => props.model.deleteDetail(detail) })
}
</script>

<template>

  <YdPageHeader title="工作细节" class="mb-0" />
  <YdPageMain>  <section class="pp-page">
    <section class="pp-toolbar"><div><span>任务拆分</span><h2>工作细节</h2></div><div class="pp-actions"><YdSelect :model-value="model.selectedProjectId" :options="projectOptions" placeholder="选择项目" class="pp-project-select" @update:model-value="selectProject" /><YdButton variant="outline" :loading="model.loading" @click="model.load">刷新</YdButton><YdButton variant="outline" :disabled="!model.details.length" @click="model.exportDetails">导出</YdButton><YdButton :disabled="!model.selectedProjectId" @click="createDetail">新建细节</YdButton></div></section>

    <section class="pp-panel">
      <YdLoadingOverlay :loading="model.loading"><YdResponsiveTable  row-key="id" table-root-class="max-w-full overflow-x-auto rounded-lg" table-class="min-w-[1740px]" border stripe column-visibility :columns="columns" :data="pagedRows" empty-text="暂无工作细节">
        <template #cell-detail="{ row }"><strong>{{ row.original.title }}</strong><div class="pp-table-sub">{{ row.original.description || '暂无说明' }}</div><div v-if="row.original.acceptanceSummary || row.original.acceptanceFiles.length" class="pp-material-box mt-3"><p>{{ row.original.acceptanceSummary || '暂无验收说明' }}</p><EvidenceFileList :model="model" :files="row.original.acceptanceFiles" compact /></div></template>
        <template #cell-status="{ row }"><div class="pp-chip-list"><YdTag variant="secondary">{{ model.detailStatusLabel(row.original) }}</YdTag><YdTag v-if="row.original.pendingAcceptance">待验收</YdTag></div></template>
        <template #cell-assignment="{ row }">{{ model.assignmentLabel(row.original) }}</template>
        <template #cell-assignees="{ row }"><div class="pp-chip-list"><span v-if="!row.original.assigneeUserIds.length" class="pp-muted">未分配</span><YdTag v-for="user in model.userOptionsForIds(row.original.assigneeUserIds)" :key="user.id" variant="secondary">{{ model.userLabel(user) }}</YdTag></div></template>
        <template #cell-acceptors="{ row }"><div class="pp-chip-list"><YdTag v-if="!row.original.acceptorUserIds.length" variant="secondary">项目负责人</YdTag><YdTag v-for="user in model.userOptionsForIds(row.original.acceptorUserIds)" :key="user.id" variant="secondary">{{ model.userLabel(user) }}</YdTag></div></template>
        <template #cell-published="{ row }"><YdTag :variant="row.original.published ? 'default' : 'secondary'">{{ row.original.published ? '已发布' : '草稿' }}</YdTag></template>
        <template #cell-dueAt="{ row }">{{ model.formatTime(row.original.dueAt) }}</template>
        <template #cell-operation="{ row }"><div class="pp-actions"><YdButton size="sm" variant="outline" @click="editDetail(row.original)">编辑</YdButton><YdButton size="sm" variant="outline" :disabled="row.original.published" @click="model.publish(row.original)">发布</YdButton><YdButton v-if="row.original.assignmentMode === 'RANDOM'" size="sm" variant="outline" @click="model.randomAssign(row.original)">随机分配</YdButton><YdButton size="sm" variant="destructive" @click="confirmDelete(row.original)">删除</YdButton></div></template>
        <template #card="{ row }">
          <YdCard class="w-full">
            <div class="flex flex-col gap-3">
              <div class="flex items-center justify-between gap-2">
                <span class="min-w-0 break-words text-base font-semibold">{{ row.title }}</span>
                <div class="flex gap-1">
                  <YdTag variant="secondary">{{ model.detailStatusLabel(row) }}</YdTag>
                  <YdTag v-if="row.pendingAcceptance">待验收</YdTag>
                  <YdTag :variant="row.published ? 'default' : 'secondary'">{{ row.published ? '已发布' : '草稿' }}</YdTag>
                </div>
              </div>
              <div class="flex flex-col gap-1 text-sm">
                <div v-if="row.description" class="flex gap-2"><span class="shrink-0 text-secondary-foreground/60">说明</span><span class="break-all">{{ row.description }}</span></div>
                <div class="flex gap-2"><span class="shrink-0 text-secondary-foreground/60">分配方式</span><span class="break-all">{{ model.assignmentLabel(row) }}</span></div>
                <div class="flex gap-2"><span class="shrink-0 text-secondary-foreground/60">负责人</span><span class="break-all">{{ model.userOptionsForIds(row.assigneeUserIds).map(user => model.userLabel(user)).join('、') || '未分配' }}</span></div>
                <div class="flex gap-2"><span class="shrink-0 text-secondary-foreground/60">截止时间</span><span class="break-all">{{ model.formatTime(row.dueAt) }}</span></div>
              </div>
              <div class="flex flex-wrap gap-2 border-t pt-3">
                <YdButton size="sm" variant="outline" @click="editDetail(row)">编辑</YdButton>
                <YdButton size="sm" variant="outline" :disabled="row.published" @click="model.publish(row)">发布</YdButton>
                <YdButton v-if="row.assignmentMode === 'RANDOM'" size="sm" variant="outline" @click="model.randomAssign(row)">随机分配</YdButton>
                <YdButton size="sm" variant="destructive" @click="confirmDelete(row)">删除</YdButton>
              </div>
            </div>
          </YdCard>
        </template>
      </YdResponsiveTable></YdLoadingOverlay>
      <YdPagination v-model:page="pagination.page" v-model:size="pagination.size" :total="model.details.length" class="mt-3" />
    </section>

    <YdModal v-model="modalVisible" :title="modalTitle" class="max-w-[820px]" :show-confirm-button="false" :show-cancel-button="false">
      <div class="pp-form">
        <label><span>标题</span><YdInput v-model="model.detailForm.title" class="w-full" :disabled="!model.selectedProjectId" /></label>
        <label><span>说明</span><YdTextarea v-model="model.detailForm.description" class="w-full" :disabled="!model.selectedProjectId" /></label>
        <div class="pp-form-grid three">
          <label><span>当前状态</span><YdSelect v-model="model.detailForm.statusCode" :options="editableStatusOptions" class="w-full" :disabled="!model.selectedProjectId" /></label>
          <label><span>需要人数</span><YdNumberField v-model="model.detailForm.requiredAssigneeCount" :min="1" class="w-full" :disabled="!model.selectedProjectId" /></label>
          <label><span>截止时间</span><YdDatePicker v-model="model.detailForm.dueAt" show-time format="YYYY-MM-DD HH:mm:ss" class="pp-date-picker" :disabled="!model.selectedProjectId" /></label>
        </div>
        <label><span>分配方式</span><YdRadioGroup v-model="model.detailForm.assignmentMode" :options="assignmentOptions" class="pp-radio-grid" @change="changeAssignmentMode" /></label>
        <label><span>参与范围</span><YdRadioGroup v-model="model.detailForm.candidateScope" :options="scopeOptions" class="pp-radio-grid" /></label>
        <label v-if="model.detailForm.candidateScope === 'SELECTED'"><span>候选人员</span><PeoplePicker v-model="model.detailForm.candidateUserIds" :model="model" title="选择候选人员" placeholder="选择可参与人员" /></label>
        <label><span>当前负责人</span><div class="pp-chip-list"><span v-if="!model.detailForm.assigneeUserIds.length" class="pp-muted">发布后由认领或随机分配产生</span><YdTag v-for="user in model.userOptionsForIds(model.detailForm.assigneeUserIds)" :key="user.id" variant="secondary">{{ model.userLabel(user) }}</YdTag></div></label>
        <label><span>验收人</span><PeoplePicker v-model="model.detailForm.acceptorUserIds" :model="model" title="选择验收人" placeholder="留空则项目负责人可验收" /></label>
      </div>
      <template #footer><YdButton variant="outline" @click="modalVisible = false">取消</YdButton><YdButton :loading="model.saving" :disabled="!model.selectedProjectId" @click="saveDetail">保存细节</YdButton></template>
    </YdModal>
  </section>
</YdPageMain>
</template>
