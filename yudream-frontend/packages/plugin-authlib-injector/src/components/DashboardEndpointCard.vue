<script setup lang="ts">
import type { YuDreamPluginSdk } from '@yudream/plugin-sdk'
import { YdAction, YdButton, YdIcon, useYdToast } from '@yudream/components'
import { computed } from 'vue'

interface DashboardCardLike {
  title?: string
  description?: string
  actionPath?: string
  dragPayloadTemplate?: string
}

const props = defineProps<{ sdk: YuDreamPluginSdk, card: DashboardCardLike, onOpen?: (card?: DashboardCardLike) => void }>()
const toast = useYdToast()
const endpointUrl = computed(() => absoluteUrl(props.sdk.http.url('/')).replace(/\/$/, ''))
const dragPayload = computed(() => (props.card.dragPayloadTemplate || '{url}')
  .replaceAll('{encodedUrl}', encodeURIComponent(endpointUrl.value))
  .replaceAll('{url}', endpointUrl.value))

async function copyEndpoint() {
  await navigator.clipboard.writeText(endpointUrl.value)
  toast.success('API 地址已复制')
}

function handleDragStart(event: DragEvent) {
  if (!event.dataTransfer) {
    return
  }
  event.stopPropagation()
  event.dataTransfer.effectAllowed = 'copy'
  event.dataTransfer.dropEffect = 'copy'
  event.dataTransfer.setData('text/plain', dragPayload.value)
  event.dataTransfer.setData('text/uri-list', endpointUrl.value)
}

function absoluteUrl(url: string) {
  if (/^https?:\/\//i.test(url)) {
    return url
  }
  return `${window.location.origin}${url.startsWith('/') ? url : `/${url}`}`
}
</script>

<template>
  <div class="dashboard-card__content authlib-dashboard-card">
    <div class="authlib-dashboard-card__body">
      <YdAction
        type="button"
        class="authlib-dashboard-card__endpoint"
        title="复制 API 地址，也可拖拽到支持导入配置的客户端"
        draggable="true"
        @click="copyEndpoint"
        @dragstart="handleDragStart"
      >
        <code>{{ endpointUrl }}</code>
        <span class="authlib-dashboard-card__copy">
          <YdIcon name="i-ri:file-copy-line" />
        </span>
      </YdAction>

    </div>
    <div class="authlib-dashboard-card__actions">
      <span class="authlib-dashboard-card__hint">点击复制，或拖入启动器</span>
      <YdButton v-if="card.actionPath" size="sm" variant="ghost" @click="onOpen?.(card)">打开管理</YdButton>
    </div>
  </div>
</template>
