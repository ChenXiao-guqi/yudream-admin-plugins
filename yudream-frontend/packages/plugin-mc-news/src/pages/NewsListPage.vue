<script setup lang="ts">
import type { ActionMenuItem, SearchConfig, SearchFieldConfig, SearchOptionsSource, StatusColumn, TableColumn, YdTablePageAction } from '@yudream/components'
import type { YuDreamPluginSdk } from '@yudream/plugin-sdk'
import type { NewsArticleView, NewsSourceView, PollStatusView } from '../types'

import { YdAction, YdButton, YdDynamicSearchForm, YdIcon, YdLoadingOverlay, YdPagination, YdResponsiveEnhancedTable, YdStat, YdStats, YdSwitch, YdTablePageLayout, YdTag, useYdModal, useYdToast } from '@yudream/components'
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { createMcNewsApi } from '../api/mc-news-api'
import ClearNewsModal from '../components/ClearNewsModal.vue'
import PushNewsModal from '../components/PushNewsModal.vue'
import { errorMessage, nextPollText, PUSH_STATE_META } from '../composables/utils'

const props = defineProps<{ sdk: YuDreamPluginSdk }>()
const api = createMcNewsApi(props.sdk)
const toast = useYdToast()
const confirm = useYdModal()

const loading = ref(false)
const pollBusy = ref(false)
const clearOpen = ref(false)
const pushOpen = ref(false)
const pushRow = ref<NewsArticleView | null>(null)
const clearingIgnored = ref(false)
const rows = ref<NewsArticleView[]>([])
const sources = ref<NewsSourceView[]>([])
const pager = reactive({ page: 1, size: 10, total: 0 })
const pollStatus = ref<PollStatusView | null>(null)
const remainSeconds = ref(0)
const ignoredCount = ref(0)
const seenCount = ref(0)
const pendingCount = ref(0)
/** 手动轮询是否推送（默认开）：关闭时本轮只回填列表与重建去重记录 */
const pushOnPoll = ref(true)
/** 轮询进行中时开关与按钮一同禁用 */
const pollDisabled = computed(() => pollBusy.value || (pollStatus.value?.polling ?? false))
/** 列表、去重记录、未送达队列任一非空就允许清空（纯空缓存时按钮置灰） */
const canClear = computed(() => pager.total > 0 || seenCount.value > 0 || pendingCount.value > 0)
let statusTimer: number | undefined

const columns: TableColumn<NewsArticleView>[] = [
  { accessorKey: 'discoveredAtLabel', header: '发现时间', width: 150 },
  { id: 'title', header: '新闻', minWidth: 320 },
  { accessorKey: 'sourceName', header: '来源', width: 170 },
  { accessorKey: 'category', header: '分类', width: 100 },
  { accessorKey: 'pushedAtLabel', header: '推送时间', width: 150, defaultHidden: true },
]

/** 推送状态列：语义色胶囊，长列表里能一眼扫出失败行 */
const pushStatusColumn: StatusColumn<NewsArticleView> = {
  statusKey: 'pushState',
  header: '推送状态',
  width: 100,
  statusMap: {
    pushed: { label: PUSH_STATE_META.pushed.label, variant: 'default', tone: 'success' },
    failed: { label: PUSH_STATE_META.failed.label, variant: 'destructive', tone: 'danger' },
    skipped: { label: PUSH_STATE_META.skipped.label, variant: 'secondary', tone: 'neutral' },
    deduped: { label: PUSH_STATE_META.deduped.label, variant: 'secondary', tone: 'neutral' },
    '': { label: PUSH_STATE_META[''].label, variant: 'default', tone: 'info' },
  },
}

/** 行操作统一收进操作菜单，危险操作保持确认流程 */
const rowActions: ActionMenuItem<NewsArticleView>[] = [
  { label: '推送', icon: 'morph:send', onClick: row => openPush(row) },
  { label: '删除', icon: 'morph:trash-2', danger: true, onClick: row => confirmDelete(row) },
]

/** 页头操作：立即轮询为主操作，清空动态是危险操作且折叠收纳 */
const pageActions = computed<YdTablePageAction[]>(() => [
  { label: '立即轮询', icon: 'morph:refresh', disabled: pollDisabled.value, onClick: () => void triggerPoll() },
  { label: '清空动态', icon: 'morph:delete', variant: 'outline', danger: true, disabled: !canClear.value, autoFold: true, onClick: openClear },
])

/* ------------------------------------------------------------------ *
 * 搜索：本插件后端不走宿主 @Searchable，配置由前端声明（控件契约与宿主一致）
 * ------------------------------------------------------------------ */

/** ControlType 是 components 内部的字符串枚举，桥接层只出类型，这里用字面量收敛一次 */
type SearchFieldInput = Partial<Omit<SearchFieldConfig, 'controlType'>> & Pick<SearchFieldConfig, 'fieldName' | 'label'> & { controlType?: 'TEXT' | 'SELECT' | 'DATE_RANGE' | 'NUMBER_RANGE' | 'CHECKBOX' | 'RADIO' }

