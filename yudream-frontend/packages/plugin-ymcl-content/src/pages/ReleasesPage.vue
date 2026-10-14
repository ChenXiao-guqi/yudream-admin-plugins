<script setup lang="ts">
import { YdLoadingOverlay } from '@yudream/components'
import type { FileItem, FileUploadRequestOptions, TableColumn, YdFilePickerInstance } from '@yudream/components'
import type { YuDreamPluginSdk } from '@yudream/plugin-sdk'
import {
  YdButton,
  YdCard,
  YdFilePicker,
  YdFileUpload,
  YdIcon,
  YdInput,
  YdModal,
  YdPageHeader,
  YdPageMain,
  YdSelect,
  YdSwitch,
  YdResponsiveTable,
  YdTag,
  YdTextarea,
  useYdModal,
  useYdToast,
} from '@yudream/components'
import { onMounted, reactive, ref } from 'vue'
import MarkdownEditor from '../components/MarkdownEditor.vue'
import {
  CHANNEL_OPTIONS,
  createUpdateApi,
  UPDATE_CHANGE_CATEGORIES,
  type UpdateArtifactRecord,
  type UpdateChangeCategory,
  type UpdateChanges,
  type UpdateReleaseRecord,
} from '../api/update-api'

const props = defineProps<{ sdk: YuDreamPluginSdk }>()

const api = createUpdateApi(props.sdk)
const toast = useYdToast()
const confirm = useYdModal()

const loading = ref(false)
const saving = ref(false)
const uploadingArtifact = ref(false)
const records = ref<UpdateReleaseRecord[]>([])
const releaseModalOpen = ref(false)
const releaseModalMode = ref<'create' | 'edit'>('create')
const artifactModalOpen = ref(false)
const detailVersion = ref('')
const artifactFiles = ref<FileItem[]>([])
const signaturePicker = ref<YdFilePickerInstance | null>(null)

function emptyChanges(): Record<UpdateChangeCategory, string[]> {
  return {
    added: [],
    changed: [],
    deprecated: [],
    removed: [],
    fixed: [],
    security: [],
  }
}

const releaseForm = reactive({
  version: '',
  channel: 'release',
  title: '',
  notes: '',
  changes: emptyChanges(),
  /** 展示用：编辑时回显已有值，保存时不提交（后端自动记录）。 */
  publishedAt: '',
  forceUpdate: false,
  enabled: true,
  /** 展示用：仅回显历史手动覆盖值，保存时不提交。 */
  externalUrl: '',
})

const artifactForm = reactive({
  kind: 'updater',
  variant: 'tauri',
  platform: 'windows',
  architecture: 'x86_64',
  targetPlatforms: 'windows-x86_64',
  filename: '',
  downloadUrl: '',
  signature: '',
  sha256: '',
  mode: 'url' as 'url' | 'file',
})

const columns = ref<TableColumn<UpdateReleaseRecord>[]>([
  { accessorKey: 'version', header: '版本', minWidth: 120 },
  { accessorKey: 'title', header: '标题', minWidth: 140 },
  { accessorKey: 'channel', header: '渠道', width: 90 },
  { id: 'changes', header: '变更', width: 80 },
  { accessorKey: 'publishedAt', header: '发布时间', width: 150 },
  { id: 'artifacts', header: '制品', width: 70 },
  { id: 'status', header: '状态', width: 110 },
  { id: 'operations', header: '操作', width: 330 },
])

function loadChanges(raw?: UpdateChanges | null) {
  const next = emptyChanges()
  if (raw && typeof raw === 'object') {
    for (const { key } of UPDATE_CHANGE_CATEGORIES) {
      const list = raw[key]
      if (Array.isArray(list)) {
        next[key] = list.filter(item => typeof item === 'string' && item.trim().length > 0)
      }
    }
  }
  return next
}

function compactChanges(raw: Record<UpdateChangeCategory, string[]>): UpdateChanges {
  const result: UpdateChanges = {}
  for (const { key } of UPDATE_CHANGE_CATEGORIES) {
    const list = raw[key]
      .map(item => item.trim())
      .filter(Boolean)
    if (list.length) {
      result[key] = list
    }
  }
  return result
}

