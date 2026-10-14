<script setup lang="ts">
import type { TableColumn } from '@yudream/components'
import type { InheritanceRule } from '../types'
import { YdButton, YdCard, YdIcon, YdInput, YdResponsiveTable } from '@yudream/components'
import type { MinecraftServerPluginModel } from '../composables/useMinecraftServerPlugin'

defineProps<{ model: MinecraftServerPluginModel }>()
const columns: TableColumn<InheritanceRule>[] = [
  { id: 'assetPattern', header: '币种匹配', width: 180 }, { id: 'minAmount', header: '最低金额', width: 140 },
  { id: 'maxAmount', header: '最高金额', width: 140 }, { id: 'inheritRate', header: '继承比例', width: 140 },
  { id: 'operation', header: '操作', width: 90, align: 'center', fixed: 'right' },
]
</script>

<template>
  <section>
    <div class="mc-section-title">
      <strong>继承规则</strong>
      <div class="mc-actions"><YdButton size="sm" variant="outline" type="button" @click="model.resetRules">恢复默认</YdButton><YdButton size="sm" type="button" @click="model.addRule"><YdIcon name="i-ri:add-line" />新增规则</YdButton></div>
    </div>
    <YdResponsiveTable :row-key="(_row, index) => String(index)" table-root-class="max-w-full overflow-x-auto rounded-lg" border stripe :columns="columns" :data="model.seasonForm.rules">
      <template #cell-assetPattern="{ row }"><YdInput v-model="row.original.assetPattern" /></template>
      <template #cell-minAmount="{ row }"><YdInput v-model="row.original.minAmount" /></template>
      <template #cell-maxAmount="{ row }"><YdInput v-model="row.original.maxAmount" /></template>
      <template #cell-inheritRate="{ row }"><YdInput v-model="row.original.inheritRate" /></template>
      <template #cell-operation="{ index }"><YdButton size="sm" variant="destructive" type="button" @click="model.removeRule(index)"><YdIcon name="i-ri:delete-bin-line" /></YdButton></template>
      <template #card="{ row, index }">
        <YdCard class="w-full">
          <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between gap-2">
              <span class="min-w-0 break-words text-base font-semibold">币种匹配</span>
              <YdInput v-model="row.assetPattern" class="w-36 shrink-0" />
            </div>
            <div class="flex flex-col gap-2 text-sm">
              <div class="flex items-center justify-between gap-2">
                <span class="shrink-0 text-secondary-foreground/60">最低金额</span>
                <YdInput v-model="row.minAmount" class="w-28 shrink-0" />
              </div>
              <div class="flex items-center justify-between gap-2">
                <span class="shrink-0 text-secondary-foreground/60">最高金额</span>
                <YdInput v-model="row.maxAmount" class="w-28 shrink-0" />
              </div>
              <div class="flex items-center justify-between gap-2">
                <span class="shrink-0 text-secondary-foreground/60">继承比例</span>
                <YdInput v-model="row.inheritRate" class="w-28 shrink-0" />
              </div>
            </div>
            <div class="flex flex-wrap gap-2 border-t pt-3">
              <YdButton size="sm" variant="destructive" type="button" @click="model.removeRule(index)"><YdIcon name="i-ri:delete-bin-line" /></YdButton>
            </div>
          </div>
        </YdCard>
      </template>
    </YdResponsiveTable>
  </section>
</template>
