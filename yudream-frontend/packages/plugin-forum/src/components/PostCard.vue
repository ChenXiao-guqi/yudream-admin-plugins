<script setup lang="ts">
import type { Post } from '../api/forum-api'
import { YdAction, YdAvatar, YdButton, YdIcon, YdTag, YdTooltip } from '@yudream/components'
const props = defineProps<{ post: Post; categoryName?: string; compact?: boolean }>()
const emit = defineEmits<{ open: []; like: []; bookmark: []; profile: [] }>()
const authorLabel = () => props.post.authorId || '社区成员'
const timeLabel = () => props.post.publishedAt ? new Date(Number(props.post.publishedAt)).toLocaleString() : '等待审核'
</script>
<template>
  <article class="forum-post-card">
    <div class="forum-post-card__author">
      <YdAction class="forum-avatar-button" type="button" @click="emit('profile')" :title="`查看 ${authorLabel()} 的资料`">
        <YdAvatar src="" :alt="authorLabel()">{{ authorLabel().slice(0, 1).toUpperCase() }}</YdAvatar>
      </YdAction>
      <div class="forum-post-card__author-text">
        <YdAction type="button" class="forum-post-card__author-name" @click="emit('profile')">{{ authorLabel() }}</YdAction>
        <span>{{ timeLabel() }}</span>
      </div>
    </div>

    <div class="forum-post-card__body">
      <YdAction type="button" class="forum-post-card__title" @click="emit('open')">
        <span v-if="post.pinned" class="forum-mark forum-mark--pinned"><YdIcon name="i-ri:pushpin-2-fill" />置顶</span>
        <span v-if="post.featured" class="forum-mark forum-mark--featured"><YdIcon name="i-ri:star-fill" />精华</span>
        <span>{{ post.title }}</span>
      </YdAction>
      <p v-if="!compact" class="forum-post-card__summary">{{ post.summary || '这篇帖子还没有摘要。' }}</p>
      <div class="forum-post-card__context">
        <YdTag variant="outline"><YdIcon name="i-ri:folder-2-line" />{{ categoryName || '未分类' }}</YdTag>
        <YdTag v-for="tag in post.tags" :key="tag" variant="outline">#{{ tag }}</YdTag>
      </div>
    </div>

    <div class="forum-post-card__stats" aria-label="帖子统计">
      <span><YdIcon name="i-ri:eye-line" />{{ post.views }}</span>
      <span><YdIcon name="i-ri:message-3-line" />{{ post.comments }}</span>
      <YdTooltip content="点赞">
        <YdButton variant="ghost" size="sm" icon-only :aria-label="`点赞 ${post.title}`" title="点赞" @click="emit('like')"><YdIcon name="i-ri:thumb-up-line" />{{ post.likes }}</YdButton>
      </YdTooltip>
      <YdTooltip content="收藏">
        <YdButton variant="ghost" size="sm" icon-only :aria-label="`收藏 ${post.title}`" title="收藏" @click="emit('bookmark')"><YdIcon name="i-ri:bookmark-line" />{{ post.bookmarks }}</YdButton>
      </YdTooltip>
    </div>
  </article>
</template>
