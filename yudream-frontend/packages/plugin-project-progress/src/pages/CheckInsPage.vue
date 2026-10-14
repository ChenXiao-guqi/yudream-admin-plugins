<script setup lang="ts">
import type { TableColumn } from '@yudream/components'
import type { ProjectProgressModel } from '../composables/useProjectProgress'
import type { ProjectCheckIn } from '../types'
import { YdButton, YdCard, YdFileUpload, YdInput, YdPagination, YdRadioGroup, YdResponsiveTable, YdSelect, YdTag, YdTextarea, useYdModal } from '@yudream/components'
import { computed, reactive, watch } from 'vue'

const props = defineProps<{ model: ProjectProgressModel }>()
const pagination = reactive({ page: 1, size: 10 })
const modal = useYdModal()
const projectOptions = computed(() => props.model.projects.map(project => ({ label: project.name, value: project.id })))
const manualTypeOptions = computed(() => {
  const allowed = props.model.selectedProject?.allowedCheckInTypes || []
  return [
    { label: '图片', value: 'IMAGE' },
    { label: '文件', value: 'FILE' },
    { label: '定位', value: 'LOCATION' },
  ].filter(item => allowed.includes(item.value))
})
const pagedRows = computed(() => props.model.checkIns.slice((pagination.page - 1) * pagination.size, pagination.page * pagination.size))
const columns: TableColumn<ProjectCheckIn>[] = [
  { id: 'user', header: '打卡人', width: 170, fixed: 'left' },
  { id: 'type', header: '类型', width: 130 },
  { id: 'summary', header: '说明', width: 420 },
  { id: 'createdAt', header: '时间', width: 180 },
]

columns.push(
  { id: 'reviewStatus', header: '审核状态', width: 120 },
  { id: 'operation', header: '操作', width: 180, fixed: 'right', align: 'center' },
)

watch(manualTypeOptions, (options) => {
  if (options.length && !options.some(item => item.value === props.model.checkInForm.type)) props.model.checkInForm.type = options[0].value
}, { immediate: true })
watch(() => props.model.checkIns.length, total => { pagination.page = Math.min(pagination.page, Math.max(1, Math.ceil(total / pagination.size))) })
watch(() => pagination.size, () => { pagination.page = 1 })

async function selectProject(projectId: unknown) {
  pagination.page = 1
  await props.model.selectProjectById(String(projectId || ''))
}

function typeLabel(value: string) {
  return { IMAGE: '图片', FILE: '文件', LOCATION: '定位', MINECRAFT_ONLINE: 'MC 在线时长' }[value] || value
}

function fileNames(files: ProjectCheckIn['files']) { return files.map(file => file.filename).join('、') }
function localUploadRequest() { return Promise.resolve({}) }
function reviewLabel(value: string) { return value === 'REJECTED' ? '已驳回' : '已通过' }
function confirmReject(record: ProjectCheckIn) { modal.confirm({ title: '驳回打卡', content: '确认驳回这条打卡记录吗？', onConfirm: () => props.model.rejectCheckIn(record) }) }
function confirmDelete(record: ProjectCheckIn) { modal.confirm({ title: '删除打卡', content: '删除后无法恢复，确认删除这条打卡记录吗？', onConfirm: () => props.model.deleteCheckIn(record) }) }
</script>

