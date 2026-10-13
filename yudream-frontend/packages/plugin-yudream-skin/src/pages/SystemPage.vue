<script setup lang="ts">
import type { SkinPluginModel } from '../composables/useSkinPlugin'
import { YdLabel, YdButton, YdIcon, YdNumberField, YdPageHeader, YdPageMain, YdSwitch } from '@yudream/components'

defineProps<{ model: SkinPluginModel }>()
</script>

<template>
  <YdPageHeader title="皮肤插件设置" class="mb-0" />
  <YdPageMain>
    <form class="grid max-w-3xl gap-4" @submit.prevent="model.saveSettings">
      <YdLabel class="grid gap-2">
        <span>每个用户最大角色数</span>
        <YdNumberField v-model="model.settingsForm.maxPlayersPerUser" :min="0" :step="1" class="w-full" />
        <span class="text-sm text-muted-foreground">0 表示不限制。</span>
      </YdLabel>
      <div class="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
        <div class="grid gap-1">
          <strong>公开上传材质</strong>
          <span class="text-sm text-muted-foreground">{{ model.settingsForm.allowPublicUpload ? '允许普通用户公开上传' : '仅管理员可公开材质' }}</span>
        </div>
        <YdSwitch v-model="model.settingsForm.allowPublicUpload" />
      </div>
      <div class="flex justify-end gap-2">
        <YdButton type="submit" :loading="model.saving === 'settings'"><YdIcon name="i-ri:save-3-line" />保存设置</YdButton>
      </div>
    </form>
  </YdPageMain>
</template>
