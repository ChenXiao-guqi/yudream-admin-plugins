<script setup lang="ts">
import { YdInput, YdTag } from '@yudream/components'
const model = defineModel<string[]>({ default: () => [] })
const input = defineModel<string>('input', { default: '' })
function add() { const value = input.value.trim().toLowerCase(); if (value && !model.value.includes(value) && model.value.length < 8) model.value = [...model.value, value]; input.value = '' }
function remove(tag: string) { model.value = model.value.filter(item => item !== tag) }
</script>
<template><div class="forum-tag-picker"><div class="forum-tag-picker__tags"><YdTag v-for="tag in model" :key="tag" variant="secondary" closable @close="remove(tag)">#{{ tag }}</YdTag></div><YdInput v-model="input" placeholder="输入标签后回车" @keyup.enter="add" /></div></template>
