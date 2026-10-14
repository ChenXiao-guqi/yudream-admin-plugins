<script setup lang="ts">
import type { YuDreamPluginSdk } from '@yudream/plugin-sdk'
import type { MyParticipation, TimeValue, UserActivity } from '../types'
import { YdButton, YdIcon } from '@yudream/components'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { createActivityProofApi } from '../api/activity-proof-api'
import { activityStage, activityStageTag, normalizeTime } from '../composables/utils'

interface DashboardCardLike { actionPath?: string }
const props = defineProps<{ sdk: YuDreamPluginSdk, card?: DashboardCardLike, onOpen?: (card?: DashboardCardLike) => void }>()
const api = createActivityProofApi(props.sdk)
const loading = ref(true)
const error = ref('')
const activities = ref<UserActivity[]>([])
const participations = ref<MyParticipation[]>([])
const participationTotal = ref(0)
const tab = ref<'latest' | 'mine'>('latest')
const cardElement = ref<HTMLElement>()
const availableHeight = ref(210)
const availableWidth = ref(320)
let resizeObserver: ResizeObserver | undefined
const entries = computed(() => tab.value === 'latest'
  ? activities.value.map(row => ({ id: row.id, title: row.title, date: row.activityStart, detail: `${row.participantCount} 人参与`, state: activityTag(row) }))
  : participations.value.map(row => ({ id: row.activityId, title: row.title, date: row.activityStart, detail: row.status === 'JOINED' ? '我的报名' : '报名记录', state: verifyState(row) })))
// 每行至少保留日期、标题与状态所需的高度，小卡片通过完整活动入口继续查看。
const visibleEntries = computed(() => entries.value.slice(0, availableWidth.value >= 560 ? 3 : Math.max(1, Math.min(3, Math.floor((availableHeight.value - 36) / 46)))))
onMounted(() => {
  if (cardElement.value) {
    resizeObserver = new ResizeObserver(([entry]) => {
      if (entry) {
        availableHeight.value = entry.contentRect.height
        availableWidth.value = entry.contentRect.width
      }
    })
    resizeObserver.observe(cardElement.value)
  }
  void load()
})
onBeforeUnmount(() => resizeObserver?.disconnect())
async function load() {
  loading.value = true
  error.value = ''
  try {
    const [activityPage, participationPage] = await Promise.all([api.me.activities(1, 3), api.me.participations(1, 3)])
    activities.value = activityPage.records
    participations.value = participationPage.records
    participationTotal.value = Number(participationPage.total ?? 0)
  }
  catch (cause: any) { error.value = cause?.message || '活动信息加载失败' }
  finally { loading.value = false }
}
function activityTag(row: UserActivity) {
  const stage = activityStage(row.status, row.signupStart, row.signupEnd, row.activityEnd)
  return stage !== 'ENDED' && row.participationStatus === 'JOINED' ? '已参与' : activityStageTag(stage).text
}
function verifyState(row: MyParticipation) {
  return row.status !== 'JOINED' ? '已取消' : row.verifyStatus === 'PASSED' ? '已通过' : row.verifyStatus === 'FAILED' ? '未通过' : '待核验'
}
function dateParts(value: TimeValue) {
  const timestamp = normalizeTime(value)
  if (!timestamp) {
    return { month: '待定', day: '—' }
  }
  const date = new Date(timestamp)
  return { month: `${date.getMonth() + 1}月`, day: String(date.getDate()).padStart(2, '0') }
}
</script>

<template>
  <div ref="cardElement" class="dashboard-card__content activity-dashboard-card" :class="{ 'activity-dashboard-card--compact': availableHeight < 160 }">
    <div v-if="loading" class="activity-dashboard-card__state">
      <YdIcon name="i-ri:loader-4-line" class="animate-spin" />正在读取活动
    </div>
    <div v-else-if="error" class="activity-dashboard-card__state">
      <span>{{ error }}</span><YdButton variant="ghost" size="sm" @click="load">
        重试
      </YdButton>
    </div>
    <template v-else>
      <div class="activity-agenda-tabs" role="group" aria-label="活动范围">
        <YdButton size="sm" class="activity-agenda-tab min-w-0 h-7 px-2 text-xs" :variant="tab === 'latest' ? 'secondary' : 'ghost'" :aria-pressed="tab === 'latest'" @click="tab = 'latest'">
          最新活动
        </YdButton>
        <YdButton size="sm" class="activity-agenda-tab min-w-0 h-7 px-2 text-xs" :variant="tab === 'mine' ? 'secondary' : 'ghost'" :aria-pressed="tab === 'mine'" @click="tab = 'mine'">
          我的参与 <span>{{ participationTotal }}</span>
        </YdButton>
        <YdButton v-if="card?.actionPath" size="icon-sm" variant="ghost" class="activity-agenda-open size-7" aria-label="查看全部活动" title="查看全部活动" @click="onOpen?.(card)">
          <YdIcon name="i-ri:arrow-right-up-line" />
        </YdButton>
      </div>
      <div class="activity-agenda" :style="{ '--agenda-visible-count': visibleEntries.length || 1 }">
        <div v-for="entry in visibleEntries" :key="`${tab}-${entry.id}`" class="activity-agenda-row">
          <div class="activity-agenda-date">
            <strong>{{ dateParts(entry.date).day }}</strong><span>{{ dateParts(entry.date).month }}</span>
          </div>
          <div class="activity-agenda-copy">
            <strong :title="entry.title">{{ entry.title }}</strong><span>{{ entry.state }}<i />{{ entry.detail }}</span>
          </div>
        </div>
        <div v-if="!entries.length" class="activity-agenda-empty">
          <YdIcon name="i-ri:calendar-event-line" /><strong>{{ tab === 'mine' ? '你的下一次相聚，从这里开始' : '好活动，值得期待' }}</strong><span>{{ tab === 'mine' ? '去活动广场发现感兴趣的活动' : '发布新活动后，会在这里显示' }}</span>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.activity-agenda-tabs { display: grid; grid-template-columns: auto auto minmax(0, 1fr); gap: 4px; flex-shrink: 0; min-width: 0; align-items: center; }
