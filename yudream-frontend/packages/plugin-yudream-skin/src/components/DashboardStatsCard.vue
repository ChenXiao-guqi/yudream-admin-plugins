<script setup lang="ts">
import type { YuDreamPluginSdk } from '@yudream/plugin-sdk'
import type { SkinSummary } from '../types'
import { onMounted, ref } from 'vue'
import { FaIcon } from '@yudream/components'
import { createSkinApi } from '../api/skin-api'

const props = defineProps<{
  sdk: YuDreamPluginSdk
}>()

const api = createSkinApi(props.sdk)
const loading = ref(false)
const error = ref('')
const summary = ref<SkinSummary | null>(null)

onMounted(load)

async function load() {
  loading.value = true
  error.value = ''
  try {
    summary.value = await api.status()
  }
  catch (cause: any) {
    error.value = cause?.message || '统计数据加载失败'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="dashboard-card__content skin-stats-card">
    <div v-if="loading" class="skin-stats-card__state">
      <FaIcon name="i-ri:loader-4-line" class="animate-spin" />
      正在读取统计
    </div>
    <div v-else-if="error" class="skin-stats-card__state error">
      <FaIcon name="i-ri:error-warning-line" />
      {{ error }}
    </div>
    <template v-else>
      <div class="skin-stats-card__grid">
        <div>
          <span>用户</span>
          <strong>{{ summary?.users ?? 0 }}</strong>
        </div>
        <div>
          <span>角色</span>
          <strong>{{ summary?.players ?? 0 }}</strong>
        </div>
        <div>
          <span>材质</span>
          <strong>{{ summary?.textures ?? 0 }}</strong>
        </div>
        <div>
          <span>衣柜</span>
          <strong>{{ summary?.closetItems ?? 0 }}</strong>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.skin-stats-card {
  display: grid;
  gap: 12px;
  align-content: center;
  min-width: 0;
}

.skin-stats-card__state {
  display: flex;
  gap: 8px;
  align-items: center;
  min-height: 92px;
  color: var(--color-text-3);
  font-size: 13px;
}

.skin-stats-card__state.error {
  color: rgb(var(--danger-6));
}

.skin-stats-card__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 0 20px;
}

.skin-stats-card__grid div {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  min-height: 44px;
  padding: 8px 0;
  background: transparent;
  border: 0;
  border-bottom: 1px solid var(--color-border-1);
  border-radius: 0;
}

.skin-stats-card__grid > div:first-child { grid-row: span 3; flex-direction: column-reverse; justify-content: center; align-items: flex-start; border-bottom: 0; border-right: 1px solid var(--color-border-1); }
.skin-stats-card__grid > div:first-child strong { font-size: clamp(40px, 15cqi, 64px); line-height: 1; font-weight: 600; letter-spacing: -0.05em; }
.skin-stats-card__grid > div:last-child { border-bottom: 0; }

.skin-stats-card__grid span {
  color: var(--color-text-3);
  font-size: 12px;
}

.skin-stats-card__grid strong {
  color: var(--color-text-1);
  font-size: 20px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
</style>