function searchField(config: SearchFieldInput): SearchFieldConfig {
  const { controlType = 'TEXT', order = 0, showWhenFolded = false, width = '200px', ...rest } = config
  return { ...rest, fieldName: config.fieldName, label: config.label, controlType: controlType as SearchFieldConfig['controlType'], order, showWhenFolded, width }
}

const searchQuery = ref<Record<string, any>>({ keyword: '', sourceId: '' })

const searchConfig: SearchConfig = {
  fields: [
    searchField({ fieldName: 'keyword', label: '关键词', placeholder: '搜索标题、摘要或 AI 正文', order: 1, showWhenFolded: true, width: '240px' }),
    searchField({ fieldName: 'sourceId', label: '来源', controlType: 'SELECT', order: 2, width: '200px' }),
  ],
}

const sourceOptions = ref<{ label: string, value: string }[]>([])
const optionsSources: SearchOptionsSource[] = [
  { id: 'sourceOptions', loader: () => sourceOptions.value },
]

async function load() {
  loading.value = true
  try {
    const page = await api.news(pager.page, pager.size, String(searchQuery.value.sourceId ?? ''), String(searchQuery.value.keyword ?? ''))
    rows.value = page.records ?? []
    pager.total = Number(page.total ?? 0)
    ignoredCount.value = Number(page.ignored ?? 0)
    seenCount.value = Number(page.seen ?? 0)
    pendingCount.value = Number(page.pending ?? 0)
  }
  catch (error) {
    toast.error(errorMessage(error, '加载新闻动态失败'))
  }
  finally {
    loading.value = false
  }
}

async function loadSources() {
  try {
    sources.value = await api.sources()
    sourceOptions.value = [{ label: '全部来源', value: '' }, ...sources.value.map(item => ({ label: item.name, value: item.id }))]
  }
  catch (error) {
    toast.error(errorMessage(error, '加载新闻源失败'))
  }
}

async function loadPollStatus() {
  try {
    pollStatus.value = await api.pollStatus()
    remainSeconds.value = pollStatus.value.nextPollInSeconds > 0 ? pollStatus.value.nextPollInSeconds : 0
  }
  catch {
    // 状态条加载失败不打断主列表
  }
}

/** 每 30 秒本地递减倒计时；到点后重取状态（轮询应已发生）。 */
function startStatusTimer() {
  statusTimer = window.setInterval(() => {
    if (remainSeconds.value > 0) {
      remainSeconds.value = Math.max(0, remainSeconds.value - 30)
      return
    }
    void loadPollStatus()
  }, 30000)
}

function applyFilters() {
  pager.page = 1
  void load()
}

function resetFilters() {
  searchQuery.value = { keyword: '', sourceId: '' }
  applyFilters()
}

function onPageChange() {
  void load()
}

function onSizeChange() {
  pager.page = 1
  void load()
}

/** 删除后重载当前页；页被删空时回退一页，避免停留在空页。 */
async function reloadAfterDelete() {
  if (!rows.value.length && pager.page > 1) {
    pager.page -= 1
  }
  await load()
}

function confirmDelete(row: NewsArticleView) {
  confirm.confirm({
    title: '删除新闻',
    content: `确认从动态中删除「${row.title}」吗？已推送的消息不受影响；删除后该新闻不会再推送，也不会因下轮轮询重新出现。`,
    onConfirm: async () => {
      try {
        await api.deleteNews(row.id)
        toast.success('已删除')
        await reloadAfterDelete()
      }
      catch (error) {
        toast.error(errorMessage(error, '删除失败'))
      }
    },
  })
}

/** 清空动态改为弹窗：两个可选项（是否清空轮询缓存、下次轮询是否推送）默认均为否。 */
function openClear() {
  clearOpen.value = true
}

async function onCleared() {
  pager.page = 1
  await load()
}

/** 手动推送单条动态：弹窗内可选是否同时发给私信订阅用户（默认否）。 */
function openPush(row: NewsArticleView) {
  pushRow.value = row
  pushOpen.value = true
}

async function onPushed() {
  await load()
}

function confirmClearIgnored() {
  confirm.confirm({
    title: '清空忽略名单',
    content: `忽略名单中有 ${ignoredCount.value} 条被删除过的新闻，确认清空吗？清空后它们会重新参与下轮轮询：去重记录中对应的指纹会被移除，因此会作为新内容再推送一次。`,
    onConfirm: async () => {
      clearingIgnored.value = true
      try {
        const result = await api.clearNewsTombstones()
        toast.success(`已清空 ${result.cleared} 条忽略名单`)
        await load()
      }
      catch (error) {
        toast.error(errorMessage(error, '清空忽略名单失败'))
      }
      finally {
        clearingIgnored.value = false
      }
    },
  })
}

