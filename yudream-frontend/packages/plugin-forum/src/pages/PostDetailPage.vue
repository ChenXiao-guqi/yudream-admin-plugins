<script setup lang="ts">
import { YdLoadingOverlay } from '@yudream/components'
import type { YuDreamPluginSdk } from '@yudream/plugin-sdk'
import { YdAction, YdAvatar, YdButton, YdIcon, YdPageHeader, YdPageMain, YdTextarea, YdTag, useYdToast } from '@yudream/components'
import { onMounted, ref } from 'vue'
import { createForumApi } from '../api/forum-api'
import MarkdownPreview from '../components/MarkdownPreview.vue'
import type { Category, Comment, Post } from '../api/forum-api'
const props = defineProps<{ sdk: YuDreamPluginSdk }>()
const api = createForumApi(props.sdk)
const toast = useYdToast()
const post = ref<Post | null>(null)
const comments = ref<Comment[]>([])
const categories = ref<Category[]>([])
const comment = ref('')
const loading = ref(true)
const id = new URLSearchParams(window.location.search).get('id') || ''
const categoryName = () => categories.value.find(item => item.id === post.value?.categoryId)?.name || '未分类'
const authorLabel = (id: string) => id || '社区成员'
async function load() {
  try {
    const [postResult, commentResult, categoryResult] = await Promise.all([api.post(id), api.comments(id), api.categories()])
    post.value = postResult
    comments.value = commentResult.records
    categories.value = categoryResult.records
  }
  catch (error) { toast.error(error instanceof Error ? error.message : '帖子加载失败') }
  finally { loading.value = false }
}
function back() { window.history.back() }
function openProfile(userId: string) { window.history.pushState({}, '', `/platform/plugins/forum/profile?id=${encodeURIComponent(userId)}`); window.dispatchEvent(new PopStateEvent('popstate')) }
async function send() { if (!comment.value.trim()) return; try { await api.comment(id, comment.value); comment.value = ''; comments.value = (await api.comments(id)).records; toast.success('评论已提交') } catch (error) { toast.error(error instanceof Error ? error.message : '评论失败') } }
async function interact(type: 'like' | 'bookmark') { try { await api.interact(id, type); post.value = await api.post(id) } catch (error) { toast.error(error instanceof Error ? error.message : '操作失败') } }
onMounted(load)
</script>
<template>
  <div class="forum-page forum-detail-page">
    <YdPageHeader :title="post?.title || '帖子详情'">
      <YdButton variant="ghost" title="返回论坛" aria-label="返回论坛" @click="back"><YdIcon name="i-ri:arrow-left-line" />返回</YdButton>
    </YdPageHeader>
    <YdPageMain>
      <YdLoadingOverlay :loading="true" v-if="loading"><div   class="forum-detail-loading" /></YdLoadingOverlay>
      <template v-else-if="post">
        <article class="forum-detail forum-detail-layout">
          <header class="forum-detail-author">
            <YdAction type="button" class="forum-avatar-button" @click="openProfile(post.authorId)"><YdAvatar src="" :alt="authorLabel(post.authorId)">{{ authorLabel(post.authorId).slice(0, 1).toUpperCase() }}</YdAvatar></YdAction>
            <div><YdAction type="button" class="forum-detail-author__name" @click="openProfile(post.authorId)">{{ authorLabel(post.authorId) }}</YdAction><div class="forum-detail-author__meta">{{ new Date(Number(post.publishedAt)).toLocaleString() }} · {{ categoryName() }}</div></div>
            <div class="forum-detail-author__badges"><YdTag v-if="post.pinned" variant="default"><YdIcon name="i-ri:pushpin-2-fill" />置顶</YdTag><YdTag v-if="post.featured" variant="secondary"><YdIcon name="i-ri:star-fill" />精华</YdTag></div>
          </header>
          <div class="forum-detail__body"><MarkdownPreview :content="post.body" /></div>
          <footer class="forum-detail__footer"><div class="forum-post-card__context"><YdTag variant="outline"><YdIcon name="i-ri:folder-2-line" />{{ categoryName() }}</YdTag><YdTag v-for="tag in post.tags" :key="tag" variant="outline">#{{ tag }}</YdTag></div><div class="forum-detail-actions"><YdButton variant="ghost" title="点赞" aria-label="点赞" @click="interact('like')"><YdIcon name="i-ri:thumb-up-line" />{{ post.likes }}</YdButton><YdButton variant="ghost" title="收藏" aria-label="收藏" @click="interact('bookmark')"><YdIcon name="i-ri:bookmark-line" />{{ post.bookmarks }}</YdButton><span><YdIcon name="i-ri:eye-line" />{{ post.views }}</span></div></footer>
        </article>
        <section class="forum-comments"><div class="forum-section-heading"><h2><YdIcon name="i-ri:message-3-line" />评论</h2><span>{{ post.comments }} 条评论</span></div><div v-for="item in comments" :key="item.id" class="forum-comment"><YdAction type="button" class="forum-avatar-button" @click="openProfile(item.authorId)"><YdAvatar src="" :alt="authorLabel(item.authorId)">{{ authorLabel(item.authorId).slice(0, 1).toUpperCase() }}</YdAvatar></YdAction><div class="forum-comment__body"><div class="forum-comment__meta"><YdAction type="button" @click="openProfile(item.authorId)">{{ authorLabel(item.authorId) }}</YdAction><span>{{ new Date(Number(item.createdAt)).toLocaleString() }}</span></div><MarkdownPreview :content="item.body" /></div></div><div class="forum-comment-editor"><YdTextarea v-model="comment" placeholder="写下你的评论，支持 Markdown"/><YdButton :disabled="!comment.trim()" @click="send"><YdIcon name="i-ri:send-plane-line" />发表评论</YdButton></div></section>
      </template>
      <div v-else class="forum-empty"><YdIcon name="i-ri:file-warning-line" /><strong>帖子不存在或暂不可见</strong></div>
    </YdPageMain>
  </div>
</template>
