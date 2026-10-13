<script setup lang="ts">
import type { YuDreamPluginSdk } from '@yudream/plugin-sdk'
import { FaButton, FaIcon, useFaToast } from '@yudream/components'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
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
const cardElement = ref<HTMLElement>()
const compact = ref(false)
let resizeObserver: ResizeObserver | undefined

onMounted(() => {
  if (!cardElement.value) {
    return
  }
  resizeObserver = new ResizeObserver(([entry]) => {
    if (entry) {
      compact.value = entry.contentRect.height < 150
    }
  })
  resizeObserver.observe(cardElement.value)
})
onBeforeUnmount(() => resizeObserver?.disconnect())

async function copyOrigin() {
  try {
    await navigator.clipboard.writeText(origin.value)
    toast.success('域站基址已复制')
  }
  catch { toast.error('复制失败，请在域概览中复制地址') }
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
  <div ref="cardElement" class="dashboard-card__content ymcl-connect-card" :class="{ 'ymcl-connect-card--compact': compact }">
    <FaButton variant="secondary" class="ymcl-connect-card__launch h-auto w-full justify-start whitespace-normal gap-3 px-3" :class="compact ? 'py-2' : 'py-3'" @click="openYmcl">
      <span class="ymcl-connect-card__launch-icon"><FaIcon name="i-ri:gamepad-line" /></span>
      <span class="ymcl-connect-card__launch-copy"><strong>打开 YMCL</strong><span>将本站加入你的启动器</span></span>
      <FaIcon name="i-ri:arrow-right-up-line" class="ymcl-connect-card__launch-arrow" />
    </FaButton>
    <FaButton variant="ghost" class="ymcl-connect-card__endpoint h-auto w-full min-w-0 justify-start px-1 py-1 gap-2" :title="`复制域站基址：${origin}`" aria-label="复制域站基址" @click="copyOrigin">
      <span class="ymcl-connect-card__endpoint-copy"><span>手动添加地址</span><code>{{ origin }}</code></span>
      <FaIcon name="i-ri:file-copy-line" class="ymcl-connect-card__copy" />
    </FaButton>
    <div class="ymcl-connect-card__support">
      <span>需安装 YMCL-Axolotl</span>
      <FaButton v-if="card?.actionPath" size="sm" variant="ghost" class="min-w-0 h-7 px-2 text-xs" @click="openPage">
        域概览<FaIcon name="i-ri:arrow-right-up-line" />
      </FaButton>
    </div>
  </div>
</template>