function changeCount(row: UpdateReleaseRecord) {
  const changes = row.changes || {}
  let total = 0
  for (const { key } of UPDATE_CHANGE_CATEGORIES) {
    total += changes[key]?.length ?? 0
  }
  return total
}

function formatPublishedAt(raw?: string): string {
  if (!raw) {
    return '-'
  }
  const value = raw.trim()
  const date = /^\d+$/.test(value) ? new Date(Number(value)) : new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  const pad = (input: number) => String(input).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const channelSelectOptions = CHANNEL_OPTIONS.map(item => ({ ...item }))

async function reload() {
  loading.value = true
  try {
    const res = await api.list()
    records.value = res.records ?? []
  }
  catch (error) {
    toast.error((error as Error).message || '加载失败')
  }
  finally {
    loading.value = false
  }
}

function openCreateRelease() {
  releaseModalMode.value = 'create'
  releaseForm.version = ''
  releaseForm.channel = 'release'
  releaseForm.title = ''
  releaseForm.notes = ''
  releaseForm.changes = emptyChanges()
  releaseForm.publishedAt = ''
  releaseForm.forceUpdate = false
  releaseForm.enabled = true
  releaseForm.externalUrl = ''
  releaseModalOpen.value = true
}

function openEditRelease(row: UpdateReleaseRecord) {
  releaseModalMode.value = 'edit'
  releaseForm.version = row.version
  releaseForm.channel = (row.channel as string) === 'beta' ? 'beta' : 'release'
  releaseForm.title = row.title || ''
  releaseForm.notes = row.notes || ''
  releaseForm.changes = loadChanges(row.changes)
  releaseForm.publishedAt = row.publishedAt || ''
  releaseForm.forceUpdate = Boolean(row.forceUpdate)
  releaseForm.enabled = row.enabled !== false
  releaseForm.externalUrl = row.externalUrl || ''
  releaseModalOpen.value = true
}

function changeItemIndexes(category: UpdateChangeCategory) {
  return releaseForm.changes[category].map((_, index) => index)
}

function addChangeItem(category: UpdateChangeCategory) {
  releaseForm.changes[category].push('')
}

function removeChangeItem(category: UpdateChangeCategory, index: number) {
  releaseForm.changes[category].splice(index, 1)
}

async function submitRelease() {
  if (!releaseForm.version.trim()) {
    toast.warning('请填写版本号')
    return
  }
  saving.value = true
  const wasCreate = releaseModalMode.value === 'create'
  const version = releaseForm.version.trim()
  try {
    await api.saveRelease({
      version,
      channel: releaseForm.channel,
      title: releaseForm.title.trim() || undefined,
      notes: releaseForm.notes,
      changes: compactChanges(releaseForm.changes),
      forceUpdate: releaseForm.forceUpdate,
      enabled: releaseForm.enabled,
    })
    toast.success(wasCreate ? '发布已保存，请继续上传更新包与 .sig' : '发布已保存')
    releaseModalOpen.value = false
    await reload()
    if (wasCreate) {
      openArtifactEditor(version)
    }
  }
  catch (error) {
    toast.error((error as Error).message || '保存失败')
  }
  finally {
    saving.value = false
  }
}

function openChangelog(row: UpdateReleaseRecord) {
  window.open(api.changelogUrl(row.version), '_blank', 'noopener')
}

function openChangelogIndex() {
  window.open(api.changelogIndexUrl(), '_blank', 'noopener')
}

function openArtifactEditor(version: string) {
  detailVersion.value = version
  artifactForm.kind = 'updater'
  artifactForm.variant = 'tauri'
  artifactForm.platform = 'windows'
  artifactForm.architecture = 'x86_64'
  artifactForm.targetPlatforms = 'windows-x86_64'
  artifactForm.filename = ''
  artifactForm.downloadUrl = ''
  artifactForm.signature = ''
  artifactForm.sha256 = ''
  artifactForm.mode = 'file'
  artifactFiles.value = []
  artifactModalOpen.value = true
}

/** YdFileUpload 自定义上传通道：选中文件即按当前表单元数据直传插件 multipart 端点。 */
async function uploadArtifactRequest(options: FileUploadRequestOptions) {
  uploadingArtifact.value = true
  try {
    return await api.uploadArtifactFile(detailVersion.value, options.file, {
      kind: artifactForm.kind,
      variant: artifactForm.variant,
      platform: artifactForm.platform,
      architecture: artifactForm.architecture,
      targetPlatforms: artifactForm.targetPlatforms
        .split(',')
        .map(item => item.trim())
        .filter(Boolean),
      filename: artifactForm.filename.trim() || options.file.name,
      signature: artifactForm.signature.trim() || undefined,
    }, options.onProgress)
  }
  catch (error) {
    toast.error((error as Error).message || '上传失败')
    throw error
  }
  finally {
    uploadingArtifact.value = false
  }
}

function onArtifactUploadSuccess() {
  toast.success('站内制品已上传')
  artifactModalOpen.value = false
  artifactFiles.value = []
  void reload()
}

function pickSignatureFile() {
  signaturePicker.value?.open()
}

function onSignatureFileSelect(files: File[]) {
  const file = files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onerror = () => toast.error('读取签名文件失败')
  reader.onload = () => {
    const text = String(reader.result || '').trim()
    if (!text) {
      toast.warning('签名文件内容为空')
      return
    }
    artifactForm.signature = text
    toast.success(`已读取 undefined 的签名`)
  }
  reader.readAsText(file)
}

async function submitUrlArtifact() {
  if (!artifactForm.filename.trim() || !artifactForm.downloadUrl.trim()) {
    toast.warning('请填写文件名与下载 URL')
    return
  }
  saving.value = true
  try {
    await api.saveUrlArtifact(detailVersion.value, {
      kind: artifactForm.kind,
      variant: artifactForm.variant,
      platform: artifactForm.platform,
      architecture: artifactForm.architecture,
      targetPlatforms: artifactForm.targetPlatforms
        .split(',')
        .map(item => item.trim())
        .filter(Boolean),
      filename: artifactForm.filename.trim(),
      downloadUrl: artifactForm.downloadUrl.trim(),
      signature: artifactForm.signature || undefined,
      sha256: artifactForm.sha256 || undefined,
    })
    toast.success('URL 制品已保存')
    artifactModalOpen.value = false
    await reload()
  }
  catch (error) {
    toast.error((error as Error).message || '保存失败')
  }
  finally {
    saving.value = false
  }
}

async function toggleYank(row: UpdateReleaseRecord) {
  const next = !row.yanked
  confirm.confirm({
    title: next ? '撤回版本' : '恢复版本',
    content: next
      ? `撤回 ${row.version} 后，启动器将不再收到该版本更新。`
      : `恢复 ${row.version} 为可更新目标？`,
    onConfirm: async () => {
      try {
        await api.setYanked(row.version, next)
        toast.success(next ? '已撤回' : '已恢复')
        await reload()
      }
      catch (error) {
        toast.error((error as Error).message || '操作失败')
      }
    },
  })
}

function removeRelease(row: UpdateReleaseRecord) {
  confirm.confirm({
    title: '删除发布',
    content: `删除 ${row.version} 及其全部制品？此操作不可撤销。`,
    onConfirm: async () => {
      try {
        await api.removeRelease(row.version)
        toast.success('已删除')
        await reload()
      }
      catch (error) {
        toast.error((error as Error).message || '删除失败')
      }
    },
  })
}

async function removeArtifact(version: string, artifact: UpdateArtifactRecord) {
  confirm.confirm({
    title: '删除制品',
    content: `删除 ${version} 的 ${artifact.filename || artifact.id}？`,
    onConfirm: async () => {
      try {
        await api.removeArtifact(version, artifact.id)
        toast.success('已删除制品')
        await reload()
      }
      catch (error) {
        toast.error((error as Error).message || '删除失败')
      }
    },
  })
}

function artifactSummary(row: UpdateReleaseRecord) {
  const list = row.artifacts || []
  if (!list.length) {
    return '0'
  }
  return String(list.length)
}

onMounted(() => {
  void reload()
})
</script>

<template>
	<section class="ymcl-releases-page">
		<YdPageHeader
			title="更新发包"
			description="YMCL 自有更新平台：维护版本发布与制品（外部 URL 或站内文件）。发布时间与更新日志公开页自动生成。"
			class="mb-0"
		>
			<YdButton type="primary" @click="openCreateRelease">
				<YdIcon name="i-ri:add-line" />
				新建发布
			</YdButton>
		</YdPageHeader>

		<YdPageMain>
			<YdCard content-class="ymcl-card-content">
				<div class="ymcl-toolbar">
					<p class="ymcl-muted">
						公开 API 前缀：
						<code>/api/plugins/ymcl-content/v1/update</code>
						·
						<YdButton size="sm" variant="ghost" @click="openChangelogIndex">
							<YdIcon name="i-ri:file-text-line" />
							打开更新日志公开页
						</YdButton>
					</p>
					<YdButton type="primary" @click="openCreateRelease">
						<YdIcon name="i-ri:add-line" />
						新建发布
					</YdButton>
				</div>
				<YdLoadingOverlay :loading="loading"><YdResponsiveTable
					table-root-class="max-w-full overflow-x-auto rounded-lg overflow-hidden"

					:columns="columns"
					:data="records"
					row-key="version"
				>
					<template #empty>
						<div class="ymcl-empty">
							<span class="ymcl-muted">暂无发布。先新建发布，再添加 updater / 安装包制品。</span>
							<YdButton type="primary" @click="openCreateRelease">
								<YdIcon name="i-ri:add-line" />
								新建发布
							</YdButton>
						</div>
					</template>
					<template #cell-title="{ row }">
						<span class="ymcl-break">{{ row.original.title || `YMCL ${row.original.version}` }}</span>
					</template>
					<template #cell-channel="{ row }">
						<YdTag :variant="row.original.channel === 'beta' ? 'outline' : 'default'">
							{{ row.original.channel === 'beta' ? '测试版' : '正式版' }}
						</YdTag>
					</template>
					<template #cell-changes="{ row }">
						<span>{{ changeCount(row.original) || '-' }}</span>
					</template>
					<template #cell-publishedAt="{ row }">
						<span class="ymcl-muted">{{ formatPublishedAt(row.original.publishedAt) }}</span>
					</template>
					<template #cell-artifacts="{ row }">
						<span>{{ artifactSummary(row.original) }}</span>
					</template>
					<template #cell-status="{ row }">
						<div class="ymcl-row-actions">
							<YdTag v-if="row.original.yanked" variant="outline">已撤回</YdTag>
							<YdTag v-else-if="row.original.enabled === false" variant="outline">停用</YdTag>
							<YdTag v-else variant="default">发布中</YdTag>
						</div>
					</template>
					<template #cell-operations="{ row }">
						<div class="ymcl-row-actions">
							<YdButton size="sm" variant="outline" @click="openEditRelease(row.original)">
								<YdIcon name="i-ri:pencil-line" />
								编辑
							</YdButton>
							<YdButton size="sm" variant="outline" @click="openArtifactEditor(row.original.version)">
								<YdIcon name="i-ri:attachment-line" />
								制品
							</YdButton>
							<YdButton size="sm" variant="outline" @click="openChangelog(row.original)">
								<YdIcon name="i-ri:file-text-line" />
								日志
							</YdButton>
							<YdButton size="sm" variant="outline" @click="toggleYank(row.original)">
								{{ row.original.yanked ? '恢复' : '撤回' }}
							</YdButton>
							<YdButton
								size="sm"
								variant="destructive"
								:disabled="saving"
								@click="removeRelease(row.original)"
							>
								删除
							</YdButton>
						</div>
						<div
							v-if="row.original.artifacts?.length"
							class="ymcl-artifact-list"
						>
							<div
								v-for="artifact in row.original.artifacts"
								:key="artifact.id"
								class="ymcl-artifact-item"
							>
								<span class="ymcl-break">
									{{ artifact.kind }} · {{ artifact.platform }}/{{ artifact.architecture }}
									· {{ artifact.filename }}
									· {{ artifact.hostedLocally ? '站内' : 'URL' }}
								</span>
								<YdButton size="sm" variant="ghost" @click="removeArtifact(row.original.version, artifact)">
									移除
								</YdButton>
							</div>
						</div>
					</template>

					<template #card="{ row }">
						<YdCard class="w-full"><div class="flex flex-col gap-3"><div class="flex items-start justify-between gap-3"><strong>{{ row.title || `YMCL ${row.version}` }}</strong><YdTag :variant="row.channel === 'beta' ? 'outline' : 'default'">{{ row.channel === 'beta' ? '测试版' : '正式版' }}</YdTag></div><p class="ymcl-muted">版本 {{ row.version }} · {{ formatPublishedAt(row.publishedAt) }} · {{ artifactSummary(row) }}</p><div class="ymcl-row-actions"><YdButton size="sm" variant="outline" @click="openEditRelease(row)">编辑</YdButton><YdButton size="sm" variant="outline" @click="openArtifactEditor(row.version)">制品</YdButton><YdButton size="sm" variant="outline" @click="openChangelog(row)">日志</YdButton><YdButton size="sm" variant="outline" @click="toggleYank(row)">{{ row.yanked ? '恢复' : '撤回' }}</YdButton><YdButton size="sm" variant="destructive" :disabled="saving" @click="removeRelease(row)">删除</YdButton></div><div v-for="artifact in row.artifacts || []" :key="artifact.id" class="ymcl-artifact-item"><span class="ymcl-break">{{ artifact.kind }} · {{ artifact.platform }}/{{ artifact.architecture }} · {{ artifact.filename }}</span><YdButton size="sm" variant="ghost" @click="removeArtifact(row.version, artifact)">移除</YdButton></div></div></YdCard>
					</template>
				</YdResponsiveTable></YdLoadingOverlay>
			</YdCard>

			<YdModal
				v-model="releaseModalOpen"
				title="发布元数据"
				width="720px"
				:show-confirm-button="false"
				show-cancel-button
			>
				<form class="ymcl-form" @submit.prevent>
					<div class="ymcl-form-row">
						<label class="ymcl-label">版本（必填，如 1.2.0 或 1.2.0-beta.1）</label>
						<YdInput v-model="releaseForm.version" placeholder="1.2.0" clearable />
					</div>
					<div class="ymcl-form-row">
						<label class="ymcl-label">渠道</label>
						<YdSelect v-model="releaseForm.channel" :options="channelSelectOptions" />
					</div>
					<div class="ymcl-form-row">
						<label class="ymcl-label">展示标题（可空，默认 YMCL + 版本号）</label>
						<YdInput v-model="releaseForm.title" placeholder="YMCL 1.2.0" clearable />
					</div>
					<div class="ymcl-form-row">
						<label class="ymcl-label">发布时间与更新日志（自动生成）</label>
						<p class="ymcl-muted">
							发布时间在保存时自动记录；「查看完整更新日志」公开页由平台按版本自动渲染
							（<code>/v1/update/changelog/版本号</code>），无需手填链接。
						</p>
						<p v-if="releaseModalMode === 'edit'" class="ymcl-muted">
							<template v-if="releaseForm.publishedAt">
								当前发布时间：{{ formatPublishedAt(releaseForm.publishedAt) }}。
							</template>
							<template v-if="releaseForm.externalUrl">
								历史自定义日志链接：{{ releaseForm.externalUrl }}（继续优先生效）
							</template>
						</p>
					</div>
					<div class="ymcl-form-row">
						<label class="ymcl-label">强制更新</label>
						<YdSwitch v-model="releaseForm.forceUpdate" />
					</div>
					<div class="ymcl-form-row">
						<label class="ymcl-label">启用</label>
						<YdSwitch v-model="releaseForm.enabled" />
					</div>

					<div class="ymcl-changes-block">
						<div class="ymcl-changes-head">
							<span class="ymcl-label">更新内容（分类分条，同 Axolotl 更新公告）</span>
							<span class="ymcl-muted">每条一个要点；空分类不会下发。</span>
						</div>
						<div
							v-for="category in UPDATE_CHANGE_CATEGORIES"
							:key="category.key"
							class="ymcl-change-category"
						>
							<div class="ymcl-change-category-head">
								<span class="ymcl-change-dot" :style="{ background: category.color }" />
								<strong>{{ category.label }}</strong>
								<YdButton size="sm" variant="outline" type="button" @click="addChangeItem(category.key)">
									<YdIcon name="i-ri:add-line" />
									添加条目
								</YdButton>
							</div>
							<div v-if="releaseForm.changes[category.key].length === 0" class="ymcl-muted">
								暂无条目
							</div>
							<div
								v-for="index in changeItemIndexes(category.key)"
								:key="`${category.key}-${index}`"
								class="ymcl-change-item"
							>
								<YdInput
									v-model="releaseForm.changes[category.key][index]"
									:placeholder="`${category.label}要点 ${index + 1}`"
									clearable
								/>
								<YdButton
									size="sm"
									variant="destructive"
									type="button"
									@click="removeChangeItem(category.key, index)"
								>
									删除
								</YdButton>
							</div>
						</div>
					</div>

					<div class="ymcl-form-row">
						<label class="ymcl-label">自由说明（可选 Markdown；为空时按上方分类自动生成）</label>
						<MarkdownEditor
							v-model="releaseForm.notes"
							placeholder="可选。留空则根据「新增 / 又更 / Bug 修复…」分类自动生成说明。"
						/>
					</div>
				</form>
				<template #footer>
					<YdButton variant="outline" @click="releaseModalOpen = false">
						取消
					</YdButton>
					<YdButton :loading="saving" @click="submitRelease">
						保存
					</YdButton>
				</template>
			</YdModal>

		<YdModal
			v-model="artifactModalOpen"
			:title="`维护制品 · ${detailVersion}`"
			width="620px"
			:show-confirm-button="false"
			show-cancel-button
		>
			<form class="ymcl-form" @submit.prevent>
				<div class="ymcl-form-row">
					<label class="ymcl-label">托管方式</label>
					<div class="ymcl-row-actions">
						<YdButton
							size="sm"
							:type="artifactForm.mode === 'file' ? 'primary' : undefined"
							:variant="artifactForm.mode === 'file' ? undefined : 'outline'"
							@click="artifactForm.mode = 'file'"
						>
							站内上传
						</YdButton>
						<YdButton
							size="sm"
							:type="artifactForm.mode === 'url' ? 'primary' : undefined"
							:variant="artifactForm.mode === 'url' ? undefined : 'outline'"
							@click="artifactForm.mode = 'url'"
						>
							外部 URL
						</YdButton>
					</div>
				</div>
				<div class="ymcl-form-row">
					<label class="ymcl-label">kind</label>
					<YdInput v-model="artifactForm.kind" placeholder="updater / installer / portable" clearable />
				</div>
				<div class="ymcl-form-row">
					<label class="ymcl-label">variant</label>
					<YdInput v-model="artifactForm.variant" placeholder="tauri / deb / appimage / nsis..." clearable />
				</div>
				<div class="ymcl-form-row">
					<label class="ymcl-label">platform / architecture</label>
					<div class="ymcl-row-actions">
						<YdInput v-model="artifactForm.platform" placeholder="windows / linux / macos" clearable />
						<YdInput v-model="artifactForm.architecture" placeholder="x86_64 / aarch64" clearable />
					</div>
				</div>
				<div class="ymcl-form-row">
					<label class="ymcl-label">targetPlatforms（逗号分隔，updater 用）</label>
					<YdInput v-model="artifactForm.targetPlatforms" placeholder="windows-x86_64,linux-x86_64" clearable />
				</div>
				<div class="ymcl-form-row">
					<label class="ymcl-label">文件名（可空，站内上传默认取所选文件名）</label>
					<YdInput v-model="artifactForm.filename" placeholder="YMCL-1.2.0_x64-setup.nsis.zip" clearable />
				</div>
				<template v-if="artifactForm.mode === 'url'">
					<div class="ymcl-form-row">
						<label class="ymcl-label">下载 URL（必填）</label>
						<YdInput v-model="artifactForm.downloadUrl" placeholder="https://..." clearable />
					</div>
					<div class="ymcl-form-row">
						<label class="ymcl-label">sha256（deb 等建议填写）</label>
						<YdInput v-model="artifactForm.sha256" placeholder="hex" clearable />
					</div>
				</template>
				<div class="ymcl-form-row">
					<label class="ymcl-label">minisign 签名（updater 必填）</label>
					<div class="ymcl-row-actions">
						<YdFilePicker ref="signaturePicker" accept=".sig,.txt,.minisig,text/plain" label="选择签名文件" @select="onSignatureFileSelect">
							<template #default />
						</YdFilePicker>
						<YdButton size="sm" variant="outline" :disabled="uploadingArtifact" @click="pickSignatureFile">
							<YdIcon name="i-ri:shield-check-line" />
							选择 .sig 文件自动填充
						</YdButton>
					</div>
					<YdTextarea v-model="artifactForm.signature" :rows="4" placeholder="或直接粘贴 minisign 签名内容" />
				</div>
				<div v-if="artifactForm.mode === 'file'" class="ymcl-form-row">
					<label class="ymcl-label">更新包文件（先确认上方元数据与签名，再选择文件；选中即上传）</label>
					<YdFileUpload
						v-model="artifactFiles"
						:max="1"
						:http-request="uploadArtifactRequest"
						:disabled="uploadingArtifact"
						description="拖放或点击上传更新包（zip / exe / deb / dmg…），支持进度显示"
						@on-success="onArtifactUploadSuccess"
					/>
				</div>
			</form>
			<template #footer>
				<YdButton variant="outline" @click="artifactModalOpen = false">
					取消
				</YdButton>
				<YdButton
					v-if="artifactForm.mode === 'url'"
					:loading="saving"
					@click="submitUrlArtifact"
				>
					保存 URL 制品
				</YdButton>
			</template>
			</YdModal>
		</YdPageMain>
	</section>
</template>

<style scoped>
.ymcl-releases-page {
	display: flex;
	min-width: 0;
	flex-direction: column;
	gap: 0;
}

.ymcl-toolbar {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 12px;
	flex-wrap: wrap;
}

.ymcl-toolbar .ymcl-muted {
	flex: 1 1 240px;
	min-width: 0;
}

.ymcl-empty {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 12px;
	padding: 8px 0;
}

.ymcl-changes-block {
	display: flex;
	flex-direction: column;
	gap: 12px;
	padding: 12px;
	border: 1px solid var(--muted-foreground, #6b7280);
	border-radius: 8px;
}

.ymcl-changes-head {
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.ymcl-change-category {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.ymcl-change-category-head {
	display: flex;
	align-items: center;
	gap: 8px;
}

.ymcl-change-dot {
	width: 8px;
	height: 8px;
	border-radius: 999px;
	flex-shrink: 0;
}

.ymcl-change-item {
	display: flex;
	align-items: center;
	gap: 8px;
}

.ymcl-change-item :deep(.fa-input),
.ymcl-change-item > :first-child {
	flex: 1 1 auto;
	min-width: 0;
}

.ymcl-artifact-list {
	display: flex;
	flex-direction: column;
	gap: 4px;
	margin-top: 6px;
}

.ymcl-artifact-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 8px;
	font-size: 12px;
	color: var(--muted-foreground, #6b7280);
}
</style>
