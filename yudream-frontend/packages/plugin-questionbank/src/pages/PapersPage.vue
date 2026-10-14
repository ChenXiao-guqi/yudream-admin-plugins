<script setup lang="ts">
import type { QuestionBankPluginModel } from '../composables/useQuestionBankPlugin'
import type { PaperView } from '../types'
import { YdButton, YdCard, YdIcon, YdPageHeader, YdPageMain, YdTag } from '@yudream/components'
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { difficultyLabel, formatTime, questionTypeLabel } from '../composables/utils'

const props = defineProps<{ model: QuestionBankPluginModel }>()
const model = props.model
const router = useRouter()

function ruleText(paper: PaperView) {
  if (paper.mode !== 'RULE') {
    return '固定题目'
  }
  const parts: string[] = []
  if (paper.types?.length) {
    parts.push(paper.types.map(questionTypeLabel).join('/'))
  }
  if (paper.tags?.length) {
    parts.push(`标签：${paper.tags.join('、')}`)
  }
  if (paper.difficulties?.length) {
    parts.push(`难度：${paper.difficulties.map(difficultyLabel).join(' ')}`)
  }
  return parts.length ? `随机抽题（${parts.join('；')}）` : '随机抽题（不限范围）'
}

async function attempt(paper: PaperView) {
  const created = await model.attemptPaper(paper.id)
  if (created) {
    router.push({ path: '/platform/plugins/questionbank/session', query: { id: created.id } })
  }
}

onMounted(() => model.loadMyPapers())
</script>

<template>
  <YdPageHeader title="题单作答" description="管理员发布的题单，每次进入按规则现场抽题">
    <YdButton variant="outline" @click="router.push('/platform/plugins/questionbank/records')">
      <YdIcon name="i-ri:history-line" />成绩记录
    </YdButton>
  </YdPageHeader>
  <YdPageMain>
    <div v-if="model.papersLoading" class="qb-practice">
      <YdCard>加载中…</YdCard>
    </div>
    <div v-else-if="!model.papers.length" class="qb-practice">
      <YdCard>
        <div class="flex flex-col items-center gap-3 py-6">
          <span class="qb-muted">暂无已发布的题单</span>
        </div>
      </YdCard>
    </div>
    <div v-else class="qb-practice">
      <YdCard v-for="paper in model.papers" :key="paper.id" :title="paper.name">
        <div class="flex flex-col gap-3">
          <div class="flex flex-wrap items-center gap-2">
            <YdTag variant="secondary">{{ paper.mode === 'RULE' ? '随机抽题' : '固定题目' }}</YdTag>
            <YdTag variant="outline">{{ paper.questionCount }} 题</YdTag>
            <YdTag v-if="paper.subjectiveMode === 'REVIEW'" variant="outline">简答人工审核</YdTag>
            <YdTag v-else-if="paper.subjectiveMode === 'AI'" variant="outline">简答 AI 判分</YdTag>
            <span class="qb-muted text-sm">{{ ruleText(paper) }}</span>
          </div>
          <div v-if="paper.description" class="text-sm" style="white-space: pre-wrap">{{ paper.description }}</div>
          <div class="flex items-center justify-between">
            <span class="qb-muted text-sm">发布于 {{ formatTime(paper.createdAt) }}</span>
            <YdButton :loading="model.loading" @click="attempt(paper)"><YdIcon name="i-ri:play-line" />开始作答</YdButton>
          </div>
        </div>
      </YdCard>
    </div>
  </YdPageMain>
</template>
