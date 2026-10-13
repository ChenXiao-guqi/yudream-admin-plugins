<script setup lang="ts">
import type { SkinPluginModel } from '../composables/useSkinPlugin'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { FaButton, FaIcon, FaTag } from '@yudream/components'
import ClosetWorkbench from '../components/ClosetWorkbench.vue'
import SkinPanel from '../components/SkinPanel.vue'

const props = defineProps<{ model: SkinPluginModel }>()
const router = useRouter()
const basePath = '/platform/plugins/yudream-skin'
const isDefaultPlayer = computed(() => !!props.model.selectedPlayer && props.model.selectedPlayer.name === props.model.defaultPlayerName)
const description = computed(() => {
  if (!props.model.players.length) {
    return '先创建一个 Minecraft 角色，再从衣柜里选择喜欢的皮肤和披风。'
  }
  if (!props.model.closetItems.length) {
    return '角色已经准备好，去皮肤库收藏外观，就能在这里预览和换装。'
  }
  return '你的角色和衣柜都在这里，选择外观试穿，确认后应用到角色。'
})
</script>

<template>
  <section class="skin-page skin-overview">
    <header class="skin-overview__hero">
      <div class="skin-overview__copy">
        <span>我的皮肤站</span>
        <h2>{{ model.accountName || '玩家' }} 的皮肤与衣柜</h2>
        <p>{{ description }}</p>
      </div>
      <div class="skin-overview__actions">
        <FaButton variant="outline" @click="router.push(`${basePath}/players`)">
          <FaIcon name="morph:users" />
          {{ model.players.length ? '管理角色' : '创建角色' }}
        </FaButton>
        <FaButton @click="router.push(`${basePath}/textures`)">
          <FaIcon name="morph:shirt" />
          去皮肤库
        </FaButton>
      </div>
    </header>

    <div class="skin-overview__stats" aria-label="个人皮肤站概况">
      <div><span>我的角色</span><strong>{{ model.players.length }}</strong></div>
      <div><span>衣柜收藏</span><strong>{{ model.closetItems.length }}</strong></div>
      <div><span>可用材质</span><strong>{{ model.textures.length }}</strong></div>
    </div>

    <SkinPanel title="当前穿着">
      <template #header>
        <FaTag v-if="isDefaultPlayer" variant="secondary">默认角色</FaTag>
        <FaButton
          v-else-if="model.selectedPlayer"
          variant="outline"
          size="sm"
          :disabled="!!model.saving"
          :loading="model.saving.startsWith('default-player:')"
          @click="model.setDefaultPlayer()"
        >
          设为默认角色
        </FaButton>
      </template>
      <div v-if="model.selectedPlayer" class="skin-overview__equipment">
        <div class="skin-overview__player">
          <FaIcon name="morph:user-round" />
          <div><span>换装目标</span><strong>{{ model.selectedPlayer.name }}</strong></div>
        </div>
        <div><span>已装备皮肤</span><strong>{{ model.selectedPlayer.skinHash ? model.textureName(model.selectedPlayer.skinHash) : '默认皮肤' }}</strong></div>
        <div><span>已装备披风</span><strong>{{ model.selectedPlayer.capeHash ? model.textureName(model.selectedPlayer.capeHash) : '未装备' }}</strong></div>
      </div>
      <p v-else class="skin-overview__help">还没有角色。创建角色后即可从下方衣柜试穿并应用外观。</p>
    </SkinPanel>

    <section id="closet" class="skin-overview__closet" aria-label="我的衣柜">
      <ClosetWorkbench :model="model" />
    </section>
  </section>
</template>

<style scoped>
.skin-overview {
  gap: 16px;
}

.skin-overview__hero {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px;
  border: 1px solid var(--color-border-2);
  border-radius: 8px;
  background: var(--color-bg-2);
}

.skin-overview__copy {
  display: grid;
  min-width: 0;
  gap: 6px;
}

.skin-overview__copy > span,
.skin-overview__stats span,
.skin-overview__equipment span {
  color: var(--color-text-3);
  font-size: 12px;
}

.skin-overview__copy h2 {
  margin: 0;
  color: var(--color-text-1);
  font-size: clamp(20px, 2vw, 26px);
  overflow-wrap: anywhere;
}

.skin-overview__copy p,
.skin-overview__help {
  margin: 0;
  color: var(--color-text-3);
  font-size: 13px;
  line-height: 1.7;
}

.skin-overview__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.skin-overview__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.skin-overview__stats > div {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 12px 16px;
  border: 1px solid var(--color-border-2);
  border-radius: 8px;
  background: var(--color-bg-2);
}

.skin-overview__stats strong {
  color: var(--color-text-1);
  font-size: 24px;
}

.skin-overview__equipment {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.skin-overview__equipment > div,
.skin-overview__player > div {
  display: grid;
  min-width: 0;
  gap: 5px;
}

.skin-overview__equipment strong {
  color: var(--color-text-1);
  font-size: 14px;
  overflow-wrap: anywhere;
}

.skin-overview__equipment .skin-overview__player {
  display: flex;
  align-items: center;
  gap: 12px;
}

.skin-overview__player > svg {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  color: var(--color-text-2);
}

.skin-overview__closet {
  min-width: 0;
  scroll-margin-top: 24px;
}

@media (max-width: 768px) {
  .skin-overview__hero {
    padding: 16px;
  }

  .skin-overview__equipment {
    grid-template-columns: 1fr;
  }
}
</style>
