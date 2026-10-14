<script setup lang="ts">
import { YdLoadingOverlay } from '@yudream/components'
import type { TableColumn } from '@yudream/components'
import type { MaterialPluginModel } from '../composables/useMaterialPlugin'
import type { MaterialItemView, MaterialSummary, PreviewInfo } from '../types'
import { YdButton, YdDrawer, YdIcon, YdInput, YdModal, YdPageHeader, YdPageMain, YdPagination, YdSearchBar, YdSelect, YdResponsiveTable, YdCheckbox, YdTag, useYdModal } from '@yudream/components'
import { onMounted, ref, watch } from 'vue'
import CategoryPicker from '../components/CategoryPicker.vue'
import EditMaterialModal from '../components/EditMaterialModal.vue'
import MaterialItemManager from '../components/MaterialItemManager.vue'
import NewVersionModal from '../components/NewVersionModal.vue'
import PreviewFrame from '../components/PreviewFrame.vue'
import ShareModal from '../components/ShareModal.vue'
import TagPicker from '../components/TagPicker.vue'
import { formatSize, formatTime, isBundle, MATERIAL_TYPES } from '../types'

const props = defineProps<{ model: MaterialPluginModel }>()
const model = props.model
const confirm = useYdModal()

const previewOpen = ref(false)
const previewInfo = ref<PreviewInfo | null>(null)
const previewTarget = ref<MaterialSummary | null>(null)
const previewing = ref(false)

// 行操作：编辑元数据 / 代传新版本 / 代管分享
const saving = ref(false)
const editOpen = ref(false)
const editTarget = ref<MaterialSummary | null>(null)
const newVersionOpen = ref(false)
const newVersionTarget = ref<MaterialSummary | null>(null)
const shareOpen = ref(false)
const shareTarget = ref<MaterialSummary | null>(null)

// 子物料抽屉：管理员对任意用户的物料增删改子物料并独立管理各子物料版本（走 /admin 代操作接口）
const itemsOpen = ref(false)
const itemsTarget = ref<MaterialSummary | null>(null)
const itemsActiveId = ref('')
const itemPreviewOpen = ref(false)
const itemPreviewLabel = ref('')

// 批量选择由 YdResponsiveTable 在桌面表格与窄屏卡片间共享。
const selectedRows = ref<MaterialSummary[]>([])
const rowSelection = ref<Record<string, boolean>>({})
const batchCategoryOpen = ref(false)
const batchCategoryId = ref('')
const batchTagsOpen = ref(false)
const batchTags = ref<string[]>([])
const batchTagMode = ref<'APPEND' | 'REPLACE'>('APPEND')
const batchSaving = ref(false)

const statusOptions = [
  { label: '全部状态', value: '' },
  { label: '正常使用', value: 'ACTIVE' },
  { label: '已归档', value: 'ARCHIVED' },
]

const batchTagModeOptions = [
  { label: '追加（与原有标签合并去重）', value: 'APPEND' },
  { label: '覆盖（替换为所选标签）', value: 'REPLACE' },
]

const columns: TableColumn<MaterialSummary>[] = [
  { type: 'selection', fixed: 'left', width: 46 },
  { accessorKey: 'name', header: '名称', minWidth: 180, fixed: 'left' },
  { id: 'type', header: '类型', width: 100 },
  { id: 'owner', header: '归属用户', width: 120 },
  { accessorKey: 'categoryName', header: '分类', width: 100 },
  { id: 'size', header: '大小', width: 100 },
  { id: 'version', header: '版本', width: 90 },
  { id: 'status', header: '状态', width: 90 },
  { accessorKey: 'updatedAt', header: '更新时间', width: 170 },
  { id: 'operation', header: '操作', width: 500 },
]

/** 翻页/筛选/刷新后行对象重建，勾选项按 id 修剪，避免对已不在当前页的行批量操作 */
watch(() => model.adminList, (list) => {
  if (!selectedRows.value.length) {
    return
  }
  const ids = new Set(list.map(item => item.id))
  selectedRows.value = selectedRows.value.filter(item => ids.has(item.id))
  rowSelection.value = Object.fromEntries(Object.entries(rowSelection.value).filter(([id, selected]) => selected && ids.has(id)))
})

