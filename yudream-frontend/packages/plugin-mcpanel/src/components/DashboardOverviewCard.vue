<script setup lang="ts">
import type { YuDreamPluginSdk } from '@yudream/plugin-sdk'
import { FaButton, FaIcon } from '@yudream/components'
import { computed, onMounted, ref } from 'vue'
import { createMcPanelExtra } from '../api/api-extra'
import { errorMessage } from '../composables/utils'

interface DashboardCardLike { actionPath?: string }
const props = defineProps<{ sdk: YuDreamPluginSdk, card?: DashboardCardLike, onOpen?: (card?: DashboardCardLike) => void }>()
const extra = createMcPanelExtra(props.sdk)
const loading = ref(true)
const error = ref('')
const nodes = ref<Record<string, number>>({})
const instances = ref<Record<string, number>>({})
const instanceMode = computed(() => props.card?.actionPath?.includes('/instances'))
const current = computed(() => instanceMode.value ? instances.value.running ?? 0 : nodes.value.online ?? 0)
const total = computed(() => instanceMode.value ? instances.value.total ?? 0 : nodes.value.total ?? 0)
const percent = computed(() => total.value ? Math.min(100, Math.round(current.value / total.value * 100)) : 0)
onMounted(load)
async function load() {
  loading.value = true
  error.value = ''
  try {
    const data = await extra.overview() as Record<string, unknown>
    nodes.value = (data.nodes as Record<string, number>) ?? {}
    instances.value = (data.instances as Record<string, number>) ?? {}
  }
  catch (cause) { error.value = errorMessage(cause, '监控数据加载失败') }
  finally { loading.value = false }
}
</script>

<template>
  <div class="dashboard-card__content mcp-dash-card">
    <div v-if="loading" class="mcp-dash-card__state"><FaIcon name="i-ri:loader-4-line" class="animate-spin" />正在读取监控数据</div>
    <div v-else-if="error" class="mcp-dash-card__state"><span>{{ error }}</span><FaButton size="sm" variant="ghost" @click="load">重试</FaButton></div>
    <template v-else>
      <div class="mcp-dash-card__readout">
        <div class="mcp-dash-card__figure"><strong>{{ current }}</strong><span>/ {{ total }}</span><p>{{ instanceMode ? '运行中的实例' : '在线节点' }}</p></div>
        <svg class="mcp-dash-card__gauge" viewBox="0 0 100 100" role="img" :aria-label="`${instanceMode ? '运行' : '在线'}比例 ${percent}%`">
          <circle cx="50" cy="50" r="40" class="mcp-dash-card__track" />
          <circle cx="50" cy="50" r="40" pathLength="100" :stroke-dasharray="`${percent} 100`" class="mcp-dash-card__arc" />
          <text x="50" y="53">{{ total ? `${percent}%` : '—' }}</text>
          <text x="50" y="69" class="mcp-dash-card__gauge-label">{{ instanceMode ? '运行率' : '在线率' }}</text>
        </svg>
      </div>
      <div class="mcp-dash-card__actions">
        <span>{{ total === 0 ? (instanceMode ? '还没有部署实例' : '还没有接入节点') : (instanceMode ? `${Math.max(0, total - current)} 个实例未运行` : `运行实例 ${instances.running ?? 0} / ${instances.total ?? 0}`) }}</span>
        <FaButton v-if="card?.actionPath" size="sm" variant="ghost" @click="onOpen?.(card)">{{ instanceMode ? '实例管理' : '监控详情' }}<FaIcon name="i-ri:arrow-right-up-line" /></FaButton>
      </div>
    </template>
  </div>
</template>
