<script setup lang="ts">
import type { FileItem, FileUploadRequestOptions } from '@yudream/components'
import type { SkinPluginModel } from '../composables/useSkinPlugin'
import { ref } from 'vue'
import { YdLabel, YdButton, YdFileUpload, YdIcon, YdInput, YdModal, YdNumberField, YdPageHeader, YdPageMain, YdTag } from '@yudream/components'

const props = defineProps<{ model: SkinPluginModel }>()
const migrationFiles = ref<FileItem[]>([])

async function selectMigrationArchive(options: FileUploadRequestOptions) {
  await props.model.handleMigrationArchive(options.file)
  options.onProgress(100)
  return { selected: true }
}
function stateText(state: string) {
  return ({ IDLE: '未迁移', PENDING: '等待迁移', RUNNING: '正在迁移', SUCCESS: '迁移完成', FAILED: '迁移失败' } as Record<string, string>)[state] || state
}
</script>

<template>
  <YdPageHeader title="Blessing Skin 数据迁移" class="mb-0">
    <YdButton variant="outline" @click="model.openMigrationLog"><YdIcon name="i-ri:file-list-3-line" />查看日志</YdButton>
  </YdPageHeader>
  <YdPageMain>
    <form class="grid gap-4" @submit.prevent="model.runMigration">
      <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
        <YdLabel class="grid gap-2"><span>数据库主机</span><YdInput v-model="model.migrationForm.host" placeholder="localhost" /></YdLabel>
        <YdLabel class="grid gap-2"><span>端口</span><YdNumberField v-model="model.migrationForm.port" :min="1" :max="65535" :step="1" class="w-full" /></YdLabel>
        <YdLabel class="grid gap-2"><span>数据库名</span><YdInput v-model="model.migrationForm.database" placeholder="blessing_skin" /></YdLabel>
        <YdLabel class="grid gap-2"><span>账号</span><YdInput v-model="model.migrationForm.username" /></YdLabel>
        <YdLabel class="grid gap-2"><span>密码</span><YdInput v-model="model.migrationForm.password" type="password" /></YdLabel>
        <YdLabel class="grid gap-2"><span>材质压缩包</span><YdFileUpload v-model="migrationFiles" :max="1" :http-request="selectMigrationArchive" description="拖放或点击选择 ZIP 压缩包" /></YdLabel>
      </div>
      <div class="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
        <div class="grid gap-1"><strong>{{ stateText(model.migrationStatus.state) }}</strong><span v-if="model.migrationStatus.startedAt" class="text-sm text-muted-foreground">开始于 {{ model.dateText(model.migrationStatus.startedAt) }}</span></div>
        <YdButton type="submit" :loading="model.saving === 'migration' || model.migrationStatus.running"><YdIcon name="i-ri:database-2-line" />{{ model.migrationStatus.running ? '正在迁移' : '开始迁移' }}</YdButton>
      </div>
      <div v-if="model.migrationReport" class="report-grid mt-4">
        <span>用户 {{ model.migrationReport.users }}</span><span>角色 {{ model.migrationReport.players }}</span><span>材质 {{ model.migrationReport.textures }}</span><span>衣柜 {{ model.migrationReport.closetItems }}</span><span>配置 {{ model.migrationReport.options }}</span>
      </div>
    </form>
    <YdModal v-model="model.migrationLogVisible" title="迁移日志" :footer="false" class="sm:max-w-4xl">
      <div class="migration-log">
        <div class="migration-log__head"><strong>{{ stateText(model.migrationStatus.state) }}</strong></div>
        <div class="migration-log__body">
          <div v-if="!model.migrationLogs.length" class="empty-state compact">暂无迁移日志</div>
          <p v-for="item in model.migrationLogs" :key="`${item.time}-${item.message}`">
            <time>{{ model.dateText(item.time) }}</time>
            <span>
              <YdTag v-if="item.level === 'ERROR'" variant="destructive" class="mr-2">错误</YdTag>
              {{ item.message }}
            </span>
          </p>
        </div>
      </div>
    </YdModal>
  </YdPageMain>
</template>