function onSelectionChange(rows: MaterialSummary[]) {
  selectedRows.value = rows
}

async function openPreview(row: MaterialSummary) {
  previewTarget.value = row
  previewInfo.value = null
  previewOpen.value = true
  previewing.value = true
  previewInfo.value = await model.adminPreview(row)
  previewing.value = false
}

function openEdit(row: MaterialSummary) {
  editTarget.value = row
  void model.loadAdminDepartments()
  editOpen.value = true
}

async function submitEdit(payload: { materialId: string, name: string, categoryId: string, tags: string[], visibility: string, deptIds: string[] }) {
  saving.value = true
  try {
    await model.adminEditMaterial(payload.materialId, {
      name: payload.name,
      categoryId: payload.categoryId || null,
      tags: payload.tags,
      visibility: payload.visibility || undefined,
      deptIds: payload.deptIds,
    })
    editOpen.value = false
    await model.loadAdmin()
  }
  finally {
    saving.value = false
  }
}

function openNewVersion(row: MaterialSummary) {
  newVersionTarget.value = row
  newVersionOpen.value = true
}

async function submitNewVersion(payload: { fileId: string, filename: string, note: string }) {
  if (!newVersionTarget.value) {
    return
  }
  saving.value = true
  try {
    await model.adminUploadNewVersion(newVersionTarget.value.id, payload.fileId, payload.filename, payload.note, false)
    newVersionOpen.value = false
  }
  finally {
    saving.value = false
  }
}

function openShare(row: MaterialSummary) {
  shareTarget.value = row
  shareOpen.value = true
}

/** 打开子物料抽屉：立即拉取该物料的子物料列表（管理端可见任意用户物料的子物料）。 */
function openItems(row: MaterialSummary) {
  itemsTarget.value = row
  itemsActiveId.value = ''
  itemsOpen.value = true
  void model.loadItems(row.id, true)
}

/**
 * 抽屉内的子物料预览：复用插件的登录态预览端点（管理端走 /admin），
 * 以 model.preview 为数据源；层级设在抽屉之上，避免被抽屉遮住。
 */
function previewItem(payload: { item: MaterialItemView, version: number }) {
  if (!itemsTarget.value) {
    return
  }
  itemPreviewLabel.value = `${payload.item.name} · v${payload.version}`
  itemPreviewOpen.value = true
  void model.loadItemPreview(itemsTarget.value.id, payload.item.id, payload.version, true)
}

/** 组合物料没有主文件，主文件预览/下载/新版本对它无意义，只在有主文件时开放。 */
function hasMainFile(row: MaterialSummary) {
  return !isBundle(row)
}

function confirmArchive(row: MaterialSummary) {
  confirm.confirm({
    title: '归档物料',
    content: `归档后「${row.name}」将从用户物料库默认列表隐藏，但文件与历史版本保留。`,
    onConfirm: () => model.adminSetStatus(row, 'ARCHIVED'),
  })
}

function confirmDelete(row: MaterialSummary) {
  const scope = hasMainFile(row)
    ? `全部 ${row.currentVersion} 个版本与文件都会删除`
    : `其全部 ${row.itemCount} 个子物料（含各自的版本与文件）都会删除`
  confirm.confirm({
    title: '删除物料',
    content: `确认删除用户 ${row.ownerName || row.ownerId} 的「${row.name}」吗？${scope}，不可恢复。`,
    onConfirm: () => model.adminRemove(row),
  })
}

// ---------- 批量操作 ----------

function selectedIds() {
  return selectedRows.value.map(item => item.id)
}

function openBatchCategory() {
  batchCategoryId.value = ''
  batchCategoryOpen.value = true
}

async function submitBatchCategory() {
  batchSaving.value = true
  try {
    await model.adminBatchCategory(selectedIds(), batchCategoryId.value)
    batchCategoryOpen.value = false
    selectedRows.value = []
    rowSelection.value = {}
  }
  finally {
    batchSaving.value = false
  }
}

function openBatchTags() {
  batchTags.value = []
  batchTagMode.value = 'APPEND'
  batchTagsOpen.value = true
}

