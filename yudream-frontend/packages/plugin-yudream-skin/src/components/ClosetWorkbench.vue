<script setup lang="ts">
import type { SkinPluginModel } from '../composables/useSkinPlugin'
import type { SkinClosetItem } from '../types'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { FaButton, FaIcon, FaInput, FaModal, FaPagination, FaSelect, FaTag, useFaModal } from '@yudream/components'
import SkinPanel from './SkinPanel.vue'
import SkinPreview from './SkinPreview.vue'
import SkinTexturePreview from './SkinTexturePreview.vue'

const props = defineProps<{ model: SkinPluginModel }>()
const router = useRouter()
const modal = useFaModal()
const keyword = ref('')
const typeFilter = ref('all')
const page = ref(1)
const size = ref(12)
const pageSizes = [12, 24, 48, 96]
const typeOptions = [
  { label: '全部外观', value: 'all' },
  { label: '皮肤', value: 'skin' },
  { label: '披风', value: 'cape' },
]
const actionPending = ref(false)
const actionError = ref('')
const removeConfirmOpen = ref(false)
const renameVisible = ref(false)
const renameItemId = ref('')
const renameName = ref('')
const renameError = ref('')
const renamePending = ref(false)

const texturesByHash = computed(() => new Map(props.model.textures.map(texture => [texture.hash, texture])))
const filteredItems = computed(() => {
  const search = keyword.value.trim().toLocaleLowerCase()
  return props.model.closetItems.filter((item) => {
    const texture = texturesByHash.value.get(item.textureHash)
    if (typeFilter.value === 'cape' && texture?.type !== 'cape') return false
    if (typeFilter.value === 'skin' && (!texture || texture.type === 'cape')) return false
    return !search || [item.itemName, texture?.name, item.textureHash]
      .some(value => value?.toLocaleLowerCase().includes(search))
  })
})
const totalPages = computed(() => Math.max(1, Math.ceil(filteredItems.value.length / size.value)))
const pagedItems = computed(() => filteredItems.value.slice((page.value - 1) * size.value, page.value * size.value))
const busy = computed(() => props.model.loading || Boolean(props.model.saving) || actionPending.value || renamePending.value)
const interactionLocked = computed(() => busy.value || renameVisible.value || removeConfirmOpen.value)
const playerOptions = computed(() => props.model.players.map(player => ({
  label: `${player.name}${player.name === props.model.defaultPlayerName ? '（默认角色）' : ''}`,
  value: player.name,
})))
const playerName = computed({
  get: () => props.model.selectedPlayerName,
  set: (name: string) => {
    const player = props.model.players.find(player => player.name === name)
    if (player && !interactionLocked.value) props.model.selectPlayer(player)
  },
})
const selectedTitle = computed(() => props.model.selectedClosetItem ? itemName(props.model.selectedClosetItem) : '选择一件外观')
const selectedTexture = computed(() => props.model.selectedClosetTexture)
const previewSkin = computed(() => selectedTexture.value && selectedTexture.value.type !== 'cape'
  ? props.model.selectedClosetSkin
  : props.model.selectedPlayerSkin)
const previewCape = computed(() => selectedTexture.value?.type === 'cape'
  ? props.model.selectedClosetCape
  : props.model.selectedPlayerCape)
const previewSlim = computed(() => selectedTexture.value && selectedTexture.value.type !== 'cape'
  ? props.model.selectedClosetSlim
  : props.model.selectedPlayerSlim)
const selectedEquipped = computed(() => Boolean(props.model.selectedClosetItem && props.model.selectedPlayer && selectedTexture.value
  && (selectedTexture.value.type === 'cape' ? props.model.selectedPlayer.capeHash : props.model.selectedPlayer.skinHash) === props.model.selectedClosetItem.textureHash))
const canApply = computed(() => Boolean(props.model.selectedClosetItem && selectedTexture.value && props.model.selectedPlayer && !selectedEquipped.value))
const useLoading = computed(() => actionPending.value && Boolean(props.model.saving.startsWith('use-texture:')))
const removeLoading = computed(() => actionPending.value && Boolean(props.model.saving.startsWith('closet:')))

watch([keyword, typeFilter, size], () => { page.value = 1 })
watch(totalPages, (lastPage) => { page.value = Math.min(page.value, lastPage) })
watch([() => props.model.selectedClosetId, () => props.model.selectedPlayerName], () => { actionError.value = '' })
watch(renameVisible, (visible) => {
  if (!visible) {
    renameItemId.value = ''
    renameName.value = ''
    renameError.value = ''
    props.model.closetRenameForm.itemName = props.model.selectedClosetItem ? itemName(props.model.selectedClosetItem) : ''
  }
})

