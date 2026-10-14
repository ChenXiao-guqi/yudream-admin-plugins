<script setup lang="ts">
import type { YuDreamPluginSdk } from '@yudream/plugin-sdk'
import { computed } from 'vue'
import { YdMarkdownEditor } from '@yudream/components'
import { useYdToast } from '@yudream/components'
const props = defineProps<{ modelValue: string; sdk: YuDreamPluginSdk; placeholder?: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const toast = useYdToast()
const value = computed({ get: () => props.modelValue || '', set: v => emit('update:modelValue', v) })
async function upload(files: File[], callback: (urls: { url: string; alt: string; title: string }[]) => void) {
  try {
    const urls = await Promise.all(files.map(async file => {
      if (!file.type.startsWith('image/')) throw new Error('请选择图片文件')
      const result = await props.sdk.files.uploadImage(file, { module: 'forum', publicAccess: true })
      return { url: result.assetUrl || result.url || '', alt: file.name, title: file.name }
    }))
    callback(urls); toast.success('图片已上传')
  } catch (error) { toast.error(error instanceof Error ? error.message : '图片上传失败'); callback([]) }
}
</script>
<template>
  <YdMarkdownEditor v-model="value" :placeholder="placeholder" height="clamp(320px, 55vh, 520px)" :image-upload="upload" />
</template>
