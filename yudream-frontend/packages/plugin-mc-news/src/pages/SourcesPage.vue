<script setup lang="ts">
import type { ActionMenuItem, TableColumn, YdTablePageAction } from '@yudream/components'
import type { YuDreamPluginSdk } from '@yudream/plugin-sdk'
import type { NewsSourceView } from '../types'

import { YdIcon, YdLoadingOverlay, YdResponsiveEnhancedTable, YdSwitch, YdTablePageLayout, YdTooltip, useYdModal, useYdToast } from '@yudream/components'
import { onMounted, ref } from 'vue'
import { createMcNewsApi } from '../api/mc-news-api'
import { checkKeywordDraft, describeKeywordDraft, errorMessage, parseKeywordDraft, SOURCE_TYPE_OPTIONS } from '../composables/utils'
import SourceEditorModal from '../components/SourceEditorModal.vue'

const props = defineProps<{ sdk: YuDreamPluginSdk }>()
const api = createMcNewsApi(props.sdk)
const toast = useYdToast()
const confirm = useYdModal()

const loading = ref(false)
const rows = ref<NewsSourceView[]>([])
const editorOpen = ref(false)
const editing = ref<NewsSourceView | null>(null)

function typeLabel(type: string) {
  return SOURCE_TYPE_OPTIONS.find(option => option.value === type)?.label ?? type
}

const columns: TableColumn<NewsSourceView>[] = [
  { accessorKey: 'name', header: '名称', minWidth: 180 },
  { id: 'type', header: '类型', width: 180 },
  { id: 'url', header: '地址', minWidth: 260 },
  { id: 'keywords', header: '关键词', minWidth: 160 },
  { id: 'enabled', header: '启用', width: 80 },
  { accessorKey: 'createdAtLabel', header: '创建时间', width: 150, defaultHidden: true },
]

/** 行操作统一收进操作菜单；内置源不可删除，菜单里直接隐藏 */
const rowActions: ActionMenuItem<NewsSourceView>[] = [
  { label: '测试', icon: 'morph:flask', onClick: row => void test(row) },
  { label: '编辑', icon: 'morph:pencil', onClick: row => openEdit(row) },
  { label: '删除', icon: 'morph:trash-2', danger: true, visible: row => !row.builtin, onClick: row => confirmDelete(row) },
]

const pageActions: YdTablePageAction[] = [
  { label: '新增源', icon: 'morph:plus', onClick: openCreate },
]

async function load() {
  loading.value = true
  try {
    rows.value = await api.sources()
  }
  catch (error) {
    toast.error(errorMessage(error, '加载新闻源失败'))
  }
  finally {
    loading.value = false
  }
}

/** 关键词规则的展示提示：填写有误标红，排除规则标红底（命中即丢弃）。 */
function keywordChipClass(rule: string) {
  const draft = parseKeywordDraft(rule)
  const check = checkKeywordDraft(draft)
  return {
    'mc-news-rule-exclude': check.ok && draft.action === 'exclude',
    'mc-news-rule-invalid': !check.ok,
  }
}

/** 悬停时用大白话说清这条规则做什么，而不是只回显紧凑语法。 */
function keywordChipTitle(rule: string) {
  const draft = parseKeywordDraft(rule)
  const check = checkKeywordDraft(draft)
  if (!check.ok)
    return `规则填写有误：${check.error}`
  return describeKeywordDraft(draft)
}

/**
 * 在线抓取该源验证可用性：不写缓存、不推送。
 * 除收录条数外还回显源原始条数、被排除数与逐条模板命中情况，便于定位「为什么没匹配上」。
 */