async function triggerPoll() {
  pollBusy.value = true
  try {
    await api.triggerPoll(pushOnPoll.value)
    toast.success(pushOnPoll.value
      ? '已触发手动轮询并推送，稍后可在推送记录中查看结果'
      : '已触发手动轮询（本次不推送），新内容只回填列表')
    setTimeout(() => {
      void load()
      void loadPollStatus()
    }, 3000)
  }
  catch (error) {
    toast.error(errorMessage(error, '触发轮询失败'))
  }
  finally {
    pollBusy.value = false
  }
}

/** 开关文字也可点：整块胶囊都是可点区域，比只点小圆点好按 */
function togglePushOnPoll() {
  if (pollDisabled.value)
    return
  pushOnPoll.value = !pushOnPoll.value
}

onMounted(() => {
  void load()
  void loadSources()
  void loadPollStatus()
  startStatusTimer()
})

onUnmounted(() => {
  if (statusTimer !== undefined) {
    window.clearInterval(statusTimer)
  }
})
</script>

<template>
  <YdTablePageLayout title="新闻动态" stats-title="轮询与统计" :actions="pageActions">
    <template #page-title>
      <div class="mc-news-poll-switch" :class="{ 'mc-news-poll-switch-on': pushOnPoll, 'mc-news-poll-switch-disabled': pollDisabled }">
        <YdSwitch v-model="pushOnPoll" :disabled="pollDisabled" />
        <YdAction
          class="mc-news-switch-label"
          :title="pollDisabled ? '轮询进行中，暂不可切换' : pushOnPoll ? '轮询完成后自动推送新内容' : '轮询只回填列表，本次不推送'"
          @click="togglePushOnPoll"
        >轮询后推送</YdAction>
      </div>
    </template>

    <template #stats>
      <YdStats>
        <YdStat title="缓存动态" :value="pager.total" description="当前缓存的新闻与版本文章" />
        <YdStat title="待补推" :value="pendingCount" description="下轮轮询自动重试的未送达条目" />
        <YdStat title="忽略名单" :value="ignoredCount" description="被删除的新闻不再推送" />
        <YdStat title="去重记录" :value="seenCount" description="标题 + 链接指纹，重复内容不再推送" />
      </YdStats>
      <div class="mc-news-poll-meta">
        <span>上次轮询：{{ pollStatus?.lastPollAtLabel || '尚未轮询' }}</span>
        <span v-if="pollStatus?.lastPollSummary">{{ pollStatus.lastPollSummary }}</span>
        <span>下次轮询：{{ nextPollText(pollStatus, remainSeconds) || '加载中' }}</span>
        <YdTag v-if="pollStatus?.polling" variant="default">轮询进行中</YdTag>
        <YdTag v-else-if="pollStatus && !pollStatus.enabled" variant="outline">已暂停</YdTag>
        <YdButton v-if="ignoredCount > 0" size="sm" variant="outline" :loading="clearingIgnored" @click="confirmClearIgnored">
          清空忽略名单
        </YdButton>
      </div>
    </template>

    <template #search="{ fold }">
      <YdDynamicSearchForm
        v-model="searchQuery"
        :config="searchConfig"
        :fold="fold"
        :options-sources="optionsSources"
        @search="applyFilters"
        @reset="resetFilters"
      />
    </template>

    <template #table>
      <ClearNewsModal
        v-model:open="clearOpen"
        :sdk="props.sdk"
        :total="pager.total"
        :seen="seenCount"
        :pending="pendingCount"
        @cleared="onCleared"
      />
      <PushNewsModal
        v-model:open="pushOpen"
        :sdk="props.sdk"
        :article="pushRow"
        @pushed="onPushed"
      />
      <YdLoadingOverlay :loading="loading">
        <YdResponsiveEnhancedTable
          row-key="id"
          table-root-class="rounded-lg overflow-hidden"
          table-class="min-w-[1000px]"
          border
          stripe
          column-visibility
          :status-column="pushStatusColumn"
          :actions="rowActions"
          :columns="columns"
          :data="rows"
          empty-text="暂无新闻，点击「立即轮询」或等待定时轮询"
        >
          <template #cell-title="{ row }">
            <div class="mc-news-title-cell">
              <a class="mc-news-link mc-news-title" :href="row.original.url" target="_blank" rel="noopener">{{ row.original.title }}</a>
              <span v-if="row.original.summary" class="mc-news-subtitle">{{ row.original.summary }}</span>
              <span v-else-if="row.original.aiSummary" class="mc-news-subtitle">AI：{{ row.original.aiSummary }}</span>
            </div>
          </template>
        </YdResponsiveEnhancedTable>
      </YdLoadingOverlay>
    </template>

    <template #footer>
      <YdPagination
        v-model:page="pager.page"
        v-model:size="pager.size"
        :total="pager.total"
        @page-change="onPageChange"
        @size-change="onSizeChange"
      />
    </template>
  </YdTablePageLayout>
</template>