.activity-agenda-open { justify-self: end; }
.activity-agenda-tabs span { margin-left: 3px; opacity: 0.65; font-variant-numeric: tabular-nums; }
.activity-agenda { display: grid; grid-template-rows: repeat(var(--agenda-visible-count), minmax(0, 1fr)); flex: 1; min-height: 0; }
.activity-agenda-row { display: flex; gap: 12px; align-items: center; min-width: 0; min-height: 0; padding: 4px 0; border-bottom: 1px solid var(--color-border-1); animation: agenda-reveal var(--yd-motion-duration-normal, 180ms) ease-out both; }
.activity-agenda-row:last-child { border-bottom: 0; }
.activity-agenda-date { display: flex; flex: 0 0 35px; flex-direction: column; align-items: center; color: var(--color-text-3); line-height: 1.2; }
.activity-agenda-date strong { font-size: 23px; font-weight: 500; color: var(--color-text-1); font-variant-numeric: tabular-nums; letter-spacing: -0.04em; }
.activity-agenda-date span { font-size: 11px; margin-top: 2px; }
.activity-agenda-copy { min-width: 0; display: grid; gap: 4px; }
.activity-agenda-copy strong { font-size: 13px; font-weight: 600; color: var(--color-text-1); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.activity-agenda-copy span { display: flex; align-items: center; gap: 6px; overflow: hidden; font-size: 11px; color: var(--color-text-3); white-space: nowrap; text-overflow: ellipsis; }
.activity-agenda-copy i { width: 2px; height: 2px; flex-shrink: 0; background: currentcolor; border-radius: 50%; }
.activity-agenda-empty { display: flex; flex-direction: column; justify-content: center; gap: 7px; height: 100%; min-height: 0; color: var(--color-text-3); font-size: 11px; }
.activity-agenda-empty > :first-child { font-size: 26px; margin-bottom: 2px; }
.activity-agenda-empty strong { color: var(--color-text-2); font-size: 13px; font-weight: 500; }
.activity-dashboard-card--compact .activity-agenda-empty > :first-child { display: none; }
@container activity-workbench (min-width: 440px) { .activity-agenda-copy strong { font-size: 15px; } .activity-agenda-copy span { font-size: 12px; } .activity-agenda-date { flex-basis: 42px; } .activity-agenda-date strong { font-size: 28px; } }
@container activity-workbench (min-width: 560px) { .activity-agenda { grid-template-columns: repeat(var(--agenda-visible-count), minmax(0, 1fr)); grid-template-rows: minmax(0, 1fr); gap: 14px; } .activity-agenda-row { flex-direction: column; gap: 8px; align-items: flex-start; justify-content: center; padding: 0 12px 0 0; border-right: 1px solid var(--color-border-1); border-bottom: 0; } .activity-agenda-row:last-child { border-right: 0; } .activity-agenda-date { flex-basis: auto; flex-direction: row; gap: 6px; align-items: baseline; } .activity-agenda-copy { width: 100%; } .activity-agenda-empty { grid-column: 1 / -1; } }
@container activity-workbench (min-width: 560px) { .activity-dashboard-card--compact .activity-agenda-row { gap: 4px; } .activity-dashboard-card--compact .activity-agenda-date strong { font-size: 22px; line-height: 1; } .activity-dashboard-card--compact .activity-agenda-copy { gap: 2px; } .activity-dashboard-card--compact .activity-agenda-copy strong { font-size: 13px; line-height: 1.25; } .activity-dashboard-card--compact .activity-agenda-copy span { font-size: 11px; line-height: 1.3; } }
@container activity-workbench (max-width: 235px) { .activity-agenda-tabs { gap: 2px; } .activity-agenda-tabs span { display: none; } .activity-agenda-row { gap: 8px; } .activity-agenda-date { flex-basis: 30px; } .activity-agenda-copy span { gap: 4px; } }
@keyframes agenda-reveal { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .activity-agenda-row { animation-duration: 120ms; } }
</style>
