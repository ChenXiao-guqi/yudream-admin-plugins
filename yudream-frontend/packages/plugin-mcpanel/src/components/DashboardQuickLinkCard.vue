<script setup lang="ts">
import { FaButton, FaIcon } from '@yudream/components'
import { computed } from 'vue'
interface DashboardCardLike { title?: string, description?: string, actionPath?: string }
const props = defineProps<{ card?: DashboardCardLike, onOpen?: (card?: DashboardCardLike) => void }>()
const quickstart = computed(() => props.card?.actionPath?.includes('quickstart'))
</script>

<template>
  <div class="dashboard-card__content mcp-dash-card mcp-dash-card--link">
    <FaButton v-if="card?.actionPath" variant="ghost" class="mcp-dash-card__entry w-full h-auto min-w-0 whitespace-normal p-0" @click="onOpen?.(card)">
      <span class="mcp-dash-card__entry-layout">
        <span class="mcp-dash-card__entry-icon"><FaIcon :name="quickstart ? 'i-ri:rocket-2-line' : 'i-ri:box-3-line'" /></span>
        <span class="mcp-dash-card__entry-copy"><strong>{{ quickstart ? '新建服务器' : '应用市场' }}</strong><span>{{ quickstart ? '选核心、配实例、开始部署' : '挑选核心，一键创建实例' }}</span></span>
        <FaIcon name="i-ri:arrow-right-up-line" class="mcp-dash-card__entry-arrow" />
      </span>
    </FaButton>
    <ol class="mcp-dash-card__steps" :class="{ 'mcp-dash-card__steps--expanded-only': !quickstart }" :aria-label="quickstart ? '部署流程' : '应用安装流程'">
      <li><b>01</b><span>{{ quickstart ? '选择核心' : '浏览应用' }}</span><small>{{ quickstart ? '选择游戏版本与服务端核心' : '查找适合服务器的应用与核心' }}</small></li>
      <li><b>02</b><span>{{ quickstart ? '配置实例' : '确认版本' }}</span><small>{{ quickstart ? '指定部署节点与实例参数' : '查看说明，确认版本与安装要求' }}</small></li>
      <li><b>03</b><span>{{ quickstart ? '部署运行' : '创建实例' }}</span><small>{{ quickstart ? '安装完成后，在实例页启动服务器' : '完成部署后，前往实例页管理' }}</small></li>
    </ol>
    <p v-if="!quickstart" class="mcp-dash-card__note">查看应用详情后部署到实例。</p>
  </div>
</template>
