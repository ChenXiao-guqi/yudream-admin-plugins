<script setup lang="ts">
import type { YuDreamPluginSdk } from '@yudream/plugin-sdk'
import type { SkinSummary } from '../types'
import { onMounted, ref } from 'vue'
import { YdAlert, YdButton, YdIcon } from '@yudream/components'
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
      <YdIcon name="i-ri:loader-4-line" class="animate-spin" />
      正在读取统计
    </div>
    <div v-else-if="error" class="skin-stats-card__state">
      <YdAlert variant="destructive" icon="i-ri:error-warning-line" title="统计数据加载失败" class="w-full min-w-0">
        <template #description>
          <p>{{ error }}</p>
          <YdButton variant="outline" size="sm" class="mt-2" :loading="loading" @click="load">重试</YdButton>
        </template>
      </YdAlert>
    </div>
    <template v-else>
      <div class="skin-stats-card__grid">
        <div>
          <span>角色</span>
          <strong>{{ summary?.players ?? 0 }}</strong>
        </div>
        <div>
          <span>用户</span>
          <strong>{{ summary?.users ?? 0 }}</strong>
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
  min-height: 0;
  overflow: hidden;
}

.skin-stats-card__state {
  display: flex;
  gap: 8px;
  align-items: center;
  min-height: 0;
  color: var(--color-text-3);
  font-size: 13px;
}

.skin-stats-card__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 0 20px;
  width: 100%;
  min-width: 0;
}

.skin-stats-card__grid div {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
  min-height: 38px;
  padding: 7px 0;
  background: transparent;
  border: 0;
  border-bottom: 1px solid var(--color-border-1);
  border-radius: 0;
}

.skin-stats-card__grid > div:first-child {
  grid-row: span 3;
  flex-direction: column-reverse;
  justify-content: center;
  align-items: flex-start;
  border-bottom: 0;
  border-right: 1px solid var(--color-border-1);
}

.skin-stats-card__grid > div:first-child strong {
  font-size: clamp(36px, 13cqi, 60px);
  line-height: 1;
  font-weight: 600;
  letter-spacing: -0.05em;
}

.skin-stats-card__grid > div:last-child {
  border-bottom: 0;
}

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

@container dashboard-card (max-height: 240px) {
  .skin-stats-card__grid div {
    min-height: 28px;
    padding-block: 4px;
  }

  .skin-stats-card__grid > div:first-child strong {
    font-size: 36px;
  }

  .skin-stats-card__grid strong {
    font-size: 17px;
  }
}

@container dashboard-card (min-width: 560px) {
  .skin-stats-card__grid {
    grid-template-columns: minmax(0, 1.4fr) repeat(3, minmax(0, 1fr));
    gap: 20px;
    align-items: center;
  }

  .skin-stats-card__grid > div,
  .skin-stats-card__grid > div:first-child {
    grid-row: auto;
    flex-direction: column-reverse;
    justify-content: center;
    align-items: flex-start;
    gap: 8px;
    border: 0;
  }

  .skin-stats-card__grid > div + div {
    padding-left: 20px;
    border-left: 1px solid var(--color-border-1);
  }

  .skin-stats-card__grid strong {
    font-size: clamp(23px, 4cqi, 36px);
  }
}
</style>