<template>
  <section class="pp-page">
    <section class="pp-toolbar">
      <div><span>进度打卡</span><h2>项目打卡</h2></div>
      <div class="pp-actions">
        <YdSelect :model-value="model.selectedProjectId" :options="projectOptions" placeholder="选择项目" class="pp-project-select" @update:model-value="selectProject" />
        <YdButton variant="outline" :loading="model.loading" @click="model.load">刷新</YdButton>
        <YdButton variant="outline" :disabled="!model.checkIns.length" @click="model.exportCheckIns">导出</YdButton>
      </div>
    </section>

    <section class="pp-grid">
      <section class="pp-panel">
        <header class="pp-panel-head"><div><h3>提交打卡</h3><span>{{ model.selectedProject?.name || '请选择项目' }}</span></div></header>
        <div class="pp-form">
          <label><span>打卡类型</span><YdRadioGroup v-model="model.checkInForm.type" :options="manualTypeOptions" :disabled="!model.selectedProjectId" class="pp-radio-grid" /></label>
          <div v-if="model.selectedProjectId && !manualTypeOptions.length" class="pp-empty">该项目未开放手动打卡</div>
          <label><span>说明</span><YdTextarea v-model="model.checkInForm.summary" class="w-full" /></label>
          <label v-if="model.checkInForm.type !== 'LOCATION'"><span>上传证明</span><YdFileUpload v-model="model.evidenceFiles" :max="1" :http-request="localUploadRequest" description="拖放或点击选择打卡证明" /></label>
          <template v-if="model.checkInForm.type === 'LOCATION'">
            <label><span>地址</span><YdInput v-model="model.checkInForm.address" class="w-full" placeholder="定位后可补充地点说明" /></label>
            <div class="pp-actions"><YdButton variant="outline" :loading="model.saving" @click="model.useCurrentLocation">获取当前位置</YdButton><span class="pp-muted">{{ model.checkInForm.latitude && model.checkInForm.longitude ? `${model.checkInForm.latitude}, ${model.checkInForm.longitude}` : '尚未获取定位' }}</span></div>
          </template>
          <div class="pp-actions"><YdButton :loading="model.saving" :disabled="!model.selectedProjectId || !manualTypeOptions.length" @click="model.submitCheckIn">提交打卡</YdButton><YdButton variant="outline" :disabled="!model.canProjectMinecraftCheckIn() || model.saving" @click="model.minecraftCheckIn()">MC 在线时长打卡</YdButton></div>
        </div>
      </section>

      <section class="pp-panel">
        <header class="pp-panel-head"><div><h3>项目打卡记录</h3><span>{{ model.checkIns.length }} 条记录</span></div></header>
        <YdResponsiveTable row-key="id" table-root-class="max-w-full overflow-x-auto rounded-lg" table-class="min-w-[900px]" border stripe column-visibility :columns="columns" :data="pagedRows" empty-text="暂无打卡记录">
          <template #cell-user="{ row }">{{ model.userLabel(model.usersById[row.original.userId]) }}</template>
          <template #cell-type="{ row }"><YdTag variant="secondary">{{ typeLabel(row.original.type) }}</YdTag></template>
          <template #cell-summary="{ row }"><strong>{{ row.original.summary || '无说明' }}</strong><div v-if="row.original.location" class="pp-table-sub">{{ row.original.location.address }}</div><div v-if="row.original.minecraft" class="pp-table-sub">{{ model.serverLabel(row.original.minecraft.serverId) }} · {{ model.minecraftScopeLabel(row.original.minecraft) }} · 有效在线 {{ model.minutes(row.original.minecraft.effectiveOnlineMillis) }}<template v-if="model.minecraftWindowLabel(row.original.minecraft)"> · 统计自 {{ model.minecraftWindowLabel(row.original.minecraft) }}</template></div><div v-if="model.minecraftSubServerSummary(row.original.minecraft)" class="pp-table-sub">子服累计 {{ model.minecraftSubServerSummary(row.original.minecraft) }}</div><div v-if="row.original.files.length" class="pp-table-sub">{{ fileNames(row.original.files) }}</div></template>
          <template #cell-createdAt="{ row }">{{ model.formatTime(row.original.createdAt) }}</template>
          <template #cell-reviewStatus="{ row }"><YdTag :variant="row.original.reviewStatus === 'REJECTED' ? 'destructive' : 'secondary'">{{ reviewLabel(row.original.reviewStatus) }}</YdTag></template>
          <template #cell-operation="{ row }"><div class="flex-center gap-2"><YdButton v-if="row.original.reviewStatus !== 'REJECTED'" size="sm" variant="outline" @click="confirmReject(row.original)">驳回</YdButton><YdButton size="sm" variant="destructive" @click="confirmDelete(row.original)">删除</YdButton></div></template>
          <template #card="{ row }">
            <YdCard class="w-full">
              <div class="flex flex-col gap-3">
                <div class="flex items-center justify-between gap-2">
                  <span class="min-w-0 break-words text-base font-semibold">{{ model.userLabel(model.usersById[row.userId]) }}</span>
                  <div class="flex gap-1">
                    <YdTag variant="secondary">{{ typeLabel(row.type) }}</YdTag>
                    <YdTag :variant="row.reviewStatus === 'REJECTED' ? 'destructive' : 'secondary'">{{ reviewLabel(row.reviewStatus) }}</YdTag>
                  </div>
                </div>
                <div class="flex flex-col gap-1 text-sm">
                  <div class="flex gap-2"><span class="shrink-0 text-secondary-foreground/60">说明</span><span class="break-all">{{ row.summary || '无说明' }}</span></div>
                  <div v-if="row.location" class="flex gap-2"><span class="shrink-0 text-secondary-foreground/60">位置</span><span class="break-all">{{ row.location.address }}</span></div>
                  <div v-if="row.minecraft" class="flex gap-2"><span class="shrink-0 text-secondary-foreground/60">MC 在线</span><span class="break-all">{{ model.serverLabel(row.minecraft.serverId) }} · {{ model.minecraftScopeLabel(row.minecraft) }} · 有效在线 {{ model.minutes(row.minecraft.effectiveOnlineMillis) }}<template v-if="model.minecraftWindowLabel(row.minecraft)"> · 统计自 {{ model.minecraftWindowLabel(row.minecraft) }}</template></span></div>
                  <div v-if="model.minecraftSubServerSummary(row.minecraft)" class="flex gap-2"><span class="shrink-0 text-secondary-foreground/60">MC 子服累计</span><span class="break-all">{{ model.minecraftSubServerSummary(row.minecraft) }}</span></div>
                  <div class="flex gap-2"><span class="shrink-0 text-secondary-foreground/60">时间</span><span class="break-all">{{ model.formatTime(row.createdAt) }}</span></div>
                </div>
                <div class="flex flex-wrap gap-2 border-t pt-3">
                  <YdButton v-if="row.reviewStatus !== 'REJECTED'" size="sm" variant="outline" @click="confirmReject(row)">驳回</YdButton>
                  <YdButton size="sm" variant="destructive" @click="confirmDelete(row)">删除</YdButton>
                </div>
              </div>
            </YdCard>
          </template>
        </YdResponsiveTable>
        <YdPagination v-model:page="pagination.page" v-model:size="pagination.size" :total="model.checkIns.length" class="mt-3" />
      </section>
    </section>
  </section>
</template>
