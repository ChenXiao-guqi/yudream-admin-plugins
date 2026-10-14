<script setup lang="ts">
import {computed } from 'vue'
import { YdAction, YdButton, YdCheckbox, YdInput, YdSelect, YdSlider } from '@yudream/components'
import type { MemoryFact } from '../types'

const MAX_FACTS = 30
const KEY_OPTIONS = [
  { value: 'preference', label: '偏好' },
  { value: 'interest', label: '兴趣' },
  { value: 'identity', label: '身份' },
  { value: 'habit', label: '习惯' },
  { value: 'topic', label: '话题' },
  { value: 'emotion', label: '情绪' },
  { value: 'note', label: '备注' },
]
const facts = defineModel<MemoryFact[]>({ required: true })
const full = computed(() => facts.value.length >= MAX_FACTS)
function add() { if (!full.value) facts.value = [...facts.value, { key: 'note', value: '', confidence: 1, approved: true, updatedAt: Date.now() }] }
function remove(index: number) { facts.value = facts.value.filter((_, item) => item !== index) }
function patch(index: number, change: Partial<MemoryFact>) { facts.value = facts.value.map((fact, item) => item === index ? { ...fact, ...change } : fact) }
function confidencePercent(fact: MemoryFact) { return Math.round((fact.confidence ?? 1) * 100) }
</script>

<template>
  <div class="fe">
    <div v-for="(fact, index) in facts" :key="index" class="fe-row">
      <div class="fe-line">
        <YdSelect :model-value="fact.key" :options="KEY_OPTIONS" class="fe-select" @update:model-value="patch(index, { key: String($event) })" />
        <YdInput :model-value="fact.value" class="fe-value" placeholder="事实内容，例如：喜欢 Java" maxlength="500" @update:model-value="patch(index, { value: String($event) })" />
        <YdAction type="button" class="fe-delete" title="删除事实" @click="remove(index)">×</YdAction>
      </div>
      <div class="fe-sub">
        <span class="fe-label">置信度</span>
        <YdSlider :model-value="[fact.confidence ?? 1]" :min="0" :max="1" :step="0.05" :tooltip="false" class="fe-slider" @update:model-value="patch(index, { confidence: $event?.[0] })" />
        <span class="fe-percent">{{ confidencePercent(fact) }}%</span>
        <YdCheckbox :model-value="fact.approved ?? true" class="fe-approved" @update:model-value="value => patch(index, { approved: Boolean(value) })">已批准</YdCheckbox>
      </div>
    </div>
    <p v-if="!facts.length" class="fe-empty">暂无事实，点击下方按钮添加</p>
    <div class="fe-footer">
      <YdButton size="sm" variant="outline" :disabled="full" @click="add">添加事实</YdButton>
      <span class="fe-count">{{ facts.length }} / {{ MAX_FACTS }}</span>
    </div>
  </div>
</template>