async function test(row: NewsSourceView) {
  try {
    const result = await api.testSource(row.id)
    const elapsed = `${(result.elapsedMs / 1000).toFixed(1)}s`
    if (result.invalid?.length) {
      toast.error(`「${row.name}」有 ${result.invalid.length} 条关键词规则填写有误已跳过：${result.invalid[0]}`)
      return
    }
    const detail: string[] = []
    if (result.rejected > 0)
      detail.push(`未命中模板 ${result.rejected} 条`)
    if (result.excluded > 0)
      detail.push(`被排除模板丢弃 ${result.excluded} 条`)
    const suffix = detail.length ? `（源 ${result.beforeFilter} 条：${detail.join('，')}）` : ''
    if (result.count > 0) {
      const zeroHit = (result.rules ?? []).filter(rule => rule.hits === 0)
      const zero = zeroHit.length ? `；${zeroHit.length} 条规则一次都没命中（如「${describeKeywordDraft(parseKeywordDraft(zeroHit[0].rule))}」）` : ''
      toast.success(`「${row.name}」收录 ${result.count} 条${suffix}，用时 ${elapsed}，最新：${result.titles[0]?.title ?? ''}${zero}`)
    }
    else if (result.beforeFilter > 0) {
      toast.warning(`「${row.name}」源返回 ${result.beforeFilter} 条但 0 条收录${suffix}，请检查关键词规则`)
    }
    else {
      toast.warning(`「${row.name}」抓取成功但源返回 0 条内容，请检查源地址`)
    }
  }
  catch (error) {
    toast.error(`「${row.name}」测试失败：${errorMessage(error, '未知错误')}`)
  }
}

function openCreate() {
  editing.value = null
  editorOpen.value = true
}

function openEdit(row: NewsSourceView) {
  editing.value = row
  editorOpen.value = true
}

async function toggleEnabled(row: NewsSourceView, enabled: boolean) {
  try {
    await api.updateSource(row.id, { enabled })
    row.enabled = enabled
    toast.success(enabled ? '已启用' : '已停用')
  }
  catch (error) {
    row.enabled = !enabled
    toast.error(errorMessage(error, '更新失败'))
  }
}

function confirmDelete(row: NewsSourceView) {
  confirm.confirm({
    title: '删除新闻源',
    content: `确认删除「${row.name}」吗？已缓存的历史新闻不受影响。`,
    onConfirm: async () => {
      try {
        await api.deleteSource(row.id)
        toast.success('已删除')
        await load()
      }
      catch (error) {
        toast.error(errorMessage(error, '删除失败'))
      }
    },
  })
}

onMounted(() => {
  void load()
})
</script>

<template>
  <YdTablePageLayout title="新闻源" :show-search="false" :actions="pageActions">
    <template #table>
      <YdLoadingOverlay :loading="loading">
        <YdResponsiveEnhancedTable
          row-key="id"
          table-root-class="rounded-lg overflow-hidden"
          table-class="min-w-[880px]"
          border
          stripe
          column-visibility
          :actions="rowActions"
          :columns="columns"
          :data="rows"
          empty-text="暂无新闻源"
        >
          <template #cell-type="{ row }">
            <span class="yd-status-tone" :data-tone="row.original.type === 'mcnet' ? 'info' : 'neutral'">{{ typeLabel(row.original.type) }}</span>
          </template>
          <template #cell-url="{ row }">
            <span class="mc-news-url" :title="row.original.url">{{ row.original.url }}</span>
          </template>
          <template #cell-keywords="{ row }">
            <div class="mc-news-variables mc-news-variables-readonly">
              <span
                v-for="keyword in row.original.keywords"
                :key="keyword"
                class="mc-news-variable-chip"
                :class="keywordChipClass(keyword)"
                :title="keywordChipTitle(keyword)"
              >{{ keyword }}</span>
              <span v-if="!row.original.keywords.length" class="mc-news-form-hint">不过滤</span>
            </div>
          </template>
          <template #cell-enabled="{ row }">
            <YdTooltip v-if="row.original.builtin" text="内置源可停用，不可删除">
              <YdSwitch :model-value="row.original.enabled" @update:model-value="(value?: boolean) => toggleEnabled(row.original, value === true)" />
            </YdTooltip>
            <YdSwitch v-else :model-value="row.original.enabled" @update:model-value="(value?: boolean) => toggleEnabled(row.original, value === true)" />
          </template>
        </YdResponsiveEnhancedTable>
      </YdLoadingOverlay>
    </template>
  </YdTablePageLayout>

  <SourceEditorModal v-model:open="editorOpen" :sdk="props.sdk" :source="editing" @saved="() => load()" />
</template>
