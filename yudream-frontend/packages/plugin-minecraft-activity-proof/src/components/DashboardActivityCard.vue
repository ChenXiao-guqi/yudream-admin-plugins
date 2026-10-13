<script setup lang="ts">
import type { MyParticipation, TimeValue, UserActivity } from '../types'
import type { YuDreamPluginSdk } from '@yudream/plugin-sdk'
import { computed, onMounted, ref } from 'vue'
import { FaButton, FaIcon } from '@yudream/components'
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
const entries = computed(() => tab.value === 'latest'
  ? activities.value.map(row => ({ id: row.id, title: row.title, date: row.activityStart, detail: `${row.participantCount} 人参与`, state: activityTag(row) }))
  : participations.value.map(row => ({ id: row.activityId, title: row.title, date: row.activityStart, detail: row.status === 'JOINED' ? '我的报名' : '报名记录', state: verifyState(row) })))
onMounted(load)
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
  if (!timestamp) return { month: '待定', day: '—' }
  const date = new Date(timestamp)
  return { month: `${date.getMonth() + 1}月`, day: String(date.getDate()).padStart(2, '0') }
}
</script>

<template>
  <div class="dashboard-card__content activity-dashboard-card">
    <div v-if="loading" class="activity-dashboard-card__state"><FaIcon name="i-ri:loader-4-line" class="animate-spin" />正在读取活动</div>
    <div v-else-if="error" class="activity-dashboard-card__state"><span>{{ error }}</span><FaButton variant="ghost" size="sm" @click="load">重试</FaButton></div>
    <template v-else>
      <div class="activity-agenda-tabs" role="group" aria-label="活动范围">
        <FaButton size="sm" :variant="tab === 'latest' ? 'secondary' : 'ghost'" :aria-pressed="tab === 'latest'" @click="tab = 'latest'">最新活动</FaButton>
        <FaButton size="sm" :variant="tab === 'mine' ? 'secondary' : 'ghost'" :aria-pressed="tab === 'mine'" @click="tab = 'mine'">我的参与 <span>{{ participationTotal }}</span></FaButton>
      </div>
      <div class="activity-agenda">
        <div v-for="entry in entries" :key="entry.id" class="activity-agenda-row">
          <div class="activity-agenda-date"><strong>{{ dateParts(entry.date).day }}</strong><span>{{ dateParts(entry.date).month }}</span></div>
          <div class="activity-agenda-copy"><strong :title="entry.title">{{ entry.title }}</strong><span>{{ entry.state }}<i />{{ entry.detail }}</span></div>
        </div>
        <div v-if="!entries.length" class="activity-agenda-empty"><FaIcon name="i-ri:calendar-event-line" /><strong>{{ tab === 'mine' ? '你的下一次相聚，从这里开始' : '好活动，值得期待' }}</strong><span>{{ tab === 'mine' ? '去活动广场发现感兴趣的活动' : '发布新活动后，会在这里显示' }}</span></div>
      </div>
      <div class="activity-agenda-footer"><span>{{ entries.length ? '最近 3 条活动记录' : '活动日程' }}</span><FaButton v-if="card?.actionPath" size="sm" variant="ghost" @click="onOpen?.(card)">活动广场<FaIcon name="i-ri:arrow-right-up-line" /></FaButton></div>
    </template>
  </div>
</template>

<style scoped>
.activity-agenda-tabs { display: flex; gap: 4px; flex-shrink: 0; }
.activity-agenda-tabs span { margin-left: 3px; opacity: 0.65; font-variant-numeric: tabular-nums; }
.activity-agenda { flex: 1; min-height: 0; overflow: auto; }
.activity-agenda-row { display: flex; gap: 13px; align-items: center; padding: 9px 0; border-bottom: 1px solid var(--color-border-1); }
.activity-agenda-row:last-child { border-bottom: 0; }
.activity-agenda-date { display: flex; flex: 0 0 35px; flex-direction: column; align-items: center; color: var(--color-text-3); line-height: 1.2; }
.activity-agenda-date strong { font-size: 23px; font-weight: 500; color: var(--color-text-1); font-variant-numeric: tabular-nums; letter-spacing: -0.04em; }
.activity-agenda-date span { font-size: 10px; margin-top: 2px; }
.activity-agenda-copy { min-width: 0; display: grid; gap: 6px; }
.activity-agenda-copy strong { font-size: 12px; font-weight: 600; color: var(--color-text-1); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.activity-agenda-copy span { display: flex; align-items: center; gap: 6px; font-size: 10px; color: var(--color-text-3); }
.activity-agenda-copy i { width: 2px; height: 2px; background: currentcolor; border-radius: 50%; }
.activity-agenda-empty { display: flex; flex-direction: column; justify-content: center; gap: 7px; height: 100%; min-height: 80px; color: var(--color-text-3); font-size: 11px; }
.activity-agenda-empty > :first-child { font-size: 26px; margin-bottom: 2px; }
.activity-agenda-empty strong { color: var(--color-text-2); font-size: 13px; font-weight: 500; }
.activity-agenda-footer { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-shrink: 0; }
.activity-agenda-footer > span { font-size: 10px; color: var(--color-text-3); }
</style>