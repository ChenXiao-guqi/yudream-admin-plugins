<script setup lang="ts">
import { YdCodeEditor } from '@yudream/components'

const props = withDefaults(defineProps<{
  modelValue: string
  language: 'json' | 'html' | 'css'
  readonly?: boolean
  minHeight?: number
}>(), { readonly: false, minHeight: 480 })
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <YdCodeEditor :model-value="modelValue" :language="language" :readonly="readonly" :height="`${props.minHeight}px`" aria-label="网页卡片模板代码" @update:model-value="emit('update:modelValue', $event)" />
</template>
