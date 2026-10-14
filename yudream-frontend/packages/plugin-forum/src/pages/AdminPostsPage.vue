<script setup lang="ts">
import { YdLoadingOverlay } from '@yudream/components'
import type { YuDreamPluginSdk } from '@yudream/plugin-sdk'
import { YdButton, YdCard, YdPageHeader, YdPageMain, YdPagination, YdResponsiveTable, YdSelect, YdTag, useYdToast } from '@yudream/components'
import { onMounted, ref } from 'vue'
import { createForumApi } from '../api/forum-api'
import type { Post } from '../api/forum-api'
const props=defineProps<{sdk:YuDreamPluginSdk}>(); const api=createForumApi(props.sdk); const toast=useYdToast(); const rows=ref<Post[]>([]); const total=ref(0); const page=ref(1); const size=ref(10); const status=ref('pending'); const loading=ref(false)
const columns=[{id:'title',header:'标题',accessorKey:'title'},{id:'authorId',header:'作者',accessorKey:'authorId'},{id:'status',header:'状态',accessorKey:'status'},{id:'createdAt',header:'创建时间',accessorKey:'createdAt'},{id:'operation',header:'操作',width:260}]
async function load(){loading.value=true;try{const result=await api.adminPosts({page:page.value,size:size.value,status:status.value});rows.value=result.records;total.value=result.total}catch(e){toast.error(e instanceof Error?e.message:'加载失败')}finally{loading.value=false}}
async function moderate(id:string,state:'published'|'rejected'|'archived'){try{await api.moderate(id,state);await load();toast.success('状态已更新')}catch(e){toast.error(e instanceof Error?e.message:'操作失败')}}
async function flag(id:string,key:'pinned'|'featured'){try{const post=rows.value.find(item=>item.id===id);await api.flags(id,{[key]:!post?.[key]});await load()}catch(e){toast.error(e instanceof Error?e.message:'操作失败')}}
onMounted(load)
</script>
<template><div class="forum-page"><YdPageHeader title="帖子审核" description="审核帖子并维护置顶、精华状态"/><YdPageMain><YdLoadingOverlay :loading="loading"><YdResponsiveTable  row-key="id" :columns="columns" :data="rows" border stripe table-root-class="rounded-lg overflow-hidden" table-class="min-w-[900px]"><template #toolbar><div class="forum-toolbar"><YdSelect v-model="status" class="forum-select" :options="[{label:'待审核',value:'pending'},{label:'已发布',value:'published'},{label:'已拒绝',value:'rejected'},{label:'全部',value:''}]" @update:model-value="page=1;load()"/></div></template><template #cell-status="{row}"><YdTag variant="outline">{{row.original.status}}</YdTag></template><template #cell-operation="{row}"><div class="flex flex-wrap gap-2"><YdButton v-if="row.original.status==='pending'" size="sm" @click="moderate(row.original.id,'published')">通过</YdButton><YdButton v-if="row.original.status==='pending'" size="sm" variant="destructive" @click="moderate(row.original.id,'rejected')">拒绝</YdButton><YdButton size="sm" variant="outline" @click="flag(row.original.id,'pinned')">{{row.original.pinned?'取消置顶':'置顶'}}</YdButton><YdButton size="sm" variant="outline" @click="flag(row.original.id,'featured')">{{row.original.featured?'取消精华':'设为精华'}}</YdButton></div></template><template #card="{ row }">
  <YdCard class="w-full">
    <div class="flex flex-col gap-3">
      <div class="flex items-center justify-between gap-2">
        <span class="min-w-0 break-words text-base font-semibold">{{ row.title }}</span>
        <YdTag variant="outline">{{ row.status }}</YdTag>
      </div>
      <div class="flex flex-col gap-1 text-sm">
        <div class="flex gap-2"><span class="shrink-0 text-secondary-foreground/60">作者</span><span class="break-all">{{ row.authorId }}</span></div>
        <div class="flex gap-2"><span class="shrink-0 text-secondary-foreground/60">创建时间</span><span class="break-all">{{ row.createdAt }}</span></div>
      </div>
      <div class="flex flex-wrap gap-2 border-t pt-3">
        <YdButton v-if="row.status==='pending'" size="sm" @click="moderate(row.id,'published')">通过</YdButton>
        <YdButton v-if="row.status==='pending'" size="sm" variant="destructive" @click="moderate(row.id,'rejected')">拒绝</YdButton>
        <YdButton size="sm" variant="outline" @click="flag(row.id,'pinned')">{{ row.pinned ? '取消置顶' : '置顶' }}</YdButton>
        <YdButton size="sm" variant="outline" @click="flag(row.id,'featured')">{{ row.featured ? '取消精华' : '设为精华' }}</YdButton>
      </div>
    </div>
  </YdCard>
</template></YdResponsiveTable></YdLoadingOverlay><YdPagination v-model:page="page" v-model:size="size" :total="total" class="mt-3" @page-change="load" @size-change="page = 1; load()"/></YdPageMain></div></template>