async function submitBatchTags() {
  batchSaving.value = true
  try {
    await model.adminBatchTags(selectedIds(), batchTags.value, batchTagMode.value)
    batchTagsOpen.value = false
    selectedRows.value = []
  }
  finally {
    batchSaving.value = false
  }
}

async function batchSetStatus(status: 'ACTIVE' | 'ARCHIVED') {
  await model.adminBatchStatus(selectedIds(), status)
  selectedRows.value = []
}

function confirmBatchDelete() {
  const count = selectedRows.value.length
  confirm.confirm({
    title: '批量删除物料',
    content: `确认删除勾选的 ${count} 个物料吗？全部版本与文件都会删除，不可恢复。`,
    onConfirm: async () => {
      await model.adminBatchDelete(selectedIds())
      selectedRows.value = []
    },
  })
}

onMounted(() => {
  void model.loadCategories()
  void model.loadAdmin()
  void model.loadAdminDepartments()
})
</script>

<template>
  <YdPageHeader title="物料管理" description="跨用户查看全部物料，支持编辑、代传新版本、分享、归档/恢复、删除与批量操作" />
  <YdPageMain>
    <!-- YdResponsiveTable 的事件会落到包装 div 上无法透传（selectionChange 收不到），需要勾选事件的表格直接用 FaTable -->
    <YdLoadingOverlay :loading="model.loading"><YdResponsiveTable v-model:row-selection="rowSelection"

      :columns="columns"
      :data="model.adminList"
      row-key="id"
      selectable
      multiple
      table-root-class="max-w-full overflow-x-auto rounded-lg"
      table-class="min-w-[1400px]"
      border stripe column-visibility
      empty-text="暂无物料"
      @selection-change="onSelectionChange"
    >
      <template #toolbar>
        <YdSearchBar class="w-full">
          <div class="material-filter-bar">
            <YdInput v-model="model.adminFilters.keyword" placeholder="搜索名称或标签" clearable @keydown.enter="model.applyAdminFilters" @clear="model.applyAdminFilters" />
            <YdInput v-model="model.adminFilters.owner" placeholder="归属用户（昵称或 ID）" clearable @keydown.enter="model.applyAdminFilters" @clear="model.applyAdminFilters" />
            <YdSelect v-model="model.adminFilters.type" :options="MATERIAL_TYPES" @change="model.applyAdminFilters" />
            <CategoryPicker v-model="model.adminFilters.categoryId" :categories="model.categories" placeholder="全部分类" @update:model-value="model.applyAdminFilters" />
            <YdSelect v-model="model.adminFilters.status" :options="statusOptions" @change="model.applyAdminFilters" />
            <YdButton variant="outline" @click="model.applyAdminFilters"><YdIcon name="i-ri:search-line" />查询</YdButton>
          </div>
        </YdSearchBar>
        <div v-if="selectedRows.length" class="mt-2 flex flex-wrap items-center gap-2">
          <span class="text-sm text-secondary-foreground/70">已选 {{ selectedRows.length }} 项</span>
          <YdButton size="sm" variant="outline" @click="openBatchCategory"><YdIcon name="i-ri:folder-transfer-line" />移动分组</YdButton>
          <YdButton size="sm" variant="outline" @click="openBatchTags"><YdIcon name="i-ri:price-tag-3-line" />打标签</YdButton>
          <YdButton size="sm" variant="outline" @click="batchSetStatus('ARCHIVED')">批量归档</YdButton>
          <YdButton size="sm" variant="outline" @click="batchSetStatus('ACTIVE')">批量恢复</YdButton>
          <YdButton size="sm" variant="destructive" @click="confirmBatchDelete">批量删除</YdButton>
        </div>
      </template>
      <template #cell-name="{ row }">
        <div class="flex items-center gap-2">
          <strong>{{ row.original.name }}</strong>
          <YdTag v-if="hasMainFile(row.original)" variant="outline" class="shrink-0">.{{ row.original.ext || '?' }}</YdTag>
          <YdTag v-else variant="secondary" class="shrink-0">组合物料</YdTag>
        </div>
      </template>
      <template #cell-type="{ row }">
        <YdTag variant="secondary">{{ hasMainFile(row.original) ? row.original.typeLabel : '组合物料' }}</YdTag>
      </template>
      <template #cell-owner="{ row }">{{ row.original.ownerName || row.original.ownerId }}</template>
      <template #cell-categoryName="{ row }">{{ row.original.categoryName || '-' }}</template>
      <template #cell-size="{ row }">{{ hasMainFile(row.original) ? formatSize(row.original.size) : '-' }}</template>
      <template #cell-version="{ row }">
        <span v-if="hasMainFile(row.original)">v{{ row.original.currentVersion }}</span>
        <span v-else>{{ row.original.itemCount }} 项</span>
      </template>
      <template #cell-status="{ row }">
        <YdTag :variant="row.original.status === 'ARCHIVED' ? 'outline' : 'default'">{{ row.original.status === 'ARCHIVED' ? '已归档' : '正常' }}</YdTag>
      </template>
      <template #cell-updatedAt="{ row }">{{ formatTime(row.original.updatedAt) }}</template>
      <template #cell-operation="{ row }">
        <div class="flex-center flex-wrap gap-2">
          <YdButton size="sm" variant="outline" @click="openPreview(row.original)"><YdIcon name="i-ri:eye-line" />预览</YdButton>
          <YdButton size="sm" variant="outline" @click="openItems(row.original)"><YdIcon name="i-ri:stack-line" />子物料</YdButton>
          <YdButton size="sm" variant="outline" @click="openEdit(row.original)"><YdIcon name="i-ri:edit-line" />编辑</YdButton>
          <YdButton v-if="hasMainFile(row.original)" size="sm" variant="outline" @click="openNewVersion(row.original)"><YdIcon name="i-ri:upload-cloud-2-line" />新版本</YdButton>
          <YdButton v-if="hasMainFile(row.original)" size="sm" variant="outline" @click="openShare(row.original)"><YdIcon name="i-ri:share-forward-line" />分享</YdButton>
          <YdButton v-if="hasMainFile(row.original)" size="sm" variant="outline" @click="model.adminDownload(row.original)"><YdIcon name="i-ri:download-line" />下载</YdButton>
          <YdButton v-if="row.original.status !== 'ARCHIVED'" size="sm" variant="outline" @click="confirmArchive(row.original)">归档</YdButton>
          <YdButton v-else size="sm" variant="outline" @click="model.adminSetStatus(row.original, 'ACTIVE')">恢复</YdButton>
          <YdButton size="sm" variant="destructive" @click="confirmDelete(row.original)">删除</YdButton>
        </div>
      </template>
      <template #card="{ row, selected, selectDisabled, toggleSelected }">
        <YdCard class="w-full"><div class="flex flex-col gap-3"><div class="flex items-start gap-2"><YdCheckbox :model-value="selected" :disabled="selectDisabled" @change="value => toggleSelected(value === true)" /><strong class="min-w-0 break-words">{{ row.name }}</strong></div><div class="flex flex-wrap items-center gap-2"><YdTag variant="secondary">{{ hasMainFile(row) ? row.typeLabel : '组合物料' }}</YdTag><YdTag :variant="row.status === 'ARCHIVED' ? 'outline' : 'default'">{{ row.status === 'ARCHIVED' ? '已归档' : '正常' }}</YdTag><span>{{ row.ownerName || row.ownerId }}</span></div><div class="grid gap-1 text-sm"><span>分类：{{ row.categoryName || '-' }}</span><span>大小：{{ hasMainFile(row) ? formatSize(row.size) : '-' }}</span><span>版本：{{ hasMainFile(row) ? 'v' + row.currentVersion : row.itemCount + ' 项' }}</span><span>更新时间：{{ formatTime(row.updatedAt) }}</span></div><div class="flex flex-wrap gap-2"><YdButton size="sm" variant="outline" @click="openPreview(row)">预览</YdButton><YdButton size="sm" variant="outline" @click="openItems(row)">子物料</YdButton><YdButton size="sm" variant="outline" @click="openEdit(row)">编辑</YdButton><YdButton v-if="hasMainFile(row)" size="sm" variant="outline" @click="openNewVersion(row)">新版本</YdButton><YdButton v-if="hasMainFile(row)" size="sm" variant="outline" @click="openShare(row)">分享</YdButton><YdButton v-if="hasMainFile(row)" size="sm" variant="outline" @click="model.adminDownload(row)">下载</YdButton><YdButton v-if="row.status !== 'ARCHIVED'" size="sm" variant="outline" @click="confirmArchive(row)">归档</YdButton><YdButton v-else size="sm" variant="outline" @click="model.adminSetStatus(row, 'ACTIVE')">恢复</YdButton><YdButton size="sm" variant="destructive" @click="confirmDelete(row)">删除</YdButton></div></div></YdCard>
      </template>
    </YdResponsiveTable></YdLoadingOverlay>
    <YdPagination
      v-model:page="model.adminPager.page"
      v-model:size="model.adminPager.size"
      :total="model.adminPager.total"
      class="mt-3"
      @page-change="model.loadAdmin"
      @size-change="model.applyAdminFilters"
    />
    <YdModal v-model="previewOpen" :title="previewTarget ? `预览：${previewTarget.name}` : '预览'" maximize :show-confirm-button="false" cancel-button-text="关闭">
      <PreviewFrame
        :sdk="model.sdk"
        :info="previewInfo"
        :loading="previewing"
        :material-type="previewTarget?.type"
        :ext="previewTarget?.ext"
      />
    </YdModal>
    <EditMaterialModal
      v-model="editOpen"
      v-model:target="editTarget"
      :categories="model.categories"
      :tags="model.tags"
      :dept-options="model.adminDeptOptions"
      :create-category="model.quickCreateCategory"
      :saving="saving"
      @submit="submitEdit"
    />
    <NewVersionModal v-model="newVersionOpen" :sdk="model.sdk" :saving="saving" @submit="submitNewVersion" />
    <ShareModal v-model="shareOpen" :material="shareTarget" :model="model" admin />
    <YdDrawer
      v-model="itemsOpen"
      :title="itemsTarget ? `子物料：${itemsTarget.name}` : '子物料'"
      description="代任意用户维护子物料，并分别管理每个子物料的独立版本链"
      side="right"
      :show-confirm-button="false"
      show-cancel-button
      cancel-button-text="关闭"
      content-class="material-items-drawer"
      @closed="itemsTarget = null"
    >
      <template v-if="itemsTarget">
        <MaterialItemManager
          v-model:active-id="itemsActiveId"
          :model="model"
          :material-id="itemsTarget.id"
          :preview-item-id="itemsTarget.previewItemId || ''"
          admin
          @preview="previewItem"
        />
      </template>
    </YdDrawer>
    <YdModal
      v-model="itemPreviewOpen"
      :title="`预览：${itemPreviewLabel}`"
      :z-index="2400"
      maximize
      :show-confirm-button="false"
      show-cancel-button
      cancel-button-text="关闭"
    >
      <PreviewFrame
        :sdk="model.sdk"
        :info="model.preview"
        :loading="model.previewLoading"
      />
    </YdModal>
    <YdModal
      v-model="batchCategoryOpen"
      title="批量移动分组"
      :description="`将勾选的 ${selectedRows.length} 个物料移动到所选分类；不选分类则移出分组`"
      :confirm-button-loading="batchSaving"
      @confirm="submitBatchCategory"
    >
      <CategoryPicker v-model="batchCategoryId" :categories="model.categories" placeholder="选择目标分类（不选为移出分组）" />
    </YdModal>
    <YdModal
      v-model="batchTagsOpen"
      title="批量打标签"
      :description="`对勾选的 ${selectedRows.length} 个物料批量设置标签`"
      :confirm-button-loading="batchSaving"
      :confirm-button-disabled="!batchTags.length"
      @confirm="submitBatchTags"
    >
      <div class="flex flex-col gap-3">
        <label class="flex flex-col gap-1 text-sm">
          <span class="text-secondary-foreground/80">方式</span>
          <YdSelect v-model="batchTagMode" :options="batchTagModeOptions" />
        </label>
        <label class="flex flex-col gap-1 text-sm">
          <span class="text-secondary-foreground/80">标签（最多 8 个）</span>
          <TagPicker v-model="batchTags" :tags="model.tags" />
        </label>
      </div>
    </YdModal>
  </YdPageMain>
</template>
