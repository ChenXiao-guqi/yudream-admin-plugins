<script setup lang="ts">
import type { SkinPluginModel } from '../composables/useSkinPlugin'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { YdLabel,
  YdAlert, YdButton, YdCard, YdEmpty, YdIcon, YdInput, YdLoading,
  YdModal, YdPagination, YdSelect, YdSpotlightCard, YdTabs, YdTag,
} from '@yudream/components'
import { useClosetWorkbench } from '../composables/useClosetWorkbench'
import SkinPreview from './SkinPreview.vue'
import SkinTexturePreview from './SkinTexturePreview.vue'

const props = defineProps<{ model: SkinPluginModel }>()
const router = useRouter()
const previewBack = ref(false)
const {
  keyword, typeFilter, page, size, pageSizes, typeOptions, actionError,
  renameVisible, renameName, renameError, renamePending, texturesByHash,
  filteredItems, pagedItems, busy, interactionLocked, playerOptions, playerName,
  selectedTitle, selectedTexture, previewSkin, previewCape, previewSlim,
  selectedEquipped, canApply, useLoading, removeLoading, isDefaultPlayer,
  itemName, itemKind, isEquipped, selectItem, resetFilters, applyToPlayer,
  openRename, beforeRenameClose, confirmRemove, setDefaultPlayer,
} = useClosetWorkbench(props.model)
</script>

