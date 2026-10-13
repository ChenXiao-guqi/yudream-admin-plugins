<script setup lang="ts">
import type { YuDreamPluginSdk } from '@yudream/plugin-sdk'
import type { SkinMe, SkinPlayer, SkinTexture } from '../types'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { FaButton, FaIcon } from '@yudream/components'
import { createSkinApi } from '../api/skin-api'
import SkinPreview from './SkinPreview.vue'

interface DashboardCardLike {
  actionPath?: string
}

const props = defineProps<{
  sdk: YuDreamPluginSdk
  card?: DashboardCardLike
  onOpen?: (card?: DashboardCardLike) => void
}>()

const api = createSkinApi(props.sdk)
const loading = ref(false)
const error = ref('')
const me = ref<SkinMe | null>(null)
const players = ref<SkinPlayer[]>([])
const textures = ref<SkinTexture[]>([])

const defaultPlayer = computed(() => {
  if (!players.value.length) {
    return null
  }
  return players.value.find(player => player.name === me.value?.defaultPlayerName)
    || players.value.find(player => player.skinHash || player.capeHash)
    || players.value[0]
})
const skinTexture = computed(() => textureByHash(defaultPlayer.value?.skinHash))
const capeTexture = computed(() => textureByHash(defaultPlayer.value?.capeHash))
const skinUrl = computed(() => api.textureUrl(defaultPlayer.value?.skinHash))
const capeUrl = computed(() => api.textureUrl(defaultPlayer.value?.capeHash))
const slim = computed(() => skinTexture.value?.model === 'slim')
const appearanceSummary = computed(() => {
  if (skinUrl.value && capeUrl.value) return '皮肤与披风已装备'
  if (skinUrl.value) return '皮肤已装备'
  if (capeUrl.value) return '披风已装备'
  return '选择一套喜欢的外观'
})
const appearanceDetails = computed(() => [
  skinTexture.value?.name && `皮肤：${skinTexture.value.name}`,
  capeTexture.value?.name && `披风：${capeTexture.value.name}`,
].filter(Boolean).join('\n'))
const equippedSkin = computed(() => skinTexture.value?.name || (skinUrl.value ? '已装备皮肤' : '未装备皮肤'))
const equippedCape = computed(() => capeTexture.value?.name || (capeUrl.value ? '已装备披风' : '未装备披风'))
const previewArea = ref<HTMLElement | null>(null)
const frame = ref({ width: 220, height: 210 })
let observer: ResizeObserver | undefined
watch(previewArea, (element) => {
  observer?.disconnect()
  if (!element) {
    return
  }
  observer = new ResizeObserver(([entry]) => {
    frame.value = {
      width: Math.max(1, Math.floor(entry.contentRect.width)),
      height: Math.max(1, Math.floor(entry.contentRect.height)),
    }
  })
  observer.observe(element)
})
onBeforeUnmount(() => observer?.disconnect())

onMounted(load)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [current, playerList, textureList] = await Promise.all([
      api.me(),
      api.players(),
      api.textures(),
    ])
    me.value = current
    players.value = playerList
    textures.value = textureList
  }
  catch (cause: any) {
    error.value = cause?.message || '皮肤预览加载失败'
  }
  finally {
    loading.value = false
  }
}

function textureByHash(hash?: string) {
  return hash ? textures.value.find(texture => texture.hash === hash) : undefined
}

function openCard() {
  props.onOpen?.(props.card)
}
</script>

