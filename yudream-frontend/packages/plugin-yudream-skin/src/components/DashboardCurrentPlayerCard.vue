<script setup lang="ts">
import type { YuDreamPluginSdk } from '@yudream/plugin-sdk'
import type { SkinMe, SkinPlayer, SkinTexture } from '../types'
import { computed, onMounted, ref } from 'vue'
import { YdAlert, YdButton, YdIcon } from '@yudream/components'
import { createSkinApi } from '../api/skin-api'

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
const skin = computed(() => textureByHash(defaultPlayer.value?.skinHash))
const cape = computed(() => textureByHash(defaultPlayer.value?.capeHash))
const accountName = computed(() => me.value?.hostUser?.nickname || me.value?.hostUser?.username || props.sdk.account.username || '玩家')

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
    error.value = cause?.message || '角色数据加载失败'
  }
  finally {
    loading.value = false
  }
}

function textureByHash(hash?: string) {
  return hash ? textures.value.find(texture => texture.hash === hash) : undefined
}

function shortHash(hash?: string) {
  return hash ? `${hash.slice(0, 10)}...` : '未绑定'
}

function openCard() {
  props.onOpen?.(props.card)
}
</script>

<template>
  <div class="dashboard-card__content skin-dashboard-card skin-player-card">
    <div v-if="loading" class="skin-dashboard-card__state">
      <YdIcon name="i-ri:loader-4-line" class="animate-spin" />
      正在读取角色
    </div>
    <div v-else-if="error" class="skin-dashboard-card__state col-span-full">
      <YdAlert variant="destructive" icon="i-ri:error-warning-line" title="角色数据加载失败" class="w-full min-w-0">
        <template #description>
          <p>{{ error }}</p>
          <YdButton variant="outline" size="sm" class="mt-2" :loading="loading" @click="load">重试</YdButton>
        </template>
      </YdAlert>
    </div>
    <template v-else>
      <div class="skin-player-card__hero">
        <div>
          <span v-if="accountName !== defaultPlayer?.name" class="skin-player-card__account">{{ accountName }}</span>
          <h3 :title="defaultPlayer?.name">{{ defaultPlayer?.name || '还没有角色' }}</h3>
          <p>{{ defaultPlayer ? `默认角色 · 共 ${players.length} 个角色` : '创建角色，开始定制你的外观' }}</p>
        </div>
        <YdButton v-if="card?.actionPath" size="icon-sm" variant="ghost" aria-label="管理角色" title="管理角色" @click="openCard"><YdIcon name="i-ri:arrow-right-up-line" /></YdButton>
      </div>

      <div class="skin-player-card__stats">
        <div>
          <YdIcon name="i-ri:t-shirt-2-line" /><span>皮肤</span>
          <strong :title="skin?.name || shortHash(defaultPlayer?.skinHash)">{{ skin?.name || shortHash(defaultPlayer?.skinHash) }}</strong>
        </div>
        <div>
          <YdIcon name="i-ri:flag-2-line" /><span>披风</span>
          <strong :title="cape?.name || shortHash(defaultPlayer?.capeHash)">{{ cape?.name || shortHash(defaultPlayer?.capeHash) }}</strong>
        </div>
      </div>

    </template>
  </div>
</template>

<style scoped>
.skin-dashboard-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  min-height: 0;
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

.skin-player-card__hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
}

.skin-player-card__hero > div {
  display: grid;
  gap: 5px;
  min-width: 0;
}

.skin-player-card__hero span {
  overflow: hidden;
  color: var(--color-text-3);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.skin-player-card__hero h3 {
  margin: 0;
  overflow: hidden;
  color: var(--color-text-1);
  font-size: clamp(20px, 6.5cqi, 26px);
  font-weight: 650;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.skin-player-card__hero p {
  margin: 0;
  color: var(--color-text-3);
  font-size: 12px;
  line-height: 1.5;
}

.skin-player-card__stats {
  display: grid;
  flex: 1;
  grid-template-columns: minmax(0, 1fr);
  align-content: center;
  min-width: 0;
  gap: 0;
}

.skin-player-card__stats div {
  display: grid;
  grid-template-columns: 20px 36px minmax(0, 1fr);
  align-items: center;
  min-width: 0;
  gap: 8px;
  padding: 11px 0;
  background: transparent;
  border: 0;
  border-radius: 0;
  border-top: 1px solid var(--color-border-2);
}

.skin-player-card__stats span {
  color: var(--color-text-3);
  font-size: 12px;
}

.skin-player-card__stats strong {
  overflow: hidden;
  color: var(--color-text-1);
  font-size: 13px;
  font-weight: 500;
  line-height: 1.4;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.skin-player-card__stats :deep(.fa-icon) {
  font-size: 16px;
  color: var(--color-text-3);
}

@container dashboard-card (max-height: 240px) {
  .skin-dashboard-card {
    gap: 6px;
  }

  .skin-player-card__hero > div {
    gap: 3px;
  }

  .skin-player-card__account {
    display: none;
  }

  .skin-player-card__hero h3 {
    font-size: 18px;
  }

  .skin-player-card__hero p {
    font-size: 11px;
    line-height: 1.3;
  }

  .skin-player-card__stats div {
    padding-block: 5px;
  }
}

@container dashboard-card (min-width: 560px) {
  .skin-player-card {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr);
    align-items: center;
    gap: 28px;
  }

  .skin-player-card__stats {
    padding-left: 24px;
    border-left: 1px solid var(--color-border-1);
  }

  .skin-player-card__stats div:first-child {
    border-top: 0;
  }
}
</style>
