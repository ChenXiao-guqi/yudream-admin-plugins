<script setup lang="ts">
import type { TableColumn } from '@yudream/components'
import type { MinecraftServer } from '../types'
import type { MinecraftServerPluginModel } from '../composables/useMinecraftServerPlugin'
import { useRouter } from 'vue-router'
import { YdButton, YdCard, YdIcon, YdPageHeader, YdPageMain, YdPagination, YdResponsiveTable, YdSearchBar, YdTag, useYdModal } from '@yudream/components'

const props = defineProps<{ model: MinecraftServerPluginModel }>()
const router = useRouter()
const modal = useYdModal()
const columns: TableColumn<MinecraftServer>[] = [
  { accessorKey: 'name', header: '服务器', width: 240, fixed: 'left' },
  { id: 'status', header: '状态', width: 100, align: 'center' },
  { id: 'enabled', header: '发布', width: 100, align: 'center' },
  { accessorKey: 'sort', header: '排序', width: 80, align: 'center' },
  { id: 'operation', header: '操作', width: 320, align: 'center', fixed: 'right' },
]
function go(component: 'Editor' | 'Seasons' | 'Operations' | 'Players', id?: string) {
  return router.push({ path: `/platform/plugins/minecraft-server/admin/${component.toLowerCase()}`, query: id ? { id } : {} })
}
async function reload() { await props.model.load(true) }
function confirmToggleServer(server: MinecraftServer) {
  const ending = server.enabled
  modal.confirm({
    title: ending ? '结束服务器' : '恢复服务器',
    content: ending
      ? `确认结束“${server.name}”吗？结束后将从 QQ 服务器列表移除，并归档到网站的已关闭服务器列表。`
      : `确认恢复“${server.name}”运营吗？`,
    onConfirm: () => props.model.toggleServerEnabled(server),
  })
}
</script>

<template>
  <YdPageHeader title="服务器管理" class="mb-0">
    <YdButton @click="go('Editor')"><YdIcon name="i-ri:add-line" />新增服务器</YdButton>
  </YdPageHeader>
  <YdPageMain>
    <YdResponsiveTable row-key="id" table-root-class="max-w-full overflow-x-auto rounded-lg" table-class="min-w-[980px]" border stripe column-visibility :columns="columns" :data="model.servers">
      <template #toolbar><YdSearchBar class="w-full"><div class="flex justify-end gap-2"><YdButton variant="outline" :loading="model.loading" @click="reload"><YdIcon name="i-ri:refresh-line" />刷新</YdButton></div></YdSearchBar></template>
      <template #cell-name="{ row }"><div class="grid gap-1"><strong>{{ row.original.name }}</strong><span class="font-mono text-xs text-muted-foreground">ID: {{ row.original.id }}</span></div></template>
      <template #cell-status="{ row }"><YdTag :variant="row.original.status?.status === 'ONLINE' ? 'default' : 'secondary'">{{ model.statusText(row.original.status?.status) }}</YdTag></template>
      <template #cell-enabled="{ row }">{{ row.original.enabled ? '启用' : '停用' }}</template>
      <template #cell-operation="{ row }"><div class="flex flex-wrap justify-center gap-2"><YdButton size="sm" :variant="row.original.enabled ? 'destructive' : 'outline'" :loading="model.saving" @click="confirmToggleServer(row.original)">{{ row.original.enabled ? '结束服务器' : '恢复运营' }}</YdButton><YdButton size="sm" variant="outline" @click="go('Editor', row.original.id)">编辑</YdButton><YdButton size="sm" variant="outline" @click="go('Seasons', row.original.id)">周目</YdButton><YdButton size="sm" variant="outline" @click="go('Operations', row.original.id)">操作记录</YdButton><YdButton size="sm" variant="outline" @click="go('Players', row.original.id)">玩家统计</YdButton></div></template>
      <template #card="{ row }">
        <YdCard class="w-full">
          <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between gap-2">
              <span class="min-w-0 break-words text-base font-semibold">{{ row.name }}</span>
              <div class="flex gap-1">
                <YdTag :variant="row.status?.status === 'ONLINE' ? 'default' : 'secondary'">{{ model.statusText(row.status?.status) }}</YdTag>
                <YdTag :variant="row.enabled ? 'default' : 'secondary'">{{ row.enabled ? '启用' : '停用' }}</YdTag>
              </div>
            </div>
            <div class="flex flex-col gap-1 text-sm">
              <div class="flex gap-2">
                <span class="shrink-0 text-secondary-foreground/60">ID</span>
                <span class="break-all">{{ row.id }}</span>
              </div>
              <div class="flex gap-2">
                <span class="shrink-0 text-secondary-foreground/60">排序</span>
                <span class="break-all">{{ row.sort }}</span>
              </div>
            </div>
            <div class="flex flex-wrap gap-2 border-t pt-3">
              <YdButton size="sm" :variant="row.enabled ? 'destructive' : 'outline'" :loading="model.saving" @click="confirmToggleServer(row)">{{ row.enabled ? '结束服务器' : '恢复运营' }}</YdButton>
              <YdButton size="sm" variant="outline" @click="go('Editor', row.id)">编辑</YdButton>
              <YdButton size="sm" variant="outline" @click="go('Seasons', row.id)">周目</YdButton>
              <YdButton size="sm" variant="outline" @click="go('Operations', row.id)">操作记录</YdButton>
              <YdButton size="sm" variant="outline" @click="go('Players', row.id)">玩家统计</YdButton>
            </div>
          </div>
        </YdCard>
      </template>
    </YdResponsiveTable>
    <YdPagination v-model:page="model.serverPager.page" v-model:size="model.serverPager.size" :total="model.serverPager.total" class="mt-3" @page-change="reload" @size-change="reload" />
  </YdPageMain>
</template>