function itemName(item: SkinClosetItem) {
  return item.itemName || props.model.textureName(item.textureHash)
}

function itemKind(item: SkinClosetItem) {
  const texture = texturesByHash.value.get(item.textureHash)
  if (!texture) return '材质信息暂不可用'
  return texture.type === 'cape' ? '披风' : texture.model === 'slim' ? 'Alex 皮肤' : 'Steve 皮肤'
}

function isEquipped(item: SkinClosetItem) {
  const player = props.model.selectedPlayer
  const texture = texturesByHash.value.get(item.textureHash)
  return Boolean(player && texture && (texture.type === 'cape' ? player.capeHash : player.skinHash) === item.textureHash)
}

function selectItem(item: SkinClosetItem) {
  if (!interactionLocked.value) props.model.selectClosetItem(item)
}

function resetFilters() {
  keyword.value = ''
  typeFilter.value = 'all'
  page.value = 1
}

function errorText(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback
}

async function applyToPlayer() {
  if (interactionLocked.value || !canApply.value) return
  actionPending.value = true
  actionError.value = ''
  try {
    await props.model.useClosetItemOnSelectedPlayer()
  }
  catch (error) {
    actionError.value = errorText(error, '应用失败，请稍后重试。')
  }
  finally {
    actionPending.value = false
  }
}

function openRename() {
  const item = props.model.selectedClosetItem
  if (!item || interactionLocked.value) return
  renameItemId.value = item.id
  renameName.value = itemName(item)
  renameError.value = ''
  renameVisible.value = true
}

async function beforeRenameClose(action: 'confirm' | 'cancel' | 'close', done: () => void) {
  if (renamePending.value) return
  if (action !== 'confirm') {
    done()
    return
  }
  const item = props.model.closetItems.find(item => item.id === renameItemId.value)
  const name = renameName.value.trim()
  if (!item) {
    renameError.value = '这件外观已不在衣柜中，请关闭后重新选择。'
    return
  }
  if (!name) {
    renameError.value = '请填写显示名称。'
    return
  }
  if (busy.value) return
  renamePending.value = true
  renameError.value = ''
  props.model.closetRenameForm.itemName = name
  try {
    await props.model.renameClosetItem(item)
    done()
  }
  catch (error) {
    renameError.value = errorText(error, '重命名失败，请稍后重试。')
  }
  finally {
    renamePending.value = false
  }
}

function confirmRemove() {
  const item = props.model.selectedClosetItem
  if (!item || interactionLocked.value) return
  removeConfirmOpen.value = true
  actionError.value = ''
  const content = `确认将“${itemName(item)}”移出衣柜吗？这只会移除收藏，不会删除原始材质或更改角色已装备的外观。`
  const confirmation = modal.confirm({
    title: '移出衣柜',
    content,
    confirmButtonText: '移出衣柜',
    closeOnPressEscape: false,
    beforeClose: async (action, done) => {
      if (busy.value) return
      if (action !== 'confirm') {
        removeConfirmOpen.value = false
        done()
        return
      }
      actionPending.value = true
      try {
        await props.model.deleteClosetItem(item)
        removeConfirmOpen.value = false
        done()
      }
      catch (error) {
        actionError.value = errorText(error, '移出失败，请稍后重试。')
        confirmation.update({ content: `${content}\n${actionError.value}` })
      }
      finally {
        actionPending.value = false
      }
    },
  })
}
</script>

