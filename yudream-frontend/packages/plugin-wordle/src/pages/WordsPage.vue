<script setup lang="ts">
import { YdLoadingOverlay } from '@yudream/components'
import type { TableColumn } from '@yudream/components'
import type { WordlePluginModel } from '../composables/useWordlePlugin'
import type { WordEntryView } from '../types'
import { computed, ref } from 'vue'
import { YdButton, YdCard, YdIcon, YdInput, YdModal, YdPageHeader, YdPageMain, YdPagination, YdSearchBar, YdSelect, YdSwitch, YdResponsiveTable, YdTag, YdTextarea, useYdModal } from '@yudream/components'

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
const columns: TableColumn<WordEntryView>[] = [
  { id: 'word', header: '词语', minWidth: 180, fixed: 'left' },
  { id: 'mode', header: '模式', width: 110 },
  { id: 'length', header: '词长', width: 80 },
  { id: 'hint', header: '提示', minWidth: 200 },
  { id: 'enabled', header: '状态', width: 100 },
  { id: 'createdAt', header: '创建时间', width: 180 },
  { id: 'operation', header: '操作', width: 220, align: 'center', fixed: 'right' },
]

function openCreate() { props.model.newWord(); modalVisible.value = true }
function openEdit(entry: WordEntryView) { props.model.editWord(entry); modalVisible.value = true }
async function saveWord() { if (await props.model.saveWord()) { modalVisible.value = false } }
function confirmDelete(entry: WordEntryView) { confirm.confirm({ title: '删除词条', content: `确认删除词条“${entry.word}”吗？删除后不会再进入答案池。`, onConfirm: () => props.model.removeWord(entry) }) }
</script>

<template>
  <YdPageHeader title="词条管理" class="mb-0">
    <YdButton @click="openCreate"><YdIcon name="i-ri:add-line" />新建词条</YdButton>
  </YdPageHeader>
  <YdPageMain>
    <YdLoadingOverlay :loading="model.loading"><YdResponsiveTable

      :columns="columns"
      :data="model.words"
      row-key="id"
      table-root-class="max-w-full overflow-x-auto rounded-lg"
      table-class="min-w-[1100px]"
      border stripe column-visibility
      empty-text="暂无自定义词条"
    >
      <template #toolbar>
        <YdSearchBar class="w-full">
          <div class="wordle-filter-bar">
            <YdSelect v-model="model.wordFilters.mode" :options="modeOptions" @change="model.applyWordFilters" />
            <YdInput v-model="model.wordFilters.keyword" placeholder="搜索词语" clearable @keyup.enter="model.applyWordFilters" />
            <YdButton variant="outline" @click="model.applyWordFilters"><YdIcon name="i-ri:search-line" />查询</YdButton>
          </div>
        </YdSearchBar>
      </template>
      <template #cell-word="{ row }"><strong>{{ row.original.word }}</strong></template>
      <template #cell-mode="{ row }"><YdTag variant="secondary">{{ row.original.modeLabel }}</YdTag></template>
      <template #cell-length="{ row }">{{ row.original.length }}</template>
      <template #cell-hint="{ row }">{{ row.original.hint || '-' }}</template>
      <template #cell-enabled="{ row }"><YdTag :variant="row.original.enabled ? 'default' : 'secondary'">{{ row.original.enabled ? '启用中' : '已停用' }}</YdTag></template>
      <template #cell-createdAt="{ row }">{{ model.formatTime(row.original.createdAt) }}</template>
      <template #cell-operation="{ row }">
        <div class="wordle-actions">
          <YdButton size="sm" variant="outline" @click="openEdit(row.original)">编辑</YdButton>
          <YdButton size="sm" variant="outline" @click="model.toggleWord(row.original)">{{ row.original.enabled ? '停用' : '启用' }}</YdButton>
          <YdButton size="sm" variant="destructive" @click="confirmDelete(row.original)">删除</YdButton>
        </div>
      </template>
      <template #card="{ row }">
        <YdCard class="w-full">
          <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between gap-2">
              <span class="min-w-0 break-words text-base font-semibold">{{ row.word }}</span>
              <div class="flex gap-1">
                <YdTag variant="secondary">{{ row.modeLabel }}</YdTag>
                <YdTag :variant="row.enabled ? 'default' : 'secondary'">{{ row.enabled ? '启用中' : '已停用' }}</YdTag>
              </div>
            </div>
            <div class="flex flex-col gap-1 text-sm">
              <div class="flex gap-2"><span class="shrink-0 text-secondary-foreground/60">词长</span><span>{{ row.length }}</span></div>
              <div class="flex gap-2"><span class="shrink-0 text-secondary-foreground/60">提示</span><span class="break-all">{{ row.hint || '-' }}</span></div>
              <div class="flex gap-2"><span class="shrink-0 text-secondary-foreground/60">创建时间</span><span>{{ model.formatTime(row.createdAt) }}</span></div>
            </div>
            <div class="flex flex-wrap gap-2 border-t pt-3">
              <YdButton size="sm" variant="outline" @click="openEdit(row)">编辑</YdButton>
              <YdButton size="sm" variant="outline" @click="model.toggleWord(row)">{{ row.enabled ? '停用' : '启用' }}</YdButton>
              <YdButton size="sm" variant="destructive" @click="confirmDelete(row)">删除</YdButton>
            </div>
          </div>
        </YdCard>
      </template>
    </YdResponsiveTable></YdLoadingOverlay>
    <YdPagination v-model:page="model.wordPager.page" v-model:size="model.wordPager.size" :total="model.wordPager.total" class="mt-3" @page-change="model.loadWords" @size-change="model.applyWordFilters" />

    <YdModal v-model="modalVisible" :title="modalTitle" class="sm:max-w-xl" :show-confirm-button="false" show-cancel-button>
      <form class="wordle-form" @submit.prevent>
        <label v-if="!model.editingWord"><span>模式</span><YdSelect v-model="model.wordForm.mode" :options="createModeOptions" /></label>
        <label v-if="!model.editingWord"><span>词语</span><YdInput v-model="model.wordForm.word" placeholder="英文小写字母或四字成语" /></label>
        <label v-else><span>词语</span><YdInput :model-value="model.wordForm.word" disabled /></label>
        <label><span>提示（可选）</span><YdTextarea v-model="model.wordForm.hint" placeholder="开局时展示给玩家的释义提示" /></label>
        <label v-if="model.editingWord"><span>启用状态</span><YdSwitch v-model="model.wordForm.enabled" /></label>
        <p class="wordle-form-help">英文单词词长 3-10 个字母；成语固定为 4 个汉字。内置词库无需在这里维护。</p>
      </form>
      <template #footer><YdButton variant="outline" @click="modalVisible = false">取消</YdButton><YdButton :loading="model.saving" @click="saveWord">保存词条</YdButton></template>
    </YdModal>
  </YdPageMain>
</template>
