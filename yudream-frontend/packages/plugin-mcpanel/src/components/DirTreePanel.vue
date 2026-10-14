<script setup lang="ts">
import { YdAction, YdButton, YdIcon } from '@yudream/components'
import { computed, onMounted, ref, watch } from 'vue'
import { errorMessage } from '../composables/utils'

/**
 * 懒加载目录树（只展示目录）：点击行选中并展开/收起，子目录首次展开时才加载。
 * 树以展开状态 + 扁平行列表渲染，避免递归组件。
 * refresh() 全量重建后自动展开并定位当前选中路径。
 */
export interface TreeNode {
  name: string
  path: string
  isFile: boolean
  expanded: boolean
  loaded: boolean
  loading: boolean
  children: TreeNode[]
}

const props = withDefaults(defineProps<{
  list: (path: string) => Promise<Array<{ name: string, isDir: boolean }>>
  modelValue?: string
  /** 展示文件叶子（编辑器侧栏用）；点击文件回调 openFile，不参与展开。 */
  showFiles?: boolean
  openFile?: (path: string, name: string) => void
}>(), {
  modelValue: '',
  showFiles: false,
})

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const roots = ref<TreeNode[]>([])
const loading = ref(false)
const error = ref('')

interface TreeRow {
  node: TreeNode
  depth: number
}

const flatRows = computed<TreeRow[]>(() => {
  const rows: TreeRow[] = []
  const walk = (nodes: TreeNode[], depth: number) => {
    for (const node of nodes) {
      rows.push({ node, depth })
      if (node.expanded && node.children.length) {
        walk(node.children, depth + 1)
      }
    }
  }
  walk(roots.value, 0)
  return rows
})

function sortNodes(nodes: TreeNode[]): TreeNode[] {
  return nodes.sort((a, b) => (Number(a.isFile) - Number(b.isFile)) || a.name.localeCompare(b.name))
}

async function loadChildren(node: TreeNode | null): Promise<TreeNode[]> {
  const path = node?.path ?? ''
  const entries = await props.list(path)
  return (entries ?? [])
    .filter(entry => entry.isDir || props.showFiles)
    .map(entry => ({
      name: entry.name,
      path: path ? `${path}/${entry.name}` : entry.name,
      isFile: !entry.isDir,
      expanded: false,
      loaded: !entry.isDir,
      loading: false,
      children: [],
    }))
}

async function toggle(node: TreeNode) {
  if (node.expanded) {
    node.expanded = false
    return
  }
  if (!node.loaded) {
    node.loading = true
    try {
      node.children = sortNodes(await loadChildren(node))
      node.loaded = true
    }
    catch (e) {
      error.value = errorMessage(e, '加载目录失败')
    }
    finally {
      node.loading = false
    }
  }
  node.expanded = true
}

function select(node: TreeNode) {
  if (node.isFile) {
    props.openFile?.(node.path, node.name)
    return
  }
  emit('update:modelValue', node.path)
  void toggle(node)
}

/** 重建树后按路径逐级展开定位；路径不存在时静默回落根目录。 */
async function revealPath(path: string) {
  if (!path) {
    emit('update:modelValue', '')
    return
  }
  let cursor = roots.value
  let acc = ''
  for (const part of path.split('/')) {
    acc = acc ? `${acc}/${part}` : part
    const found = cursor.find(node => node.name === part)
    if (!found) {
      emit('update:modelValue', '')
      return
    }
    if (!found.loaded) {
      found.loading = true
      try {
        found.children = sortNodes(await loadChildren(found))
        found.loaded = true
      }
      catch {
        return
      }
      finally {
        found.loading = false
      }
    }
    found.expanded = true
    cursor = found.children
  }
  emit('update:modelValue', path)
}

async function refresh() {
  error.value = ''
  loading.value = true
  try {
    roots.value = sortNodes(await loadChildren(null))
    await revealPath(props.modelValue)
  }
  catch (e) {
    error.value = errorMessage(e, '加载目录树失败')
  }
  finally {
    loading.value = false
  }
}

defineExpose({ refresh })

watch(() => props.modelValue, (value) => {
  // 外部（面包屑/新建目录后）改变选中路径时，展开其祖先链保证高亮可见。
  if (value) {
    void revealPath(value)
  }
})

onMounted(() => void refresh())
</script>

<template>
  <div class="mcp-tree" :class="{ 'is-loading': loading }">
    <div class="mcp-tree-head">
      <span>目录</span>
      <span class="mcp-spacer" />
      <YdButton size="icon-sm" variant="ghost" :disabled="loading" title="重建目录树" @click="refresh">
        <YdIcon name="i-ri:refresh-line" />
      </YdButton>
    </div>
    <div v-if="error" class="mcp-tree-msg is-error">
      {{ error }}
    </div>
    <div v-else-if="loading && !flatRows.length" class="mcp-tree-msg">
      加载中…
    </div>
    <div v-else-if="!flatRows.length" class="mcp-tree-msg">
      没有子目录
    </div>
    <div v-else class="mcp-tree-body">
      <div
        v-for="{ node, depth } in flatRows"
        :key="node.path"
        class="mcp-tree-row"
        :class="{ 'is-active': node.path === modelValue }"
        :style="{ paddingLeft: String(8 + depth * 16) + 'px' }"
        :title="'/' + node.path"
      >
        <YdAction
          v-if="!node.isFile"
          type="button"
          class="mcp-tree-caret"
          :aria-label="(node.expanded ? '收起 ' : '展开 ') + node.name"
          @click="toggle(node)"
        >
          <YdIcon
            :name="node.loading ? 'i-ri:loader-4-line' : node.expanded ? 'i-ri:arrow-down-s-line' : 'i-ri:arrow-right-s-line'"
            :class="{ 'is-spinning': node.loading }"
          />
        </YdAction>
        <YdAction type="button" class="mcp-tree-select" @click="select(node)">
          <YdIcon :name="node.isFile ? 'i-ri:file-line' : (node.expanded ? 'i-ri:folder-open-line' : 'i-ri:folder-line')" class="mcp-tree-folder" />
          <span class="mcp-tree-name">{{ node.name }}</span>
        </YdAction>
      </div>
    </div>
  </div>
</template>