<template>
  <section class="skin-library-layout skin-closet-workbench" aria-label="我的衣柜与换装">
    <SkinPanel title="我的衣柜">
      <template #header>
        <div class="skin-closet-workbench__header-actions">
          <FaTag variant="secondary">{{ model.closetItems.length }} 件</FaTag>
          <FaButton size="sm" variant="outline" @click="router.push('/platform/plugins/yudream-skin/textures')">
            <FaIcon name="i-ri:add-line" />
            去皮肤库收藏
          </FaButton>
        </div>
      </template>

      <p class="skin-help-text">点击整张卡片试穿，在右侧选择目标角色并确认应用。</p>
      <div class="skin-filter-bar">
        <FaInput v-model="keyword" clearable class="skin-filter-keyword" placeholder="搜索衣柜名称、材质名称" aria-label="搜索衣柜" :disabled="model.loading">
          <template #start><FaIcon name="i-ri:search-line" /></template>
        </FaInput>
        <FaSelect v-model="typeFilter" class="skin-filter-select" :options="typeOptions" aria-label="外观类型" :disabled="model.loading" />
        <FaButton variant="outline" class="skin-filter-reset" :disabled="model.loading" @click="resetFilters">重置</FaButton>
      </div>

      <div v-if="model.loading && !model.closetItems.length" class="empty-state" role="status">正在加载衣柜…</div>
      <div v-else-if="!model.closetItems.length" class="empty-state skin-closet-workbench__empty">
        <FaIcon name="i-ri:archive-line" />
        <strong>衣柜还是空的</strong>
        <span>先去皮肤库收藏皮肤或披风，再回到这里为角色换装。</span>
        <FaButton @click="router.push('/platform/plugins/yudream-skin/textures')">浏览皮肤库</FaButton>
      </div>
      <div v-else-if="!filteredItems.length" class="empty-state skin-closet-workbench__empty">
        <strong>没有找到匹配的外观</strong>
        <span>可以换一个关键词，或重置类型筛选。</span>
        <FaButton variant="outline" @click="resetFilters">重置筛选</FaButton>
      </div>
      <div v-else class="skin-card-grid closet" :aria-busy="model.loading">
        <button
          v-for="item in pagedItems"
          :key="item.id"
          type="button"
          class="skin-texture-card skin-closet-workbench__card"
          :class="{ active: model.selectedClosetId === item.id }"
          :aria-pressed="model.selectedClosetId === item.id"
          :aria-label="`${itemName(item)}，${itemKind(item)}${isEquipped(item) ? '，当前角色已装备' : ''}`"
          :disabled="interactionLocked"
          @click="selectItem(item)"
        >
          <span v-if="model.selectedClosetId === item.id" class="skin-closet-workbench__selected">
            <FaTag variant="secondary"><FaIcon name="i-ri:checkbox-circle-fill" />已选中</FaTag>
          </span>
          <span class="skin-texture-card__image render">
            <SkinTexturePreview
              :texture-url="model.textureUrl(item.textureHash)"
              :type="texturesByHash.get(item.textureHash)?.type"
              :model="texturesByHash.get(item.textureHash)?.model"
            />
          </span>
          <span class="skin-texture-card__body">
            <strong :title="itemName(item)">{{ itemName(item) }}</strong>
            <small :title="model.textureName(item.textureHash)">{{ model.textureName(item.textureHash) }}</small>
          </span>
          <span class="skin-closet-workbench__card-meta">
            <span>{{ itemKind(item) }}</span>
            <FaTag v-if="isEquipped(item)" variant="secondary">已装备</FaTag>
          </span>
        </button>
      </div>
      <FaPagination
        v-if="filteredItems.length"
        v-model:page="page"
        v-model:size="size"
        :total="filteredItems.length"
        :sizes="pageSizes"
        class="skin-list-pagination mt-3"
        layout="total, sizes, ->, pager"
      />
    </SkinPanel>

    <aside class="skin-inspector skin-closet-workbench__inspector" aria-label="换装预览与操作">
      <div class="skin-closet-workbench__target">
        <label for="skin-closet-target-player">目标角色</label>
        <FaSelect
          id="skin-closet-target-player"
          v-model="playerName"
          :options="playerOptions"
          :disabled="interactionLocked || !model.players.length"
          placeholder="请选择目标角色"
          class="skin-closet-workbench__player-select"
        />
        <div class="skin-closet-workbench__status" aria-live="polite">
          <strong>{{ model.selectedPlayer?.name || '还没有目标角色' }}</strong>
          <FaTag v-if="selectedEquipped" variant="secondary">当前角色已装备</FaTag>
          <FaTag v-else-if="model.selectedClosetItem && selectedTexture" variant="secondary">仅预览 · 尚未应用</FaTag>
        </div>
      </div>

      <SkinPreview title="换装预览" :skin="previewSkin" :cape="previewCape" :slim="previewSlim" controls>
        <div class="preview-meta">
          <span :title="selectedTitle">{{ selectedTitle }}</span>
          <span>{{ model.selectedClosetItem ? itemKind(model.selectedClosetItem) : '当前角色外观' }}</span>
        </div>
      </SkinPreview>

      <div class="skin-closet-workbench__details">
        <div class="skin-detail-title">
          <strong :title="selectedTitle">{{ selectedTitle }}</strong>
          <span :title="selectedTexture?.name">{{ selectedTexture?.name || '从衣柜选择一件外观后再操作' }}</span>
        </div>
        <p class="skin-help-text">试穿会保留角色另一栏已装备的外观，点击“应用到角色”后才会保存。</p>
        <div v-if="model.selectedPlayer" class="skin-detail-meta">
          <div><span>已装备皮肤</span><strong :title="model.textureName(model.selectedPlayer.skinHash)">{{ model.textureName(model.selectedPlayer.skinHash) }}</strong></div>
          <div><span>已装备披风</span><strong :title="model.textureName(model.selectedPlayer.capeHash)">{{ model.textureName(model.selectedPlayer.capeHash) }}</strong></div>
        </div>
        <FaButton :disabled="interactionLocked || !canApply" :loading="useLoading" @click="applyToPlayer">
          <FaIcon name="i-ri:t-shirt-2-line" />
          {{ selectedEquipped ? '当前角色已装备' : '应用到角色' }}
        </FaButton>
        <div class="skin-closet-workbench__item-actions">
          <FaButton variant="outline" :disabled="interactionLocked || !model.selectedClosetItem" @click="openRename">
            <FaIcon name="i-ri:edit-2-line" />重命名
          </FaButton>
          <FaButton variant="destructive" :disabled="interactionLocked || !model.selectedClosetItem" :loading="removeLoading" @click="confirmRemove">
            <FaIcon name="i-ri:delete-bin-6-line" />移出衣柜
          </FaButton>
        </div>
        <p v-if="actionError" class="skin-help-text" role="alert">{{ actionError }}</p>
        <p v-if="model.selectedClosetItem && !selectedTexture" class="skin-help-text">这件外观的材质信息暂不可用，可以刷新页面后重试。</p>
        <div v-if="!model.players.length" class="skin-closet-workbench__no-player">
          <p class="skin-help-text">先创建一个角色，就可以应用试穿的外观。</p>
          <FaButton variant="outline" @click="router.push('/platform/plugins/yudream-skin/players')">创建角色</FaButton>
        </div>
      </div>
    </aside>

    <FaModal
      v-model="renameVisible"
      title="重命名衣柜外观"
      description="只修改衣柜中的显示名称，原始材质名称保持不变。"
      show-cancel-button
      confirm-button-text="保存名称"
      :confirm-button-loading="renamePending"
      :confirm-button-disabled="busy || !renameName.trim()"
      :closable="!renamePending"
      :close-on-click-overlay="!renamePending"
      :close-on-press-escape="!renamePending"
      :before-close="beforeRenameClose"
      class="sm:max-w-md"
    >
      <div class="skin-rename-form">
        <label>
          <span>显示名称</span>
          <FaInput v-model="renameName" :disabled="renamePending" placeholder="例如：夏日 Steve" :aria-invalid="Boolean(renameError)" @input="renameError = ''" />
        </label>
        <p v-if="renameError" class="skin-help-text" role="alert">{{ renameError }}</p>
      </div>
    </FaModal>
  </section>
