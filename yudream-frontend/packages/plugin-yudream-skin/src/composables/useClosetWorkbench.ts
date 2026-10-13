import type { SkinPluginModel } from './useSkinPlugin'
import type { SkinClosetItem } from '../types'
import { computed, ref, watch } from 'vue'
import { useYdModal } from '@yudream/components'

export function useClosetWorkbench(model: SkinPluginModel) {
  const modal = useYdModal()
  const keyword = ref('')
  const typeFilterValue = ref<string | number>('all')
  const typeFilter = computed({
    get: () => typeFilterValue.value,
    set: (value: string | number) => { if (!model.loading) typeFilterValue.value = value },
  })
  const page = ref(1)
  const size = ref(6)
  const pageSizes = [6, 12, 24]
  const typeOptions = computed(() => [
    { label: '全部外观', value: 'all' },
    { label: `皮肤 ${model.closetItems.filter(item => { const texture = texturesByHash.value.get(item.textureHash); return texture && texture.type !== 'cape' }).length}`, value: 'skin' },
    { label: `披风 ${model.closetItems.filter(item => texturesByHash.value.get(item.textureHash)?.type === 'cape').length}`, value: 'cape' },
  ])
  const actionPending = ref(false)
  const actionError = ref('')
  const removeConfirmOpen = ref(false)
  const renameVisible = ref(false)
  const renameItemId = ref('')
  const renameName = ref('')
  const renameError = ref('')
  const renamePending = ref(false)

  const texturesByHash = computed(() => new Map(model.textures.map(texture => [texture.hash, texture])))
  const filteredItems = computed(() => {
    const search = (keyword.value || '').trim().toLocaleLowerCase()
    return model.closetItems.filter((item) => {
      const texture = texturesByHash.value.get(item.textureHash)
      if (typeFilter.value === 'cape' && texture?.type !== 'cape') return false
      if (typeFilter.value === 'skin' && (!texture || texture.type === 'cape')) return false
      return !search || [item.itemName, texture?.name, item.textureHash]
        .some(value => value?.toLocaleLowerCase().includes(search))
    })
  })
  const totalPages = computed(() => Math.max(1, Math.ceil(filteredItems.value.length / size.value)))
  const pagedItems = computed(() => filteredItems.value.slice((page.value - 1) * size.value, page.value * size.value))
  const busy = computed(() => model.loading || Boolean(model.saving) || actionPending.value || renamePending.value)
  const interactionLocked = computed(() => busy.value || renameVisible.value || removeConfirmOpen.value)
  const playerOptions = computed(() => model.players.map(player => ({
    label: `${player.name}${player.name === model.defaultPlayerName ? '（默认角色）' : ''}`,
    value: player.name,
  })))
  const playerName = computed({
    get: () => model.selectedPlayerName,
    set: (name: string) => {
      const player = model.players.find(player => player.name === name)
      if (player && !interactionLocked.value) model.selectPlayer(player)
    },
  })
  const selectedTitle = computed(() => model.selectedClosetItem ? itemName(model.selectedClosetItem) : '选择一件外观')
  const selectedTexture = computed(() => model.selectedClosetTexture)
  const previewSkin = computed(() => selectedTexture.value && selectedTexture.value.type !== 'cape'
    ? model.selectedClosetSkin
    : model.selectedPlayerSkin)
  const previewCape = computed(() => selectedTexture.value?.type === 'cape'
    ? model.selectedClosetCape
    : model.selectedPlayerCape)
  const previewSlim = computed(() => selectedTexture.value && selectedTexture.value.type !== 'cape'
    ? model.selectedClosetSlim
    : model.selectedPlayerSlim)
  const selectedEquipped = computed(() => Boolean(model.selectedClosetItem && model.selectedPlayer && selectedTexture.value
    && (selectedTexture.value.type === 'cape' ? model.selectedPlayer.capeHash : model.selectedPlayer.skinHash) === model.selectedClosetItem.textureHash))
  const canApply = computed(() => Boolean(model.selectedClosetItem && selectedTexture.value && model.selectedPlayer && !selectedEquipped.value))
  const useLoading = computed(() => actionPending.value && Boolean(model.saving.startsWith('use-texture:')))
  const removeLoading = computed(() => actionPending.value && Boolean(model.saving.startsWith('closet:')))

  watch([keyword, typeFilter, size], () => { page.value = 1 })
  watch(totalPages, (lastPage) => { page.value = Math.min(page.value, lastPage) })
  watch([() => model.selectedClosetId, () => model.selectedPlayerName], () => { actionError.value = '' })
  watch(renameVisible, (visible) => {
    if (!visible) {
      renameItemId.value = ''
      renameName.value = ''
      renameError.value = ''
      model.closetRenameForm.itemName = model.selectedClosetItem ? itemName(model.selectedClosetItem) : ''
    }
  })

  function itemName(item: SkinClosetItem) {
    return item.itemName || model.textureName(item.textureHash)
  }

  function itemKind(item: SkinClosetItem) {
    const texture = texturesByHash.value.get(item.textureHash)
    if (!texture) return '材质信息暂不可用'
    return texture.type === 'cape' ? '披风' : texture.model === 'slim' ? 'Alex 皮肤' : 'Steve 皮肤'
  }

  function isEquipped(item: SkinClosetItem) {
    const player = model.selectedPlayer
    const texture = texturesByHash.value.get(item.textureHash)
    return Boolean(player && texture && (texture.type === 'cape' ? player.capeHash : player.skinHash) === item.textureHash)
  }

  function selectItem(item: SkinClosetItem) {
    if (!interactionLocked.value) model.selectClosetItem(item)
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
      await model.useClosetItemOnSelectedPlayer()
    }
    catch (error) {
      actionError.value = errorText(error, '应用失败，请稍后重试。')
    }
    finally {
      actionPending.value = false
    }
  }

  function openRename() {
    const item = model.selectedClosetItem
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
    const item = model.closetItems.find(item => item.id === renameItemId.value)
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
    model.closetRenameForm.itemName = name
    try {
      await model.renameClosetItem(item)
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
    const item = model.selectedClosetItem
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
          await model.deleteClosetItem(item)
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

  const isDefaultPlayer = computed(() => Boolean(model.selectedPlayer && model.selectedPlayer.name === model.defaultPlayerName))
  async function setDefaultPlayer() {
    if (interactionLocked.value || !model.selectedPlayer || isDefaultPlayer.value) return
    actionPending.value = true
    actionError.value = ''
    try { await model.setDefaultPlayer() }
    catch (error) { actionError.value = errorText(error, '设置默认角色失败，请重试。') }
    finally { actionPending.value = false }
  }

  return {
    keyword, typeFilter, page, size, pageSizes, typeOptions, actionError,
    renameVisible, renameName, renameError, renamePending, texturesByHash,
    filteredItems, pagedItems, busy, interactionLocked, playerOptions, playerName,
    selectedTitle, selectedTexture, previewSkin, previewCape, previewSlim,
    selectedEquipped, canApply, useLoading, removeLoading, isDefaultPlayer,
    itemName, itemKind, isEquipped, selectItem, resetFilters, applyToPlayer,
    openRename, beforeRenameClose, confirmRemove, setDefaultPlayer,
  }
}
