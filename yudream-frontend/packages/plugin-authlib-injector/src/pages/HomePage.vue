<script setup lang="ts">
import type { TableColumn } from '@yudream/components'
import type { AuthlibEndpoint } from '../types'
import type { AuthlibPluginModel } from '../composables/useAuthlibPlugin'
import { YdCard, YdCopyButton, YdLoadingOverlay, YdPageHeader, YdPageMain, YdResponsiveEnhancedTable, YdTag } from '@yudream/components'

defineProps<{ model: AuthlibPluginModel }>()

const columns: TableColumn<AuthlibEndpoint>[] = [
  { accessorKey: 'method', header: '方法', width: 100 },
  { accessorKey: 'path', header: '协议路径', width: 420 },
  { accessorKey: 'note', header: '用途', width: 360 },
]
</script>

<template>
  <section class="authlib-home">
    <YdPageHeader title="Authlib 运行状态" description="查看 Yggdrasil 协议服务地址、依赖状态和固定协议端点。" class="mb-0">
      <YdCopyButton :text="model.launcherUrl" label="复制 API 地址" />
    </YdPageHeader>

    <YdPageMain>
      <div class="authlib-summary-grid">
        <YdCard title="启动器配置" description="Yggdrasil 服务根地址" content-class="authlib-card-content">
          <div class="authlib-address-row">
            <code>{{ model.launcherUrl }}</code>
            <YdCopyButton :text="model.launcherUrl" label="复制" size="sm" variant="outline" />
          </div>
          <p class="authlib-muted">将此地址填写到支持 authlib-injector 的启动器或服务端配置中。</p>
        </YdCard>

        <YdCard title="服务状态" description="仅管理端可见" content-class="authlib-card-content">
          <div class="authlib-status-line">
            <span>连接状态</span>
            <span class="yd-status-tone" :data-tone="model.status ? 'success' : 'warning'">{{ model.statusText }}</span>
          </div>
          <div class="authlib-status-line"><span>账号来源</span><strong>{{ model.status?.accountSource || '-' }}</strong></div>
          <div class="authlib-status-line">
            <span>皮肤插件</span>
            <span class="yd-status-tone" :data-tone="model.status?.skinPluginEnabled ? 'success' : 'neutral'">{{ model.status?.skinPluginEnabled ? '已启用' : '未启用' }}</span>
          </div>
          <div class="authlib-status-line"><span>材质地址</span><code>{{ model.status?.textureBaseUrl || '-' }}</code></div>
        </YdCard>
      </div>

      <div class="authlib-endpoint-head mt-4">
        <strong>协议端点</strong>
        <span>固定协议清单，不作为管理 CRUD 数据。</span>
        <YdTag variant="secondary">{{ model.endpoints.length }} 个端点</YdTag>
      </div>

      <YdLoadingOverlay :loading="model.loading">
        <YdResponsiveEnhancedTable
          row-key="path"
          table-root-class="rounded-lg overflow-hidden"
          table-class="min-w-[860px]"
          border
          stripe
          column-visibility
          :columns="columns"
          :data="model.endpoints"
          empty-text="暂无协议端点"
        >
          <template #cell-method="{ row }">
            <span class="yd-status-tone" :data-tone="row.original.method === 'GET' ? 'neutral' : 'info'">{{ row.original.method }}</span>
          </template>
          <template #cell-path="{ row }"><code>{{ row.original.path }}</code></template>
        </YdResponsiveEnhancedTable>
      </YdLoadingOverlay>
    </YdPageMain>
  </section>
</template>