<template>
  <section class="studio-workspace" aria-label="衣柜与换装工作区">
    <YdCard class="studio-library gap-0 py-0" v-bind="{ headerClass: 'studio-library__header', contentClass: 'studio-library__content' }">
      <template #header>
        <div class="studio-heading">
          <div class="studio-title-line">
            <YdIcon name="morph:archive" class="studio-section-icon" />
            <h2>我的衣柜</h2>
            <YdTag variant="secondary">{{ model.closetItems.length }} 件收藏</YdTag>
          </div>
          <p>把喜欢的外观留在这里，点选整张卡片即可试穿。</p>
        </div>
      </template>
      <div class="studio-toolbar">
        <YdTabs v-model="typeFilter" :list="typeOptions" class="studio-type-tabs" content-class="hidden" />
        <YdInput v-model="keyword" class="studio-search" clearable type="search" placeholder="搜索收藏名称…" aria-label="搜索衣柜" :disabled="model.loading">
          <template #start><YdIcon name="morph:search" /></template>
        </YdInput>
      </div>
      <YdLoading v-if="model.loading && !model.closetItems.length" text="正在加载衣柜…" class="studio-empty" />
      <div v-else-if="pagedItems.length" class="studio-item-grid" aria-label="收藏的外观" :aria-busy="model.loading">
        <YdButton
          v-for="item in pagedItems" :key="item.id"
          :variant="model.selectedClosetId === item.id ? 'secondary' : 'ghost'"
          class="studio-item h-auto w-full whitespace-normal"
          :aria-pressed="model.selectedClosetId === item.id"
          :aria-label="`${itemName(item)}，${itemKind(item)}${isEquipped(item) ? '，已装备' : ''}`"
          :disabled="interactionLocked" @click="selectItem(item)"
        >
          <span class="studio-item__image">
            <SkinTexturePreview :texture-url="model.textureUrl(item.textureHash)" :type="texturesByHash.get(item.textureHash)?.type" :model="texturesByHash.get(item.textureHash)?.model" />
            <YdTag v-if="model.selectedClosetId === item.id" class="studio-item__selected" variant="secondary" icon="morph:circle-check">已选中</YdTag>
            <YdTag v-if="isEquipped(item)" class="studio-item__equipped" variant="secondary" icon="morph:check">已装备</YdTag>
          </span>
          <span class="studio-item__name" :title="itemName(item)">{{ itemName(item) }}</span>
          <span class="studio-item__description" :title="model.textureName(item.textureHash)">{{ itemKind(item) }} · {{ model.textureName(item.textureHash) }}</span>
        </YdButton>
      </div>
      <YdEmpty v-else class="studio-empty" icon="morph:archive" :title="model.closetItems.length ? '没有找到这件外观' : '衣柜还是空的'" :description="model.closetItems.length ? '换个关键词，或看看其他外观类型。' : '去皮肤库收藏皮肤和披风，就能在这里试穿。'">
        <YdButton v-if="model.closetItems.length" variant="outline" @click="resetFilters">清除筛选</YdButton>
        <YdButton v-else @click="router.push('/platform/plugins/yudream-skin/textures')">浏览皮肤库</YdButton>
      </YdEmpty>
      <div v-if="filteredItems.length" class="studio-library__footer">
        <YdPagination v-model:page="page" v-model:size="size" :total="filteredItems.length" :sizes="pageSizes" layout="total, sizes, ->, pager" />
      </div>
    </YdCard>

    <aside class="studio-fitting" aria-label="角色试衣间">
      <YdCard class="studio-fitting-card gap-0 py-0" v-bind="{ headerClass: 'studio-fitting-card__header', contentClass: 'studio-fitting-card__content' }">
        <template #header>
          <div class="studio-title-line"><YdIcon name="morph:person-standing" class="studio-section-icon" /><h2>角色试衣间</h2></div>
          <YdTag v-if="isDefaultPlayer" variant="secondary" icon="morph:star">默认角色</YdTag>
          <YdButton v-else-if="model.selectedPlayer" variant="ghost" size="sm" :disabled="interactionLocked" :loading="model.saving.startsWith('default-player:')" @click="setDefaultPlayer">设为默认</YdButton>
        </template>
        <div class="studio-target">
          <YdLabel id="studio-player-label">换装目标</YdLabel>
          <YdSelect v-model="playerName" :options="playerOptions" :disabled="interactionLocked || !model.players.length" placeholder="选择角色" class="w-full" aria-labelledby="studio-player-label" />
        </div>
        <YdSpotlightCard class="studio-stage border-0 shadow-none" :gradient-opacity="0.1">
          <div class="studio-stage__state" aria-live="polite">
            <YdTag v-if="selectedEquipped" variant="secondary" icon="morph:circle-check">当前角色已装备</YdTag>
            <YdTag v-else-if="model.selectedClosetItem && selectedTexture" variant="outline">仅试穿 · 尚未应用</YdTag>
            <YdTag v-else variant="outline">当前角色外观</YdTag>
          </div>
          <SkinPreview class="studio-renderer" :skin="previewSkin" :cape="previewCape" :slim="previewSlim" :frame-width="300" :frame-height="240" :auto-rotate="false" :view="previewBack ? 'back' : 'front'" controls />
          <div class="studio-stage__controls">
            <YdButton variant="ghost" size="sm" @click="previewBack = !previewBack"><YdIcon name="morph:flip-horizontal-2" />{{ previewBack ? '查看正面' : '查看背面' }}</YdButton>
          </div>
        </YdSpotlightCard>
        <div class="studio-selection">
          <div class="studio-selection__title">
            <h3 :title="selectedTitle">{{ selectedTitle }}</h3>
            <span class="studio-selection__kind">{{ model.selectedClosetItem ? itemKind(model.selectedClosetItem) : '' }}</span>
          </div>
          <div v-if="model.selectedPlayer" class="studio-equipment" aria-label="角色当前装备">
            <div><span><YdIcon name="morph:shirt" />当前皮肤</span><strong :title="model.textureName(model.selectedPlayer.skinHash)">{{ model.selectedPlayer.skinHash ? model.textureName(model.selectedPlayer.skinHash) : '默认皮肤' }}</strong></div>
            <div><span><YdIcon name="morph:flag" />当前披风</span><strong :title="model.textureName(model.selectedPlayer.capeHash)">{{ model.selectedPlayer.capeHash ? model.textureName(model.selectedPlayer.capeHash) : '未装备' }}</strong></div>
          </div>
          <YdButton class="w-full" :disabled="interactionLocked || !canApply" :loading="useLoading" @click="applyToPlayer">
            <YdIcon :name="selectedEquipped ? 'morph:circle-check' : 'morph:shirt'" />{{ selectedEquipped ? '已装备这件外观' : '应用到角色' }}
          </YdButton>
          <p class="studio-apply-note">{{ model.selectedPlayer ? '应用后保存到当前角色，另一件装备会保留。' : '先创建一个角色，再为它应用外观。' }}</p>
          <YdButton v-if="!model.players.length" class="mt-3 w-full" variant="outline" @click="router.push('/platform/plugins/yudream-skin/players')">创建角色</YdButton>
          <div class="studio-selection__actions">
            <YdButton variant="ghost" size="sm" :disabled="interactionLocked || !model.selectedClosetItem" @click="openRename"><YdIcon name="morph:pencil" />重命名</YdButton>
            <YdButton variant="outline" size="sm" :disabled="interactionLocked || !model.selectedClosetItem" :loading="removeLoading" @click="confirmRemove"><YdIcon name="morph:archive-x" />移出衣柜</YdButton>
          </div>
          <YdAlert v-if="actionError" class="mt-3" title="操作未完成" :description="actionError" />
          <div v-if="model.refreshError" class="mt-3 grid gap-3">
            <YdAlert title="已保存，刷新未完成" :description="model.refreshError" />
            <YdButton variant="outline" :disabled="busy" @click="model.retryRefresh">重新加载</YdButton>
          </div>
          <YdAlert v-if="model.selectedClosetItem && !selectedTexture" class="mt-3" title="材质暂不可用" description="这件收藏的材质信息暂不可用，请刷新页面后重试。" />
        </div>
      </YdCard>
    </aside>

    <YdModal v-model="renameVisible" title="重命名收藏" description="只修改衣柜中的显示名称，原始材质保持不变。" show-cancel-button confirm-button-text="保存名称" :confirm-button-loading="renamePending" :confirm-button-disabled="busy || !renameName.trim()" :closable="!renamePending" :close-on-click-overlay="!renamePending" :close-on-press-escape="!renamePending" :before-close="beforeRenameClose" class="sm:max-w-md">
      <div class="studio-rename">
        <YdLabel for="studio-rename-name">收藏名称</YdLabel>
        <YdInput id="studio-rename-name" v-model="renameName" :disabled="renamePending" placeholder="输入收藏名称" :aria-invalid="Boolean(renameError)" @input="renameError = ''" />
        <YdAlert v-if="renameError" title="名称未保存" :description="renameError" />
      </div>
    </YdModal>
  </section>
