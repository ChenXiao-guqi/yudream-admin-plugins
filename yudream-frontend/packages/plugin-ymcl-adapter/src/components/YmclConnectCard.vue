<script setup lang="ts">
import type { YuDreamPluginSdk } from '@yudream/plugin-sdk'
import { FaButton, FaIcon, useFaToast } from '@yudream/components'
import { computed } from 'vue'
import { openYmcl as openYmclProtocol, siteOrigin } from '../composables/ymcl-protocol'

interface DashboardCardLike {
  title?: string
  description?: string
  actionPath?: string
  dragPayloadTemplate?: string
}

const props = defineProps<{
  sdk: YuDreamPluginSdk
  card?: DashboardCardLike
  onOpen?: (card?: DashboardCardLike) => void
}>()

const toast = useFaToast()
void props.sdk
const origin = computed(() => siteOrigin())

async function copyOrigin() {
  await navigator.clipboard.writeText(origin.value)
  toast.success('域站基址已复制')
}

function openYmcl() {
  const ok = openYmclProtocol(origin.value)
  if (ok) {
    toast.info('已尝试打开 YMCL；若没有响应，请确认已安装 YMCL-Axolotl')
  }
}

function openPage() {
  props.onOpen?.(props.card)
}
</script>

<template>
  <div class="dashboard-card__content ymcl-connect-card">
    <div class="ymcl-connect-card__body">
      <div class="ymcl-connect-card__intro"><FaIcon name="i-ri:gamepad-line" /><strong>连接你的启动器</strong></div>
      <p class="ymcl-connect-card__desc">
        将本站添加到 YMCL，继续你的游戏旅程。
      </p>
      <button
        type="button"
        class="ymcl-connect-card__endpoint"
        title="复制域站基址"
        @click="copyOrigin"
      >
        <code>{{ origin }}</code>
        <span class="ymcl-connect-card__copy">
          <FaIcon name="i-ri:file-copy-line" />
        </span>
      </button>
      <p class="ymcl-connect-card__hint">
        <FaIcon name="i-ri:information-line" />
        <span>需安装 YMCL-Axolotl；也可点击地址手动添加。</span>
      </p>
    </div>
    <div class="ymcl-connect-card__actions">
      <FaButton v-if="card?.actionPath" size="sm" variant="ghost" @click="openPage">
        域概览
        <FaIcon name="i-ri:arrow-right-up-line" />
      </FaButton>
      <FaButton size="sm" variant="secondary" @click="openYmcl">
        <FaIcon name="i-ri:external-link-line" />
        打开 YMCL
      </FaButton>
    </div>
  </div>
</template>

<style scoped>
.ymcl-connect-card__intro { display: flex; align-items: center; gap: 10px; color: var(--color-text-1); }
.ymcl-connect-card__intro > :first-child { font-size: 26px; }
.ymcl-connect-card__intro strong { font-size: 17px; font-weight: 600; }
.ymcl-connect-card__actions { justify-content: space-between; border-top: 0; padding-top: 0; }
.ymcl-connect-card__hint { font-size: 10px; }
</style>
