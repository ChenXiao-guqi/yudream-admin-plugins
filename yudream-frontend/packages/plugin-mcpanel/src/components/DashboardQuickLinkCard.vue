<script setup lang="ts">
import { FaButton, FaIcon } from '@yudream/components'
import { computed } from 'vue'
interface DashboardCardLike { title?: string, description?: string, actionPath?: string }
const props = defineProps<{ card?: DashboardCardLike, onOpen?: (card?: DashboardCardLike) => void }>()
const quickstart = computed(() => props.card?.actionPath?.includes('quickstart'))
</script>

<template>
  <div class="dashboard-card__content mcp-dash-card mcp-dash-card--link">
    <FaButton v-if="card?.actionPath" variant="ghost" class="mcp-dash-card__entry" @click="onOpen?.(card)">
      <span class="mcp-dash-card__entry-icon"><FaIcon :name="quickstart ? 'i-ri:rocket-2-line' : 'i-ri:box-3-line'" /></span>
      <span class="mcp-dash-card__entry-copy"><strong>{{ quickstart ? '开启新的服务器' : '发现服务器应用' }}</strong><span>{{ quickstart ? '选择核心，完成配置，即可部署' : '浏览应用目录，为实例选择合适的核心' }}</span></span>
      <FaIcon name="i-ri:arrow-right-up-line" class="mcp-dash-card__entry-arrow" />
    </FaButton>
    <div v-if="quickstart" class="mcp-dash-card__steps" aria-label="部署流程"><span><b>01</b>选择核心</span><i /><span><b>02</b>配置实例</span><i /><span><b>03</b>部署运行</span></div>
    <p v-else class="mcp-dash-card__note">从应用到实例，在同一个面板完成部署。</p>
  </div>
</template>