</template>

<style scoped>
.studio-workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  align-items: start;
  gap: var(--yd-workspace-gap, 24px);
  min-width: 0;
}

.studio-workspace > *,
.studio-heading,
.studio-fitting-card {
  min-width: 0;
}

.studio-library :deep(.studio-library__header),
.studio-fitting-card :deep(.studio-fitting-card__header) {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-block: 16px;
}

.studio-title-line {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.studio-title-line h2 {
  margin: 0;
  color: var(--color-text-1);
  font-size: 17px;
  font-weight: 650;
  line-height: 1.5;
}

.studio-section-icon {
  width: 19px;
  height: 19px;
  color: var(--color-text-2);
}

.studio-heading p,
.studio-stage__hint,
.studio-apply-note {
  margin: 7px 0 0;
  color: var(--color-text-3);
  font-size: 12px;
  line-height: 1.6;
}

.studio-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 2px 0 16px;
}

.studio-type-tabs {
  min-width: 278px;
}

.studio-search {
  flex: 0 1 240px;
  width: 240px;
  min-width: 200px;
}

.studio-item-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.studio-item {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: start;
  gap: 0;
  min-width: 0;
  padding: 10px;
  height: auto;
  text-align: left;
}

.studio-item__image {
  position: relative;
  display: grid;
  min-height: 120px;
  overflow: hidden;
  place-items: center;
  border-radius: var(--yd-surface-radius, 10px);
  background: var(--color-fill-1);
}

.studio-item__image :deep(.skin-texture-preview) {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: center;
  gap: 12px;
  padding: 8px 20px 6px;
  width: 100%;
  height: 100%;
  background: transparent;
}

.studio-item__image :deep(.skin-texture-preview.cape) {
  grid-template-columns: 1fr;
  justify-items: center;
}

.studio-item__image :deep(.skin-texture-preview__pane) {
  display: grid;
  align-items: center;
  justify-items: center;
  gap: 5px;
  min-width: 0;
}

.studio-item__image :deep(.skin-texture-preview__label) {
  color: var(--color-text-4);
  font-size: 9px;
  line-height: 1;
  font-weight: 400;
}

.studio-item__image :deep(.skin-texture-preview__canvas) {
  display: block;
  max-width: 100%;
  height: 90px;
  width: auto;
  object-fit: contain;
  image-rendering: pixelated;
}

.studio-item__selected {
  position: absolute;
  right: 8px;
  top: 8px;
}