<template>
  <div class="dashboard-card__content skin-dashboard-card skin-preview-card">
    <div v-if="loading" class="skin-dashboard-card__state">
      <FaIcon name="i-ri:loader-4-line" class="animate-spin" />
      正在生成预览
    </div>
    <div v-else-if="error" class="skin-dashboard-card__state error">
      <FaIcon name="i-ri:error-warning-line" />
      {{ error }}
    </div>
    <template v-else>
      <div ref="previewArea" class="skin-preview-card__viewer" :aria-label="`${defaultPlayer?.name || '角色'}的三维外观预览`">
        <SkinPreview
          compact
          :frame-width="frame.width"
          :frame-height="frame.height"
          :skin="skinUrl"
          :cape="capeUrl"
          :slim="slim"
        />
      </div>
      <div class="skin-preview-card__footer">
        <div class="skin-preview-card__meta" :title="appearanceDetails">
          <strong>{{ defaultPlayer?.name || '还没有角色' }}</strong>
          <span>{{ appearanceSummary }}</span>
          <dl class="skin-preview-card__equipment">
            <div><dt>皮肤</dt><dd :title="equippedSkin">{{ equippedSkin }}</dd></div>
            <div><dt>披风</dt><dd :title="equippedCape">{{ equippedCape }}</dd></div>
          </dl>
        </div>
        <FaButton v-if="card?.actionPath" size="sm" variant="ghost" class="skin-preview-card__change" @click="openCard">
          换装
          <FaIcon name="i-ri:arrow-right-line" />
        </FaButton>
      </div>
    </template>
  </div>
</template>

<style scoped>
.skin-dashboard-card {
  display: flex;
  flex-direction: column;
  gap: 0;
  min-width: 0;
  overflow: hidden;
}

.skin-preview-card__viewer {
  flex: 1;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
}

.skin-dashboard-card__state {
  display: flex;
  gap: 8px;
  align-items: center;
  flex: 1;
  min-height: 0;
  color: var(--color-text-3);
  font-size: 13px;
}

.skin-dashboard-card__state.error {
  color: rgb(var(--danger-6));
}

.skin-preview-card :deep(.skin-preview) {
  display: grid;
  width: 100%;
  height: 100%;
  gap: 0;
  min-width: 0;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
}

.skin-preview-card :deep(.skin-preview__stage) {
  width: 100%;
  height: 100%;
  min-height: 0;
  background: transparent;
}

.skin-preview-card :deep(canvas) {
  filter: none;
}

.skin-preview-card :deep(.skin-preview__empty) {
  min-height: 0;
}

.skin-preview-card__meta {
  display: grid;
  min-width: 0;
  gap: 3px;
}

.skin-preview-card__meta strong,
.skin-preview-card__meta span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.skin-preview-card__meta strong {
  color: var(--color-text-1);
  font-size: 14px;
  font-weight: 600;
}

.skin-preview-card__meta span {
  color: var(--color-text-3);
  font-size: 12px;
}

.skin-preview-card__footer {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
  padding-top: 10px;
  border-top: 1px solid var(--color-border-1);
}

.skin-preview-card__change {
  flex: 0 0 auto;
}

.skin-preview-card__equipment {
  display: none;
  margin: 0;
}

@container dashboard-card (min-width: 560px) {
  .skin-preview-card {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 0.8fr);
    gap: 24px;
  }

  .skin-preview-card__footer {
    flex-direction: column;
    align-items: stretch;
    justify-content: center;
    gap: 14px;
    padding-top: 0;
    padding-left: 24px;
    border-top: 0;
    border-left: 1px solid var(--color-border-1);
  }

  .skin-preview-card__meta {
    gap: 7px;
  }

  .skin-preview-card__meta strong {
    font-size: 19px;
  }

  .skin-preview-card__equipment {
    display: grid;
    gap: 10px;
    margin-top: 12px;
  }

  .skin-preview-card__equipment > div {
    display: grid;
    grid-template-columns: 30px minmax(0, 1fr);
    gap: 10px;
    font-size: 12px;
  }

  .skin-preview-card__equipment dt {
    color: var(--color-text-3);
  }

  .skin-preview-card__equipment dd {
    overflow: hidden;
    margin: 0;
    color: var(--color-text-2);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .skin-preview-card__change {
    align-self: flex-start;
  }
}
</style>
