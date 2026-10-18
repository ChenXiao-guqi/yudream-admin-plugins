<script setup lang="ts">
import type { ActionMenuItem, SearchConfig, SearchFieldConfig, SearchOptionsSource, StatusColumn, TableColumn, YdTablePageAction } from '@yudream/components'
import type { WordlePluginModel } from '../composables/useWordlePlugin'
import type { WordEntryView } from '../types'
import { computed, ref } from 'vue'
import { YdButton, YdDynamicSearchForm, YdForm, YdFormItem, YdInput, YdLoadingOverlay, YdModal, YdPagination, YdResponsiveEnhancedTable, YdSelect, YdSwitch, YdTablePageLayout, YdTextarea, useYdModal } from '@yudream/components'

const props = defineProps<{ model: WordlePluginModel }>()
const confirm = useYdModal()
const modalVisible = ref(false)
const modalTitle = computed(() => props.model.editingWord ? '编辑词条' : '新建词条')
const modeOptions = [
  { label: '全部模式', value: '' },
  { label: '英文单词', value: 'ENGLISH' },
  { label: '四字成语', value: 'IDIOM' },
]
const createModeOptions = modeOptions.slice(1)

/** ControlType 是 components 内部的字符串枚举，桥接层只出类型，这里用字面量收敛一次 */
type SearchFieldInput = Partial<Omit<SearchFieldConfig, 'controlType'>> & Pick<SearchFieldConfig, 'fieldName' | 'label'> & { controlType?: 'TEXT' | 'SELECT' | 'DATE_RANGE' | 'NUMBER_RANGE' | 'CHECKBOX' | 'RADIO' }

function searchField(config: SearchFieldInput): SearchFieldConfig {
  const { controlType = 'TEXT', order = 0, showWhenFolded = false, width = '200px', ...rest } = config
  return { ...rest, fieldName: config.fieldName, label: config.label, controlType: controlType as SearchFieldConfig['controlType'], order, showWhenFolded, width }
}

const searchQuery = ref<Record<string, any>>({
  keyword: props.model.wordFilters.keyword ?? '',
  mode: props.model.wordFilters.mode ?? '',
})

const searchConfig: SearchConfig = {
  fields: [
    searchField({ fieldName: 'keyword', label: '词语', placeholder: '搜索词语', order: 1, showWhenFolded: true, width: '220px' }),
    searchField({ fieldName: 'mode', label: '模式', controlType: 'SELECT', order: 2, width: '180px' }),
  ],
}

const optionsSources: SearchOptionsSource[] = [
  { id: 'modeOptions', loader: () => modeOptions },
]

function applySearch() {
  props.model.wordFilters.keyword = String(searchQuery.value.keyword ?? '')
  props.model.wordFilters.mode = String(searchQuery.value.mode ?? '')
  props.model.applyWordFilters()
}

const columns: TableColumn<WordEntryView>[] = [
  { id: 'word', header: '词语', minWidth: 180 },
  { id: 'mode', header: '模式', width: 110 },
  { id: 'length', header: '词长', width: 80 },
  { id: 'hint', header: '提示', minWidth: 200 },
  { accessorKey: 'createdAt', header: '创建时间', width: 180, defaultHidden: true },
]

/** 词条状态：语义色胶囊 */
const wordStatusColumn: StatusColumn<WordEntryView> = {
  statusKey: 'enabled',
  header: '状态',
  width: 100,
  statusMap: {
    'true': { label: '启用中', variant: 'default', tone: 'success' },
    'false': { label: '已停用', variant: 'secondary', tone: 'neutral' },
  },
}

/** 行操作统一收进操作菜单，删除保持确认流程 */
const rowActions: ActionMenuItem<WordEntryView>[] = [
  { label: '编辑', icon: 'morph:pencil', onClick: row => openEdit(row) },
  { label: row => (row.enabled ? '停用' : '启用'), icon: 'morph:power', onClick: row => props.model.toggleWord(row) },
  { label: '删除', icon: 'morph:trash-2', danger: true, onClick: row => confirmDelete(row) },
]

const pageActions: YdTablePageAction[] = [
  { label: '新建词条', icon: 'morph:plus', onClick: openCreate },
]

function openCreate() {
  props.model.newWord()
  modalVisible.value = true
}

function openEdit(entry: WordEntryView) {
  props.model.editWord(entry)
  modalVisible.value = true
}

async function saveWord() {
  if (await props.model.saveWord()) {
    modalVisible.value = false
  }
}

function confirmDelete(entry: WordEntryView) {
  confirm.confirm({ title: '删除词条', content: `确认删除词条“${entry.word}”吗？删除后不会再进入答案池。`, onConfirm: () => props.model.removeWord(entry) })
}
</script>

<template>
  <YdTablePageLayout title="词条管理" :actions="pageActions">
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
      <YdLoadingOverlay :loading="model.loading">
        <YdResponsiveEnhancedTable
          row-key="id"
          table-root-class="rounded-lg overflow-hidden"
          table-class="min-w-[860px]"
          border
          stripe
          column-visibility
          :status-column="wordStatusColumn"
          :actions="rowActions"
          :columns="columns"
          :data="model.words"
          empty-text="暂无自定义词条"
        >
          <template #cell-word="{ row }"><strong>{{ row.original.word }}</strong></template>
          <template #cell-mode="{ row }">{{ row.original.modeLabel }}</template>
          <template #cell-length="{ row }">{{ row.original.length }}</template>
          <template #cell-hint="{ row }">{{ row.original.hint || '-' }}</template>
          <template #cell-createdAt="{ row }">{{ model.formatTime(row.original.createdAt) }}</template>
        </YdResponsiveEnhancedTable>
      </YdLoadingOverlay>
    </template>

    <template #footer>
      <YdPagination
        v-model:page="model.wordPager.page"
        v-model:size="model.wordPager.size"
        :total="model.wordPager.total"
        @page-change="model.loadWords"
        @size-change="model.applyWordFilters"
      />
    </template>
  </YdTablePageLayout>

  <YdModal v-model="modalVisible" :title="modalTitle" class="sm:max-w-xl" :show-confirm-button="false" show-cancel-button>
    <YdForm :model="model.wordForm" layout="vertical">
      <div class="flex flex-col gap-4">
        <YdFormItem v-if="!model.editingWord" label="模式" required>
          <YdSelect v-model="model.wordForm.mode" :options="createModeOptions" />
        </YdFormItem>
        <YdFormItem label="词语" required>
          <YdInput v-if="!model.editingWord" v-model="model.wordForm.word" placeholder="英文小写字母或四字成语" />
          <YdInput v-else :model-value="model.wordForm.word" disabled />
        </YdFormItem>
        <YdFormItem label="提示（可选）" extra="开局时展示给玩家的释义提示。">
          <YdTextarea v-model="model.wordForm.hint" placeholder="开局时展示给玩家的释义提示" />
        </YdFormItem>
        <YdFormItem v-if="model.editingWord" label="启用状态">
          <YdSwitch v-model="model.wordForm.enabled" />
        </YdFormItem>
        <p class="text-sm text-muted-foreground">
          英文单词词长 3-10 个字母；成语固定为 4 个汉字。内置词库无需在这里维护。
        </p>
      </div>
    </YdForm>
    <template #footer>
      <YdButton variant="outline" @click="modalVisible = false">
        取消
      </YdButton>
      <YdButton :loading="model.saving" @click="saveWord">
        保存词条
      </YdButton>
    </template>
  </YdModal>
</template>