.studio-item__name {
  margin-top: 10px;
  overflow: hidden;
  color: var(--color-text-1);
  font-size: 14px;
  line-height: 1.5;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.studio-item__description {
  overflow: hidden;
  margin-top: 3px;
  color: var(--color-text-3);
  font-size: 11px;
  line-height: 1.5;
  font-weight: 400;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.studio-item__equipped {
  position: absolute;
  right: 8px;
  bottom: 8px;
}

.studio-library__footer {
  padding-top: 18px;
  margin-top: 14px;
  border-top: 1px solid var(--color-border-1);
}

.studio-library__footer :deep([data-slot="pagination-content"]) {
  flex-wrap: wrap;
}

.studio-fitting {
  position: sticky;
  top: 20px;
}

.studio-target {
  display: grid;
  gap: 8px;
  margin: 0 0 14px;
}

.studio-target > label,
.studio-rename > label {
  color: var(--color-text-3);
  font-size: 12px;
  line-height: 1.5;
}

.studio-stage {
  background: var(--color-fill-1);
  overflow: hidden;
}

.studio-stage :deep(.yd-spotlight-content) {
  padding: 8px 0;
}

.studio-stage__state {
  display: flex;
  justify-content: center;
  position: relative;
  z-index: 1;
  min-height: 26px;
}

.studio-stage :deep(.skin-preview__toolbar) {
  justify-content: center;
  padding: 8px 0;
}

.studio-renderer {
  display: grid;
  justify-content: center;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
  padding: 0;
  border: 0;
  background: transparent;
}

.studio-renderer :deep(.skin-preview__stage) {
  display: grid;
  place-items: center;
  min-width: 0;
  max-width: 100%;
  min-height: 240px;
  background: transparent;
}

.studio-renderer :deep(canvas) {
  display: block;
  max-width: 100%;
  object-fit: contain;
}

.studio-renderer :deep(.skin-preview__empty) {
  display: grid;
  place-items: center;
  align-content: center;
  min-height: 240px;
  gap: 8px;
  color: var(--color-text-3);
  text-align: center;
}

.studio-stage__controls {
  display: flex;
  justify-content: center;
  gap: 4px;
}

.studio-stage__hint {
  margin: 6px 0 0;
  text-align: center;
  font-size: 10px;
}

.studio-selection {
  padding-top: 12px;
}

.studio-selection__title {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.studio-selection__title > span,
.studio-selection__kind {
  color: var(--color-text-3);
  font-size: 12px;
}

.studio-selection__title h3 {
  margin: 5px 0 3px;
  color: var(--color-text-1);
  font-size: 19px;
  line-height: 1.45;
  font-weight: 650;
  overflow-wrap: anywhere;
}

.studio-equipment {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin: 12px 0 14px;
  padding: 10px 0;
  border-top: 1px solid var(--color-border-1);
  border-bottom: 1px solid var(--color-border-1);
}

.studio-equipment > div {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
  gap: 5px;
  font-size: 12px;
}

.studio-equipment > div > span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  color: var(--color-text-3);
}

.studio-equipment svg {
  width: 14px;
  height: 14px;
}

.studio-equipment strong {
  max-width: 100%;
  overflow: hidden;
  color: var(--color-text-2);
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.studio-apply-note {
  text-align: center;
  font-size: 10px;
}

.studio-selection__actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 10px;
}

.studio-empty {
  display: grid;
  justify-items: center;
  align-content: center;
  min-height: 420px;
  gap: 10px;
  color: var(--color-text-3);
}

.studio-empty > svg {
  width: 36px;
  height: 36px;
  margin-bottom: 5px;
}

.studio-empty > strong {
  color: var(--color-text-2);
  font-size: 16px;
}

.studio-empty p {
  margin: 0 0 5px;
  font-size: 12px;
  text-align: center;
}

.studio-rename {
  display: grid;
  gap: 8px;
}

.studio-rename p {
  margin: 0;
  color: var(--color-text-2);
  font-size: 12px;
}

@container (max-width: 960px) and (min-width: 769px) {
  .studio-workspace {
    gap: 16px;
    grid-template-columns: minmax(0, 1fr) 330px;
  }

  .studio-item-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .studio-search {
    flex: 1 1 200px;
    width: 100%;
  }

}

@container (max-width: 768px) {
  .studio-workspace {
    display: flex;
    flex-direction: column-reverse;
    gap: 20px;
  }

  .studio-workspace > * {
    width: 100%;
  }

  .studio-fitting {
    position: static;
  }

  .studio-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .studio-search {
    width: 100%;
    flex: auto;
    min-width: 0;
  }

  .studio-type-tabs {
    min-width: 0;
  }

  .studio-item-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .studio-item__image :deep(.skin-texture-preview) {
    padding-inline: 12px;
    gap: 8px;
  }

}

@container (max-width: 400px) {
  .studio-item-grid {
    gap: 8px;
  }

  .studio-item {
    padding: 6px;
  }

  .studio-item__image {
    min-height: 120px;
  }

  .studio-item__image :deep(.skin-texture-preview__canvas) {
    height: 90px;
  }
}
</style>
