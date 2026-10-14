<script setup lang="ts">
import { YdMultiSelect } from '@yudream/components'

withDefaults(defineProps<{
  /** 选项：value 为提交值，label 为展示文案 */
  options: { label: string, value: string }[]
  placeholder?: string
}>(), { placeholder: '搜索并选择（可多选）' })

const model = defineModel<string[]>({ default: () => [] })
</script>

<template>
  <YdMultiSelect v-model="model" :options="options" :placeholder="placeholder" allow-search :max-tag-count="4" />
</template>