</template>

<style scoped>
.skin-closet-workbench__header-actions,
.skin-closet-workbench__card-meta,
.skin-closet-workbench__status {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.skin-closet-workbench__card-meta {
  justify-content: space-between;
  color: var(--color-text-3);
  font-size: 12px;
}

.skin-closet-workbench__card {
  position: relative;
}

.skin-closet-workbench__card.active {
  border-color: var(--color-text-2);
  background: var(--color-fill-2);
  box-shadow: inset 0 0 0 1px var(--color-text-2);
}

.skin-closet-workbench__card:focus-visible {
  outline: 2px solid var(--color-text-2);
  outline-offset: 3px;
}

.skin-closet-workbench__card:disabled {
  cursor: default;
}

.skin-closet-workbench__selected {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 1;
}

.skin-closet-workbench__target,
.skin-closet-workbench__details,
.skin-closet-workbench__no-player {
  display: grid;
  min-width: 0;
  gap: 12px;
}

.skin-closet-workbench__target > label {
  color: var(--color-text-2);
  font-size: 12px;
  font-weight: 600;
}

.skin-closet-workbench__player-select {
  width: 100%;
}

.skin-closet-workbench__status strong {
  min-width: 0;
  overflow-wrap: anywhere;
  color: var(--color-text-1);
  font-size: 14px;
}

.skin-closet-workbench__item-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.skin-closet-workbench__empty {
  display: grid;
  grid-column: 1 / -1;
  justify-items: center;
  gap: 12px;
}

.skin-closet-workbench__empty strong {
  color: var(--color-text-1);
}

@container (max-width: 960px) {
  .skin-closet-workbench {
    grid-template-columns: 1fr;
  }

  .skin-closet-workbench__inspector {
    position: static;
  }
}

@media (max-width: 640px) {
  .skin-closet-workbench__header-actions {
    justify-content: flex-end;
  }

  .skin-closet-workbench__item-actions {
    grid-template-columns: 1fr;
  }
}
</style>
